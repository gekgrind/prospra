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

type DashboardAlert = {
  key: string;
  label: string;
  message: string;
};

function getNumericProfileField(
  profile: Record<string, unknown>,
  key: string
) {
  const value = profile[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function hasAnyNumericProfileField(
  profile: Record<string, unknown>,
  keys: string[]
) {
  return keys.some((key) => getNumericProfileField(profile, key) !== null);
}

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

  const dashboardAlerts: DashboardAlert[] = [];
  const profileRecord = profile as Record<string, unknown>;

  const [recentEntriesResult, actionPlansResult, recentConversationsResult, usageSnapshot] =
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

      supabase
        .from("conversations")
        .select("id, title, updated_at, created_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(3),

      getUsageSnapshot(supabase, user.id),
    ]);

  const { data: recentEntries, error: recentEntriesError } = recentEntriesResult;
  const { data: actionPlans, error: actionPlansError } = actionPlansResult;
  const { data: recentConversations, error: recentConversationsError } =
    recentConversationsResult;

  if (recentEntriesError) {
    console.warn(
      "[DASHBOARD_RECENT_ENTRIES_FETCH_ERROR]",
      formatError(recentEntriesError)
    );
    dashboardAlerts.push({
      key: "recent-activity",
      label: "Activity unavailable",
      message:
        "Recent founder activity could not be loaded. The rest of your dashboard is still available.",
    });
  }

  if (actionPlansError) {
    console.warn(
      "[DASHBOARD_ACTION_PLANS_FETCH_ERROR]",
      formatError(actionPlansError)
    );
    dashboardAlerts.push({
      key: "action-plans",
      label: "Action plans unavailable",
      message:
        "Your latest action plan could not be loaded. You can still open AI Mentor to create or refresh one.",
    });
  }

  if (recentConversationsError) {
    console.warn(
      "[DASHBOARD_RECENT_CONVERSATIONS_FETCH_ERROR]",
      formatError(recentConversationsError)
    );
    dashboardAlerts.push({
      key: "mentor-sessions",
      label: "Mentor history unavailable",
      message:
        "Recent mentor sessions could not be loaded. Starting a new session is still available.",
    });
  }

  const safeRecentEntries = recentEntries ?? [];
  const safeRecentConversations = recentConversations ?? [];
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

  const founderInputKeys = [
    "clarity_score",
    "execution_score",
    "strategy_score",
    "consistency_score",
    "market_readiness_score",
  ];

  const businessHealthInputKeys = [
    "traffic_score",
    "lead_flow_score",
    "clarity_score",
    "funnel_strength",
    "momentum_score",
  ];

  const hasFounderScoreInputs = hasAnyNumericProfileField(
    profileRecord,
    founderInputKeys
  );
  const hasBusinessHealthInputs = hasAnyNumericProfileField(
    profileRecord,
    businessHealthInputKeys
  );
  const hasWebsiteAnalysis =
    getNumericProfileField(profileRecord, "website_score") !== null;

  const founderScore = computeFounderScore({
    clarity: getNumericProfileField(profileRecord, "clarity_score") ?? 0.5,
    execution: getNumericProfileField(profileRecord, "execution_score") ?? 0.5,
    strategy: getNumericProfileField(profileRecord, "strategy_score") ?? 0.5,
    consistency:
      getNumericProfileField(profileRecord, "consistency_score") ?? 0.5,
    marketReadiness:
      getNumericProfileField(profileRecord, "market_readiness_score") ?? 0.5,
    websiteScore: getNumericProfileField(profileRecord, "website_score") ?? 0,
    journalConsistency:
      getNumericProfileField(profileRecord, "journal_consistency") ?? 0,
    goalProgress: avgGoalProgress,
  });

  const businessHealth = computeBusinessHealthIndicators({
    trafficScore: getNumericProfileField(profileRecord, "traffic_score") ?? 50,
    leadFlowScore:
      getNumericProfileField(profileRecord, "lead_flow_score") ?? 50,
    offerClarityScore:
      getNumericProfileField(profileRecord, "clarity_score") ?? 50,
    funnelStrengthScore:
      getNumericProfileField(profileRecord, "funnel_strength") ?? 50,
    momentumScore: getNumericProfileField(profileRecord, "momentum_score") ?? 50,
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
        recentMentorSessions={safeRecentConversations}
        founderScore={founderScore}
        businessHealth={businessHealth}
        goals={goals}
        momentum={momentum}
        latestActionPlan={latestActionPlan}
        usageSnapshot={usageSnapshot}
        dashboardAlerts={dashboardAlerts}
        hasFounderScoreInputs={hasFounderScoreInputs}
        hasBusinessHealthInputs={hasBusinessHealthInputs}
        hasWebsiteAnalysis={hasWebsiteAnalysis}
      />
      <SuccessCoachDock />
    </>
  );
}
