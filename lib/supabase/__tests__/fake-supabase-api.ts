// A small stand-in for the Supabase HTTP API, enough for the real
// @supabase/ssr + auth-js + postgrest-js stack to run against it:
//   - /auth/v1/user checks the bearer against the access tokens it issued;
//   - /auth/v1/token?grant_type=refresh_token rotates a refresh token exactly
//     once and reports `refresh_token_already_used` on any reuse;
//   - /rest/v1/<table> serves in-memory tables holding two founders' rows,
//     honours eq/in filters, applies writes, and records every call (filters
//     and write bodies) so a test can see whose data a handler touched.

import { createChunks, stringToBase64URL } from "@supabase/ssr";

export const SUPABASE_URL = "http://supabase.test";
export const SHARED_COOKIE = "entrepreneuria-auth-token";
export const LEGACY_COOKIE = "sb-rifzbzaabkaeagyulxip-auth-token";

type User = { id: string; email: string; user_metadata: Record<string, unknown> };

type IssuedSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: "bearer";
  user: User;
};

export type RestCall = {
  method: string;
  table: string;
  search: string;
  filters: Array<{ column: string; values: string[] }>;
  body: Array<Record<string, unknown>>;
  accessToken: string | null;
};

type Row = Record<string, unknown>;

function jwt(payload: Record<string, unknown>) {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.${Buffer.from("fake-signature").toString("base64url")}`;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const OTHER_USER_ID = "user-2";

/** Two founders' data, so a handler that selects the wrong one gets caught. */
function seedTables(): Record<string, Row[]> {
  const profile = (id: string, name: string) => ({
    id,
    full_name: name,
    is_premium: true,
    plan_tier: "pro",
    onboarding_complete: false,
    onboarding_responses: {},
    onboarding_step: 1,
  });

  return {
    profiles: [profile("user-1", "Test Founder"), profile(OTHER_USER_ID, "Someone Else")],
    conversations: [
      { id: "conv-1", user_id: "user-1", title: "Pricing" },
      { id: "conv-other", user_id: OTHER_USER_ID, title: "Not yours" },
    ],
    messages: [
      { id: "m-1", conversation_id: "conv-1", role: "user", content: "How should I price this?", created_at: "2026-10-01T00:00:00Z" },
      { id: "m-2", conversation_id: "conv-1", role: "assistant", content: "Start from the value delivered.", created_at: "2026-10-01T00:01:00Z" },
      { id: "m-3", conversation_id: "conv-other", role: "user", content: "Private", created_at: "2026-10-01T00:00:00Z" },
    ],
    conversation_outputs: [
      { conversation_id: "conv-1", user_id: "user-1", summary: "Saved summary", insights: [], action_plan: [] },
      { conversation_id: "conv-other", user_id: OTHER_USER_ID, summary: "Private summary", insights: [], action_plan: [] },
    ],
  };
}

const CONTROL_PARAMS = new Set(["select", "order", "limit", "offset", "on_conflict", "columns"]);

function parseFilters(url: URL) {
  const filters: Array<{ column: string; values: string[] }> = [];

  for (const [column, raw] of url.searchParams) {
    if (CONTROL_PARAMS.has(column)) continue;

    const eq = raw.match(/^eq\.(.*)$/);
    const inList = raw.match(/^in\.\((.*)\)$/);
    if (eq) filters.push({ column, values: [eq[1]] });
    else if (inList) filters.push({ column, values: inList[1].split(",").map((v) => v.replace(/^"|"$/g, "")) });
  }

  return filters;
}

function matches(row: Row, filters: Array<{ column: string; values: string[] }>) {
  return filters.every(({ column, values }) => values.includes(String(row[column])));
}

export function createFakeSupabaseApi() {
  let counter = 0;
  const accessTokens = new Map<string, { user: User; expiresAt: number }>();
  const liveRefreshTokens = new Map<string, User>();
  const spentRefreshTokens = new Set<string>();

  const tables = seedTables();
  const calls = {
    tokenRefreshes: [] as string[],
    userLookups: [] as Array<string | null>,
    rest: [] as RestCall[],
  };

  function issue(user: User, { expired = false } = {}): IssuedSession {
    counter += 1;
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = expired ? now - 60 : now + 3600;
    const access_token = jwt({ sub: user.id, exp: expiresAt, n: counter, role: "authenticated" });
    const refresh_token = `refresh-${counter}`;

    accessTokens.set(access_token, { user, expiresAt });
    liveRefreshTokens.set(refresh_token, user);

    return {
      access_token,
      refresh_token,
      expires_in: 3600,
      expires_at: expiresAt,
      token_type: "bearer",
      user,
    };
  }

  function bearer(request: Request) {
    return request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  }

  function userFor(token: string | null) {
    const entry = token ? accessTokens.get(token) : undefined;
    if (!entry || entry.expiresAt * 1000 <= Date.now()) return null;
    return entry.user;
  }

  async function handle(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/auth/v1/user") {
      const token = bearer(request);
      calls.userLookups.push(token);
      const user = userFor(token);
      return user
        ? json(user)
        : json({ code: 403, error_code: "bad_jwt", msg: "invalid JWT" }, 403);
    }

    if (url.pathname === "/auth/v1/token" && url.searchParams.get("grant_type") === "refresh_token") {
      const { refresh_token } = (await request.json()) as { refresh_token: string };
      calls.tokenRefreshes.push(refresh_token);

      if (spentRefreshTokens.has(refresh_token)) {
        return json(
          { code: 400, error_code: "refresh_token_already_used", msg: "Invalid Refresh Token: Already Used" },
          400
        );
      }

      const user = liveRefreshTokens.get(refresh_token);
      if (!user) {
        return json({ code: 400, error_code: "refresh_token_not_found", msg: "Invalid Refresh Token" }, 400);
      }

      liveRefreshTokens.delete(refresh_token);
      spentRefreshTokens.add(refresh_token);
      return json(issue(user));
    }

    if (url.pathname.startsWith("/rest/v1/rpc/")) {
      return json(null);
    }

    if (url.pathname.startsWith("/rest/v1/")) {
      const table = url.pathname.slice("/rest/v1/".length);
      const token = bearer(request);
      const filters = parseFilters(url);
      const text = request.method === "GET" || request.method === "HEAD" ? "" : await request.text();
      const parsed = text ? (JSON.parse(text) as Row | Row[]) : [];
      const body = Array.isArray(parsed) ? parsed : [parsed];
      calls.rest.push({ method: request.method, table, search: url.search, filters, body, accessToken: token });

      // A request without a valid user token sees nothing, like RLS would.
      if (!userFor(token)) {
        return json({ code: "42501", message: "permission denied" }, 401);
      }

      const rows = (tables[table] ??= []);
      const wantsObject = (request.headers.get("accept") ?? "").includes("vnd.pgrst.object");
      const wantsRows = (request.headers.get("prefer") ?? "").includes("return=representation");
      let result: Row[];

      if (request.method === "GET") {
        result = rows.filter((row) => matches(row, filters));
        const limit = Number(url.searchParams.get("limit"));
        if (limit > 0) result = result.slice(0, limit);
      } else if (request.method === "POST") {
        const key = url.searchParams.get("on_conflict");
        result = body.map((incoming) => {
          const existing = key ? rows.find((row) => row[key] === incoming[key]) : undefined;
          if (existing) return Object.assign(existing, incoming);
          const row = { id: `${table}-${rows.length + 1}`, ...incoming };
          rows.push(row);
          return row;
        });
      } else if (request.method === "PATCH") {
        result = rows.filter((row) => matches(row, filters)).map((row) => Object.assign(row, body[0]));
      } else if (request.method === "DELETE") {
        result = rows.filter((row) => matches(row, filters));
        tables[table] = rows.filter((row) => !result.includes(row));
      } else {
        result = [];
      }

      if (wantsObject) {
        return result.length === 1
          ? json(result[0])
          : json({ code: "PGRST116", message: `${result.length} rows` }, 406);
      }

      return request.method === "GET" || wantsRows ? json(result) : new Response(null, { status: 204 });
    }

    return json({ msg: `fake supabase: unhandled ${request.method} ${url.pathname}` }, 404);
  }

  const fetch = async (input: RequestInfo | URL, init?: RequestInit) =>
    handle(input instanceof Request ? input : new Request(input, init));

  return { issue, handle, fetch, calls, tables };
}

export function makeUser(id: string, padding = 0): User {
  // Padding makes the encoded session long enough to be split into chunks.
  return { id, email: `${id}@example.com`, user_metadata: { bio: "x".repeat(padding) } };
}

/** The Cookie header @supabase/ssr would have written for this session. */
export function sessionCookieHeader(session: IssuedSession, name = SHARED_COOKIE) {
  const encoded = `base64-${stringToBase64URL(JSON.stringify(session))}`;
  return createChunks(name, encoded)
    .map((chunk) => `${chunk.name}=${chunk.value}`)
    .join("; ");
}
