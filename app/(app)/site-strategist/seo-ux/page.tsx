"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Gauge,
  Loader2,
  SearchCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { InteractiveGlowSurface } from "@/components/ui/interactive-glow";
import {
  runMockSeoUxAnalysis,
  type SeoUxAnalysisResult,
  type SeoUxFix,
  type SeoUxPriority,
} from "@/lib/web-intelligence/seo-ux-analyzer";
import { cn } from "@/lib/utils";

const priorityStyles: Record<SeoUxPriority, string> = {
  Critical: "border-[#f59e0b]/34 bg-[#2a1d09]/62 text-[#ffd38a]",
  Important: "border-[#00D4FF]/24 bg-[#082033]/68 text-[#b6f4ff]",
  "Nice-to-have": "border-[#4f7ca7]/22 bg-[#07111f]/66 text-[#c7d8ea]",
};

export default function SeoUxPage() {
  const [url, setUrl] = React.useState("");
  const [primaryKeyword, setPrimaryKeyword] = React.useState("");
  const [audienceOffer, setAudienceOffer] = React.useState("");
  const [result, setResult] = React.useState<SeoUxAnalysisResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  const canSubmit =
    url.trim().length > 0 && primaryKeyword.trim().length > 0 && !isAnalyzing;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!url.trim() || !primaryKeyword.trim()) {
      setError("Add a page URL and primary keyword before running analysis.");
      return;
    }

    setError(null);
    setIsAnalyzing(true);

    try {
      const analysis = await runMockSeoUxAnalysis({
        url,
        primaryKeyword,
        audienceOffer,
      });
      setResult(analysis);
    } catch {
      setError(
        "Prospra could not generate the SEO/UX analysis. Check the page details and try again."
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

      <section className="rounded-[24px] border border-[#4f7ca7]/20 bg-[rgba(10,20,38,0.66)] p-5 shadow-[0_16px_50px_rgba(0,0,0,0.24)] md:p-6">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8fb8d8]">
            Site Strategist tool
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-3xl">
            SEO/UX Analyzer
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#c7d8ea]/78">
            Analyze a page for search visibility, visitor clarity, conversion
            friction, and the fixes most likely to improve performance.
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,0.86fr)_minmax(360px,1fr)]">
        <InteractiveGlowSurface className="rounded-[20px] border border-[#4f7ca7]/18 bg-[rgba(8,16,30,0.68)] p-4 md:p-5">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Field
              id="seo-url"
              label="Page URL"
              value={url}
              onChange={setUrl}
              placeholder="https://your-site.com/services"
              type="url"
            />
            <Field
              id="seo-keyword"
              label="Primary keyword"
              value={primaryKeyword}
              onChange={setPrimaryKeyword}
              placeholder="AI business coach for founders"
            />
            <label className="block" htmlFor="seo-audience-offer">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8fb8d8]">
                Audience / offer
              </span>
              <textarea
                id="seo-audience-offer"
                rows={4}
                value={audienceOffer}
                onChange={(event) => setAudienceOffer(event.target.value)}
                placeholder="Optional: who this page is for, what you sell, and what action visitors should take."
                className="mt-3 w-full resize-none rounded-2xl border border-[#4f7ca7]/24 bg-[#07111f]/75 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-[#8fb8d8]/48 focus:border-[#00D4FF]/45"
              />
            </label>

            {error ? (
              <div className="rounded-2xl border border-[#f59e0b]/26 bg-[#2a1d09]/50 px-4 py-3 text-sm leading-6 text-[#ffd38a]">
                {error}
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={!canSubmit}
              className="h-10 rounded-full border border-[#00D4FF]/30 bg-[#00D4FF]/14 px-4 text-sm font-semibold text-[#dffbff] hover:border-[#00D4FF]/50 hover:bg-[#00D4FF]/20"
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SearchCheck className="h-4 w-4" />
              )}
              Run SEO/UX Analysis
            </Button>
          </form>
        </InteractiveGlowSurface>

        <ResultsPanel result={result} isAnalyzing={isAnalyzing} />
      </section>
    </div>
  );
}

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: React.HTMLInputTypeAttribute;
};

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: FieldProps) {
  return (
    <label className="block" htmlFor={id}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8fb8d8]">
        {label}
      </span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-3 h-11 w-full rounded-2xl border border-[#4f7ca7]/24 bg-[#07111f]/75 px-4 text-sm text-white outline-none placeholder:text-[#8fb8d8]/48 focus:border-[#00D4FF]/45"
      />
    </label>
  );
}

function ResultsPanel({
  result,
  isAnalyzing,
}: {
  result: SeoUxAnalysisResult | null;
  isAnalyzing: boolean;
}) {
  if (isAnalyzing) {
    return (
      <InteractiveGlowSurface className="rounded-[20px] border border-[#4f7ca7]/18 bg-[#07111f]/70 p-4 md:p-5">
        <div className="flex min-h-[360px] flex-col justify-center gap-4">
          <div className="h-20 rounded-2xl border border-[#4f7ca7]/18 bg-[#0d2039]/70" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-24 rounded-2xl border border-[#4f7ca7]/18 bg-[#0d2039]/56" />
            <div className="h-24 rounded-2xl border border-[#4f7ca7]/18 bg-[#0d2039]/56" />
          </div>
          <div className="h-32 rounded-2xl border border-[#4f7ca7]/18 bg-[#0d2039]/46" />
          <p className="text-sm text-[#c7d8ea]/72">
            Reviewing page signals and preparing prioritized recommendations.
          </p>
        </div>
      </InteractiveGlowSurface>
    );
  }

  if (!result) {
    return (
      <InteractiveGlowSurface className="rounded-[20px] border border-[#4f7ca7]/18 bg-[#07111f]/70 p-4 md:p-5">
        <div className="flex min-h-[360px] flex-col justify-center rounded-2xl border border-dashed border-[#4f7ca7]/24 bg-[#06101d]/70 px-4 py-6">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-[#00D4FF]/22 bg-[#00D4FF]/10 text-[#9eefff]">
            <Gauge className="h-5 w-5" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8fb8d8]">
            Analysis ready when you are
          </p>
          <h2 className="mt-2 text-lg font-semibold text-white">
            Enter a URL and keyword to generate SEO/UX recommendations.
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#c7d8ea]/72">
            Prospra will score the page, review conversion friction, and sort
            the next fixes by priority.
          </p>
        </div>
      </InteractiveGlowSurface>
    );
  }

  return (
    <InteractiveGlowSurface className="space-y-4 rounded-[20px] border border-[#4f7ca7]/18 bg-[#07111f]/70 p-4 md:p-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8fb8d8]">
          Mock analysis
        </p>
        <h2 className="mt-2 text-lg font-semibold text-white">
          {result.analyzedUrl}
        </h2>
        <p className="mt-2 text-sm text-[#c7d8ea]/72">
          Keyword: {result.primaryKeyword}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ScoreCard label="SEO score" score={result.seoScore} />
        <ScoreCard label="UX score" score={result.uxScore} />
      </div>

      <div className="grid gap-3">
        <ResultCard title="Title/meta feedback" body={result.titleMetaFeedback} />
        <ResultCard
          title="Heading structure feedback"
          body={result.headingStructureFeedback}
        />
        <ResultCard title="Keyword alignment" body={result.keywordAlignment} />
        <ResultCard
          title="Mobile/readability notes"
          body={result.mobileReadabilityNotes}
        />
        <ResultCard
          title="Page speed placeholder"
          body={result.pageSpeedPlaceholder}
        />
        <ResultCard title="Accessibility notes" body={result.accessibilityNotes} />
      </div>

      <div className="rounded-2xl border border-[#4f7ca7]/18 bg-[#06101d]/68 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8fb8d8]">
          Prioritized fixes
        </p>
        <div className="mt-3 space-y-3">
          {result.prioritizedFixes.map((fix) => (
            <PriorityFix key={`${fix.priority}-${fix.title}`} fix={fix} />
          ))}
        </div>
      </div>
    </InteractiveGlowSurface>
  );
}

function ScoreCard({ label, score }: { label: string; score: number }) {
  return (
    <div className="rounded-2xl border border-[#4f7ca7]/18 bg-[#06101d]/68 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8fb8d8]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-white">{score}</p>
      <p className="mt-1 text-xs text-[#c7d8ea]/64">Out of 100</p>
    </div>
  );
}

function ResultCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-[#4f7ca7]/18 bg-[#06101d]/60 p-4">
      <div className="flex items-start gap-2">
        <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#9eefff]" />
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-[#c7d8ea]/74">{body}</p>
        </div>
      </div>
    </div>
  );
}

function PriorityFix({ fix }: { fix: SeoUxFix }) {
  return (
    <div className="rounded-2xl border border-[#4f7ca7]/18 bg-[#07111f]/66 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
            priorityStyles[fix.priority]
          )}
        >
          {fix.priority === "Critical" ? (
            <AlertTriangle className="h-3 w-3" />
          ) : null}
          {fix.priority}
        </span>
        <h3 className="text-sm font-semibold text-white">{fix.title}</h3>
      </div>
      <p className="mt-2 text-sm leading-6 text-[#c7d8ea]/72">{fix.detail}</p>
    </div>
  );
}
