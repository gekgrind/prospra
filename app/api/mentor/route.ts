// =========================================
//  PROSPRA MENTOR — FULL BRAIN STACK ROUTE
//  (Corrected imports + stable OpenAI + Supabase SSR)
// =========================================

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import OpenAI from "openai";

// Brain modules
import { FIXED_RULES } from "@/lib/brain/fixed-rules";
import { getRelevantResources } from "@/lib/brain/resources-brain";
import { embed } from "@/lib/embeddings";

// ---------- OPENAI SETUP ----------
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ---------- SUPABASE CLIENT ----------
function createClient(request: Request) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.headers.get("cookie") ?? "";
        },
      },
    }
  );
}

// =========================================
//             MAIN ROUTE HANDLER
// =========================================
export async function POST(req: Request) {
  try {
    const supabase = createClient(req);
    const { messages } = await req.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { role: "assistant", content: "I need something to respond to 😅" },
        { status: 400 }
      );
    }

    const userMessage = messages[messages.length - 1].content;

    // ---------- AUTH ----------
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let isPremium = false;
    let memoryRows = [];

    if (user) {
      // Check premium
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_premium, plan_tier, subscription_status")
        .eq("id", user.id)
        .maybeSingle();

      isPremium =
        profile?.is_premium ||
        profile?.subscription_status === "active" ||
        profile?.plan_tier === "pro";

      // Load personal memory
      const { data: memory } = await supabase
        .from("ai_memory")
        .select("*")
        .eq("user_id", user.id);

      memoryRows = memory || [];
    }

    // ---------- RESOURCE BRAIN ----------
    const resources = await getRelevantResources(userMessage);

    const resourceContext =
      resources?.length > 0
        ? resources
            .map((r: any) => `• ${r.title}\n${r.summary}`)
            .join("\n\n")
        : "No relevant curated resources found.";

    // ---------- MEMORY BRAIN ----------
    const memoryContext =
      memoryRows?.length > 0
        ? memoryRows.map((m: any) => `• ${m.content}`).join("\n")
        : "No memory stored yet.";

    // ---------- SYSTEM PROMPT ----------
    const systemPrompt = `
You are Prospra — the user's AI Mentor.

Follow these FIXED RULES:
${FIXED_RULES}

Relevant curated resource knowledge:
${resourceContext}

User-specific memory:
${memoryContext}

Reply with:
- Supportive, realistic, modern entrepreneurial coaching
- Slightly playful Gen-Z tone when appropriate
- Step-by-step clarity
- Zero hallucinations
`;

    // ---------- AI COMPLETION ----------
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      temperature: 0.8,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    });

    const aiReply =
      completion.choices?.[0]?.message?.content ??
      "Oops, my brain glitched for a sec — try again?";

    // ---------- RESPONSE ----------
    return NextResponse.json({
      role: "assistant",
      content: aiReply,
    });
  } catch (error: any) {
    console.error("MENTOR ROUTE ERROR:", error);

    return NextResponse.json(
      {
        role: "assistant",
        content:
          "Oof… something broke in my thinking engine. Try again? If this keeps happening, we can debug it together.",
        error: error?.message,
      },
      { status: 500 }
    );
  }
}
