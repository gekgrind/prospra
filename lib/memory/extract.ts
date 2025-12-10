import { embed } from "@/lib/embeddings";
import { openai } from "@ai-sdk/openai";

export async function extractAndStoreMemories(supabase: any, userId: string, message: string) {
  const extractionPrompt = `
Extract any long-term useful facts the model should remember.
Return an array of memory strings.
Only include important, persistent information.
`;

  const res = await openai("gpt-4.1").chat.completions.create({
    messages: [
      { role: "system", content: extractionPrompt },
      { role: "user", content: message },
    ]
  });

  const memories = JSON.parse(res.choices[0].message.content || "[]");

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
