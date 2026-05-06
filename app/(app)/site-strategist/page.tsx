"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Compass,
  Gauge,
  Globe,
  Layers3,
  Loader2,
  MessageSquareText,
  MousePointerClick,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InteractiveGlowSurface } from "@/components/ui/interactive-glow";
import type { SiteStrategistAnalysis } from "@/lib/site-strategist/parser";

type AnalyzeResponse =
  | {
      success: true;
      analysis: SiteStrategistAnalysis;
    }
  | {
      error: string;
    };

type AnalysisSections = {
  websiteSummary: string[];
  messagingClarity: string[];
  ctaStrength: string[];
  homepageStructure: string[];
  quickWins: string[];
  recommendedNextActions: string[];
};

function normalizeClientUrl(value: string): string {
  const input = value.trim();
  if (!input) {
    throw new Error("Enter a website URL before running Site Strategist.");
  }

  const withProtocol = /^https?:\/\//i.test(input) ? input : `https://${input}`;
  const parsed = new URL(withProtocol);

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Use a public http or https website URL.");
  }

  if (parsed.username || parsed.password) {
    throw new Error("Remove embedded credentials from the URL before analyzing.");
  }

  if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i.test(parsed.hostname)) {
    throw new Error("Use a public website URL, not a local development URL.");
  }

  parsed.hash = "";
  return parsed.toString();
}

function getMetaValue(analysis: SiteStrategistAnalysis | null, key: string) {
  return (
    analysis?.metaTags.find(
      (tag) => tag.key.toLowerCase() === key.toLowerCase()
    )?.value ?? null
  );
}

function firstNonEmpty(items: Array<string | null | undefined>, fallback: string) {
  return items.find((item) => item && item.trim().length > 0) ?? fallback;
}

function buildAnalysisSections(
  analysis: SiteStrategistAnalysis | null
): AnalysisSections {
  const normalizedUrl = analysis?.normalizedUrl ?? "Selected website";
  const headings = analysis?.headings ?? [];
  const metaTags = analysis?.metaTags ?? [];
  const ctaMatches = analysis?.cta?.matches ?? [];
  const valueText = analysis?.valueProposition?.text ?? null;
  const title = getMetaValue(analysis, "og:title");
  const description = firstNonEmpty(
    [
      getMetaValue(analysis, "description"),
      getMetaValue(analysis, "og:description"),
      valueText,
    ],
    "No clear summary copy was detected in the first pass."
  );
  const h1s = headings.filter((heading) => heading.level === "h1");
  const h2s = headings.filter((heading) => heading.level === "h2");

  const quickWins = [
    !valueText
      ? "Add one unmistakable homepage value proposition above the fold."
      : null,
    h1s.length !== 1
      ? "Use exactly one H1 so visitors and search engines understand the page hierarchy."
      : null,
    ctaMatches.length === 0
      ? "Add a direct primary CTA such as booking, starting, requesting, or joining."
      : null,
    metaTags.length === 0
      ? "Add title, description, and social meta tags to improve discoverability and sharing."
      : null,
  ].filter(Boolean) as string[];

  const nextActions = [
    "Choose the single conversion action this page should earn from the right visitor.",
    "Rewrite the hero section around audience, outcome, proof, and the primary action.",
    "Use the specialist modules for SEO/UX, CTA, copy, and funnel refinement after this first pass.",
  ];

  return {
    websiteSummary: [
      `Analyzed URL: ${normalizedUrl}`,
      title ? `Primary page title signal: ${title}` : `Detected summary: ${description}`,
      `Site Strategist found ${headings.length} heading signal${
        headings.length === 1 ? "" : "s"
      } and ${metaTags.length} metadata signal${metaTags.length === 1 ? "" : "s"}.`,
    ],
    messagingClarity: [
      valueText
        ? `Core value proposition detected: ${valueText}`
        : "The first pass could not detect a strong value proposition.",
      description,
      h1s.length > 0
        ? `Primary H1: ${h1s[0]?.text ?? "Unavailable"}`
        : "No H1 was detected, so the page may not be making its main promise obvious enough.",
    ],
    ctaStrength: [
      analysis?.cta?.present
        ? `CTA language found: ${ctaMatches.slice(0, 6).join(", ")}.`
        : "No obvious CTA language was detected in the fetched page text.",
      ctaMatches.length >= 3
        ? "CTA coverage appears healthy for a first pass."
        : "CTA coverage is light; visitors may need a clearer next step.",
      "Strong CTAs should connect the action to the outcome the founder is promising.",
    ],
    homepageStructure: [
      h1s.length === 1
        ? "Homepage hierarchy has one detected H1."
        : `Homepage hierarchy has ${h1s.length} detected H1 headings.`,
      h2s.length > 0
        ? `Detected section-level headings include: ${h2s
            .slice(0, 4)
            .map((heading) => heading.text)
            .join(" | ")}.`
        : "No H2 section structure was detected in the first pass.",
      headings.length >= 3
        ? "The page has enough heading structure to start organizing a conversion narrative."
        : "The page may need clearer sections for problem, offer, proof, process, and action.",
    ],
    quickWins:
      quickWins.length > 0
        ? quickWins
        : [
            "Tighten the hero message so the audience, outcome, and next step are visible without scrolling.",
            "Place proof near the primary CTA to reduce hesitation.",
            "Use section headings that guide the visitor through problem, offer, proof, and action.",
          ],
    recommendedNextActions: nextActions,
  };
}

export default function SiteStrategistPage() {
  const [websiteUrl, setWebsiteUrl] = React.useState("");
  const [analysis, setAnalysis] = React.useState<SiteStrategistAnalysis | null>(
    null
  );
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  const sections = React.useMemo(
    () => buildAnalysisSections(analysis),
    [analysis]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    let normalizedUrl: string;
    try {
      normalizedUrl = normalizeClientUrl(websiteUrl);
    } catch (validationError) {
      setAnalysis(null);
      setSuccessMessage(null);
      setError(
        validationError instanceof Error
          ? validationError.message
          : "Enter a valid public website URL."
      );
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/site-strategist/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: normalizedUrl }),
      });
      const payload = (await response.json().catch(() => null)) as
        | AnalyzeResponse
        | null;

      if (!response.ok || !payload || "error" in payload) {
        setAnalysis(null);
        setError(
          payload && "error" in payload
            ? payload.error.replace(/^Not authenticated\.$/, "Please sign in before running Site Strategist.")
            : "Site Strategist could not analyze this website right now."
        );
        return;
      }

      setWebsiteUrl(payload.analysis.normalizedUrl);
      setAnalysis(payload.analysis);
      setSuccessMessage("Analysis complete. Your launch-readiness snapshot is ready.");
    } catch {
      setAnalysis(null);
      setError("We hit a connection issue. Please try again in a moment.");
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
        Back to Site Strategist dashboard
      </Link>

      <InteractiveGlowSurface className="relative overflow-hidden rounded-[28px] border border-[#4f7ca7]/20 bg-[rgba(10,20,38,0.72)] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.3)] backdrop-blur-xl md:p-7">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00D4FF]/60 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,212,255,0.14),transparent_25%),radial-gradient(circle_at_bottom_left,rgba(79,124,167,0.12),transparent_32%)]" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00D4FF]/25 bg-[#00D4FF]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#bdefff]">
              <Sparkles className="h-3.5 w-3.5 text-[#00D4FF]" />
              Site Strategist
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white md:text-4xl">
              Launch-readiness analysis for your website.
            </h1>
            <p className="mt-3 text-sm leading-7 text-[#c7d8ea]/80 md:text-base">
              Run a practical first pass on message clarity, CTA strength,
              homepage structure, and the next moves most likely to improve
              visitor confidence.
            </p>
          </div>

          <div className="rounded-2xl border border-[#00D4FF]/20 bg-[#07111f]/70 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8fb8d8]">
              Analyzer status
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              {analysis ? "Snapshot ready" : "Ready for URL"}
            </p>
          </div>
        </div>
      </InteractiveGlowSurface>

      <section className="grid gap-4 xl:grid-cols-[minmax(320px,0.78fr)_minmax(0,1fr)]">
        <InteractiveGlowSurface className="rounded-[20px] border border-[#4f7ca7]/18 bg-[rgba(8,16,30,0.68)] p-4 md:p-5">
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8fb8d8]">
                Website source
              </p>
              <h2 className="mt-2 text-lg font-semibold text-white">
                Enter the public homepage or landing page URL.
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#c7d8ea]/72">
                The current analyzer uses fetchable page signals now and can be
                replaced with deeper AI output without changing this result
                structure.
              </p>
            </div>

            <label className="block" htmlFor="site-strategist-url">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8fb8d8]">
                Website URL
              </span>
              <Input
                id="site-strategist-url"
                type="text"
                inputMode="url"
                value={websiteUrl}
                onChange={(event) => setWebsiteUrl(event.target.value)}
                placeholder="https://yourdomain.com"
                className="mt-3 h-11 border-[#4f7ca7]/35 bg-[#07111f]/80 text-white placeholder:text-[#88a7c4]/55"
                aria-describedby="site-strategist-url-help"
              />
            </label>

            <p id="site-strategist-url-help" className="text-xs text-[#8fb8d8]">
              Public http and https URLs are supported. Plain domains are
              treated as https.
            </p>

            {error ? <StatusPanel tone="error" message={error} /> : null}
            {successMessage ? (
              <StatusPanel tone="success" message={successMessage} />
            ) : null}

            <Button
              type="submit"
              disabled={isAnalyzing}
              className="h-11 w-full rounded-full bg-[linear-gradient(90deg,#00D4FF_0%,#4f7ca7_100%)] font-semibold text-[#021423] hover:opacity-95"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing Website
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4" />
                  Analyze Website
                </>
              )}
            </Button>
          </form>
        </InteractiveGlowSurface>

        <ResultsPanel
          analysis={analysis}
          sections={sections}
          isAnalyzing={isAnalyzing}
        />
      </section>
    </div>
  );
}

function ResultsPanel({
  analysis,
  sections,
  isAnalyzing,
}: {
  analysis: SiteStrategistAnalysis | null;
  sections: AnalysisSections;
  isAnalyzing: boolean;
}) {
  if (isAnalyzing) {
    return (
      <InteractiveGlowSurface className="rounded-[20px] border border-[#4f7ca7]/18 bg-[#07111f]/70 p-4 md:p-5">
        <div className="flex min-h-[520px] flex-col justify-center gap-4">
          <div className="h-24 animate-pulse rounded-2xl border border-[#4f7ca7]/18 bg-[#0d2039]/70" />
          <div className="grid gap-3 md:grid-cols-2">
            <div className="h-28 animate-pulse rounded-2xl border border-[#4f7ca7]/18 bg-[#0d2039]/56" />
            <div className="h-28 animate-pulse rounded-2xl border border-[#4f7ca7]/18 bg-[#0d2039]/56" />
          </div>
          <div className="h-36 animate-pulse rounded-2xl border border-[#4f7ca7]/18 bg-[#0d2039]/46" />
          <p className="text-sm text-[#c7d8ea]/72">
            Fetching the page and organizing launch-readiness signals.
          </p>
        </div>
      </InteractiveGlowSurface>
    );
  }

  if (!analysis) {
    return (
      <InteractiveGlowSurface className="rounded-[20px] border border-[#4f7ca7]/18 bg-[#07111f]/70 p-4 md:p-5">
        <div className="flex min-h-[520px] flex-col justify-center rounded-2xl border border-dashed border-[#4f7ca7]/24 bg-[#06101d]/70 px-4 py-6">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-[#00D4FF]/22 bg-[#00D4FF]/10 text-[#9eefff]">
            <Gauge className="h-5 w-5" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8fb8d8]">
            Analysis ready when you are
          </p>
          <h2 className="mt-2 text-lg font-semibold text-white">
            Your Site Strategist snapshot will appear here.
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#c7d8ea]/72">
            Enter a public URL to generate structured feedback for summary,
            messaging, CTA strength, structure, quick wins, and next actions.
          </p>
        </div>
      </InteractiveGlowSurface>
    );
  }

  return (
    <div className="space-y-4">
      <InteractiveGlowSurface className="rounded-[20px] border border-[#00D4FF]/22 bg-[#06101d]/72 p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8fb8d8]">
              Launch snapshot
            </p>
            <h2 className="mt-2 text-lg font-semibold text-white">
              {analysis.normalizedUrl}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#c7d8ea]/72">
              First-pass analysis based on fetchable homepage HTML.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#00D4FF]/25 bg-[#00D4FF]/10 px-3 py-1.5 text-xs font-semibold text-[#bdefff]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Success
          </span>
        </div>
      </InteractiveGlowSurface>

      <div className="grid gap-4 lg:grid-cols-2">
        <AnalysisSection
          icon={ClipboardList}
          title="Website summary"
          items={sections.websiteSummary}
        />
        <AnalysisSection
          icon={MessageSquareText}
          title="Messaging clarity"
          items={sections.messagingClarity}
        />
        <AnalysisSection
          icon={MousePointerClick}
          title="CTA strength"
          items={sections.ctaStrength}
        />
        <AnalysisSection
          icon={Layers3}
          title="Homepage structure"
          items={sections.homepageStructure}
        />
        <AnalysisSection
          icon={Sparkles}
          title="Quick wins"
          items={sections.quickWins}
        />
        <AnalysisSection
          icon={Compass}
          title="Recommended next actions"
          items={sections.recommendedNextActions}
        />
      </div>
    </div>
  );
}

function AnalysisSection({
  icon: Icon,
  title,
  items,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: string[];
}) {
  const safeItems =
    items.length > 0
      ? items
      : ["No signal was returned for this section in the current analysis."];

  return (
    <InteractiveGlowSurface className="rounded-[20px] border border-[#4f7ca7]/18 bg-[#07111f]/70 p-4 md:p-5">
      <div className="flex items-center gap-2 text-[#9eefff]">
        <Icon className="h-4 w-4" />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <ul className="mt-4 space-y-3">
        {safeItems.map((item) => (
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

function StatusPanel({
  tone,
  message,
}: {
  tone: "error" | "success";
  message: string;
}) {
  const isError = tone === "error";

  return (
    <div
      className={
        isError
          ? "flex items-start gap-2 rounded-2xl border border-[#ff7d7d]/25 bg-[#2a0f18]/55 px-3 py-2 text-xs leading-5 text-[#ffd1d1]"
          : "flex items-start gap-2 rounded-2xl border border-[#00D4FF]/24 bg-[#00D4FF]/10 px-3 py-2 text-xs leading-5 text-[#bdefff]"
      }
      role={isError ? "alert" : "status"}
      aria-live="polite"
    >
      {isError ? (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      {message}
    </div>
  );
}
