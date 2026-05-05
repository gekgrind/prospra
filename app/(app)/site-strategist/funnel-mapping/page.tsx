"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  CircleDashed,
  Route,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { InteractiveGlowSurface } from "@/components/ui/interactive-glow";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type {
  FunnelMappingError,
  FunnelMappingResult,
  FunnelStage,
  TrafficSource,
} from "@/lib/web-intelligence/funnel-mapping";

type FunnelFormState = {
  websiteUrl: string;
  offer: string;
  audience: string;
  conversionGoal: string;
  trafficSources: TrafficSource[];
};

const trafficSourceOptions: TrafficSource[] = [
  "Organic search",
  "Paid ads",
  "Social media",
  "Email",
  "Referral",
  "Direct traffic",
  "Partnerships",
];

const defaultFormState: FunnelFormState = {
  websiteUrl: "",
  offer: "",
  audience: "",
  conversionGoal: "",
  trafficSources: ["Organic search"],
};

export default function FunnelMappingPage() {
  const [formState, setFormState] =
    React.useState<FunnelFormState>(defaultFormState);
  const [analysis, setAnalysis] = React.useState<FunnelMappingResult | null>(
    null
  );
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const canAnalyze =
    formState.websiteUrl.trim().length > 0 &&
    formState.offer.trim().length > 0 &&
    formState.audience.trim().length > 0 &&
    formState.conversionGoal.trim().length > 0 &&
    formState.trafficSources.length > 0 &&
    !isLoading;

  function updateField<Key extends keyof FunnelFormState>(
    key: Key,
    value: FunnelFormState[Key]
  ) {
    setFormState((current) => ({ ...current, [key]: value }));
  }

  function toggleTrafficSource(source: TrafficSource) {
    setFormState((current) => {
      const nextSources = current.trafficSources.includes(source)
        ? current.trafficSources.filter((item) => item !== source)
        : [...current.trafficSources, source];

      return { ...current, trafficSources: nextSources };
    });
  }

  async function handleAnalyze(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canAnalyze) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/site-strategist/funnel-mapping", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formState),
      });
      const payload = (await response.json().catch(() => null)) as
        | FunnelMappingResult
        | FunnelMappingError
        | null;

      if (!response.ok || !payload || "error" in payload) {
        setError(
          payload && "error" in payload
            ? payload.error
            : "Funnel Mapping could not analyze this funnel right now."
        );
        return;
      }

      setAnalysis(payload);
    } catch {
      setError(
        "Funnel Mapping could not connect to the analysis service. Please try again."
      );
    } finally {
      setIsLoading(false);
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
              Funnel Mapping
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#c7d8ea]/78">
              Map the path from first visit to conversion, then spot the stages
              where trust, clarity, or follow-up needs stronger support.
            </p>
          </div>

          <div className="rounded-2xl border border-[#00D4FF]/20 bg-[#07111f]/70 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8fb8d8]">
              Funnel health
            </p>
            <p className="mt-1 text-3xl font-semibold text-white">
              {analysis ? `${analysis.healthScore}/100` : "--"}
            </p>
          </div>
        </div>
      </InteractiveGlowSurface>

      <section className="grid gap-4 xl:grid-cols-[minmax(320px,0.74fr)_minmax(0,1fr)]">
        <InteractiveGlowSurface className="rounded-[20px] border border-[#4f7ca7]/18 bg-[rgba(8,16,30,0.68)] p-4 md:p-5">
          <form className="space-y-5" onSubmit={handleAnalyze}>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8fb8d8]">
                Funnel inputs
              </p>
              <h2 className="mt-2 text-lg font-semibold text-white">
                Define the journey you want to improve.
              </h2>
            </div>

            <Field label="Website URL" htmlFor="website-url">
              <Input
                id="website-url"
                value={formState.websiteUrl}
                onChange={(event) =>
                  updateField("websiteUrl", event.target.value)
                }
                placeholder="https://example.com"
                className="border-[#4f7ca7]/24 bg-[#07111f]/75 text-white placeholder:text-[#8fb8d8]/48 focus-visible:ring-[#00D4FF]/25"
              />
            </Field>

            <Field label="Business offer" htmlFor="business-offer">
              <Textarea
                id="business-offer"
                value={formState.offer}
                onChange={(event) => updateField("offer", event.target.value)}
                placeholder="Describe the offer, product, service, or lead magnet."
                rows={3}
                className="resize-none border-[#4f7ca7]/24 bg-[#07111f]/75 text-white placeholder:text-[#8fb8d8]/48 focus-visible:ring-[#00D4FF]/25"
              />
            </Field>

            <Field label="Target audience" htmlFor="target-audience">
              <Input
                id="target-audience"
                value={formState.audience}
                onChange={(event) =>
                  updateField("audience", event.target.value)
                }
                placeholder="Early-stage founders, local service buyers, etc."
                className="border-[#4f7ca7]/24 bg-[#07111f]/75 text-white placeholder:text-[#8fb8d8]/48 focus-visible:ring-[#00D4FF]/25"
              />
            </Field>

            <Field label="Primary conversion goal" htmlFor="conversion-goal">
              <Input
                id="conversion-goal"
                value={formState.conversionGoal}
                onChange={(event) =>
                  updateField("conversionGoal", event.target.value)
                }
                placeholder="Book a call, start a trial, join the list, buy now."
                className="border-[#4f7ca7]/24 bg-[#07111f]/75 text-white placeholder:text-[#8fb8d8]/48 focus-visible:ring-[#00D4FF]/25"
              />
            </Field>

            <div className="space-y-3">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8fb8d8]">
                Current traffic sources
              </Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {trafficSourceOptions.map((source) => (
                  <label
                    key={source}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#4f7ca7]/18 bg-[#07111f]/55 px-3 py-2 text-sm text-[#d7e7f6]/82"
                  >
                    <Checkbox
                      checked={formState.trafficSources.includes(source)}
                      onCheckedChange={() => toggleTrafficSource(source)}
                      className="border-[#4f7ca7]/50 data-[state=checked]:border-[#00D4FF] data-[state=checked]:bg-[#00D4FF] data-[state=checked]:text-[#05101d]"
                    />
                    {source}
                  </label>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={!canAnalyze}
              className="h-10 rounded-full bg-[#00D4FF] px-5 text-sm font-semibold text-[#04111f] hover:bg-[#64e7ff] disabled:cursor-not-allowed disabled:bg-[#4f7ca7]/25 disabled:text-[#c7d8ea]/45"
            >
              {isLoading ? "Generating..." : "Generate funnel map"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </InteractiveGlowSurface>

        <div className="space-y-4">
          {error ? <ErrorPanel message={error} /> : null}
          {isLoading ? <LoadingPanel /> : null}
          {analysis ? (
            <>
              <FunnelMap stages={analysis.stages} />

              <div className="grid gap-4 lg:grid-cols-3">
                <InsightPanel
                  title="Weakest stage"
                  icon={CircleAlert}
                  items={[analysis.weakestStage]}
                />
                <InsightPanel
                  title="Missing assets"
                  icon={CircleDashed}
                  items={analysis.missingAssets}
                />
                <InsightPanel
                  title="Friction points"
                  icon={Route}
                  items={analysis.frictionPoints}
                />
              </div>
            </>
          ) : !isLoading ? (
            <EmptyResultsPanel />
          ) : null}
        </div>
      </section>

      {analysis ? (
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.78fr)]">
          <RecommendationPanel
            title="Recommended funnel improvements"
            items={analysis.improvements}
            variant="numbered"
          />
          <RecommendationPanel
            title="Suggested next 3 actions"
            items={analysis.nextActions}
            variant="actions"
          />
        </section>
      ) : null}
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

function EmptyResultsPanel() {
  return (
    <InteractiveGlowSurface className="rounded-[20px] border border-[#4f7ca7]/18 bg-[rgba(8,16,30,0.68)] p-4 md:p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8fb8d8]">
        Funnel map
      </p>
      <h2 className="mt-2 text-lg font-semibold text-white">
        Your funnel map will appear here.
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#c7d8ea]/76">
        Add the funnel inputs and generate the map to see stage strength,
        conversion gaps, and the next actions to take.
      </p>
    </InteractiveGlowSurface>
  );
}

function LoadingPanel() {
  return (
    <InteractiveGlowSurface className="rounded-[20px] border border-[#4f7ca7]/18 bg-[rgba(8,16,30,0.68)] p-4 md:p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8fb8d8]">
        Analyzing funnel
      </p>
      <div className="mt-4 space-y-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-12 animate-pulse rounded-2xl border border-[#4f7ca7]/14 bg-[#07111f]/70"
          />
        ))}
      </div>
    </InteractiveGlowSurface>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <InteractiveGlowSurface className="rounded-[20px] border border-[#ff7a90]/28 bg-[#2b101c]/55 p-4">
      <div className="flex gap-3">
        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#ffb3c0]" />
        <div>
          <p className="text-sm font-semibold text-white">
            Funnel Mapping needs one adjustment.
          </p>
          <p className="mt-1 text-sm leading-6 text-[#ffd5dd]/82">{message}</p>
        </div>
      </div>
    </InteractiveGlowSurface>
  );
}

function FunnelMap({ stages }: { stages: FunnelStage[] }) {
  return (
    <InteractiveGlowSurface className="rounded-[20px] border border-[#4f7ca7]/18 bg-[rgba(8,16,30,0.68)] p-4 md:p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8fb8d8]">
            Visual funnel map
          </p>
          <h2 className="mt-2 text-lg font-semibold text-white">
            Visitor to customer journey
          </h2>
        </div>
        <Sparkles className="h-5 w-5 text-[#9eefff]" />
      </div>

      <div className="mt-5 grid gap-3">
        {stages.map((stage, index) => (
          <div key={stage.name} className="grid gap-3 md:grid-cols-[160px_1fr]">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold",
                  stage.status === "strong"
                    ? "border-[#00D4FF]/45 bg-[#00D4FF]/12 text-[#9eefff]"
                    : stage.status === "watch"
                      ? "border-[#f3c969]/45 bg-[#f3c969]/12 text-[#ffe29a]"
                      : "border-[#ff7a90]/45 bg-[#ff7a90]/12 text-[#ffb3c0]"
                )}
              >
                {index + 1}
              </div>
              <p className="text-sm font-semibold text-white">{stage.name}</p>
            </div>

            <div className="rounded-2xl border border-[#4f7ca7]/18 bg-[#07111f]/62 p-3">
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#0d2039]">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      stage.status === "strong"
                        ? "bg-[#00D4FF]"
                        : stage.status === "watch"
                          ? "bg-[#f3c969]"
                          : "bg-[#ff7a90]"
                    )}
                    style={{ width: `${stage.strength}%` }}
                  />
                </div>
                <span className="w-10 text-right text-xs font-semibold text-[#d4e8fb]">
                  {stage.strength}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-[#c7d8ea]/74">
                {stage.insight}
              </p>
            </div>
          </div>
        ))}
      </div>
    </InteractiveGlowSurface>
  );
}

function InsightPanel({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: string[];
}) {
  return (
    <InteractiveGlowSurface className="rounded-[20px] border border-[#4f7ca7]/18 bg-[#07111f]/70 p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#9eefff]" />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-xl border border-[#4f7ca7]/16 bg-[#06101d]/70 px-3 py-2 text-xs leading-5 text-[#d7e7f6]/80"
          >
            {item}
          </li>
        ))}
      </ul>
    </InteractiveGlowSurface>
  );
}

function RecommendationPanel({
  title,
  items,
  variant,
}: {
  title: string;
  items: string[];
  variant: "numbered" | "actions";
}) {
  return (
    <InteractiveGlowSurface className="rounded-[20px] border border-[#4f7ca7]/18 bg-[rgba(8,16,30,0.68)] p-4 md:p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8fb8d8]">
        {title}
      </p>
      <div className="mt-4 grid gap-3">
        {items.map((item, index) => (
          <div
            key={item}
            className="flex gap-3 rounded-2xl border border-[#4f7ca7]/18 bg-[#07111f]/62 p-3"
          >
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#00D4FF]/25 bg-[#00D4FF]/10 text-xs font-semibold text-[#9eefff]">
              {variant === "actions" ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                index + 1
              )}
            </div>
            <p className="text-sm leading-6 text-[#d7e7f6]/82">{item}</p>
          </div>
        ))}
      </div>
    </InteractiveGlowSurface>
  );
}
