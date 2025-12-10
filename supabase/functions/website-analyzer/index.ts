// supabase/functions/website-analyzer/index.ts
// Deno Edge Function

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";
import OpenAI from "https://esm.sh/openai@4.67.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const openaiKey = Deno.env.get("OPENAI_API_KEY")!;

const supabase = createClient(supabaseUrl, serviceRoleKey);
const openai = new OpenAI({ apiKey: openaiKey });

type AnalyzerRequest = {
  website: string;
  user_id: string;
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = (await req.json()) as AnalyzerRequest;

    if (!body.website || !body.user_id) {
      return new Response(
        JSON.stringify({ error: "website and user_id are required" }),
        { status: 400 }
      );
    }

    const websiteUrl = body.website;
    const userId = body.user_id;

    // 1) Fetch website HTML
    const htmlRes = await fetch(websiteUrl, {
      method: "GET",
      headers: {
        "User-Agent": "ProspraBot/1.0 (+https://entrepreneuria.io)",
      },
    });

    const html = await htmlRes.text();

    // 2) Convert HTML → plain-ish text for analysis
    const textContent = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 12000); // keep it sane for the model

    // 3) Ask OpenAI for advanced scoring JSON
    const scoringPrompt = `
You are an expert website strategist (SEO + UX + offer clarity).

Analyze this website content and return STRICT JSON.

Website text:
"""${textContent}"""

Return ONLY valid JSON with this shape:

{
  "summary": "2-3 sentence summary of what this site is about",
  "seo": {
    "score": number,           // 0-100
    "strengths": string[],
    "issues": string[],
    "recommendations": string[]
  },
  "ux": {
    "score": number,           // 0-100
    "strengths": string[],
    "issues": string[],
    "recommendations": string[]
  },
  "offer_clarity": {
    "score": number,           // 0-100
    "strengths": string[],
    "issues": string[],
    "recommendations": string[]
  },
  "quick_wins": string[]       // 3-7 highest leverage action items
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: "Return ONLY valid JSON. No prose." },
        { role: "user", content: scoringPrompt },
      ],
      temperature: 0.2,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";

    let analysis: any;
    try {
      analysis = JSON.parse(raw);
    } catch (_err) {
      // fallback: try to extract JSON from messy output
      const match = raw.match(/\{[\s\S]*\}/);
      analysis = match ? JSON.parse(match[0]) : null;
    }

    if (!analysis) {
      throw new Error("Failed to parse analysis JSON");
    }

    // 4) Store scores JSON on the profile
    await supabase
      .from("profiles")
      .update({
        website_data: analysis, // website_data is JSONB in your schema
        website_last_scanned: new Date().toISOString(),
      })
      .eq("id", userId);

    // 5) (Optional) you can still embed + store chunks in website_brain_embeddings here
    //    if you're not already doing that elsewhere.
    //    For now, we just respond with the analysis.

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("website-analyzer error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
