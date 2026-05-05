"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Gauge,
  Loader2,
  MousePointerClick,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InteractiveGlowSurface } from "@/components/ui/interactive-glow";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  type CtaAnalyzerResult,
  type CtaPageGoal,
  runMockCtaAnalysis,
} from "@/lib/web-intelligence/cta-analyzer";

const pageGoalOptions: Array<{ value: CtaPageGoal; label: string }> = [
  { value: "book-call", label: "Book a call" },
  { value: "start-trial", label: "Start a trial" },
  { value: "buy-now", label: "Buy now" },
  { value: "join-list", label: "Join a list" },
  { value: "download-resource", label: "Download a resource" },
  { value: "request-demo", label: "Request a demo" },
];

export default function CtaAnalyzerPage() {
  const [url, setUrl] = React.useState("");
  const [currentCtaText, setCurrentCtaText] = React.useState("");
  const [pageGoal, setPageGoal] = React.useState<CtaPageGoal>("book-call");
  const [targetAudience, setTargetAudience] = React.useState("");
  const [result, setResult] = React.useState<CtaAnalyzerResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  const canAnalyze =
    url.trim().length > 0 &&
    currentCtaText.trim().length > 0 &&
    targetAudience.trim().length > 0 &&
    !isAnalyzing;

  async function handleAnalyze(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!url.trim() || !currentCtaText.trim() || !targetAudience.trim()) {
      setError(
        "Add the page URL, current CTA text, and target audience before running analysis."
      );
      return;
    }

    setError(null);
    setIsAnalyzing(true);

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 550));
      const analysis = await runMockCtaAnalysis({
        url,
        currentCtaText,
        pageGoal,
        targetAudience,
      });
      setResult(analysis);
    } catch {
      setResult(null);
      setError(
        "CTA Analyzer could not generate recommendations right now. Please try again."
      );
    } finally {
      setIsAnalyzing(false);
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

      <InteractiveGlowSurface className="rounded-[24px] border border-[#4f7ca7]/20 bg-[rgba(10,20,38,0.66)] p-5 shadow-[0_16px_50px_rgba(0,0,0,0.24)] md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8fb8d8]">
              Site Strategist tool
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-3xl">
              CTA Analyzer
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#c7d8ea]/78">
              Evaluate the main call-to-action on a website page, then sharpen
              the wording, context, and placement so visitors know why to act.
            </p>
          </div>

          <div className="rounded-2xl border border-[#00D4FF]/20 bg-[#07111f]/70 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8fb8d8]">
              CTA strength
            </p>
            <p className="mt-1 text-3xl font-semibold text-white">
              {result ? `${result.strengthScore}/100` : "--"}
            </p>
          </div>
        </div>
      </InteractiveGlowSurface>

      <section className="grid gap-4 xl:grid-cols-[minmax(320px,0.74fr)_minmax(0,1fr)]">
        <InteractiveGlowSurface className="rounded-[20px] border border-[#4f7ca7]/18 bg-[rgba(8,16,30,0.68)] p-4 md:p-5">
          <form className="space-y-5" onSubmit={handleAnalyze}>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8fb8d8]">
                CTA inputs
              </p>
              <h2 className="mt-2 text-lg font-semibold text-white">
                Define the action you want visitors to take.
              </h2>
            </div>

            <Field label="Website URL" htmlFor="cta-url">
              <Input
                id="cta-url"
                type="url"
                inputMode="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://example.com/pricing"
                className="h-11 border-[#4f7ca7]/24 bg-[#07111f]/75 text-white placeholder:text-[#8fb8d8]/48 focus-visible:ring-[#00D4FF]/25"
              />
            </Field>

            <Field label="Current CTA text" htmlFor="current-cta-text">
              <Input
                id="current-cta-text"
                value={currentCtaText}
                onChange={(event) => setCurrentCtaText(event.target.value)}
                placeholder="Example: Get started"
                className="h-11 border-[#4f7ca7]/24 bg-[#07111f]/75 text-white placeholder:text-[#8fb8d8]/48 focus-visible:ring-[#00D4FF]/25"
              />
            </Field>

            <Field label="Page goal" htmlFor="page-goal">
              <select
                id="page-goal"
                value={pageGoal}
                onChange={(event) =>
                  setPageGoal(event.target.value as CtaPageGoal)
                }
                className="h-11 w-full rounded-md border border-[#4f7ca7]/24 bg-[#07111f]/75 px-3 text-sm text-white outline-none transition-colors focus:border-[#00D4FF]/45 focus:ring-2 focus:ring-[#00D4FF]/15"
              >
                {pageGoalOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Target audience" htmlFor="target-audience">
              <Textarea
                id="target-audience"
                value={targetAudience}
                onChange={(event) => setTargetAudience(event.target.value)}
                placeholder="Example: service founders who need a clearer path from site visits to qualified calls."
                rows={4}
                className="resize-none border-[#4f7ca7]/24 bg-[#07111f]/75 text-white placeholder:text-[#8fb8d8]/48 focus-visible:ring-[#00D4FF]/25"
              />
            </Field>

            {error ? <ErrorPanel message={error} /> : null}

            <Button
              type="submit"
              disabled={!canAnalyze}
              className="h-10 rounded-full bg-[#00D4FF] px-5 text-sm font-semibold text-[#04111f] hover:bg-[#64e7ff] disabled:cursor-not-allowed disabled:bg-[#4f7ca7]/25 disabled:text-[#c7d8ea]/45"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing CTA
                </>
              ) : (
                <>
                  <MousePointerClick className="h-4 w-4" />
                  Analyze CTA
                </>
              )}
            </Button>
          </form>
        </InteractiveGlowSurface>

        <ResultsPanel result={result} isAnalyzing={isAnalyzing} />
      </section>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={htmlFor}
        className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8fb8d8]"
      >
        {label}
      </Label>
      {children}
    </div>
  );
}

function ResultsPanel({
  result,
  isAnalyzing,
}: {
  result: CtaAnalyzerResult | null;
  isAnalyzing: boolean;
}) {
  if (isAnalyzing) {
    return (
      <InteractiveGlowSurface className="rounded-[20px] border border-[#4f7ca7]/18 bg-[#07111f]/70 p-4 md:p-5">
        <div className="flex min-h-[460px] flex-col justify-center gap-4">
          <div className="h-24 animate-pulse rounded-2xl border border-[#4f7ca7]/18 bg-[#0d2039]/70" />
          <div className="grid gap-3 md:grid-cols-2">
            <div className="h-28 animate-pulse rounded-2xl border border-[#4f7ca7]/18 bg-[#0d2039]/56" />
            <div className="h-28 animate-pulse rounded-2xl border border-[#4f7ca7]/18 bg-[#0d2039]/56" />
          </div>
          <div className="h-36 animate-pulse rounded-2xl border border-[#4f7ca7]/18 bg-[#0d2039]/46" />
          <p className="text-sm text-[#c7d8ea]/72">
            Reviewing clarity, urgency, value cues, placement, and conversion
            friction.
          </p>
        </div>
      </InteractiveGlowSurface>
    );
  }

  if (!result) {
    return (
      <InteractiveGlowSurface className="rounded-[20px] border border-[#4f7ca7]/18 bg-[#07111f]/70 p-4 md:p-5">
        <div className="flex min-h-[460px] flex-col justify-center rounded-2xl border border-dashed border-[#4f7ca7]/24 bg-[#06101d]/70 px-4 py-6">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-[#00D4FF]/22 bg-[#00D4FF]/10 text-[#9eefff]">
            <Gauge className="h-5 w-5" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8fb8d8]">
            Analysis ready when you are
          </p>
          <h2 className="mt-2 text-lg font-semibold text-white">
            Your CTA recommendations will appear here.
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#c7d8ea]/72">
            Add the page, current CTA, goal, and audience to get a practical
            conversion-focused rewrite set.
          </p>
        </div>
      </InteractiveGlowSurface>
    );
  }

  return (
    <div className="space-y-4">
      <InteractiveGlowSurface className="rounded-[20px] border border-[#4f7ca7]/18 bg-[#07111f]/70 p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8fb8d8]">
              CTA analysis
            </p>
            <h2 className="mt-2 text-lg font-semibold text-white">
              {result.analyzedUrl}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#c7d8ea]/72">
              Current CTA: {result.currentCtaText}
            </p>
          </div>
          <div className="rounded-2xl border border-[#00D4FF]/25 bg-[#00D4FF]/10 px-4 py-3 text-center">
            <div className="flex items-center justify-center gap-2 text-[#9eefff]">
              <Gauge className="h-4 w-4" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">
                Strength score
              </span>
            </div>
            <p className="mt-1 text-3xl font-semibold text-white">
              {result.strengthScore}
            </p>
          </div>
        </div>
      </InteractiveGlowSurface>

      <div className="grid gap-4 md:grid-cols-3">
        <FeedbackCard title="Clarity" body={result.clarityFeedback} />
        <FeedbackCard title="Urgency" body={result.urgencyFeedback} />
        <FeedbackCard
          title="Value proposition"
          body={result.valuePropositionFeedback}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ListPanel
          title="Placement suggestions"
          items={result.placementSuggestions}
        />
        <ListPanel title="Friction / risk notes" items={result.frictionRiskNotes} />
      </div>

      <InteractiveGlowSurface className="rounded-[20px] border border-[#4f7ca7]/18 bg-[rgba(8,16,30,0.68)] p-4 md:p-5">
        <div className="flex items-center gap-2 text-[#9eefff]">
          <Sparkles className="h-4 w-4" />
          <h3 className="text-sm font-semibold text-white">
            Improved CTA variations
          </h3>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {result.improvedVariations.map((variation) => (
            <div
              key={variation}
              className="rounded-2xl border border-[#4f7ca7]/18 bg-[#07111f]/62 px-4 py-3 text-sm font-semibold text-[#d7e7f6]/86"
            >
              {variation}
            </div>
          ))}
        </div>
      </InteractiveGlowSurface>

      <InteractiveGlowSurface className="rounded-[20px] border border-[#00D4FF]/22 bg-[#06101d]/72 p-4 md:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8fb8d8]">
          Recommended CTA system
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-[220px_1fr]">
          <div className="rounded-2xl border border-[#00D4FF]/28 bg-[#00D4FF]/10 px-4 py-3">
            <p className="text-xs font-semibold text-[#9eefff]">Button text</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {result.recommendedButtonText}
            </p>
          </div>
          <div className="rounded-2xl border border-[#4f7ca7]/18 bg-[#07111f]/62 px-4 py-3">
            <p className="text-xs font-semibold text-[#9eefff]">
              Supporting microcopy
            </p>
            <p className="mt-2 text-sm leading-6 text-[#d7e7f6]/82">
              {result.recommendedSupportingMicrocopy}
            </p>
          </div>
        </div>
      </InteractiveGlowSurface>
    </div>
  );
}

function FeedbackCard({ title, body }: { title: string; body: string }) {
  return (
    <InteractiveGlowSurface className="rounded-[20px] border border-[#4f7ca7]/18 bg-[#07111f]/70 p-4">
      <div className="flex items-center gap-2 text-[#9eefff]">
        <CheckCircle2 className="h-4 w-4" />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-6 text-[#c7d8ea]/76">{body}</p>
    </InteractiveGlowSurface>
  );
}

function ListPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <InteractiveGlowSurface className="rounded-[20px] border border-[#4f7ca7]/18 bg-[#07111f]/70 p-4 md:p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8fb8d8]">
        {title}
      </p>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-2xl border border-[#4f7ca7]/18 bg-[#06101d]/70 px-3 py-2 text-sm leading-6 text-[#d7e7f6]/80"
          >
            {item}
          </li>
        ))}
      </ul>
    </InteractiveGlowSurface>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div
      className="flex items-start gap-2 rounded-2xl border border-[#ff7d7d]/25 bg-[#2a0f18]/55 px-3 py-2 text-xs leading-5 text-[#ffd1d1]"
      role="alert"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}
