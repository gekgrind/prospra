// A small stand-in for the Supabase HTTP API, enough for the real
// @supabase/ssr + auth-js + postgrest-js stack to run against it:
//   - /auth/v1/user checks the bearer against the access tokens it issued;
//   - /auth/v1/token?grant_type=refresh_token rotates a refresh token exactly
//     once and reports `refresh_token_already_used` on any reuse;
//   - /rest/v1/<table> answers generic rows owned by the token's user and
//     records each call so a test can see whose data was asked for.

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
  accessToken: string | null;
};

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

const OBJECT_ROWS: Record<string, (userId: string) => Record<string, unknown>> = {
  profiles: (userId) => ({
    id: userId,
    full_name: "Test Founder",
    is_premium: true,
    plan_tier: "pro",
    onboarding_complete: false,
    onboarding_responses: {},
    onboarding_step: 1,
  }),
  conversations: (userId) => ({ id: "conv-1", user_id: userId, title: "Pricing" }),
};

const LIST_ROWS: Record<string, (userId: string) => Array<Record<string, unknown>>> = {
  messages: () => [{ role: "user", content: "How should I price this?" }],
};

export function createFakeSupabaseApi() {
  let counter = 0;
  const accessTokens = new Map<string, { user: User; expiresAt: number }>();
  const liveRefreshTokens = new Map<string, User>();
  const spentRefreshTokens = new Set<string>();

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

    if (url.pathname.startsWith("/rest/v1/")) {
      const table = url.pathname.slice("/rest/v1/".length);
      const token = bearer(request);
      calls.rest.push({ method: request.method, table, search: url.search, accessToken: token });

      // Row-level security, roughly: no valid user token, no rows.
      const user = userFor(token);
      const wantsObject = (request.headers.get("accept") ?? "").includes("vnd.pgrst.object");

      if (!user) {
        return wantsObject
          ? json({ code: "PGRST116", message: "no rows" }, 406)
          : json([]);
      }

      if (wantsObject) {
        const row = OBJECT_ROWS[table]?.(user.id) ?? { id: `${table}-1`, user_id: user.id };
        return json(row);
      }

      if (request.method === "GET") {
        return json(LIST_ROWS[table]?.(user.id) ?? []);
      }

      return new Response(null, { status: 204 });
    }

    return json({ msg: `fake supabase: unhandled ${request.method} ${url.pathname}` }, 404);
  }

  const fetch = async (input: RequestInfo | URL, init?: RequestInit) =>
    handle(input instanceof Request ? input : new Request(input, init));

  return { issue, handle, fetch, calls };
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
