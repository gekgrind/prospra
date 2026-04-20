import type { LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type {
  WebIntelligenceFeature,
  WebsiteIntelligenceSnapshot,
} from "@/lib/web-intelligence/types";

type WebIntelligenceFeatureCardProps = {
  feature: WebIntelligenceFeature;
  icon: LucideIcon;
  snapshot: WebsiteIntelligenceSnapshot;
  className?: string;
};

export function WebIntelligenceFeatureCard({
  feature,
  icon: Icon,
  snapshot,
  className,
}: WebIntelligenceFeatureCardProps) {
  const derived = getFeatureContent(feature.key, snapshot);

  return (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-[#4f7ca7]/20 bg-[rgba(10,20,38,0.66)] shadow-[0_18px_44px_rgba(0,0,0,0.24)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#00D4FF]/30 hover:bg-[rgba(12,26,48,0.76)]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00D4FF]/50 to-transparent opacity-60 transition-opacity group-hover:opacity-100" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,212,255,0.12),transparent_30%)] opacity-70" />

      <CardHeader className="relative z-10 space-y-3 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="rounded-xl border border-[#00D4FF]/25 bg-[#00D4FF]/10 p-2.5 text-[#9eefff]">
            <Icon className="h-4 w-4" />
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-[#4f7ca7]/40 bg-[#07111f]/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9cb9d3]">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                derived.isReady ? "bg-[#00D4FF]" : "bg-[#7f93aa]"
              )}
            />
            {derived.status}
          </span>
        </div>
        <CardTitle className="text-base font-semibold text-white">
          {feature.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="relative z-10 space-y-3 pt-0">
        {derived.metric ? (
          <div className="rounded-xl border border-[#4f7ca7]/18 bg-[#07111f]/70 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8fb8d8]">
              {derived.metric.label}
            </p>
            <p className="mt-1 text-2xl font-semibold text-white">
              {derived.metric.value}
            </p>
          </div>
        ) : null}

        <CardDescription className="text-sm leading-6 text-[#c7d8ea]/78">
          {derived.description}
        </CardDescription>

        {derived.bullets.length > 0 ? (
          <ul className="space-y-2">
            {derived.bullets.map((bullet) => (
              <li
                key={bullet}
                className="rounded-xl border border-[#4f7ca7]/16 bg-[#07111f]/55 px-3 py-2 text-xs leading-5 text-[#d7e7f6]/80"
              >
                {bullet}
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}

function getFeatureContent(
  key: WebIntelligenceFeature["key"],
  snapshot: WebsiteIntelligenceSnapshot
) {
  const hasSnapshot = Boolean(snapshot.websiteUrl);

  switch (key) {
    case "website-coach":
      return {
        isReady: hasSnapshot,
        status: hasSnapshot ? "Live insight" : "Waiting",
        metric:
          snapshot.offerClarityScore !== null
            ? {
                label: "Offer clarity",
                value: `${snapshot.offerClarityScore}/100`,
              }
            : null,
        description:
          snapshot.homepageSummary ??
          "Get sharp feedback on clarity, structure, and messaging across your pages.",
        bullets: snapshot.keyIssues.slice(0, 2),
      };

    case "seo-ux":
      return {
        isReady: hasSnapshot,
        status: hasSnapshot ? "Scored" : "Waiting",
        metric:
          snapshot.seoScore !== null || snapshot.uxScore !== null
            ? {
                label: "SEO / UX",
                value: `${snapshot.seoScore ?? "—"} / ${snapshot.uxScore ?? "—"}`,
              }
            : null,
        description:
          hasSnapshot
            ? "SEO and user-experience scoring has been generated from the current website snapshot."
            : "Measure discoverability and user experience with focused scoring signals.",
        bullets: [],
      };

    case "funnel-mapping":
      return {
        isReady: hasSnapshot,
        status: hasSnapshot ? "Mapped" : "Waiting",
        metric: null,
        description:
          snapshot.funnelSummary ??
          "Visualize how visitors move through your site and where momentum breaks.",
        bullets: [],
      };

    case "cta-analyzer":
      return {
        isReady: hasSnapshot,
        status: hasSnapshot ? "Reviewed" : "Waiting",
        metric:
          snapshot.ctaScore !== null
            ? {
                label: "CTA score",
                value: `${snapshot.ctaScore}/100`,
              }
            : null,
        description:
          hasSnapshot
            ? "CTA performance has been evaluated from messaging and conversion intent signals."
            : "Inspect your calls to action and identify where conversion intent weakens.",
        bullets: snapshot.keyIssues.slice(2, 4),
      };

    case "copy-architect":
      return {
        isReady: hasSnapshot,
        status: hasSnapshot ? "Recommendations ready" : "Waiting",
        metric: null,
        description:
          hasSnapshot
            ? "Refinement recommendations are ready for positioning, clarity, and conversion-focused improvements."
            : "Strengthen the copy on key pages with positioning and conversion-focused improvements.",
        bullets: snapshot.recommendedFixes.slice(0, 3),
      };

    default:
      return {
        isReady: false,
        status: "Waiting",
        metric: null,
        description: "No analysis available yet.",
        bullets: [],
      };
  }
}