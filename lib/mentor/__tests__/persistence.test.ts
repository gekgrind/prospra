// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { persistAssistantTurn, persistUserTurn } from "@/lib/mentor/persistence";

import { createFakeSupabase } from "./fake-supabase";

function setup(messages: Array<{ role: string; content: string }> = []) {
  const fake = createFakeSupabase({
    conversations: [{ id: "c1", user_id: "u1", title: "New Conversation" }],
    messages: messages.map((m, i) => ({ id: `seed-${i}`, conversation_id: "c1", ...m })),
  });
  return { ...fake, supabase: fake.client as unknown as SupabaseClient };
}

describe("persistUserTurn", () => {
  it("stores the first turn and titles the conversation", async () => {
    const { supabase, messages, db } = setup();
    await expect(persistUserTurn(supabase, "c1", "  Price my offer  ")).resolves.toEqual({ inserted: true });
    expect(messages("c1")).toEqual([{ role: "user", content: "Price my offer" }]);
    expect(db.conversations[0].title).toBe("Price my offer");
  });

  it("is idempotent for an unanswered identical turn (retry / duplicate submit)", async () => {
    const { supabase, messages } = setup([{ role: "user", content: "Price my offer" }]);
    await expect(persistUserTurn(supabase, "c1", "Price my offer")).resolves.toEqual({ inserted: false });
    expect(messages("c1")).toHaveLength(1);
  });

  it("stores a repeated question once it has been answered", async () => {
    const { supabase, messages, db } = setup([
      { role: "user", content: "Again?" },
      { role: "assistant", content: "Yes." },
    ]);
    await persistUserTurn(supabase, "c1", "Again?");
    expect(messages("c1").map((m) => m.role)).toEqual(["user", "assistant", "user"]);
    expect(db.conversations[0].title).toBe("New Conversation");
  });

  it("ignores empty turns", async () => {
    const { supabase, writes } = setup();
    await persistUserTurn(supabase, "c1", "   ");
    expect(writes).toHaveLength(0);
  });
});

describe("persistAssistantTurn", () => {
  it("stores a completed reply and bumps the conversation", async () => {
    const { supabase, messages, writes } = setup([{ role: "user", content: "Q" }]);
    await persistAssistantTurn(supabase, "c1", "Answer", {
      replacePreviousReply: false,
      answeringUserTurn: "Q",
    });
    expect(messages("c1")).toEqual([
      { role: "user", content: "Q" },
      { role: "assistant", content: "Answer" },
    ]);
    expect(writes.some((w) => w.table === "conversations" && w.op === "update")).toBe(true);
  });

  it("never stores an empty reply", async () => {
    const { supabase, writes } = setup([{ role: "user", content: "Q" }]);
    await expect(
      persistAssistantTurn(supabase, "c1", " \n ", { replacePreviousReply: false, answeringUserTurn: "Q" })
    ).resolves.toEqual({ inserted: false });
    expect(writes).toHaveLength(0);
  });

  it("replaces the previous reply to the same turn on regenerate", async () => {
    const { supabase, messages } = setup([
      { role: "user", content: "Earlier" },
      { role: "assistant", content: "Earlier answer" },
      { role: "user", content: "Q" },
      { role: "assistant", content: "Old answer" },
    ]);
    await persistAssistantTurn(supabase, "c1", "New answer", {
      replacePreviousReply: true,
      answeringUserTurn: "Q",
    });
    expect(messages("c1")).toEqual([
      { role: "user", content: "Earlier" },
      { role: "assistant", content: "Earlier answer" },
      { role: "user", content: "Q" },
      { role: "assistant", content: "New answer" },
    ]);
  });

  it("does not delete anything when the regenerated turn doesn't match the stored one", async () => {
    const { supabase, messages } = setup([
      { role: "user", content: "Other" },
      { role: "assistant", content: "Kept" },
    ]);
    await persistAssistantTurn(supabase, "c1", "New", { replacePreviousReply: true, answeringUserTurn: "Q" });
    expect(messages("c1").map((m) => m.content)).toEqual(["Other", "Kept", "New"]);
  });
});

describe("persistUserTurn on regenerate", () => {
  it("treats an already-answered latest turn as the same turn", async () => {
    const { supabase, messages } = setup([
      { role: "user", content: "Q" },
      { role: "assistant", content: "Saved reply" },
    ]);
    await expect(persistUserTurn(supabase, "c1", "Q", { isRegenerate: true })).resolves.toEqual({
      inserted: false,
    });
    expect(messages("c1")).toHaveLength(2);
  });
});
