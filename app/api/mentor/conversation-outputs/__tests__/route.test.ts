// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// vi.mock calls below are hoisted above these imports.
import { GET, POST } from "@/app/api/mentor/conversation-outputs/route";
import { createFakeSupabase } from "@/lib/mentor/__tests__/fake-supabase";

type SupabaseClientOptions = {
  cookieOptions?: { name?: string };
  cookies: { get: (name: string) => string | undefined };
};

const state = vi.hoisted(() => ({
  fake: null as null | ReturnType<typeof import("@/lib/mentor/__tests__/fake-supabase").createFakeSupabase>,
  clientOptions: null as null | SupabaseClientOptions,
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: (_url: string, _key: string, options: SupabaseClientOptions) => {
    state.clientOptions = options;
    return state.fake!.client;
  },
}));

vi.mock("ai", () => ({
  generateObject: async () => {
    throw new Error("generateObject should not be reached in these tests");
  },
}));
vi.mock("@ai-sdk/openai", () => ({ openai: (model: string) => ({ model }) }));
vi.mock("@/lib/mentor/sync-strategic-state", () => ({ syncStrategicState: async () => {} }));
vi.mock("@/lib/config/ecosystem", () => ({
  getEcosystemCookieDomain: () => ".entrepreneuria.io",
}));

const SHARED_COOKIE = "entrepreneuria-auth-token.0=base64-abc; entrepreneuria-auth-token.1=def";

// Mirrors @supabase/ssr's `get` cookie adapter: the session is read from the
// cookie named by cookieOptions.name (possibly chunked as name.0, name.1, ...),
// falling back to the default sb-<project-ref>-auth-token when no name is set.
function useCookieBackedAuth() {
  const user = { id: "user-1", user_metadata: {} };
  state.fake!.client.auth.getUser = async () => {
    const storageKey = state.clientOptions?.cookieOptions?.name ?? "sb-localhost-auth-token";
    const { get } = state.clientOptions!.cookies;
    const hasSession = Boolean(get(storageKey) ?? get(`${storageKey}.0`));
    return { data: { user: hasSession ? user : null } };
  };
}

function getRequest(conversationId: string, cookie?: string) {
  return new Request(
    `http://localhost/api/mentor/conversation-outputs?conversationId=${conversationId}`,
    { headers: cookie ? { cookie } : {} }
  );
}

function postRequest(conversationId: string, cookie?: string) {
  return new Request("http://localhost/api/mentor/conversation-outputs", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify({ conversationId }),
  });
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://localhost");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
  vi.stubEnv("OPENAI_API_KEY", "test-key");
  state.clientOptions = null;
  state.fake = createFakeSupabase({
    profiles: [{ id: "user-1" }],
    conversations: [
      { id: "conv-1", user_id: "user-1" },
      { id: "conv-other", user_id: "someone-else" },
    ],
    conversation_outputs: [
      { conversation_id: "conv-1", summary: "Saved summary", insights: [], action_plan: [] },
    ],
    messages: [],
  });
  useCookieBackedAuth();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("/api/mentor/conversation-outputs — shared ecosystem auth cookie", () => {
  it("GET authenticates a founder signed in through the chunked shared session cookie", async () => {
    const res = await GET(getRequest("conv-1", SHARED_COOKIE));

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ outputs: { conversation_id: "conv-1", summary: "Saved summary" } });
    expect(state.clientOptions?.cookieOptions?.name).toBe("entrepreneuria-auth-token");
  });

  it("POST authenticates through the shared session and reaches normal route logic", async () => {
    // conv-1 has no messages, so the route's own validation (422) runs after auth.
    const res = await POST(postRequest("conv-1", SHARED_COOKIE));

    expect(res.status).toBe(422);
    expect(await res.json()).toMatchObject({ error: expect.stringContaining("more conversation context") });
  });

  it("GET still returns 401 without an auth cookie", async () => {
    const res = await GET(getRequest("conv-1"));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("POST still returns 401 without an auth cookie", async () => {
    const res = await POST(postRequest("conv-1"));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("still returns 404 for another founder's conversation", async () => {
    const getRes = await GET(getRequest("conv-other", SHARED_COOKIE));
    const postRes = await POST(postRequest("conv-other", SHARED_COOKIE));
    expect(getRes.status).toBe(404);
    expect(postRes.status).toBe(404);
  });
});
