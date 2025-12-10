import { embed } from "@/lib/embeddings";

export async function getRelevantMemories(supabase: any, userId: string, embedding: number[]) {
  const { data, error } = await supabase.rpc("match_ai_memory", {
    query_embedding: embedding,
    match_count: 8,
    user_id_input: userId,
  });

  if (error) return [];

  return data;
}
