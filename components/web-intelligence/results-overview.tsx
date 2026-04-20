import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FixesList } from "@/components/web-intelligence/fixes-list";
import { IssuesList } from "@/components/web-intelligence/issues-list";
import { ScoreCard } from "@/components/web-intelligence/score-card";
import type { WebsiteIntelligenceSnapshot } from "@/lib/web-intelligence/types";

type ResultsOverviewProps = {
  snapshot: WebsiteIntelligenceSnapshot;
};

export function ResultsOverview({ snapshot }: ResultsOverviewProps) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ScoreCard label="Offer Clarity" score={snapshot.offerClarityScore} />
        <ScoreCard label="SEO" score={snapshot.seoScore} />
        <ScoreCard label="UX" score={snapshot.uxScore} />
        <ScoreCard label="CTAs" score={snapshot.ctaScore} />
      </section>

      <Card className="bg-brandNavy border-brandBlue/40">
        <CardHeader>
          <CardTitle className="text-base text-brandBlueLight">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-brandBlueLight/80">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brandBlueLight/60">Homepage</p>
            <p className="mt-1">{snapshot.homepageSummary ?? "No homepage summary generated yet."}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brandBlueLight/60">Funnel</p>
            <p className="mt-1">{snapshot.funnelSummary ?? "No funnel summary generated yet."}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <IssuesList issues={snapshot.keyIssues ?? []} />
        <FixesList fixes={snapshot.recommendedFixes ?? []} />
      </div>
    </div>
  );
}
