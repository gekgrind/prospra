import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

/**
 * WEBSITE SCORING PROMPT
 * (Preserving your exact JSON structure)
 */
const SCORING_PROMPT = (text: string) => `
You are Prospra's Website Intelligence Engine.

Analyze the website text below and produce a JSON object following this EXACT shape:

{
  "scores": {
    "seo": 0-100,
    "ux": 0-100,
    "offer_clarity": 0-100,
    "trust": 0-100,
    "content_quality": 0-100,
    "overall": 0-100
  },
  "insights": {
    "seo": ["bullet", "bullet"],
    "ux": ["bullet", "bullet"],
    "offer_clarity": ["bullet", "bullet"],
    "trust": ["bullet", "bullet"],
    "content_quality": ["bullet", "bullet"]
  },
  "priorities": [
    "Top recommended actions in order"
  ]
}

Rules:
- Make the scoring strict, not generous.
- Use the website text to justify each insight.
- Do NOT include any explanation outside JSON.

WEBSITE CONTENT:
${text}
`;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // Auth
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Load website URL
    const { data: profile } = await supabase
      .from("profiles")
      .select("website_url")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.website_url) {
      return NextResponse.json(
        { error: "No website_url stored for user" },
        { status: 400 }
      );
    }

    // Fetch website text from embeddings table
    const { data: chunks, error: chunkError } = await supabase
      .from("website_brain_embeddings")
      .select("content")
      .eq("user_id", user.id);

    if (chunkError || !chunks?.length) {
      return NextResponse.json(
        { error: "No website content available to score" },
        { status: 400 }
      );
    }

    const websiteText = chunks.map((c: any) => c.content).join("\n\n");

    // ------------------------
    // AI-SDK Scoring Engine
    // ------------------------
    const { text } = await generateText({
      model: openai("gpt-4o"),
      messages: [
        { role: "system", content: "You are Prospra's Website Scoring Engine." },
        { role: "user", content: SCORING_PROMPT(websiteText) },
      ],
      temperature: 0.2,
      maxOutputTokens: 800,
    });

    const raw = text.trim();
    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error("JSON Parse Error:", raw);
      return NextResponse.json(
        { error: "Failed to parse scoring JSON", raw },
        { status: 500 }
      );
    }

    // Save results
    await supabase
      .from("profiles")
      .update({
        website_score: parsed.scores ?? null,
        website_data: parsed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    return NextResponse.json(
      {
        success: true,
        scores: parsed.scores,
        insights: parsed.insights,
        priorities: parsed.priorities,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("WEBSITE SCORE ERROR:", err);
    return NextResponse.json(
      { error: err?.message ?? "Unknown server error" },
      { status: 500 }
    );
  }
}
