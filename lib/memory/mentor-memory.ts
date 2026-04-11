import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

const MEMORY_CATEGORIES = [
  "business_direction",
  "target_audience",
  "offer_focus",
  "goal",
  "blocker",
  "working_style",
  "constraint",
] as const;

type MemoryCategory = (typeof MEMORY_CATEGORIES)[number];

type ExtractedMemory = {
  category: MemoryCategory;
  content: string;
  confidence: number;
  metadata?: {
    cadence?: "recurring" | "evolving" | "stable";
    horizon?: "short_term" | "mid_term" | "long_term";
  };
};

type StoredMemory = {
  id: string;
  memory_type: string;
  memory: string;
  importance: number | null;
  updated_at: string | null;
  tags: string[] | null;
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "how",
  "i",
  "in",
  "is",
  "it",
  "my",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "we",
  "with",
  "you",
]);

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function uniqueTokens(text: string) {
  return new Set(tokenize(text));
}

function jaccardSimilarity(a: string, b: string) {
  const aTokens = uniqueTokens(a);
  const bTokens = uniqueTokens(b);

  if (aTokens.size === 0 || bTokens.size === 0) return 0;

  let intersection = 0;
  aTokens.forEach((token) => {
    if (bTokens.has(token)) intersection += 1;
  });

  const union = aTokens.size + bTokens.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function normalizeMemoryContent(content: string) {
  return content
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^[-•\d.)\s]+/, "");
}

function parseExtractedMemories(raw: string): ExtractedMemory[] {
  try {
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed?.memories) ? parsed.memories : [];

    return list
      .map((item: any) => ({
        category: item?.category,
        content: normalizeMemoryContent(item?.content || ""),
        confidence: Number(item?.confidence ?? 0),
        metadata: item?.metadata,
      }))
      .filter((item: ExtractedMemory) => {
        return (
          MEMORY_CATEGORIES.includes(item.category) &&
          item.content.length >= 15 &&
          item.content.length <= 220 &&
          item.confidence >= 0.65
        );
      });
  } catch {
    return [];
  }
}

function buildTags(item: ExtractedMemory) {
  const tags = [item.category, item.metadata?.cadence, item.metadata?.horizon].filter(Boolean);
  return tags.length ? (tags as string[]) : null;
}

function memoryToPromptLine(memory: StoredMemory) {
  const category = memory.memory_type;
  const importance = memory.importance ?? 3;
  return `- [${category}] ${memory.memory} (importance ${importance}/5)`;
}

function scoreRelevance(memory: StoredMemory, currentMessage: string) {
  const overlap = jaccardSimilarity(memory.memory, currentMessage);
  const importance = (memory.importance ?? 3) / 5;

  const updated = memory.updated_at ? new Date(memory.updated_at).getTime() : 0;
  const now = Date.now();
  const ageDays = updated ? Math.max(0, (now - updated) / (1000 * 60 * 60 * 24)) : 120;
  const freshness = Math.max(0.2, 1 - ageDays / 120);

  return overlap * 0.65 + importance * 0.25 + freshness * 0.1;
}

export async function extractMentorMemories(opts: {
  model: string;
  userMessage: string;
  assistantMessage: string;
}) {
  const { model, userMessage, assistantMessage } = opts;

  const { text } = await generateText({
    model: openai(model),
    messages: [
      {
        role: "system",
        content: `You extract ONLY long-term founder memory.
Return strict JSON with shape:
{"memories":[{"category":"business_direction|target_audience|offer_focus|goal|blocker|working_style|constraint","content":"...","confidence":0-1,"metadata":{"cadence":"recurring|evolving|stable","horizon":"short_term|mid_term|long_term"}}]}
Rules:
- Keep only high-signal insights likely useful for future sessions.
- Skip one-off tactical details or temporary chatter.
- Keep content concise (max 1 sentence, max 220 chars).
- Deduplicate within this extraction.`,
      },
      {
        role: "user",
        content: `Founder message:\n${userMessage}\n\nMentor response:\n${assistantMessage}`,
      },
    ],
    temperature: 0,
  });

  return parseExtractedMemories(text);
}

export async function upsertMentorMemories(opts: {
  supabase: any;
  userId: string;
  items: ExtractedMemory[];
  source: string;
  conversationId?: string | null;
}) {
  const { supabase, userId, items, source, conversationId } = opts;
  if (!items.length) return;

  const byCategory = new Map<MemoryCategory, ExtractedMemory[]>();
  for (const item of items) {
    const list = byCategory.get(item.category) || [];
    list.push(item);
    byCategory.set(item.category, list);
  }

  for (const [category, categoryItems] of byCategory.entries()) {
    const { data: existingRows, error } = await supabase
      .from("ai_memory")
      .select("id, memory_type, memory, importance, updated_at, tags")
      .eq("user_id", userId)
      .eq("memory_type", category)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("MEMORY_LOOKUP_ERROR", error);
      continue;
    }

    for (const item of categoryItems) {
      const existing = (existingRows || []).find((row: StoredMemory) => {
        const similarity = jaccardSimilarity(row.memory, item.content);
        return (
          similarity >= 0.72 ||
          row.memory.toLowerCase().includes(item.content.toLowerCase()) ||
          item.content.toLowerCase().includes(row.memory.toLowerCase())
        );
      });

      const importance = Math.min(5, Math.max(3, Math.round(item.confidence * 5)));

      if (existing) {
        const mergedTags = Array.from(
          new Set([...(existing.tags || []), ...(buildTags(item) || [])])
        );

        await supabase
          .from("ai_memory")
          .update({
            memory: item.content,
            importance: Math.max(existing.importance ?? 3, importance),
            updated_at: new Date().toISOString(),
            source,
            tags: mergedTags.length ? mergedTags : null,
            conversation_id: conversationId || null,
          })
          .eq("id", existing.id)
          .eq("user_id", userId);
      } else {
        await supabase.from("ai_memory").insert({
          user_id: userId,
          memory_type: category,
          memory: item.content,
          importance,
          source,
          tags: buildTags(item),
          conversation_id: conversationId || null,
          is_private: true,
        });
      }
    }
  }
}

export async function getMentorMemoryContext(opts: {
  supabase: any;
  userId: string;
  currentMessage: string;
  limit?: number;
}) {
  const { supabase, userId, currentMessage, limit = 6 } = opts;

  const { data, error } = await supabase
    .from("ai_memory")
    .select("id, memory_type, memory, importance, updated_at, tags")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(60);

  if (error || !data?.length) {
    return "No relevant memory yet.";
  }

  const ranked = (data as StoredMemory[])
    .map((item) => ({
      item,
      score: scoreRelevance(item, currentMessage),
    }))
    .filter((x) => x.score > 0.2)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.item);

  if (!ranked.length) {
    return "No relevant memory yet.";
  }

  return ranked.map(memoryToPromptLine).join("\n");
}
