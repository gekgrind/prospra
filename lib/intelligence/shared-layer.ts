import type { SupabaseClient } from "@supabase/supabase-js";
import type { MemoryScope } from "@/lib/intelligence/types";

export async function fetchSharedInsights(
  supabase: SupabaseClient,
  userId: string,
  appScope: string
) {
  const { data, error } = await supabase
    .from("shared_intelligence_insights")
    .select("insight_key, insight_summary, insight_payload, source_app, priority, created_at")
    .eq("user_id", userId)
    .or(`source_app.eq.${appScope},source_app.eq.global`)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw error;
  return data ?? [];
}

export async function persistMentorMemory(
  supabase: SupabaseClient,
  args: { userId: string; scope: MemoryScope; memory: string; source: string; confidence?: number }
) {
  const { error } = await supabase.from("mentor_memory_entries").insert({
    user_id: args.userId,
    memory_scope: args.scope,
    memory_text: args.memory,
    source_ref: args.source,
    confidence: args.confidence ?? 0.6,
  });

  if (error) throw error;
}

export function buildInsightPromptBlock(insights: Array<{ insight_key: string; insight_summary: string }>) {
  if (!insights.length) return "No shared intelligence insights available.";
  return insights.map((item) => `- ${item.insight_key}: ${item.insight_summary}`).join("\n");
}
