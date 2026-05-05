"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Gauge,
  Lightbulb,
  Loader2,
  ShieldCheck,
  Target,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { InteractiveGlowSurface } from "@/components/ui/interactive-glow";
import type {
  WebsiteCoachError,
  WebsiteCoachGoal,
  WebsiteCoachResult,
} from "@/lib/web-intelligence/website-coach";

const goalOptions: Array<{ value: WebsiteCoachGoal; label: string }> = [
  { value: "generate-leads", label: "Generate leads" },
  { value: "book-calls", label: "Book calls" },
  { value: "sell-products", label: "Sell products" },
  { value: "explain-offer", label: "Explain the offer" },
  { value: "build-trust", label: "Build trust" },
];

export default function WebsiteCoachPage() {
  const [websiteUrl, setWebsiteUrl] = React.useState("");
  const [businessType, setBusinessType] = React.useState("");
  const [targetAudience, setTargetAudience] = React.useState("");
  const [mainGoal, setMainGoal] =
    React.useState<WebsiteCoachGoal>("generate-leads");
  const [result, setResult] = React.useState<WebsiteCoachResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/site-strategist/website-coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          websiteUrl,
          businessType,
          targetAudience,
          mainGoal,
        }),
      });
      const payload = (await response.json()) as
        | WebsiteCoachResult
        | WebsiteCoachError;

      if (!response.ok || "error" in payload) {
        setResult(null);
        setError(
          "error" in payload
            ? payload.error
            : "Website Coach could not analyze this site right now."
        );
        return;
      }

      setResult(payload);
    } catch {
      setResult(null);
      setError("We hit a connection issue. Please try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/web-intelligence"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#9eefff] transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Site Strategist
      </Link>

      <section className="rounded-[24px] border border-[#4f7ca7]/20 bg-[rgba(10,20,38,0.66)] p-5 shadow-[0_16px_50px_rgba(0,0,0,0.24)] md:p-6">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8fb8d8]">
            Site Strategist tool
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-3xl">
            Website Coach
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#c7d8ea]/78">
            Get practical guidance on the website changes most likely to improve
            clarity, trust, and conversion for your current growth goal.
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)]">
        <InteractiveGlowSurface className="rounded-[20px] border border-[#4f7ca7]/18 bg-[rgba(8,16,30,0.68)] p-4 md:p-5">
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label
                htmlFor="website-url"
                className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8fb8d8]"
              >
                Website URL
              </label>
              <Input
                id="website-url"
                type="url"
                inputMode="url"
                value={websiteUrl}
                onChange={(event) => setWebsiteUrl(event.target.value)}
                placeholder="https://yourdomain.com"
                required
                className="h-11 border-[#4f7ca7]/35 bg-[#07111f]/80 text-white placeholder:text-[#88a7c4]/55"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="business-type"
                className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8fb8d8]"
              >
                Business type
              </label>
              <Input
                id="business-type"
                value={businessType}
                onChange={(event) => setBusinessType(event.target.value)}
                placeholder="Example: coaching practice, SaaS, local service"
                required
                className="h-11 border-[#4f7ca7]/35 bg-[#07111f]/80 text-white placeholder:text-[#88a7c4]/55"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="target-audience"
                className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8fb8d8]"
              >
                Target audience
              </label>
              <Textarea
                id="target-audience"
                value={targetAudience}
                onChange={(event) => setTargetAudience(event.target.value)}
                placeholder="Who are you trying to help, attract, or convert?"
                required
                rows={4}
                className="resize-none border-[#4f7ca7]/35 bg-[#07111f]/80 text-white placeholder:text-[#88a7c4]/55"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="main-goal"
                className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8fb8d8]"
              >
                Main website goal
              </label>
              <select
                id="main-goal"
                value={mainGoal}
                onChange={(event) =>
                  setMainGoal(event.target.value as WebsiteCoachGoal)
                }
                className="h-11 w-full rounded-md border border-[#4f7ca7]/35 bg-[#07111f]/80 px-3 text-sm text-white outline-none transition-colors focus:border-[#00D4FF]/45 focus:ring-2 focus:ring-[#00D4FF]/15"
              >
                {goalOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 w-full rounded-full bg-[linear-gradient(90deg,#00D4FF_0%,#4f7ca7_100%)] font-semibold text-[#021423] hover:opacity-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing Website
                </>
              ) : (
                "Analyze Website"
              )}
            </Button>

            {error ? (
              <p
                className="flex items-start gap-2 rounded-2xl border border-[#ff7d7d]/25 bg-[#2a0f18]/55 px-3 py-2 text-xs leading-5 text-[#ffd1d1]"
                role="alert"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </p>
            ) : null}
          </form>
        </InteractiveGlowSurface>

        <ResultsPanel result={result} isLoading={isSubmitting} />
      </section>
    </div>
  );
}

function ResultsPanel({
  result,
  isLoading,
}: {
  result: WebsiteCoachResult | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <InteractiveGlowSurface className="rounded-[20px] border border-[#4f7ca7]/18 bg-[#07111f]/70 p-4 md:p-5">
        <div className="flex min-h-[440px] flex-col items-center justify-center gap-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#9eefff]" />
          <div className="max-w-sm space-y-2">
            <h2 className="text-lg font-semibold text-white">
              Website Coach is reviewing the page
            </h2>
            <p className="text-sm leading-6 text-[#c7d8ea]/72">
              Prospra is organizing the first pass around clarity, trust,
              conversion intent, and the next founder-ready moves.
            </p>
          </div>
        </div>
      </InteractiveGlowSurface>
    );
  }

  if (!result) {
    return (
      <InteractiveGlowSurface className="rounded-[20px] border border-[#4f7ca7]/18 bg-[#07111f]/70 p-4 md:p-5">
        <div className="flex min-h-[440px] flex-col items-center justify-center gap-4 text-center">
          <span className="rounded-2xl border border-[#00D4FF]/25 bg-[#00D4FF]/10 p-3 text-[#9eefff]">
            <Lightbulb className="h-6 w-6" />
          </span>
          <div className="max-w-sm space-y-2">
            <h2 className="text-lg font-semibold text-white">
              Your coaching snapshot will appear here
            </h2>
            <p className="text-sm leading-6 text-[#c7d8ea]/72">
              Add the site, audience, and main goal to get a usable first pass
              while deeper crawling and AI analysis are being wired.
            </p>
          </div>
        </div>
      </InteractiveGlowSurface>
    );
  }

  return (
    <InteractiveGlowSurface className="space-y-5 rounded-[20px] border border-[#4f7ca7]/18 bg-[#07111f]/70 p-4 md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8fb8d8]">
            Coaching snapshot
          </p>
          <h2 className="mt-2 text-lg font-semibold text-white">
            {result.normalizedUrl}
          </h2>
        </div>
        <div className="rounded-2xl border border-[#00D4FF]/25 bg-[#00D4FF]/10 px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2 text-[#9eefff]">
            <Gauge className="h-4 w-4" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">
              Overall score
            </span>
          </div>
          <p className="mt-1 text-3xl font-semibold text-white">
            {result.overallScore}
          </p>
        </div>
      </div>

      <ResultSection
        icon={CheckCircle2}
        title="Top 5 improvement recommendations"
        items={result.topRecommendations}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <FeedbackBlock
          icon={Lightbulb}
          title="Messaging clarity feedback"
          body={result.messagingClarityFeedback}
        />
        <FeedbackBlock
          icon={ShieldCheck}
          title="Trust and credibility feedback"
          body={result.trustCredibilityFeedback}
        />
      </div>

      <ResultSection
        icon={Target}
        title="Conversion opportunities"
        items={result.conversionOpportunities}
      />

      <ResultSection
        icon={CheckCircle2}
        title="Suggested next actions"
        items={result.suggestedNextActions}
      />
    </InteractiveGlowSurface>
  );
}

function FeedbackBlock({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-[#4f7ca7]/18 bg-[#06101d]/70 p-4">
      <div className="flex items-center gap-2 text-[#9eefff]">
        <Icon className="h-4 w-4" />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-6 text-[#c7d8ea]/76">{body}</p>
    </div>
  );
}

function ResultSection({
  icon: Icon,
  title,
  items,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: string[];
}) {
  return (
    <section className="rounded-2xl border border-[#4f7ca7]/18 bg-[#06101d]/70 p-4">
      <div className="flex items-center gap-2 text-[#9eefff]">
        <Icon className="h-4 w-4" />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-xl border border-[#4f7ca7]/16 bg-[#07111f]/65 px-3 py-2 text-sm leading-6 text-[#d7e7f6]/80"
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
