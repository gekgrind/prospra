// @vitest-environment node
import { writeFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// vi.mock calls below are hoisted above these imports.
import { GET as getOnboardingProgress, PATCH as patchOnboardingProgress } from "@/app/api/onboarding-progress/route";
import { POST as postOnboarding } from "@/app/api/onboarding/route";
import { GET as getProfile } from "@/app/api/profile/get/route";
import { PATCH as patchProfile } from "@/app/api/profile/route";
import { POST as postMentor } from "@/app/api/mentor/route";
import {
  GET as getConversationOutputs,
  POST as postConversationOutputs,
} from "@/app/api/mentor/conversation-outputs/route";
import { POST as postChat } from "@/app/api/chat/route";
import { createClient } from "@/lib/supabase/server";
import { createCookieJar, type CookieJar } from "@/lib/supabase/__tests__/cookie-jar";
import {
  LEGACY_COOKIE,
  OTHER_USER_ID,
  SHARED_COOKIE,
  SUPABASE_URL,
  createFakeSupabaseApi,
  makeUser,
  sessionCookieHeader,
  type RestCall,
} from "@/lib/supabase/__tests__/fake-supabase-api";

// The seven handlers that used to build their own Supabase client. Everything
// between the cookie and the Auth API is the real stack: lib/supabase/server.ts,
// shared-auth-cookie.ts, lib/config/ecosystem.ts, @supabase/ssr, auth-js and
// postgrest-js. Only next/headers (no request scope in a unit test), the model
// SDKs and a few context helpers are stand-ins.

const state = vi.hoisted(() => ({
  jar: null as null | CookieJar,
  streams: 0,
  generations: 0,
}));

vi.mock("next/headers", () => ({ cookies: async () => state.jar }));

vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: () => {},
}));

vi.mock("ai", () => ({
  streamText: () => {
    state.streams += 1;
    return {
      toUIMessageStreamResponse: () => new Response("stream", { status: 200 }),
      consumeStream: () => Promise.resolve(),
    };
  },
  generateText: async () => ({ text: "[]" }),
  generateObject: async () => {
    state.generations += 1;
    return {
      object: {
        summary: "Price from value.",
        insights: ["Anchor on outcomes", "Test two tiers", "Talk to five buyers"],
        actionPlan: ["List outcomes", "Draft tiers", "Book calls"],
        recommendedPriority: "Draft the two tiers",
        riskOrBlocker: "No buyer interviews yet",
      },
    };
  },
}));
vi.mock("@ai-sdk/openai", () => ({ openai: (model: string) => ({ model }) }));
vi.mock("@/lib/analytics/server", () => ({ trackServerEvent: async () => {} }));
vi.mock("@/lib/monetization", () => ({
  enforceUsageLimit: async () => ({ allowed: true }),
  recordUsageEvent: async () => {},
}));
vi.mock("@/lib/brain/resources-brain", () => ({ getRelevantResources: async () => [] }));
vi.mock("@/lib/website-brain/retrieve", () => ({ getWebsiteBrainContext: async () => null }));
vi.mock("@/lib/identity/profile", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/identity/profile")>()),
  getBillingProfile: async () => null,
}));
vi.mock("@/lib/mentor/build-mentor-context", () => ({ buildMentorContext: async () => ({}) }));
vi.mock("@/lib/mentor/build-mentor-system-prompt", () => ({
  buildMentorSystemPrompt: () => "MENTOR_CONTEXT",
}));
vi.mock("@/lib/mentor/sync-strategic-state", () => ({ syncStrategicState: async () => {} }));

const APP = "https://prospra.entrepreneuria.io";
const USER_ID = "user-1";

function json(method: string, path: string, body: unknown) {
  return new NextRequest(`${APP}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const writesTo = (table: string, method?: string) =>
  api.calls.rest.filter((call) => call.table === table && call.method !== "GET" && (!method || call.method === method));

type Endpoint = {
  label: string;
  call: () => Promise<Response>;
  /** Proof the handler got past auth and did its real work as this founder. */
  reached: (response: Response) => Promise<void>;
};

const ENDPOINTS: Endpoint[] = [
  {
    label: "GET /api/onboarding-progress",
    call: () => getOnboardingProgress(),
    reached: async (response) => {
      expect(await response.json()).toMatchObject({ onboarding_step: 1, onboarding_complete: false });
    },
  },
  {
    label: "PATCH /api/onboarding-progress",
    call: () => patchOnboardingProgress(json("PATCH", "/api/onboarding-progress", { responses: {}, onboarding_step: 2 })),
    reached: async () => {
      expect(api.tables.profiles.find((row) => row.id === USER_ID)?.onboarding_step).toBe(2);
      expect(api.tables.profiles.find((row) => row.id === OTHER_USER_ID)?.onboarding_step).toBe(1);
    },
  },
  {
    label: "POST /api/onboarding",
    call: () => postOnboarding(json("POST", "/api/onboarding", { responses: { founder_name: "Test" } })),
    reached: async () => {
      expect(writesTo("profiles", "PATCH").length).toBeGreaterThan(0);
      expect(api.tables.profiles.find((row) => row.id === OTHER_USER_ID)?.onboarding_responses).toEqual({});
    },
  },
  {
    label: "GET /api/profile/get",
    call: () => getProfile(),
    reached: async (response) => {
      expect(await response.json()).toMatchObject({ profile: { id: USER_ID, full_name: "Test Founder" } });
    },
  },
  {
    label: "PATCH /api/profile",
    call: () => patchProfile(json("PATCH", "/api/profile", { full_name: "Renamed Founder" })),
    reached: async (response) => {
      expect(await response.json()).toMatchObject({ profile: { id: USER_ID, full_name: "Renamed Founder" } });
      expect(api.tables.profiles.find((row) => row.id === OTHER_USER_ID)?.full_name).toBe("Someone Else");
    },
  },
  {
    label: "POST /api/mentor",
    call: () => postMentor(json("POST", "/api/mentor", { conversationId: "conv-1" })),
    reached: async () => {
      expect(state.streams).toBe(1);
    },
  },
  {
    label: "GET /api/mentor/conversation-outputs",
    call: () => getConversationOutputs(new NextRequest(`${APP}/api/mentor/conversation-outputs?conversationId=conv-1`)),
    reached: async (response) => {
      expect(await response.json()).toMatchObject({ outputs: { conversation_id: "conv-1", summary: "Saved summary" } });
    },
  },
  {
    label: "POST /api/mentor/conversation-outputs",
    call: () => postConversationOutputs(json("POST", "/api/mentor/conversation-outputs", { conversationId: "conv-1" })),
    reached: async () => {
      expect(state.generations).toBe(1);
      expect(writesTo("conversation_outputs", "POST")).toHaveLength(1);
      expect(api.tables.conversation_outputs.find((row) => row.conversation_id === "conv-other")?.summary).toBe(
        "Private summary"
      );
    },
  },
  {
    label: "POST /api/chat",
    call: () =>
      postChat(
        json("POST", "/api/chat", {
          conversationId: "conv-1",
          mode: "mentor",
          trigger: "submit-message",
          messages: [{ role: "user", parts: [{ type: "text", text: "Draft my two pricing tiers." }] }],
        })
      ),
    reached: async () => {
      expect(state.streams).toBe(1);
      expect(writesTo("messages", "POST").length).toBeGreaterThan(0);
    },
  },
];

let api: ReturnType<typeof createFakeSupabaseApi>;

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
  vi.stubEnv("NEXT_PUBLIC_ENTREPRENEURIA_COOKIE_DOMAIN", "");
  vi.stubEnv("OPENAI_API_KEY", "test-key");
  api = createFakeSupabaseApi();
  state.streams = 0;
  state.generations = 0;
  vi.stubGlobal("fetch", api.fetch);
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const isSharedCookie = (name: string) => name === SHARED_COOKIE || name.startsWith(`${SHARED_COOKIE}.`);

function sessionWrites(jar: CookieJar) {
  return jar.writes.filter((write) => isSharedCookie(write.name));
}

/** The session @supabase/ssr would read back from the jar's shared cookie. */
function readSession(jar: CookieJar) {
  const chunks = jar
    .getAll()
    .filter(({ name }) => isSharedCookie(name))
    .sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
  const encoded = chunks.map(({ value }) => value).join("");
  return JSON.parse(Buffer.from(encoded.replace(/^base64-/, ""), "base64url").toString("utf8")) as {
    access_token: string;
    refresh_token: string;
    user: { id: string };
  };
}

/**
 * Every query and write the handler made was about this founder's own data:
 * no filter names the other founder or their conversation/messages, every
 * filtered call names one of ours, and every written owner field is ours.
 */
function expectOnlyOwnData(calls: RestCall[]) {
  const ownConversations = new Set(
    api.tables.conversations.filter((row) => row.user_id === USER_ID).map((row) => String(row.id))
  );
  const ownMessages = new Set(
    api.tables.messages.filter((row) => ownConversations.has(String(row.conversation_id))).map((row) => String(row.id))
  );
  const own = new Set([USER_ID, ...ownConversations, ...ownMessages]);
  const foreign = new Set([
    OTHER_USER_ID,
    ...api.tables.conversations.filter((row) => row.user_id === OTHER_USER_ID).map((row) => String(row.id)),
    "m-3",
  ]);

  expect(calls.length).toBeGreaterThan(0);
  expect(calls.some((call) => call.filters.some(({ values }) => values.includes(USER_ID)))).toBe(true);

  for (const call of calls) {
    const values = call.filters.flatMap((filter) => filter.values);
    expect(values.filter((value) => foreign.has(value)), `${call.method} ${call.table}${call.search}`).toEqual([]);
    if (values.length > 0) {
      expect(values.some((value) => own.has(value)), `${call.method} ${call.table}${call.search}`).toBe(true);
    }

    for (const row of call.body) {
      if ("user_id" in row) expect(row.user_id).toBe(USER_ID);
      if ("conversation_id" in row) expect(ownConversations.has(String(row.conversation_id))).toBe(true);
      if (call.table === "profiles" && "id" in row) expect(row.id).toBe(USER_ID);
    }
  }
}

async function callWith(endpoint: Endpoint, cookieHeader: string) {
  state.jar = createCookieJar(cookieHeader);
  const response = await endpoint.call();
  return { response, jar: state.jar };
}

describe.each(ENDPOINTS)("$label on the shared entrepreneuria.io session", (endpoint) => {
  // Big enough that the encoded session spans more than one cookie chunk.
  const user = makeUser(USER_ID, 4000);

  it("authenticates from the chunked shared cookie alone, without refreshing", async () => {
    const session = api.issue(user);
    const header = sessionCookieHeader(session);
    expect(header).toContain(`${SHARED_COOKIE}.1=`);

    const { response, jar } = await callWith(endpoint, header);

    expect(response.status).toBe(200);
    await endpoint.reached(response);
    expect(api.calls.userLookups).toContain(session.access_token);
    expect(api.calls.tokenRefreshes).toEqual([]);
    expect(sessionWrites(jar)).toEqual([]);
    expect(api.calls.rest.every((call) => call.accessToken === session.access_token)).toBe(true);
    expectOnlyOwnData(api.calls.rest);
  });

  it("does not accept the legacy sb-<ref>-auth-token cookie", async () => {
    const session = api.issue(user);
    const { response } = await callWith(endpoint, sessionCookieHeader(session, LEGACY_COOKIE));

    expect(response.status).toBe(401);
    expect(api.calls.tokenRefreshes).toEqual([]);
    expect(api.calls.rest.filter((call) => call.method !== "GET")).toEqual([]);
  });

  it("saves a refreshed session onto the shared domain, for the same founder", async () => {
    const expired = api.issue(user, { expired: true });
    // A leftover chunk from an older, longer session must not survive beside the new one.
    const header = `${sessionCookieHeader(expired)}; ${SHARED_COOKIE}.4=stale`;

    const { response, jar } = await callWith(endpoint, header);

    expect(response.status).toBe(200);
    await endpoint.reached(response);
    expect(api.calls.tokenRefreshes).toEqual([expired.refresh_token]);

    const writes = sessionWrites(jar);
    expect(writes.length).toBeGreaterThan(0);
    for (const write of writes) {
      expect(write.options).toMatchObject({ domain: ".entrepreneuria.io", path: "/", sameSite: "lax" });
      expect(write.options).not.toHaveProperty("name");
    }
    expect(writes).toContainEqual(
      expect.objectContaining({ name: `${SHARED_COOKIE}.4`, value: "", options: expect.objectContaining({ maxAge: 0 }) })
    );

    const rotated = readSession(jar);
    expect(rotated.user.id).toBe(USER_ID);
    expect(rotated.refresh_token).not.toBe(expired.refresh_token);
    expect(api.calls.rest.every((call) => call.accessToken === rotated.access_token)).toBe(true);
    expectOnlyOwnData(api.calls.rest);

    // A sibling reader on the next request picks the saved session up as-is.
    state.jar = createCookieJar(jar.toHeader());
    const sibling = await createClient();
    const { data } = await sibling.auth.getUser();
    expect(data.user?.id).toBe(USER_ID);
    expect(api.calls.tokenRefreshes).toEqual([expired.refresh_token]);

    if (process.env.SSO_REPLAY_OUT && endpoint.label === "GET /api/profile/get") {
      writeFileSync(
        process.env.SSO_REPLAY_OUT,
        JSON.stringify({ cookie: jar.toHeader(), userId: USER_ID, accessToken: rotated.access_token }, null, 2)
      );
    }
  });

  it("signs out on every subdomain when the browser replays a spent refresh token", async () => {
    const expired = api.issue(user, { expired: true });
    const header = sessionCookieHeader(expired);

    await callWith(endpoint, header);
    expect(api.calls.tokenRefreshes).toEqual([expired.refresh_token]);
    const restCallsBeforeReplay = api.calls.rest.length;

    // The old cookies again, e.g. a tab that never received the Set-Cookie.
    const { response, jar } = await callWith(endpoint, header);

    expect(response.status).toBe(401);
    expect(api.calls.tokenRefreshes).toEqual([expired.refresh_token, expired.refresh_token]);
    expect(api.calls.rest.slice(restCallsBeforeReplay).filter((call) => call.method !== "GET")).toEqual([]);
    const removals = sessionWrites(jar);
    expect(removals.length).toBeGreaterThan(0);
    for (const removal of removals) {
      expect(removal).toMatchObject({ value: "", options: expect.objectContaining({ maxAge: 0, domain: ".entrepreneuria.io" }) });
    }
    expect(jar.getAll().filter(({ name }) => isSharedCookie(name))).toEqual([]);
  });
});

describe("the ownership check itself", () => {
  it("fails a handler that filters on the other founder", () => {
    api.issue(makeUser(USER_ID));
    const call = (filters: RestCall["filters"], body: RestCall["body"] = []): RestCall => ({
      method: "GET",
      table: "profiles",
      search: "",
      filters,
      body,
      accessToken: null,
    });

    expect(() => expectOnlyOwnData([call([{ column: "id", values: [OTHER_USER_ID] }])])).toThrow();
    expect(() =>
      expectOnlyOwnData([call([{ column: "id", values: [USER_ID] }]), call([{ column: "id", values: ["conv-other"] }])])
    ).toThrow();
    expect(() =>
      expectOnlyOwnData([
        call([{ column: "id", values: [USER_ID] }]),
        { ...call([]), method: "POST", table: "messages", body: [{ conversation_id: "conv-other" }] },
      ])
    ).toThrow();
    expect(() => expectOnlyOwnData([call([{ column: "id", values: [USER_ID] }])])).not.toThrow();
  });
});
