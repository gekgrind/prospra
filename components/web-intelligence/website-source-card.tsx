"use client";

import * as React from "react";
import { Globe, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InteractiveGlowCard } from "@/components/ui/interactive-glow";
import { Input } from "@/components/ui/input";
import type { WebsiteIntelligenceSnapshot } from "@/lib/web-intelligence/types";

type WebsiteSourceCardProps = {
  onSnapshotReady: (snapshot: WebsiteIntelligenceSnapshot) => void;
};

type AnalyzeResponse = {
  success: boolean;
  snapshot: WebsiteIntelligenceSnapshot;
};

export function WebsiteSourceCard({ onSnapshotReady }: WebsiteSourceCardProps) {
  const [websiteUrl, setWebsiteUrl] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/web-intelligence/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ websiteUrl }),
      });

      const payload = (await response.json()) as AnalyzeResponse | { error: string };

      if (!response.ok || !("success" in payload) || !payload.success) {
        const errorMessage =
          "error" in payload ? payload.error : "Unable to analyze website right now.";
        setMessage(errorMessage);
        return;
      }

      onSnapshotReady(payload.snapshot);
      setMessage("Site Strategist analysis complete. Diagnostics are now populated below.");
    } catch {
      setMessage("We hit a connection issue. Please try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <InteractiveGlowCard className="relative rounded-[24px] border border-[#4f7ca7]/20 bg-[rgba(10,20,38,0.72)] shadow-[0_20px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00D4FF]/55 to-transparent" />

      <CardHeader className="relative z-10 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-white">
          <span className="inline-flex rounded-lg border border-[#00D4FF]/25 bg-[#00D4FF]/10 p-2 text-[#9eefff]">
            <Globe className="h-4 w-4" />
          </span>
          Website source
        </CardTitle>
      </CardHeader>

      <CardContent className="relative z-10 space-y-4 pt-0">
        <p className="text-sm leading-6 text-[#c7d8ea]/76">
          Enter your canonical website URL to initialize Site Strategist. This
          becomes the source of truth for clarity analysis, SEO and UX scoring,
          CTA evaluation, funnel mapping, and conversion recommendations.
        </p>

        <form className="space-y-3" onSubmit={onSubmit}>
          <label htmlFor="website-url" className="text-xs font-medium text-[#dce9f7]">
            Website URL
          </label>
          <div className="flex flex-col gap-3 md:flex-row">
            <Input
              id="website-url"
              type="url"
              inputMode="url"
              placeholder="https://yourdomain.com"
              value={websiteUrl}
              onChange={(event) => setWebsiteUrl(event.target.value)}
              required
              className="h-11 border-[#4f7ca7]/35 bg-[#07111f]/80 text-white placeholder:text-[#88a7c4]/55"
            />
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 min-w-[180px] bg-[linear-gradient(90deg,#00D4FF_0%,#4f7ca7_100%)] font-semibold text-[#021423] hover:opacity-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze Website"
              )}
            </Button>
          </div>
        </form>

        <div className="space-y-1">
          <p className="text-xs text-[#8fb8d8]">
            Tip: use your public homepage URL for the clearest first snapshot.
          </p>
          {message ? (
            <p className="text-xs text-[#bfefff]" role="status" aria-live="polite">
              {message}
            </p>
          ) : null}
        </div>
      </CardContent>
    </InteractiveGlowCard>
  );
}
