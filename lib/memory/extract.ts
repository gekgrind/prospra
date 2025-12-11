import { embed } from "@/lib/embeddings";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function extractAndStoreMemories(supabase: any, userId: string, message: string) {
  const extractionPrompt = `
Extract any long-term useful facts the model should remember.
Return an array of memory strings.
Only include important, persistent information.
`;

  const res = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      { role: "system", content: extractionPrompt },
      { role: "user", content: message },
    ],
  });

  const memoryContent = res.choices[0]?.message?.content ?? "[]";
  let memories: string[] = [];

  try {
    memories = JSON.parse(memoryContent);
  } catch (err) {
    console.error("Memory extraction parse error:", err);
    memories = [];
  }

  for (const mem of memories) {
    const embedding = await embed(mem);

    await supabase.from("ai_memory").insert({
      user_id: userId,
      content: mem,
      embedding,
      importance: 3,
    });
  }
}
