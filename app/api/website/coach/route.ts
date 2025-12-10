// app/api/website/coach/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import { getWebsiteBrainContext } from "@/lib/website-brain/retrieve";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // 1) Auth check
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    // 2) Load profile + website
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("website_url")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Website Coach profile error:", profileError);
      return NextResponse.json(
        { error: "Failed to load profile" },
        { status: 500 }
      );
    }

    if (!profile?.website_url) {
      return NextResponse.json(
        { error: "No website URL found for this user" },
        { status: 400 }
      );
    }

    // 3) Parse request body (coach question)
    const body = await req.json().catch(() => null);
    const question =
      (typeof body?.question === "string" && body.question.trim()) || "";

    if (!question) {
      return NextResponse.json(
        { error: "Missing 'question' in request body" },
        { status: 400 }
      );
    }

    // 4) Website Brain context
    const websiteContext = await getWebsiteBrainContext(user.id, question);

    // 5) System prompt for Website Coach mode
    const systemPrompt = `
You are **Prospra Website Coach**, a specialist focused on improving the user's website.

You ALWAYS base your coaching on the Website Context below when relevant.

Your job:
- Diagnose issues in SEO, UX, clarity, offer, CTAs, and funnel
- Explain things in friendly, non-jargony language
- Give concrete, prioritized recommendations the user can implement this week
- Speak directly to the user, not in third person
- Assume the user's site is at: ${profile.website_url}

WEBSITE CONTEXT (can be partial or noisy):
${websiteContext || "No website content available yet."}

RESPONSE FORMAT (Markdown):

**Quick Diagnosis (2–3 sentences)**  
High-level snapshot of what’s working and what’s not.

**SEO Snapshot**  
- What you're signaling to search engines right now  
- Biggest gaps / opportunities  

**UX & Clarity Check**  
- How clear the message is  
- Any friction or confusion for visitors  

**Offer & CTA Review**  
- Is the main offer clear and compelling?  
- Are the CTAs specific and action-driven?  

**Funnel & Next Steps**  
- What the implied funnel is (from first visit to conversion)  
- 3–5 concrete improvements you’d make next  

**Copy Upgrade Suggestions**  
- 2–3 specific lines, headlines, or CTA rewrites you recommend

Tone:
- Supportive, direct, practical
- Like a smart marketing friend who actually looked at their site
- Keep paragraphs short and scannable.
`;

    // 6) Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `The user asked:\n"${question}"\n\nGive coaching focused on their website.`,
        },
      ],
      temperature: 0.7,
    });

    const answer = completion.choices[0]?.message?.content ?? "";

    return NextResponse.json(
      {
        success: true,
        answer,
        websiteUrl: profile.website_url,
        hasWebsiteContext: Boolean(websiteContext),
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Website Coach Error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Unexpected server error" },
      { status: 500 }
    );
  }
}
