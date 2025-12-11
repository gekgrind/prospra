import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import {
  AdCampaign,
  AdGeneratorOptions,
  VCContext,
  WebsiteScoreContext,
  buildAdGeneratorPrompt,
  normalizeCampaignResponse,
} from "@/lib/website-brain/ad-generator";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    // ✅ IMPORTANT: await the server client
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("getUser error:", userError);
    }

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as Partial<
      AdGeneratorOptions
    >;

    const options: AdGeneratorOptions = {
      platforms:
        body.platforms && body.platforms.length > 0
          ? body.platforms
          : ["tiktok", "meta", "google-search"],
      tone: body.tone ?? "supportive-hype",
      growthFocus: body.growthFocus ?? "leads-and-sales",
    };

    // ---- Load profile / founder context ---------------------------------
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        `
        id,
        full_name,
        company_name,
        industry,
        growth_goal,
        monthly_revenue,
        target_mrr,
        founder_score,
        business_health_score,
        website_url
      `
      )
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("profile error:", profileError);
    }

    // ---- Load latest website snapshot / scores --------------------------
    // ⚠️ TODO: adjust table + column names to match your schema
    const { data: snapshot, error: snapshotError } = await supabase
      .from("website_snapshots")
      .select(
        `
        id,
        url,
        content,
        score_overall,
        score_clarity,
        score_offer,
        score_seo,
        score_ux
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (snapshotError) {
      console.error("snapshot error:", snapshotError);
    }

    if (!snapshot?.content) {
      return NextResponse.json(
        {
          error:
            "No website content found. Run a website scan first, then try again.",
        },
        { status: 400 }
      );
    }

    const websiteContent: string = snapshot.content;
    const websiteUrl: string =
      snapshot.url || profile?.website_url || "Unknown";

    const vcContext: VCContext = {
      fundingStage:
        (user.user_metadata as any)?.settings?.fundingStage ?? undefined,
      targetRaise:
        (user.user_metadata as any)?.settings?.targetRaise ?? undefined,
      runwayMonths:
        (user.user_metadata as any)?.settings?.runwayMonths ?? undefined,
      founderScore: (profile as any)?.founder_score ?? null,
      businessHealthScore: (profile as any)?.business_health_score ?? null,
    };

    const websiteScoreContext: WebsiteScoreContext = {
      url: websiteUrl,
      overallScore: (snapshot as any).score_overall ?? null,
      clarityScore: (snapshot as any).score_clarity ?? null,
      offerScore: (snapshot as any).score_offer ?? null,
      seoScore: (snapshot as any).score_seo ?? null,
      uxScore: (snapshot as any).score_ux ?? null,
    };

    const founderName = profile?.full_name || "Founder";
    const companyName = profile?.company_name || "This startup";
    const growthGoal = profile?.growth_goal || "increase revenue and growth";

    const { systemPrompt, userPrompt } = buildAdGeneratorPrompt({
      founderName,
      companyName,
      industry: profile?.industry ?? undefined,
      growthGoal,
      websiteContent,
      options,
      vcContext,
      websiteScoreContext,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.9,
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content);
    const campaigns: AdCampaign[] = normalizeCampaignResponse(parsed);

    return NextResponse.json({
      campaigns,
      context: {
        usedOptions: options,
        vcContext,
        websiteScoreContext,
        websiteUrl,
        companyName,
        founderName,
      },
    });
  } catch (err) {
    console.error("ad-campaign route error:", err);
    return NextResponse.json(
      { error: "Failed to generate ad campaigns" },
      { status: 500 }
    );
  }
}
