import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeMultiFactorFounderScore } from "@/lib/intelligence/founder-score";

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: latest } = await supabase
      .from("founder_score_signals")
      .select("action_plan_completion, mentor_consistency, website_clarity, revenue_readiness, execution_velocity")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const result = computeMultiFactorFounderScore({
      actionPlanCompletion: latest?.action_plan_completion ?? 0,
      mentorConsistency: latest?.mentor_consistency ?? 0,
      websiteClarity: latest?.website_clarity ?? 0,
      revenueReadiness: latest?.revenue_readiness ?? 0,
      executionVelocity: latest?.execution_velocity ?? 0,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("INTELLIGENCE_FOUNDER_SCORE_GET_ERROR", error);
    return NextResponse.json({ error: "Failed to compute founder score" }, { status: 500 });
  }
}
