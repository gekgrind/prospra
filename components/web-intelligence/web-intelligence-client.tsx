"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ResultsOverview } from "@/components/web-intelligence/results-overview";
import type { WebsiteIntelligenceSnapshot } from "@/lib/web-intelligence/types";

type WebIntelligenceClientProps = {
  initialSnapshot: WebsiteIntelligenceSnapshot | null;
};

export function WebIntelligenceClient({ initialSnapshot }: WebIntelligenceClientProps) {
  const [websiteUrl, setWebsiteUrl] = useState(initialSnapshot?.websiteUrl ?? "");
  const [snapshot, setSnapshot] = useState<WebsiteIntelligenceSnapshot | null>(initialSnapshot);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const latestAnalyzedLabel = (() => {
    if (!snapshot?.updatedAt) return null;

    try {
      return new Date(snapshot.updatedAt).toLocaleString();
    } catch {
      return null;
    }
  })();

  async function handleAnalyze(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!websiteUrl.trim()) {
      setError("Please enter a website URL to analyze.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/web-intelligence/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ websiteUrl: websiteUrl.trim() }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to analyze this website right now.");
      }

      const nextSnapshot = (payload?.snapshot ?? null) as WebsiteIntelligenceSnapshot | null;
      setSnapshot(nextSnapshot);
      setWebsiteUrl(nextSnapshot?.websiteUrl ?? websiteUrl.trim());
      setSuccessMessage("Analysis complete. Your latest snapshot has been saved.");
    } catch (analysisError) {
      const message = analysisError instanceof Error ? analysisError.message : "Analysis failed.";
      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-brandNavy border-brandBlue/40">
        <CardHeader>
          <CardTitle className="text-brandBlueLight">Web Intelligence</CardTitle>
          <CardDescription className="text-brandBlueLight/70">
            Analyze your homepage signals, save a snapshot, and use the output to guide founder-level improvements.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAnalyze} className="flex flex-col gap-3 sm:flex-row">
            <Input
              type="url"
              value={websiteUrl}
              onChange={(event) => setWebsiteUrl(event.target.value)}
              placeholder="https://your-website.com"
              className="bg-brandNavy/60 border-brandBlue/50 text-brandBlueLight placeholder:text-brandBlueLight/50"
              aria-label="Website URL"
              required
            />
            <Button type="submit" className="bg-brandBlue text-white hover:bg-brandBlue/80" disabled={isAnalyzing}>
              {isAnalyzing ? "Analyzing..." : "Run Analysis"}
            </Button>
          </form>

          <p className="text-xs text-brandBlueLight/60">
            We currently run a first-pass homepage analysis using fetchable HTML and structured heuristics.
          </p>

          {snapshot?.websiteUrl ? (
            <p className="text-xs text-brandBlueLight/60">Latest analyzed URL: {snapshot.websiteUrl}</p>
          ) : null}

          {latestAnalyzedLabel ? (
            <p className="text-xs text-brandBlueLight/50">Last updated: {latestAnalyzedLabel}</p>
          ) : null}

          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          {successMessage ? <p className="text-sm text-emerald-300">{successMessage}</p> : null}
        </CardContent>
      </Card>

      {snapshot ? (
        <ResultsOverview snapshot={snapshot} />
      ) : (
        <Card className="bg-brandNavy border-brandBlue/40">
          <CardHeader>
            <CardTitle className="text-brandBlueLight">No analysis yet</CardTitle>
            <CardDescription className="text-brandBlueLight/70">
              Run your first website analysis to unlock scorecards, key issues, and founder-ready fixes.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
