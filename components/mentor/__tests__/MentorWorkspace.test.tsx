import { useReducer } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// vi.mock calls below are hoisted above this import.
import { MentorWorkspace } from "@/components/mentor/MentorWorkspace";

/* ------------------------------- fake chat ------------------------------- */

type FakeMessage = { id: string; role: string; parts: Array<{ type: string; text: string }> };
type FinishEvent = { message: FakeMessage; isAbort: boolean; isDisconnect: boolean; isError: boolean };

const chat = vi.hoisted(() => {
  const store = {
    messages: [] as FakeMessage[],
    status: "ready" as "ready" | "submitted" | "streaming" | "error",
    options: null as null | { onFinish: (e: FinishEvent) => void; onError: (e: Error) => void },
    rerender: () => {},
    counter: 0,
    sendMessage: null as unknown as ReturnType<typeof vi.fn>,
    regenerate: null as unknown as ReturnType<typeof vi.fn>,
    stop: null as unknown as ReturnType<typeof vi.fn>,
    setMessages: (next: FakeMessage[]) => {
      store.messages = next;
      store.rerender();
    },
    clearError: () => {},
  };
  return store;
});

vi.mock("@ai-sdk/react", () => ({
  useChat: (options: NonNullable<typeof chat.options>) => {
    const [, force] = useReducer((x: number) => x + 1, 0);
    chat.options = options;
    chat.rerender = force;
    return {
      messages: chat.messages,
      status: chat.status,
      setMessages: chat.setMessages,
      sendMessage: chat.sendMessage,
      regenerate: chat.regenerate,
      stop: chat.stop,
      clearError: chat.clearError,
    };
  },
}));

function text(role: string, value: string): FakeMessage {
  return { id: `m${++chat.counter}`, role, parts: [{ type: "text", text: value }] };
}

function streamReply(value: string) {
  act(() => {
    const last = chat.messages[chat.messages.length - 1];
    chat.messages =
      last?.role === "assistant"
        ? [...chat.messages.slice(0, -1), { ...last, parts: [{ type: "text", text: value }] }]
        : [...chat.messages, text("assistant", value)];
    chat.status = "streaming";
    chat.rerender();
  });
}

function finishReply(flags: Partial<FinishEvent> = {}) {
  act(() => {
    chat.status = "ready";
    chat.rerender();
    chat.options!.onFinish({
      message: chat.messages[chat.messages.length - 1],
      isAbort: false,
      isDisconnect: false,
      isError: false,
      ...flags,
    });
  });
}

function failReply(error: Error) {
  act(() => {
    chat.status = "error";
    chat.rerender();
    chat.options!.onError(error);
    chat.options!.onFinish({
      message: chat.messages[chat.messages.length - 1],
      isAbort: false,
      isDisconnect: false,
      isError: true,
    });
  });
}

/* ----------------------------- fake supabase ----------------------------- */

type Op = { table: string; op: "select" | "insert" | "update"; payload?: unknown; filters: Record<string, unknown> };

const db = vi.hoisted(() => ({
  ops: [] as Op[],
  conversations: [] as Array<{ id: string; title: string; updated_at: string }>,
  messages: {} as Record<string, Array<{ id: string; role: string; content: string }>>,
  failConversationInsert: false,
  nextId: 1,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) },
    from: (table: string) => {
      const op: Op = { table, op: "select", filters: {} };
      const resolve = () => {
        if (op.op === "insert") {
          if (table === "conversations") {
            if (db.failConversationInsert) return { data: null, error: { message: "insert failed" } };
            const row = { id: `conv-new-${db.nextId++}`, ...(op.payload as object), updated_at: new Date().toISOString() };
            return { data: row, error: null };
          }
          return { data: null, error: null };
        }
        if (op.op === "update") return { data: null, error: null };
        if (table === "profiles") return { data: { full_name: "Misti Grinder" }, error: null };
        if (table === "conversations") return { data: db.conversations, error: null };
        if (table === "messages") {
          return { data: db.messages[op.filters.conversation_id as string] ?? [], error: null };
        }
        return { data: null, error: null };
      };
      const builder: Record<string, unknown> = {
        select: () => builder,
        order: () => builder,
        eq: (key: string, value: unknown) => {
          op.filters[key] = value;
          return builder;
        },
        insert: (payload: unknown) => {
          op.op = "insert";
          op.payload = payload;
          db.ops.push(op);
          return builder;
        },
        update: (payload: unknown) => {
          op.op = "update";
          op.payload = payload;
          db.ops.push(op);
          return builder;
        },
        maybeSingle: async () => resolve(),
        single: async () => resolve(),
        then: (ok: (v: unknown) => unknown, bad: (e: unknown) => unknown) =>
          Promise.resolve(resolve()).then(ok, bad),
      };
      return builder;
    },
  }),
}));

/* --------------------------- navigation + fetch --------------------------- */

const nav = vi.hoisted(() => ({ search: "", push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: nav.push }),
  useSearchParams: () => new URLSearchParams(nav.search),
}));


function insertsInto(table: string) {
  return db.ops.filter((op) => op.table === table && op.op === "insert");
}

beforeEach(() => {
  chat.messages = [];
  chat.status = "ready";
  chat.counter = 0;
  chat.sendMessage = vi.fn((message: { text: string }) => {
    chat.messages = [...chat.messages, text("user", message.text)];
    chat.status = "submitted";
    chat.rerender();
    return Promise.resolve();
  });
  chat.regenerate = vi.fn(() => {
    chat.status = "submitted";
    chat.rerender();
    return Promise.resolve();
  });
  chat.stop = vi.fn(() => {
    chat.status = "ready";
    chat.rerender();
    return Promise.resolve();
  });

  db.ops = [];
  db.nextId = 1;
  db.failConversationInsert = false;
  db.conversations = [
    { id: "conv-a", title: "Pricing for launch", updated_at: new Date().toISOString() },
    { id: "conv-b", title: "Hiring plan", updated_at: new Date().toISOString() },
  ];
  db.messages = {
    "conv-a": [
      { id: "a1", role: "user", content: "How should I price?" },
      { id: "a2", role: "assistant", content: "Start with **value-based** pricing." },
    ],
    "conv-b": [{ id: "b1", role: "user", content: "Who do I hire first?" }],
  };

  nav.search = "";
  nav.push = vi.fn();
  window.history.replaceState(null, "", "/mentor");

  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const body = url.startsWith("/api/credits")
        ? { isPremium: false }
        : url.startsWith("/api/mentor/conversation-outputs")
          ? { outputs: null }
          : { actionPlan: null };
      return new Response(JSON.stringify(body), { status: 200 });
    })
  );
});

async function renderWorkspace() {
  render(<MentorWorkspace />);
  await screen.findByRole("navigation", { name: "Mentor conversation history" });
}

function historyRail() {
  return screen.getByRole("navigation", { name: "Mentor conversation history" });
}

describe("MentorWorkspace", () => {
  it("opens on the Mentor welcome with history on the side", async () => {
    await renderWorkspace();

    expect(screen.getByRole("heading", { name: "What are we working on?" })).toBeInTheDocument();
    expect(screen.getByText("Good to see you, Misti")).toBeInTheDocument();
    expect(document.querySelector('[data-mentor-state="welcome"]')).not.toBeNull();
    expect(within(historyRail()).getByRole("button", { name: /Pricing for launch/ })).toBeInTheDocument();
  });

  it("fills the composer from a conversation starter without sending", async () => {
    await renderWorkspace();
    await userEvent.click(screen.getByRole("button", { name: "Pressure-test my business idea" }));

    expect((screen.getByLabelText("Message your mentor") as HTMLTextAreaElement).value).toContain(
      "Pressure-test my business idea"
    );
    expect(chat.sendMessage).not.toHaveBeenCalled();
  });

  it("hides the Mentor Mode picker for launch and sends the default mode", async () => {
    await renderWorkspace();
    expect(screen.queryByRole("button", { name: /Change mode/ })).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Message your mentor"), "Quick question{Enter}");
    await waitFor(() => expect(chat.sendMessage).toHaveBeenCalledTimes(1));
    expect(chat.sendMessage.mock.calls[0][1].body).toMatchObject({ mode: "mentor" });
  });

  it("sends, thinks and streams, leaving persistence to the server", async () => {
    await renderWorkspace();
    const box = screen.getByLabelText("Message your mentor");
    await userEvent.type(box, "Help me focus this week{Enter}");

    await waitFor(() => expect(chat.sendMessage).toHaveBeenCalledTimes(1));
    const [, options] = chat.sendMessage.mock.calls[0];
    expect(options.body).toMatchObject({ conversationId: "conv-new-1", mode: "mentor" });

    expect(insertsInto("conversations")).toHaveLength(1);
    expect(window.location.search).toBe("?conversation=conv-new-1");

    // Thinking state before the first token.
    expect(screen.getByText("Thinking it through…")).toBeInTheDocument();
    expect(document.querySelector('[data-mentor-state="thinking"]')).not.toBeNull();

    streamReply("**Focus** on one channel.");
    expect(document.querySelector('[data-mentor-state="explaining"]')).not.toBeNull();

    finishReply();
    expect(screen.getByRole("article", { name: "Mentor" })).toHaveTextContent("Focus on one channel.");

    // The action plan is synced for the conversation the reply belongs to.
    await waitFor(() =>
      expect(
        (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.some(
          ([url, init]) =>
            url === "/api/action-plans/sync" &&
            JSON.parse((init as RequestInit).body as string).conversationId === "conv-new-1"
        )
      ).toBe(true)
    );
    // /api/chat is the only writer of chat turns.
    expect(insertsInto("messages")).toHaveLength(0);
  });

  it("guards against duplicate submits", async () => {
    await renderWorkspace();
    const box = screen.getByLabelText("Message your mentor");
    await userEvent.type(box, "Once");
    await userEvent.keyboard("{Enter}{Enter}");
    // While busy the send control becomes "Stop", so a third attempt cannot send either.
    expect(screen.queryByRole("button", { name: "Send message" })).toBeNull();

    await waitFor(() => expect(chat.sendMessage).toHaveBeenCalledTimes(1));
    expect(insertsInto("conversations")).toHaveLength(1);
  });

  it("keeps the draft when the conversation cannot be started", async () => {
    db.failConversationInsert = true;
    await renderWorkspace();
    await userEvent.type(screen.getByLabelText("Message your mentor"), "Save me{Enter}");

    expect(await screen.findByText(/couldn't start a conversation/)).toBeInTheDocument();
    expect(screen.getByLabelText("Message your mentor")).toHaveValue("Save me");
    expect(chat.sendMessage).not.toHaveBeenCalled();
  });

  it("shows a human error and retries the reply without re-sending the message", async () => {
    await renderWorkspace();
    await userEvent.type(screen.getByLabelText("Message your mentor"), "Will this fail?{Enter}");
    await waitFor(() => expect(chat.sendMessage).toHaveBeenCalled());

    failReply(new Error(JSON.stringify({ error: "CHAT_ERROR", message: "boom at line 3" })));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("couldn't finish that reply");
    expect(alert).not.toHaveTextContent("boom");
    expect(screen.getByRole("article", { name: "You" })).toHaveTextContent("Will this fail?");

    await userEvent.click(within(alert).getByRole("button", { name: "Try again" }));
    expect(chat.regenerate).toHaveBeenCalledWith({
      body: expect.objectContaining({ conversationId: "conv-new-1" }),
    });
    expect(chat.sendMessage).toHaveBeenCalledTimes(1);
    expect(insertsInto("messages")).toHaveLength(0);
  });

  it("offers an upgrade on usage limits", async () => {
    await renderWorkspace();
    await userEvent.type(screen.getByLabelText("Message your mentor"), "One more{Enter}");
    await waitFor(() => expect(chat.sendMessage).toHaveBeenCalled());

    failReply(new Error(JSON.stringify({ error: "USAGE_LIMIT", message: "Out of prompts today" })));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Out of prompts today");
    expect(within(alert).getByRole("link", { name: "Upgrade" })).toHaveAttribute("href", "/upgrade");
  });

  it("switches conversations from history and starts new ones", async () => {
    await renderWorkspace();
    await userEvent.click(within(historyRail()).getByRole("button", { name: /Pricing for launch/ }));

    expect(await screen.findByText("How should I price?")).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Mentor" }).querySelector("strong")).toHaveTextContent(
      "value-based"
    );
    expect(window.location.search).toBe("?conversation=conv-a");
    expect(within(historyRail()).getByRole("button", { name: /Pricing for launch/ })).toHaveAttribute(
      "aria-current",
      "true"
    );

    await userEvent.click(within(historyRail()).getByRole("button", { name: /Hiring plan/ }));
    expect(await screen.findByText("Who do I hire first?")).toBeInTheDocument();
    expect(screen.queryByText("How should I price?")).not.toBeInTheDocument();

    const workspace = screen.getByRole("region", { name: "Mentor conversation" });
    await userEvent.click(within(workspace).getByRole("button", { name: "New conversation" }));
    expect(await screen.findByRole("heading", { name: "What are we working on?" })).toBeInTheDocument();
    expect(window.location.search).toBe("");
  });

  it("restores the conversation in the URL on reload", async () => {
    nav.search = "conversation=conv-b";
    await renderWorkspace();
    expect(await screen.findByText("Who do I hire first?")).toBeInTheDocument();
  });

  it("stops streaming into the view when switching mid-reply and never writes to another conversation", async () => {
    await renderWorkspace();
    await userEvent.type(screen.getByLabelText("Message your mentor"), "Long answer please{Enter}");
    await waitFor(() => expect(chat.sendMessage).toHaveBeenCalled());
    expect(chat.sendMessage.mock.calls[0][1].body.conversationId).toBe("conv-new-1");
    streamReply("Partial thought");

    await userEvent.click(within(historyRail()).getByRole("button", { name: /Pricing for launch/ }));
    await screen.findByText("How should I price?");

    expect(chat.stop).toHaveBeenCalled();
    expect(screen.queryByText("Partial thought")).not.toBeInTheDocument();

    // A late finish from the abandoned request is ignored by the new view.
    finishReply({ isAbort: true });
    expect(insertsInto("messages")).toHaveLength(0);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.some(([url]) => url === "/api/action-plans/sync")
    ).toBe(false);
  });
  it("shows the not-configured message when insights generation returns 503 NOT_CONFIGURED", async () => {
    await renderWorkspace();
    await userEvent.click(within(historyRail()).getByRole("button", { name: /Pricing for launch/ }));
    await screen.findByText("How should I price?");

    const baseFetch = fetch as unknown as ReturnType<typeof vi.fn>;
    const previous = baseFetch.getMockImplementation()!;
    baseFetch.mockImplementation(async (url: string, init?: RequestInit) =>
      url === "/api/mentor/conversation-outputs" && init?.method === "POST"
        ? new Response(
            JSON.stringify({
              error: "Action plan generation is not configured. Missing environment variables: OPENAI_API_KEY",
              code: "NOT_CONFIGURED",
            }),
            { status: 503 }
          )
        : previous(url, init)
    );

    await userEvent.click(screen.getByRole("button", { name: "Generate" }));
    expect(await screen.findByText(/AI provider isn't configured/)).toBeInTheDocument();
    expect(screen.queryByText(/OPENAI_API_KEY/)).not.toBeInTheDocument();
  });
});
