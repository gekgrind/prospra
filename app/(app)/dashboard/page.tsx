import { redirect } from "next/navigation";
import { buildSharedLoginHref } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";
import { SuccessCoachDock } from "@/components/dashboard/SuccessCoachDock";

import { computeFounderScore } from "@/lib/founder/score-engine";
import { computeBusinessHealthIndicators } from "@/lib/business/health";
import { computeGoalProgress } from "@/lib/goals";
import { getUsageSnapshot } from "@/lib/monetization";
import { computeMomentumSummary } from "@/lib/momentum";
import { trackServerEvent } from "@/lib/analytics/server";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

type Goal = Parameters<typeof computeGoalProgress>[0];

function formatError(error: unknown) {
  if (!error) return null;

  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }

  if (typeof error === "object") {
    try {
      return JSON.parse(JSON.stringify(error));
    } catch {
      return { message: "Unknown object error" };
    }
  }

  return { message: String(error) };
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.warn("[DASHBOARD_AUTH_GET_USER_ERROR]", formatError(userError));
  }

  if (!user) {
    redirect(buildSharedLoginHref("/dashboard"));
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.warn("[DASHBOARD_PROFILE_FETCH_ERROR]", formatError(profileError));
  }

  if (!profile || !profile.onboarding_complete) {
    redirect("/onboarding");
  }

  const [recentEntriesResult, actionPlansResult, usageSnapshot] =
    await Promise.all([
      supabase
        .from("journal_entries")
        .select(
          "id, entry_date, progress_notes, challenges, wins, mood, created_at"
        )
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false })
        .limit(5),

      supabase
        .from("action_plans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1),

      getUsageSnapshot(supabase, user.id),
    ]);

  const { data: recentEntries, error: recentEntriesError } = recentEntriesResult;
  const { data: actionPlans, error: actionPlansError } = actionPlansResult;

  if (recentEntriesError) {
    console.warn(
      "[DASHBOARD_RECENT_ENTRIES_FETCH_ERROR]",
      formatError(recentEntriesError)
    );
  }

  if (actionPlansError) {
    console.warn(
      "[DASHBOARD_ACTION_PLANS_FETCH_ERROR]",
      formatError(actionPlansError)
    );
  }

  const safeRecentEntries = recentEntries ?? [];
  const latestActionPlan = actionPlans?.[0] ?? null;

  // `plans` is a shared catalog table, not a user-owned goals table.
  // Keep goals empty until a real user goals source is wired up.
  const goals: Goal[] = [];

  const goalProgressValues = goals.map((goal) => computeGoalProgress(goal));
  const avgGoalProgress =
    goalProgressValues.length > 0
      ? goalProgressValues.reduce((sum, value) => sum + value, 0) /
        goalProgressValues.length
      : 0;

  const founderScore = computeFounderScore({
    clarity: profile.clarity_score ?? 0.5,
    execution: profile.execution_score ?? 0.5,
    strategy: profile.strategy_score ?? 0.5,
    consistency: profile.consistency_score ?? 0.5,
    marketReadiness: profile.market_readiness_score ?? 0.5,
    websiteScore: profile.website_score ?? 0,
    journalConsistency: profile.journal_consistency ?? 0,
    goalProgress: avgGoalProgress,
  });

  const businessHealth = computeBusinessHealthIndicators({
    trafficScore: profile.traffic_score ?? 60,
    leadFlowScore: profile.lead_flow_score ?? 50,
    offerClarityScore: profile.clarity_score ?? 70,
    funnelStrengthScore: profile.funnel_strength ?? 55,
    momentumScore: profile.momentum_score ?? 65,
  });

  const momentum = computeMomentumSummary({
    goals,
    journalEntries: safeRecentEntries,
    latestConversation: null,
  });

  try {
    await trackServerEvent(ANALYTICS_EVENTS.DASHBOARD_VIEWED, {
      user_id: user.id,
      onboarding_complete: Boolean(profile.onboarding_complete),
      plan_tier: profile.plan_tier ?? "free",
      founder_score: founderScore.totalScore,
    });
  } catch (error) {
    console.warn("[DASHBOARD_ANALYTICS_ERROR]", formatError(error));
  }

  return (
    <>
      <DashboardClient
        user={user}
        profile={profile}
        recentEntries={safeRecentEntries}
        founderScore={founderScore}
        businessHealth={businessHealth}
        goals={goals}
        momentum={momentum}
        latestActionPlan={latestActionPlan}
        usageSnapshot={usageSnapshot}
      />
      <SuccessCoachDock />
    </>
  );
}
