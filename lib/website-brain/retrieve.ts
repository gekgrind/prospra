import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Create an embedding for text using OpenAI
 */
async function getEmbedding(text: string) {
  try {
    const result = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    return result.data[0].embedding;
  } catch (err) {
    console.error("WebsiteBrain Embedding Error:", err);
    return null;
  }
}

/**
 * Retrieve relevant chunks from the user's Website Brain
 * based on similarity to the user's latest chat message.
 */
export async function getWebsiteBrainContext(
  userId: string,
  userMessage: string
) {
  try {
    const supabase = await createClient();

    // 1) Create embedding of user's query
    const userEmbedding = await getEmbedding(userMessage);
    if (!userEmbedding) return "";

    // 2) Query similar website chunks via RPC
    const { data, error } = await supabase.rpc("match_website_embeddings", {
      p_user_id: userId,
      p_query_embedding: userEmbedding,
      p_match_threshold: 0.65,
      p_match_count: 8,
    });

    if (error) {
      console.error("WebsiteBrain RPC Error:", error);
      return "";
    }

    if (!data || data.length === 0) return "";

    // 3) Extract content field (REAL column name)
    const chunks = data
      .map((row: any) => row.content?.trim() ?? "")
      .filter((x: string) => x.length > 0);

    if (chunks.length === 0) return "";

    // 4) Remove duplicates + normalize spacing
    const unique = Array.from(new Set(chunks));

    const finalText = unique.join("\n\n");

    // 5) Wrap in a structured section so the system prompt receives clean context
    return `
=== WEBSITE CONTEXT START ===
${finalText}
=== WEBSITE CONTEXT END ===
`.trim();
  } catch (err) {
    console.error("WebsiteBrain Retrieval Error:", err);
    return "";
  }
}
