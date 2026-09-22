import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side persistence for Mentor conversations.
 *
 * /api/chat is the single writer for chat turns: it stores the founder's turn
 * once the request is authenticated and the conversation ownership is
 * verified, and stores the Mentor's reply when generation finishes — even if
 * the browser has gone away. All queries run as the signed-in user, so RLS
 * applies on top of the explicit ownership check in the route.
 */

type StoredMessage = { id: string; role: string; content: string | null };

const RECENT_WINDOW = 20;

async function recentMessages(
  supabase: SupabaseClient,
  conversationId: string
): Promise<StoredMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(RECENT_WINDOW);

  if (error) throw error;
  return (data as StoredMessage[] | null) ?? [];
}

async function touchConversation(
  supabase: SupabaseClient,
  conversationId: string,
  title?: string
) {
  const payload: { updated_at: string; title?: string } = {
    updated_at: new Date().toISOString(),
  };
  if (title) payload.title = title;

  await supabase.from("conversations").update(payload).eq("id", conversationId);
}

/**
 * Store the founder's turn exactly once. Nothing is written when:
 *  - the newest stored message is already this same, unanswered turn (a
 *    re-send after a failed reply, or a duplicate submit), or
 *  - this is a regenerate and the newest stored founder turn is this one,
 *    even if a reply was already saved (the reply is replaced on finish).
 */
export async function persistUserTurn(
  supabase: SupabaseClient,
  conversationId: string,
  content: string,
  options: { isRegenerate?: boolean } = {}
): Promise<{ inserted: boolean }> {
  const text = content.trim();
  if (!text) return { inserted: false };

  const recent = await recentMessages(supabase, conversationId);
  const latest = recent[0];
  const latestUserTurn = recent.find((message) => message.role === "user");
  const same = (message?: StoredMessage) => (message?.content ?? "").trim() === text;

  if (
    (latest?.role === "user" && same(latest)) ||
    (options.isRegenerate && latestUserTurn && same(latestUserTurn))
  ) {
    return { inserted: false };
  }

  const { error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, role: "user", content: text });
  if (error) throw error;

  await touchConversation(
    supabase,
    conversationId,
    recent.length === 0 ? text.slice(0, 50) : undefined
  );

  return { inserted: true };
}

/**
 * Store the Mentor's reply to the latest founder turn. Empty replies are never
 * stored. On a regenerate, any earlier reply to that same turn is replaced so
 * a Retry never leaves two answers to one question.
 */
export async function persistAssistantTurn(
  supabase: SupabaseClient,
  conversationId: string,
  text: string,
  options: { replacePreviousReply: boolean; answeringUserTurn: string }
): Promise<{ inserted: boolean }> {
  const reply = text.trim();
  if (!reply) return { inserted: false };

  if (options.replacePreviousReply) {
    const recent = await recentMessages(supabase, conversationId);
    const firstUserIndex = recent.findIndex((message) => message.role === "user");
    const answeredTurn = firstUserIndex >= 0 ? recent[firstUserIndex] : null;

    if (
      answeredTurn &&
      (answeredTurn.content ?? "").trim() === options.answeringUserTurn.trim()
    ) {
      const staleReplyIds = recent
        .slice(0, firstUserIndex)
        .filter((message) => message.role === "assistant")
        .map((message) => message.id);

      if (staleReplyIds.length > 0) {
        const { error } = await supabase.from("messages").delete().in("id", staleReplyIds);
        if (error) throw error;
      }
    }
  }

  const { error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, role: "assistant", content: text });
  if (error) throw error;

  await touchConversation(supabase, conversationId);
  return { inserted: true };
}
