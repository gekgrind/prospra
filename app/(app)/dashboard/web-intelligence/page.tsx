"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, BookOpenText, Compass, MessageSquare } from "lucide-react";

import { WebIntelligenceHero } from "@/components/web-intelligence/web-intelligence-hero";
import { WebsiteSourceCard } from "@/components/web-intelligence/website-source-card";
import { WebIntelligenceFeatureCard } from "@/components/web-intelligence/web-intelligence-feature-card";
import { WebIntelligenceEmptyState } from "@/components/web-intelligence/web-intelligence-empty-state";
import { Button } from "@/components/ui/button";
import { InteractiveGlowSurface } from "@/components/ui/interactive-glow";
import {
  EMPTY_WEBSITE_INTELLIGENCE_SNAPSHOT,
  WEB_INTELLIGENCE_FEATURE_ICONS,
  WEB_INTELLIGENCE_FEATURES,
} from "@/lib/web-intelligence/features";
import type { WebsiteIntelligenceSnapshot } from "@/lib/web-intelligence/types";

export default function WebIntelligencePage() {
  const [snapshot, setSnapshot] = React.useState<WebsiteIntelligenceSnapshot>(
    EMPTY_WEBSITE_INTELLIGENCE_SNAPSHOT
  );

  return (
    <div className="space-y-8">
      <WebIntelligenceHero />

      <WebsiteSourceCard onSnapshotReady={setSnapshot} />

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-white md:text-2xl">
            Diagnostic modules
          </h2>
          <p className="text-sm text-[#c7d8ea]/74">
            Site Strategist turns your website snapshot into practical signals,
            issues, scoring, and next-step recommendations.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {WEB_INTELLIGENCE_FEATURES.map((feature) => (
            <WebIntelligenceFeatureCard
              key={feature.key}
              feature={feature}
              icon={WEB_INTELLIGENCE_FEATURE_ICONS[feature.key]}
              snapshot={snapshot}
            />
          ))}
        </div>
      </section>

      {snapshot.websiteUrl ? (
        <InteractiveGlowSurface className="rounded-[24px] border border-[#4f7ca7]/20 bg-[rgba(10,20,38,0.66)] p-5 shadow-[0_16px_50px_rgba(0,0,0,0.24)]">
          <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8fb8d8]">
            Latest analyzed site
          </h3>
          <p className="mt-2 text-base font-medium text-white">
            {snapshot.websiteUrl}
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Metric label="Offer clarity" value={snapshot.offerClarityScore} />
            <Metric label="SEO score" value={snapshot.seoScore} />
            <Metric label="UX score" value={snapshot.uxScore} />
            <Metric label="CTA score" value={snapshot.ctaScore} />
          </div>
          {snapshot.homepageSummary ? (
            <p className="mt-4 text-sm leading-6 text-[#c7d8ea]/78">
              {snapshot.homepageSummary}
            </p>
          ) : null}
        </InteractiveGlowSurface>
      ) : (
        <WebIntelligenceEmptyState />
      )}

      <InteractiveGlowSurface className="rounded-[20px] border border-[#4f7ca7]/18 bg-[rgba(8,16,30,0.68)] p-4 backdrop-blur-xl md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8fb8d8]">
              Connected workflows
            </p>
            <h3 className="mt-1 text-lg font-semibold text-white">
              Move from diagnostics to execution across Prospra.
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            <QuickLink href="/mentor" label="AI Mentor" icon={MessageSquare} />
            <QuickLink
              href="/dashboard/insights"
              label="Insights & Actions"
              icon={Compass}
            />
            <QuickLink
              href="/dashboard/resources"
              label="Toolkit"
              icon={BookOpenText}
            />
          </div>
        </div>
      </InteractiveGlowSurface>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <div className="rounded-2xl border border-[#4f7ca7]/18 bg-[#07111f]/70 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8fb8d8]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">
        {typeof value === "number" ? value : "—"}
      </p>
    </div>
  );
}

type QuickLinkProps = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

function QuickLink({ href, label, icon: Icon }: QuickLinkProps) {
  return (
    <Button
      asChild
      variant="outline"
      className="h-9 rounded-full border-[#4f7ca7]/30 bg-[#0d2039]/75 px-4 text-xs font-semibold text-[#d4e8fb] hover:border-[#00D4FF]/35 hover:bg-[#112949] hover:text-white"
    >
      <Link href={href}>
        <Icon className="mr-1.5 h-3.5 w-3.5" />
        {label}
        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
      </Link>
    </Button>
  );
}
