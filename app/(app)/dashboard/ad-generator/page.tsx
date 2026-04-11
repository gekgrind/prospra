"use client";

import { useState } from "react";
import { AdCampaign } from "@/lib/website-brain/ad-generator";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type GeneratorContext = {
  usedOptions: {
    platforms: string[];
    tone: string;
    growthFocus: string;
  };
  vcContext: {
    fundingStage?: string;
    targetRaise?: string;
    runwayMonths?: string;
    founderScore?: number | null;
    businessHealthScore?: number | null;
  };
  websiteScoreContext: {
    url?: string | null;
    overallScore?: number | null;
    clarityScore?: number | null;
    offerScore?: number | null;
    seoScore?: number | null;
    uxScore?: number | null;
  };
  websiteUrl?: string;
  companyName?: string;
  founderName?: string;
};

const ALL_PLATFORMS = [
  { id: "tiktok", label: "TikTok" },
  { id: "meta", label: "Meta (Facebook/IG)" },
  { id: "google-search", label: "Google Search" },
  { id: "youtube-shorts", label: "YouTube Shorts" },
  { id: "linkedin", label: "LinkedIn" },
];

export default function AdGeneratorPage() {
  const [platforms, setPlatforms] = useState<string[]>([
    "tiktok",
    "meta",
    "google-search",
  ]);
  const [tone, setTone] = useState("supportive-hype");
  const [growthFocus, setGrowthFocus] = useState("leads-and-sales");
  const [customGoal, setCustomGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [context, setContext] = useState<GeneratorContext | null>(null);
  const [error, setError] = useState<string | null>(null);

  const togglePlatform = (id: string) => {
    setPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/website/ad-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platforms,
          tone,
          growthFocus: customGoal.trim() || growthFocus,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate campaigns");
      }

      const data = (await res.json()) as {
        campaigns: AdCampaign[];
        context: GeneratorContext;
      };

      setCampaigns(data.campaigns || []);
      setContext(data.context || null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (campaign: AdCampaign) => {
    try {
      const text = [
        `Campaign: ${campaign.name}`,
        `Objective: ${campaign.objective}`,
        `Summary: ${campaign.summary}`,
        `Stage Fit: ${campaign.stageFit}`,
        "",
        `Platforms: ${campaign.platforms.join(", ")}`,
        `Primary Audience: ${campaign.primaryAudience}`,
        `Angle: ${campaign.angle}`,
        "",
        `KPIs: ${campaign.kpis.join(", ")}`,
        `Budget: ${campaign.estBudget.monthly} — ${campaign.estBudget.notes}`,
        "",
        `Creatives:`,
        ...campaign.creatives.map(
          (c) =>
            `- [${c.platform}] (${c.type})\n  Hook: ${c.hook}\n  Copy: ${c.primaryText}\n  CTA: ${c.cta}`
        ),
        "",
        `Funnel:`,
        ...campaign.funnel.map(
          (f) => `- ${f.stage}: ${f.asset} → ${f.action}`
        ),
      ].join("\n");

      await navigator.clipboard.writeText(text);
      alert("Campaign copied to clipboard ✨");
    } catch {
      alert("Could not copy to clipboard, sorry!");
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300 mb-3">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          VC-Backed Ad Campaign Lab
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">
          Website → Ad Campaigns
        </h1>
        <p className="text-slate-400 max-w-2xl">
          Prospra reads your current website, your funding stage, and runway —
          then designs launch-ready campaigns a growth partner would charge
          thousands for.
        </p>
      </div>

      {/* Context strip */}
      {context && (
        <Card className="bg-slate-900/70 border-slate-800">
          <CardContent className="flex flex-wrap items-center gap-3 py-4 text-xs sm:text-sm">
            {context.websiteUrl && (
              <Badge
                variant="outline"
                className="border-sky-500/60 text-sky-300 bg-sky-500/10"
              >
                Site: {context.websiteUrl}
              </Badge>
            )}
            {context.vcContext.fundingStage && (
              <Badge
                variant="outline"
                className="border-emerald-500/60 text-emerald-300 bg-emerald-500/10"
              >
                Stage: {context.vcContext.fundingStage}
              </Badge>
            )}
            {context.vcContext.runwayMonths && (
              <Badge
                variant="outline"
                className="border-amber-500/60 text-amber-300 bg-amber-500/10"
              >
                Runway: {context.vcContext.runwayMonths} months
              </Badge>
            )}
            {context.websiteScoreContext.overallScore != null && (
              <Badge
                variant="outline"
                className="border-purple-500/60 text-purple-300 bg-purple-500/10"
              >
                Website Score: {context.websiteScoreContext.overallScore}/100
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <Card className="bg-slate-900/70 border-slate-800 shadow-xl shadow-slate-950/40">
        <CardHeader>
          <CardTitle className="text-white">
            Configure your campaign generation
          </CardTitle>
          <CardDescription className="text-slate-400">
            Pick channels, tone, and your main growth focus. Prospra will do the
            rest.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Platforms */}
          <div className="space-y-2">
            <Label className="text-slate-200 text-sm">
              Platforms to prioritize
            </Label>
            <div className="flex flex-wrap gap-2">
              {ALL_PLATFORMS.map((p) => {
                const active = platforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlatform(p.id)}
                    className={[
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition",
                      active
                        ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/40"
                        : "bg-slate-900/60 text-slate-300 border-slate-700 hover:border-emerald-400/60 hover:text-emerald-200",
                    ].join(" ")}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            {platforms.length === 0 && (
              <p className="text-xs text-rose-400">
                At least one platform needs to be selected.
              </p>
            )}
          </div>

          {/* Tone + Focus */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-slate-200 text-sm">
                Coach & campaign tone
              </Label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="h-10 w-full rounded-md border border-slate-700 bg-slate-900/80 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
              >
                <option value="supportive-hype">
                  Supportive, hype, and optimistic
                </option>
                <option value="direct">
                  Direct, blunt, no-fluff operator
                </option>
                <option value="luxury">
                  Calm, premium, luxury positioning
                </option>
                <option value="analytical">
                  Analytical, data-heavy framing
                </option>
              </select>
              <p className="text-xs text-slate-500">
                This influences how bold and spicy your hooks and copy are.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200 text-sm">
                Growth focus (or custom)
              </Label>
              <select
                value={growthFocus}
                onChange={(e) => setGrowthFocus(e.target.value)}
                className="h-10 w-full rounded-md border border-slate-700 bg-slate-900/80 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/70 mb-2"
              >
                <option value="awareness">Brand awareness</option>
                <option value="leads-and-sales">
                  Leads & sales (default)
                </option>
                <option value="activation">
                  Activating existing signups/users
                </option>
                <option value="retention">
                  Retention & reactivation
                </option>
              </select>
              <Input
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                placeholder="Or type a custom objective, e.g. 'Book 10 sales calls/month from founders in SaaS'"
                className="bg-slate-900/80 border-slate-700 text-xs text-slate-100 placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Action row */}
          <div className="flex flex-col gap-3 border-t border-slate-800 pt-4 md:flex-row md:items-center md:justify-between">
            <div className="text-xs text-slate-500">
              Prospra will generate 3 campaigns designed for your current stage,
              runway, and website quality — not generic templates.
            </div>
            <Button
              onClick={handleGenerate}
              disabled={loading || platforms.length === 0}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-6"
            >
              {loading ? "Summoning growth spirits…" : "Generate campaigns"}
            </Button>
          </div>

          {error && (
            <p className="text-sm text-rose-400 border-t border-rose-500/30 pt-3">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {campaigns.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-white">
              Generated campaigns
            </h2>
            <p className="text-xs text-slate-500">
              Use these as launch-ready starting points. Tweak, test, and scale.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {campaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className="bg-slate-900/80 border-slate-800 flex flex-col"
              >
                <CardHeader className="space-y-2 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-white text-base">
                        {campaign.name}
                      </CardTitle>
                      <CardDescription className="text-emerald-300 text-xs mt-1">
                        {campaign.objective}
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-700 text-xs text-slate-200 hover:border-emerald-400 hover:text-emerald-200"
                      onClick={() => handleCopy(campaign)}
                    >
                      Copy
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {campaign.platforms.map((p) => (
                      <Badge
                        key={p}
                        variant="outline"
                        className="border-slate-700 text-[10px] uppercase tracking-wide text-slate-300"
                      >
                        {p}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-slate-300 flex-1 flex flex-col">
                  <p className="text-slate-300 text-xs">{campaign.summary}</p>
                  {campaign.stageFit && (
                    <p className="text-[11px] text-amber-300/90 bg-amber-500/5 border border-amber-500/30 rounded-md px-2 py-1">
                      Stage fit: {campaign.stageFit}
                    </p>
                  )}
                  <div>
                    <p className="font-semibold text-slate-100 text-xs mb-1">
                      Angle & audience
                    </p>
                    <p className="text-[11px] text-slate-300">
                      <span className="font-medium text-slate-200">
                        Audience:
                      </span>{" "}
                      {campaign.primaryAudience || "Not specified"}
                    </p>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      <span className="font-medium text-slate-200">
                        Angle:
                      </span>{" "}
                      {campaign.angle || "—"}
                    </p>
                  </div>

                  {/* KPIs & budget */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] mt-1">
                    <div>
                      <p className="font-semibold text-slate-100 mb-0.5">
                        KPIs
                      </p>
                      <ul className="space-y-0.5 list-disc list-inside text-slate-300">
                        {campaign.kpis.map((kpi) => (
                          <li key={kpi}>{kpi}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-100 mb-0.5">
                        Budget
                      </p>
                      <p>{campaign.estBudget.monthly}</p>
                      {campaign.estBudget.notes && (
                        <p className="text-slate-400 mt-0.5">
                          {campaign.estBudget.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Creatives preview */}
                  {campaign.creatives.length > 0 && (
                    <div className="mt-2 border-t border-slate-800 pt-2">
                      <p className="font-semibold text-slate-100 text-xs mb-1">
                        Example creative
                      </p>
                      <div className="space-y-1.5">
                        {campaign.creatives.slice(0, 2).map((cr, idx) => (
                          <div
                            key={idx}
                            className="rounded-md bg-slate-900/80 border border-slate-800 px-2 py-1.5"
                          >
                            <p className="text-[10px] text-slate-400 mb-0.5">
                              [{cr.platform}] {cr.type}
                            </p>
                            <p className="text-[11px] text-emerald-300">
                              Hook: {cr.hook}
                            </p>
                            <p className="text-[11px] text-slate-200 mt-0.5">
                              {cr.primaryText}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              CTA: {cr.cta}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Funnel */}
                  {campaign.funnel.length > 0 && (
                    <div className="mt-2 border-t border-slate-800 pt-2">
                      <p className="font-semibold text-slate-100 text-xs mb-1">
                        Funnel outline
                      </p>
                      <ol className="space-y-0.5 text-[11px] text-slate-300 list-decimal list-inside">
                        {campaign.funnel.map((step, idx) => (
                          <li key={idx}>
                            <span className="font-medium">{step.stage}:</span>{" "}
                            {step.asset} → {step.action}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
