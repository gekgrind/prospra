// FULL UPDATED
// /app/api/chat/route.ts

import { streamText, generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import OpenAI from "openai";
import { createServerClient } from "@supabase/ssr";
import { generateConversationTitle } from "./get-title";
import { getWebsiteBrainContext } from "@/lib/website-brain/retrieve";

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/* -------------------------------------------------------------
   TYPES
------------------------------------------------------------- */

type UIMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

/* -------------------------------------------------------------
   UTILS
------------------------------------------------------------- */

function extractTextFromMessage(message: any) {
  if (!message) return "";

  if (typeof message.content === "string") return message.content;

  if (Array.isArray(message.parts)) {
    return message.parts
      .map((p: any) =>
        p?.text
          ? p.text
          : typeof p?.content === "string"
          ? p.content
          : ""
      )
      .join("");
  }

  return "";
}

/* -------------------------------------------------------------
   SUPABASE CLIENT
------------------------------------------------------------- */

function createClient(request: Request) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          try {
            const raw = request.headers.get("cookie");
            if (!raw) return undefined;

            const cookies = raw
              .split(";")
              .map((c) => c.trim())
              .find((c) => c.startsWith(`${name}=`));

            const value = cookies?.substring(name.length + 1);
            return value && value.length > 0 ? value : undefined;
          } catch {
            return undefined;
          }
        },
      },
    }
  );
}

/* -------------------------------------------------------------
   EMBEDDINGS
------------------------------------------------------------- */

async function getEmbedding(text: string) {
  try {
    const res = await openaiClient.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return res.data[0]?.embedding ?? null;
  } catch (err) {
    console.error("EMBEDDING ERROR:", err);
    return null;
  }
}

/* -------------------------------------------------------------
   MEMORY RETRIEVAL
------------------------------------------------------------- */

async function getUserMemories(supabase: any, userId: string, embedding?: any) {
  try {
    if (!embedding) {
      const { data } = await supabase
        .from("ai_memory")
        .select("*")
        .eq("user_id", userId)
        .order("importance", { ascending: false })
        .limit(20);

      return data ?? [];
    }

    const { data, error } = await supabase.rpc("match_memories", {
      query_embedding: embedding,
      user_id: userId,
      match_count: 20,
    });

    if (error) {
      console.error("match_memories RPC ERROR:", error);
      return [];
    }

    return data ?? [];
  } catch (err) {
    console.error("MEMORY RETRIEVAL ERROR:", err);
    return [];
  }
}

/* -------------------------------------------------------------
   MEMORY SCORING + EXTRACTION
------------------------------------------------------------- */

async function scoreMemory(text: string) {
  try {
    const { text: out } = await generateText({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "system",
          content:
            "Score this memory on a scale of 1–5 for long-term usefulness. Respond ONLY with a number.",
        },
        { role: "user", content: text },
      ],
    });

    const n = parseInt(out.trim(), 10);
    return Number.isNaN(n) ? 3 : n;
  } catch {
    return 3;
  }
}

async function extractMemories(model: string, userMessage: string, aiResponse: string) {
  try {
    const { text } = await generateText({
      model: openai(model),
      messages: [
        {
          role: "system",
          content:
            'Extract meaningful long-term memories ONLY. Output JSON: {"memories":[{"memory_type":"...","memory":"...","importance":1-5}]}',
        },
        {
          role: "user",
          content: `User said: "${userMessage}"\nAI said: "${aiResponse}"`,
        },
      ],
    });

    return JSON.parse(text);
  } catch {
    return { memories: [] };
  }
}

async function saveMemories(supabase: any, userId: string, memories: any[]) {
  if (!memories.length) return;

  for (const m of memories) {
    try {
      const importance = await scoreMemory(m.memory);
      const embedding = await getEmbedding(m.memory);

      await supabase.from("ai_memory").insert({
        user_id: userId,
        memory_type: m.memory_type || "note",
        memory: m.memory,
        importance,
        embedding,
      });
    } catch (err) {
      console.error("MEMORY SAVE ERROR:", err);
    }
  }
}

/* -------------------------------------------------------------
   SYSTEM PROMPTS FOR MODES
------------------------------------------------------------- */

function buildSystemPrompt(mode: string, websiteContext: string, memoryContext: string) {
  switch (mode) {
    case "website-coach":
      return `
You are **Prospra Website Coach**, an expert at improving clarity, UX, and conversion.

Respond with:  
**Insight** (2–3 sentences)  
**What's Working**  
- bullet  
- bullet  
**Fix This Next**  
1. item  
2. item  
3. item  

Rules:  
- Reference website context deeply.  
- Be clear, punchy, supportive, Gen-Z friendly.

Website Context:
${websiteContext}

Memory Context:
${memoryContext}
`;

    case "seo-ux":
      return `
You are **Prospra SEO/UX Analyzer**.

Your job:  
- Score SEO fundamentals  
- Identify UX issues  
- Suggest high-impact fixes  
- Improve scannability and SEO structure

Respond with sections:  
**SEO Score (1–100)**  
**UX Score (1–100)**  
**Top Issues**  
**Fix This Next**

Website Context:
${websiteContext}

Memory Context:
${memoryContext}
`;

    case "funnel-mapping":
      return `
You are **Prospra Funnel Architect**.

Your job:  
- Map the user’s funnel  
- Identify leaks  
- Suggest fixes  
- Output a funnel diagram  
- Provide conversion recommendations

Sections:  
**Funnel Overview**  
**Drop-Off Risks**  
**Fix This Next**  
**ASCII Funnel Diagram**

Website Context:
${websiteContext}

Memory Context:
${memoryContext}
`;

    case "cta-analyzer":
      return `
You are **Prospra CTA Analyzer**, a senior conversion copywriter.

Workflow:
1. Analyze the CTA for clarity, emotion, action, urgency.  
2. Suggest 2–3 improved versions.  
3. Provide coaching.  
4. ALWAYS output a CTA score JSON block at the end EXACTLY like this:

\`\`\`cta-score
{
  "clarity": 0-100,
  "emotion": 0-100,
  "strength": 0-100,
  "urgency": 0-100,
  "conversion": 0-100,
  "summary": "short 1-sentence summary"
}
\`\`\`

Respond with:  
**CTA Analysis**  
**Better Versions**  
**Why These Work**  

Website Context:
${websiteContext}

Memory Context:
${memoryContext}
`;

    default:
      return `
You are **Prospra**, an elite entrepreneurial mentor.

Respond with:

**Mentor Insight (1–2 sentences)**  
**Key Points**  
- bullet  
- bullet  
- bullet  
**Action Steps**  
1. step  
2. step  
3. step  
**Bonus Tip**

Tone: warm, human, Gen-Z friendly, practical.  
Reference memories + website when helpful.

Website Context:
${websiteContext}

Memory Context:
${memoryContext}
`;
  }
}

/* -------------------------------------------------------------
   MAIN HANDLER
------------------------------------------------------------- */

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const { messages: raw, conversationId: incoming, mode = "mentor" } = body;
    if (!Array.isArray(raw)) {
      return new Response(JSON.stringify({ error: "Messages must be an array" }), {
        status: 400,
      });
    }

    const normalized: UIMessage[] = raw.map((m: any) => ({
      role: m.role,
      content: extractTextFromMessage(m),
    }));

    const supabase = createClient(req);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let memoryContext = "No relevant memories found.";
    let websiteContext = "";
    let isPremium = false;
    let conversationId = incoming ?? null;

    const lastUserMessage = normalized[normalized.length - 1]?.content || "";

    /* -------------------- USER LOGIC -------------------- */
    if (user) {
      const embedding = await getEmbedding(lastUserMessage);
      const memories = await getUserMemories(supabase, user.id, embedding);

      memoryContext =
        memories.length > 0
          ? memories
              .map(
                (m: any) =>
                  `- (${m.memory_type}, importance ${m.importance}) ${m.memory}`
              )
              .join("\n")
          : "No relevant memories found.";

      try {
        websiteContext =
          (await getWebsiteBrainContext(user.id, lastUserMessage)) ??
          "";
      } catch {
        websiteContext = "";
      }

      // Premium + daily credit logic (your original behavior preserved)
      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "is_premium, plan_tier, subscription_status, daily_credit_limit, daily_credits_used, last_credit_reset"
        )
        .eq("id", user.id)
        .single();

      const tier = profile?.plan_tier ?? "free";
      const active = profile?.subscription_status === "active";

      isPremium = profile?.is_premium || (tier !== "free" && active);

      let dailyLimit = profile?.daily_credit_limit ?? 5;
      let used = profile?.daily_credits_used ?? 0;
      let last = profile?.last_credit_reset ?? null;

      const today = new Date().toISOString().slice(0, 10);
      if (last !== today) {
        await supabase
          .from("profiles")
          .update({ daily_credits_used: 0, last_credit_reset: today })
          .eq("id", user.id);

        used = 0;
      }

      if (!isPremium && used >= dailyLimit) {
        return new Response(
          "You've used today's free Prospra prompts. Upgrade to keep the inspiration flowing!",
          { status: 429 }
        );
      }

      if (!isPremium) {
        await supabase
          .from("profiles")
          .update({ daily_credits_used: used + 1 })
          .eq("id", user.id);
      }

      if (!conversationId) {
        const title = await generateConversationTitle(lastUserMessage);
        const { data: conv } = await supabase
          .from("conversations")
          .insert({ user_id: user.id, title })
          .select()
          .single();

        conversationId = conv?.id ?? null;
      }
    }

    /* -------------------- SYSTEM PROMPT -------------------- */

    const systemPrompt = buildSystemPrompt(
      mode,
      websiteContext || "No website data yet.",
      memoryContext
    );

    /* -------------------- STREAM RESPONSE -------------------- */

    const result = streamText({
      model: openai(isPremium ? "gpt-4o" : "gpt-4o-mini"),
      messages: [
        { role: "system", content: systemPrompt },
        ...normalized,
      ],
      temperature: isPremium ? 0.9 : 0.6,

      onFinish: async ({ text }: any) => {
        try {
          if (user && text) {
            const extracted = await extractMemories(
              isPremium ? "gpt-4o" : "gpt-4o-mini",
              lastUserMessage,
              text
            );
            await saveMemories(supabase, user.id, extracted.memories || []);
          }
        } catch (err) {
          console.error("MEMORY EXTRACTION ERROR:", err);
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (err: any) {
    console.error("CHAT ROUTE ERROR:", err);

    return new Response(
      JSON.stringify({
        error: "CHAT_ERROR",
        message: String(err),
      }),
      { status: 500 }
    );
  }
}
