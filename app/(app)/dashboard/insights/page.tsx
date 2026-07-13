import { createClient } from "@/lib/supabase/server";
import { computeMultiFactorFounderScore } from "@/lib/intelligence/founder-score";
import { fetchSharedInsights } from "@/lib/intelligence/shared-layer";
import { sanitizeTasks } from "@/lib/action-plans";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

type InsightsData = {
  founderScore: { totalScore: number; breakdown: Record<string, number> } | null;
  sharedInsights: Array<{
    insight_key: string;
    insight_summary: string;
    source_app: string;
    priority: number;
  }>;
  recentTakeaways: Array<{ conversationId: string; summary: string; insights: string[] }>;
  website: {
    seoScore: number | null;
    uxScore: number | null;
    offerClarityScore: number | null;
    ctaScore: number | null;
    keyIssues: string[];
  } | null;
  actionPlan: { total: number; done: number } | null;
};

async function loadInsights(): Promise<
  | { data: InsightsData; error: null }
  | { data: null; error: string }
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: "Sign in again to view your insights." };
    }

    const [
      { data: scoreRow },
      sharedInsights,
      { data: outputs },
      { data: websiteRow },
      { data: planRow },
    ] = await Promise.all([
      supabase
        .from("founder_score_signals")
        .select(
          "action_plan_completion, mentor_consistency, website_clarity, revenue_readiness, execution_velocity"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      fetchSharedInsights(supabase as never, user.id, "prospra").catch(
        () => []
      ),
      supabase
        .from("conversation_outputs")
        .select("conversation_id, summary, insights, created_at")
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("website_intelligence")
        .select("seo_score, ux_score, offer_clarity_score, cta_score, key_issues")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("action_plans")
        .select("tasks")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const founderScore = scoreRow
      ? computeMultiFactorFounderScore({
          actionPlanCompletion: scoreRow.action_plan_completion ?? 0,
          mentorConsistency: scoreRow.mentor_consistency ?? 0,
          websiteClarity: scoreRow.website_clarity ?? 0,
          revenueReadiness: scoreRow.revenue_readiness ?? 0,
          executionVelocity: scoreRow.execution_velocity ?? 0,
        })
      : null;

    const recentTakeaways = ((outputs ?? []) as Array<{
      conversation_id: string;
      summary: string | null;
      insights: string[] | null;
    }>)
      .filter((output) => output.summary || (output.insights ?? []).length > 0)
      .map((output) => ({
        conversationId: output.conversation_id,
        summary: output.summary ?? "",
        insights: Array.isArray(output.insights) ? output.insights : [],
      }));

    const website = websiteRow
      ? {
          seoScore: websiteRow.seo_score,
          uxScore: websiteRow.ux_score,
          offerClarityScore: websiteRow.offer_clarity_score,
          ctaScore: websiteRow.cta_score,
          keyIssues: Array.isArray(websiteRow.key_issues)
            ? (websiteRow.key_issues as unknown[]).filter(
                (issue): issue is string => typeof issue === "string"
              )
            : [],
        }
      : null;

    let actionPlan: InsightsData["actionPlan"] = null;
    if (planRow) {
      const tasks = sanitizeTasks(planRow.tasks);
      actionPlan = {
        total: tasks.length,
        done: tasks.filter((task) => task.status === "completed").length,
      };
    }

    return {
      data: {
        founderScore,
        sharedInsights: Array.isArray(sharedInsights) ? sharedInsights : [],
        recentTakeaways,
        website,
        actionPlan,
      },
      error: null,
    };
  } catch (error) {
    console.error("[INSIGHTS_PAGE_LOAD_ERROR]", error);
    return {
      data: null,
      error: "Prospra could not load your insights. Retry the page shortly.",
    };
  }
}

function ScorePill({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-xl border border-brandBlue/30 bg-brandNavy/60 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-brandBlueLight/60">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-brandBlueLight">
        {typeof value === "number" ? value : "—"}
      </p>
    </div>
  );
}

export default async function DashboardInsightsPage() {
  const { data, error } = await loadInsights();

  const hasAnyData =
    data &&
    (data.founderScore ||
      data.sharedInsights.length > 0 ||
      data.recentTakeaways.length > 0 ||
      data.website ||
      data.actionPlan);

  return (
    <div className="space-y-6">
      <Card className="bg-brandNavy border-brandBlue/40">
        <CardHeader>
          <CardTitle className="text-brandBlueLight">Insights</CardTitle>
          <CardDescription className="text-brandBlueLight/70">
            Growth signals, execution patterns, and takeaways pulled from your
            mentor sessions, action plans, and website analysis.
          </CardDescription>
        </CardHeader>
        {error ? (
          <CardContent className="text-sm text-red-400">{error}</CardContent>
        ) : !hasAnyData ? (
          <CardContent className="text-sm text-brandBlueLight/70">
            No insight data yet. Complete a mentor session, generate a session
            recap, or run a website analysis to start generating trends.
          </CardContent>
        ) : null}
      </Card>

      {data?.founderScore ? (
        <Card className="bg-brandNavy border-brandBlue/40">
          <CardHeader>
            <CardTitle className="text-brandBlueLight text-base">
              Founder Score: {data.founderScore.totalScore}
            </CardTitle>
            <CardDescription className="text-brandBlueLight/70">
              Multi-factor score from execution, strategy, consistency,
              clarity, and readiness signals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-5">
              {Object.entries(data.founderScore.breakdown).map(
                ([key, value]) => (
                  <ScorePill key={key} label={key} value={value} />
                )
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {data?.actionPlan || data?.website ? (
        <div className="grid gap-4 md:grid-cols-2">
          {data.actionPlan ? (
            <Card className="bg-brandNavy border-brandBlue/40">
              <CardHeader>
                <CardTitle className="text-brandBlueLight text-base">
                  Action Plan Momentum
                </CardTitle>
                <CardDescription className="text-brandBlueLight/70">
                  {data.actionPlan.done}/{data.actionPlan.total} tasks complete
                  on your latest plan.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}
          {data.website ? (
            <Card className="bg-brandNavy border-brandBlue/40">
              <CardHeader>
                <CardTitle className="text-brandBlueLight text-base">
                  Website Signals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                  <ScorePill label="SEO" value={data.website.seoScore} />
                  <ScorePill label="UX" value={data.website.uxScore} />
                  <ScorePill
                    label="Clarity"
                    value={data.website.offerClarityScore}
                  />
                  <ScorePill label="CTA" value={data.website.ctaScore} />
                </div>
                {data.website.keyIssues.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-5 text-sm text-brandBlueLight/80">
                    {data.website.keyIssues.slice(0, 4).map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      {data && data.recentTakeaways.length > 0 ? (
        <Card className="bg-brandNavy border-brandBlue/40">
          <CardHeader>
            <CardTitle className="text-brandBlueLight text-base">
              Recent Session Takeaways
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.recentTakeaways.map((takeaway) => (
              <div
                key={takeaway.conversationId}
                className="rounded-xl border border-brandBlue/30 bg-brandNavy/60 px-4 py-3"
              >
                {takeaway.summary ? (
                  <p className="text-sm text-brandBlueLight">
                    {takeaway.summary}
                  </p>
                ) : null}
                {takeaway.insights.length > 0 ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-brandBlueLight/75">
                    {takeaway.insights.slice(0, 3).map((insight) => (
                      <li key={insight}>{insight}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {data && data.sharedInsights.length > 0 ? (
        <Card className="bg-brandNavy border-brandBlue/40">
          <CardHeader>
            <CardTitle className="text-brandBlueLight text-base">
              Cross-App Intelligence
            </CardTitle>
            <CardDescription className="text-brandBlueLight/70">
              Signals shared from other Entrepreneuria apps.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.sharedInsights.slice(0, 6).map((insight) => (
                <li
                  key={`${insight.source_app}-${insight.insight_key}`}
                  className="rounded-lg border border-brandBlue/25 bg-brandNavy/60 px-3 py-2 text-sm text-brandBlueLight/85"
                >
                  {insight.insight_summary}
                  <span className="ml-2 text-[10px] uppercase tracking-widest text-brandBlueLight/50">
                    {insight.source_app}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
