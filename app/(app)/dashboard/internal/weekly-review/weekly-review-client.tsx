"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Review = {
  period_start: string;
  period_end: string;
  summary_data: {
    wins: string[];
    inMotion: string[];
    blockers: string[];
  };
  narrative: {
    reflectionSummary: string;
    focusRecommendation: string;
    suggestedMentorPrompt: string;
  };
  generated_with_ai: boolean;
  updated_at: string;
};

export default function WeeklyReviewClient() {
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getErrorMessage = (err: unknown) =>
    err instanceof Error ? err.message : "Could not load weekly review";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/weekly-review", { method: "GET" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load weekly review");
      setReview(data.review ?? null);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const generate = async (forceRegenerate = false) => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/weekly-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceRegenerate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not generate review");
      setReview(data.review);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Weekly Founder Review</h1>
          <p className="text-sm text-slate-400">Review your rolling last 7 days and reset your next focus.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => generate(false)} disabled={generating}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate this week"}
          </Button>
          {review ? (
            <Button onClick={() => generate(true)} variant="outline" disabled={generating}>
              Regenerate
            </Button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-6 text-sm text-red-300">{error}</CardContent>
        </Card>
      ) : !review ? (
        <Card>
          <CardContent className="py-6 text-sm text-slate-400">
            No review yet for this week. Generate your recap to see wins, unfinished work, blockers, and your next focus.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Weekly reflection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-300">
              <p>{review.narrative.reflectionSummary}</p>
              <p className="font-medium text-white">Focus for next week: {review.narrative.focusRecommendation}</p>
              <p>Suggested mentor prompt: “{review.narrative.suggestedMentorPrompt}”</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>This week&apos;s wins</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2 text-sm text-slate-300">
                {review.summary_data.wins.map((item, idx) => (
                  <li key={`w-${idx}`}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Still in motion</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2 text-sm text-slate-300">
                {review.summary_data.inMotion.map((item, idx) => (
                  <li key={`m-${idx}`}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Blockers</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2 text-sm text-slate-300">
                {review.summary_data.blockers.map((item, idx) => (
                  <li key={`b-${idx}`}>{item}</li>
                ))}
              </ul>

              <p className="mt-4 text-xs text-slate-500">
                Window: {new Date(review.period_start).toLocaleDateString()} - {new Date(review.period_end).toLocaleDateString()} ·
                {review.generated_with_ai ? " AI-assisted" : " deterministic fallback"} · Updated {new Date(review.updated_at).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
