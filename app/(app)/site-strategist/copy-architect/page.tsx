"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  FileText,
  Gauge,
  Loader2,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InteractiveGlowSurface } from "@/components/ui/interactive-glow";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  copyArchitectToneOptions,
  type CopyArchitectResult,
  type CopyArchitectTone,
} from "@/lib/web-intelligence/copy-architect";

type CopyArchitectApiError = {
  error: string;
};

export default function CopyArchitectPage() {
  const [websiteUrl, setWebsiteUrl] = React.useState("");
  const [existingCopy, setExistingCopy] = React.useState("");
  const [businessOffer, setBusinessOffer] = React.useState("");
  const [targetAudience, setTargetAudience] = React.useState("");
  const [desiredTone, setDesiredTone] =
    React.useState<CopyArchitectTone>("Clear and confident");
  const [result, setResult] = React.useState<CopyArchitectResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isImproving, setIsImproving] = React.useState(false);

  const canImprove = existingCopy.trim().length > 0 && !isImproving;

  async function handleImproveCopy(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!existingCopy.trim()) {
      setError("Add the existing copy before improving the page.");
      return;
    }

    setError(null);
    setIsImproving(true);

    try {
      const response = await fetch("/api/site-strategist/copy-architect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          websiteUrl,
          existingCopy,
          businessOffer,
          targetAudience,
          desiredTone,
        }),
      });

      const body = (await response.json().catch(() => null)) as
        | CopyArchitectResult
        | CopyArchitectApiError
        | null;

      if (!response.ok) {
        setResult(null);
        setError(
          isCopyArchitectApiError(body)
            ? body.error
            : "Copy Architect could not generate recommendations right now. Please try again."
        );
        return;
      }

      if (!body || isCopyArchitectApiError(body)) {
        throw new Error("Invalid Copy Architect response.");
      }

      const analysis = body;
      setResult(analysis);
    } catch {
      setResult(null);
      setError(
        "Copy Architect could not generate recommendations right now. Please try again."
      );
    } finally {
      setIsImproving(false);
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
              Copy Architect
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#c7d8ea]/78">
              Rewrite website copy for sharper clarity, stronger trust, and a
              cleaner conversion path without changing the core offer.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
            <ScoreBadge label="Clarity" value={result?.clarityScore ?? null} />
            <ScoreBadge
              label="Conversion"
              value={result?.conversionScore ?? null}
            />
          </div>
        </div>
      </InteractiveGlowSurface>

      <section className="grid gap-4 xl:grid-cols-[minmax(320px,0.74fr)_minmax(0,1fr)]">
        <InteractiveGlowSurface className="rounded-[20px] border border-[#4f7ca7]/18 bg-[rgba(8,16,30,0.68)] p-4 md:p-5">
          <form className="space-y-5" onSubmit={handleImproveCopy}>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8fb8d8]">
                Copy inputs
              </p>
              <h2 className="mt-2 text-lg font-semibold text-white">
                Give Copy Architect the page context.
              </h2>
            </div>

            <Field label="Website/page URL" htmlFor="copy-url">
              <Input
                id="copy-url"
                type="url"
                inputMode="url"
                value={websiteUrl}
                onChange={(event) => setWebsiteUrl(event.target.value)}
                placeholder="https://example.com/home"
                className="h-11 border-[#4f7ca7]/24 bg-[#07111f]/75 text-white placeholder:text-[#8fb8d8]/48 focus-visible:ring-[#00D4FF]/25"
              />
            </Field>

            <Field label="Existing copy" htmlFor="existing-copy">
              <Textarea
                id="existing-copy"
                value={existingCopy}
                onChange={(event) => setExistingCopy(event.target.value)}
                placeholder="Paste the current headline, hero copy, section copy, or full page copy."
                rows={7}
                className="resize-none border-[#4f7ca7]/24 bg-[#07111f]/75 text-white placeholder:text-[#8fb8d8]/48 focus-visible:ring-[#00D4FF]/25"
              />
            </Field>

            <Field label="Business/offer" htmlFor="business-offer">
              <Input
                id="business-offer"
                value={businessOffer}
                onChange={(event) => setBusinessOffer(event.target.value)}
                placeholder="Example: strategic website audits for early-stage founders"
                className="h-11 border-[#4f7ca7]/24 bg-[#07111f]/75 text-white placeholder:text-[#8fb8d8]/48 focus-visible:ring-[#00D4FF]/25"
              />
            </Field>

            <Field label="Target audience" htmlFor="target-audience">
              <Input
                id="target-audience"
                value={targetAudience}
                onChange={(event) => setTargetAudience(event.target.value)}
                placeholder="Example: solo founders preparing to improve conversion"
                className="h-11 border-[#4f7ca7]/24 bg-[#07111f]/75 text-white placeholder:text-[#8fb8d8]/48 focus-visible:ring-[#00D4FF]/25"
              />
            </Field>

            <Field label="Desired tone" htmlFor="desired-tone">
              <select
                id="desired-tone"
                value={desiredTone}
                onChange={(event) =>
                  setDesiredTone(event.target.value as CopyArchitectTone)
                }
                className="h-11 w-full rounded-md border border-[#4f7ca7]/24 bg-[#07111f]/75 px-3 text-sm text-white outline-none transition-colors focus:border-[#00D4FF]/45 focus:ring-2 focus:ring-[#00D4FF]/15"
              >
                {copyArchitectToneOptions.map((tone) => (
                  <option key={tone} value={tone}>
                    {tone}
                  </option>
                ))}
              </select>
            </Field>

            {error ? <ErrorPanel message={error} /> : null}

            <Button
              type="submit"
              disabled={!canImprove}
              className="h-10 rounded-full bg-[#00D4FF] px-5 text-sm font-semibold text-[#04111f] hover:bg-[#64e7ff] disabled:cursor-not-allowed disabled:bg-[#4f7ca7]/25 disabled:text-[#c7d8ea]/45"
            >
              {isImproving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Improving copy
                </>
              ) : (
                <>
                  <WandSparkles className="h-4 w-4" />
                  Improve Copy
                </>
              )}
            </Button>
          </form>
        </InteractiveGlowSurface>

        <ResultsPanel result={result} isImproving={isImproving} />
      </section>
    </div>
  );
}

function isCopyArchitectApiError(
  body: CopyArchitectResult | CopyArchitectApiError | null
): body is CopyArchitectApiError {
  return Boolean(body && "error" in body);
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
  isImproving,
}: {
  result: CopyArchitectResult | null;
  isImproving: boolean;
}) {
  if (isImproving) {
    return (
      <InteractiveGlowSurface className="rounded-[20px] border border-[#4f7ca7]/18 bg-[#07111f]/70 p-4 md:p-5">
        <div className="flex min-h-[540px] flex-col justify-center gap-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="h-28 animate-pulse rounded-2xl border border-[#4f7ca7]/18 bg-[#0d2039]/70" />
            <div className="h-28 animate-pulse rounded-2xl border border-[#4f7ca7]/18 bg-[#0d2039]/56" />
          </div>
          <div className="h-32 animate-pulse rounded-2xl border border-[#4f7ca7]/18 bg-[#0d2039]/56" />
          <div className="h-40 animate-pulse rounded-2xl border border-[#4f7ca7]/18 bg-[#0d2039]/46" />
          <p className="text-sm text-[#c7d8ea]/72">
            Reviewing clarity, trust cues, conversion intent, headline strength,
            and CTA momentum.
          </p>
        </div>
      </InteractiveGlowSurface>
    );
  }

  if (!result) {
    return (
      <InteractiveGlowSurface className="rounded-[20px] border border-[#4f7ca7]/18 bg-[#07111f]/70 p-4 md:p-5">
        <div className="flex min-h-[540px] flex-col justify-center rounded-2xl border border-dashed border-[#4f7ca7]/24 bg-[#06101d]/70 px-4 py-6">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-[#00D4FF]/22 bg-[#00D4FF]/10 text-[#9eefff]">
            <FileText className="h-5 w-5" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8fb8d8]">
            Copy review ready
          </p>
          <h2 className="mt-2 text-lg font-semibold text-white">
            Improved website copy will appear here.
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#c7d8ea]/72">
            Add the page, current copy, offer, audience, and tone to generate a
            clearer conversion-focused rewrite set.
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
              Copy analysis
            </p>
            <h2 className="mt-2 text-lg font-semibold text-white">
              {result.analyzedUrl}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ScoreBadge label="Clarity" value={result.clarityScore} />
            <ScoreBadge label="Conversion" value={result.conversionScore} />
          </div>
        </div>
      </InteractiveGlowSurface>

      <InteractiveGlowSurface className="rounded-[20px] border border-[#4f7ca7]/18 bg-[rgba(8,16,30,0.68)] p-4 md:p-5">
        <div className="flex items-center gap-2 text-[#9eefff]">
          <MessageSquareText className="h-4 w-4" />
          <h3 className="text-sm font-semibold text-white">
            Before / after comparison
          </h3>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <ComparisonBlock label="Before" body={result.comparison.before} />
          <ComparisonBlock label="After" body={result.comparison.after} />
        </div>
      </InteractiveGlowSurface>

      <div className="grid gap-4 lg:grid-cols-2">
        <ListPanel
          title="Improved headline options"
          items={result.headlineOptions}
          icon={Sparkles}
        />
        <ListPanel
          title="Improved subheadline options"
          items={result.subheadlineOptions}
          icon={MessageSquareText}
        />
      </div>

      <InteractiveGlowSurface className="rounded-[20px] border border-[#00D4FF]/22 bg-[#06101d]/72 p-4 md:p-5">
        <div className="flex items-center gap-2 text-[#9eefff]">
          <FileText className="h-4 w-4" />
          <h3 className="text-sm font-semibold text-white">
            Rewritten hero section
          </h3>
        </div>
        <div className="mt-4 space-y-3">
          <HeroLine label="Headline" value={result.rewrittenHero.headline} />
          <HeroLine
            label="Subheadline"
            value={result.rewrittenHero.subheadline}
          />
          <HeroLine label="Body" value={result.rewrittenHero.body} />
          <HeroLine label="CTA" value={result.rewrittenHero.cta} />
        </div>
      </InteractiveGlowSurface>

      <div className="grid gap-4 lg:grid-cols-2">
        <ListPanel
          title="Trust-building copy suggestions"
          items={result.trustBuildingSuggestions}
          icon={ShieldCheck}
        />
        <ListPanel
          title="CTA copy suggestions"
          items={result.ctaSuggestions}
          icon={WandSparkles}
        />
      </div>

      <ListPanel
        title="Why the new copy works"
        items={result.notes}
        icon={Gauge}
      />
    </div>
  );
}

function ScoreBadge({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <div className="rounded-2xl border border-[#00D4FF]/20 bg-[#07111f]/70 px-4 py-3 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8fb8d8]">
        {label}
      </p>
      <p className="mt-1 text-3xl font-semibold text-white">
        {typeof value === "number" ? `${value}` : "--"}
      </p>
    </div>
  );
}

function ComparisonBlock({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-2xl border border-[#4f7ca7]/18 bg-[#07111f]/62 px-4 py-3">
      <p className="text-xs font-semibold text-[#9eefff]">{label}</p>
      <p className="mt-2 text-sm leading-6 text-[#d7e7f6]/80">{body}</p>
    </div>
  );
}

function HeroLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#4f7ca7]/18 bg-[#07111f]/62 px-4 py-3">
      <p className="text-xs font-semibold text-[#9eefff]">{label}</p>
      <p className="mt-2 text-sm leading-6 text-[#d7e7f6]/82">{value}</p>
    </div>
  );
}

function ListPanel({
  title,
  items,
  icon: Icon,
}: {
  title: string;
  items: string[];
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <InteractiveGlowSurface className="rounded-[20px] border border-[#4f7ca7]/18 bg-[#07111f]/70 p-4 md:p-5">
      <div className="flex items-center gap-2 text-[#9eefff]">
        <Icon className="h-4 w-4" />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
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
