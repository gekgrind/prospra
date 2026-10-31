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
  SHARED_COOKIE,
  SUPABASE_URL,
  createFakeSupabaseApi,
  makeUser,
  sessionCookieHeader,
} from "@/lib/supabase/__tests__/fake-supabase-api";

// The seven handlers that used to build their own Supabase client. Everything
// between the cookie and the Auth API is the real stack: lib/supabase/server.ts,
// shared-auth-cookie.ts, lib/config/ecosystem.ts, @supabase/ssr and auth-js.
// Only next/headers (no request scope in a unit test), the model SDKs and a
// few context helpers are stand-ins.

const state = vi.hoisted(() => ({
  jar: null as null | CookieJar,
}));

vi.mock("next/headers", () => ({ cookies: async () => state.jar }));

vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: () => {},
}));

vi.mock("ai", () => ({
  streamText: () => ({
    toUIMessageStreamResponse: () => new Response("stream", { status: 200 }),
    consumeStream: () => Promise.resolve(),
  }),
  generateText: async () => ({ text: "[]" }),
  generateObject: async () => ({
    object: { summary: "Summary", insights: [], action_plan: [] },
  }),
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

type Endpoint = {
  label: string;
  call: () => Promise<Response>;
};

const ENDPOINTS: Endpoint[] = [
  { label: "GET /api/onboarding-progress", call: () => getOnboardingProgress() },
  {
    label: "PATCH /api/onboarding-progress",
    call: () => patchOnboardingProgress(json("PATCH", "/api/onboarding-progress", { responses: {}, onboarding_step: 1 })),
  },
  {
    label: "POST /api/onboarding",
    call: () => postOnboarding(json("POST", "/api/onboarding", { responses: { founder_name: "Test" } })),
  },
  { label: "GET /api/profile/get", call: () => getProfile() },
  {
    label: "PATCH /api/profile",
    call: () => patchProfile(json("PATCH", "/api/profile", { full_name: "Test Founder" })),
  },
  {
    label: "POST /api/mentor",
    call: () => postMentor(json("POST", "/api/mentor", { conversationId: "conv-1" })),
  },
  {
    label: "GET /api/mentor/conversation-outputs",
    call: () => getConversationOutputs(new NextRequest(`${APP}/api/mentor/conversation-outputs?conversationId=conv-1`)),
  },
  {
    label: "POST /api/mentor/conversation-outputs",
    call: () => postConversationOutputs(json("POST", "/api/mentor/conversation-outputs", { conversationId: "conv-1" })),
  },
  {
    label: "POST /api/chat",
    call: () =>
      postChat(
        json("POST", "/api/chat", {
          conversationId: "conv-1",
          mode: "mentor",
          trigger: "submit-message",
          messages: [{ role: "user", parts: [{ type: "text", text: "How should I price this?" }] }],
        })
      ),
  },
];

let api: ReturnType<typeof createFakeSupabaseApi>;

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
  vi.stubEnv("NEXT_PUBLIC_ENTREPRENEURIA_COOKIE_DOMAIN", "");
  vi.stubEnv("OPENAI_API_KEY", "test-key");
  api = createFakeSupabaseApi();
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

    expect(response.status).not.toBe(401);
    expect(response.status).toBeLessThan(500);
    expect(api.calls.userLookups).toContain(session.access_token);
    expect(api.calls.tokenRefreshes).toEqual([]);
    expect(sessionWrites(jar)).toEqual([]);
    // Identity: every data call ran as this founder's token.
    expect(api.calls.rest.length).toBeGreaterThan(0);
    expect(api.calls.rest.every((call) => call.accessToken === session.access_token)).toBe(true);
  });

  it("does not accept the legacy sb-<ref>-auth-token cookie", async () => {
    const session = api.issue(user);
    const { response } = await callWith(endpoint, sessionCookieHeader(session, LEGACY_COOKIE));

    expect(response.status).toBe(401);
    expect(api.calls.tokenRefreshes).toEqual([]);
  });

  it("saves a refreshed session onto the shared domain, for the same founder", async () => {
    const expired = api.issue(user, { expired: true });
    // A leftover chunk from an older, longer session must not survive beside the new one.
    const header = `${sessionCookieHeader(expired)}; ${SHARED_COOKIE}.4=stale`;

    const { response, jar } = await callWith(endpoint, header);

    expect(response.status).not.toBe(401);
    expect(response.status).toBeLessThan(500);
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
    expect(api.calls.rest.length).toBeGreaterThan(0);
    expect(api.calls.rest.every((call) => call.accessToken === rotated.access_token)).toBe(true);

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

    // The old cookies again, e.g. a tab that never received the Set-Cookie.
    const { response, jar } = await callWith(endpoint, header);

    expect(response.status).toBe(401);
    expect(api.calls.tokenRefreshes).toEqual([expired.refresh_token, expired.refresh_token]);
    const removals = sessionWrites(jar);
    expect(removals.length).toBeGreaterThan(0);
    for (const removal of removals) {
      expect(removal).toMatchObject({ value: "", options: expect.objectContaining({ maxAge: 0, domain: ".entrepreneuria.io" }) });
    }
    expect(jar.getAll().filter(({ name }) => isSharedCookie(name))).toEqual([]);
  });
});
