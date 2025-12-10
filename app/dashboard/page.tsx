import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";
import { SuccessCoachDock } from "@/components/dashboard/SuccessCoachDock";

// NEW IMPORTS
import { computeFounderScore } from "@/lib/founder/score-engine";
import { computeBusinessHealthIndicators } from "@/lib/business/health";
import { computeGoalProgress } from "@/lib/goals";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError) console.error("Profile fetch error:", profileError);

  // Onboarding required?
  if (!profile?.onboarding_complete) redirect("/onboarding");

  // Fetch 5 most recent journal entries
  const { data: recentEntries } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false })
    .limit(5);

  // Fetch goals
  const { data: goalsData } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const goals = goalsData ?? [];

  // Compute goal progress averages (for founder score bonus inputs)
  const goalProgressValues = goals.map((g) =>
    computeGoalProgress(g)
  );
  const avgGoalProgress =
    goalProgressValues.length > 0
      ? goalProgressValues.reduce((a, b) => a + b, 0) / goalProgressValues.length
      : 0;

  // Founder Score Inputs (placeholders until full scoring data comes online)
  const founderScoreInput = {
    clarity: profile?.clarity_score ?? 0.5,
    execution: profile?.execution_score ?? 0.5,
    strategy: profile?.strategy_score ?? 0.5,
    consistency: profile?.consistency_score ?? 0.5,
    marketReadiness: profile?.market_readiness_score ?? 0.5,
    websiteScore: profile?.website_score ?? 0,
    journalConsistency: profile?.journal_consistency ?? 0,
    goalProgress: avgGoalProgress,
  };

  const founderScore = computeFounderScore(founderScoreInput);

  // Business Health Layer (can later be tied to real analyzer output)
  const businessHealth = computeBusinessHealthIndicators({
    trafficScore: profile?.traffic_score ?? 60,
    leadFlowScore: profile?.lead_flow_score ?? 50,
    offerClarityScore: profile?.clarity_score ?? 70,
    funnelStrengthScore: profile?.funnel_strength ?? 55,
    momentumScore: profile?.momentum_score ?? 65,
  });

  return (
    <>
      {/* Dashboard Data Client */}
      <DashboardClient
        user={user}
        profile={profile}
        recentEntries={recentEntries ?? []}
        founderScore={founderScore}
        businessHealth={businessHealth}
        goals={goals}
      />

      {/* Global Success Coach */}
      <SuccessCoachDock />
    </>
  );
}
