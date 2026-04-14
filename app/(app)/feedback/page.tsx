"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  FEEDBACK_TYPES,
  FEATURE_AREAS,
  type FeedbackType,
} from "@/lib/feedback";

const typeLabels: Record<FeedbackType, string> = {
  bug: "Bug",
  feature_request: "Feature request",
  general_feedback: "General feedback",
};

function FeedbackForm() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [feedbackType, setFeedbackType] =
    useState<FeedbackType>("general_feedback");
  const [featureArea, setFeatureArea] = useState<string>("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const conversationId = useMemo(() => {
    return searchParams.get("conversation_id") ?? "";
  }, [searchParams]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      setError("Please enter a message before submitting.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedback_type: feedbackType,
          message: trimmedMessage,
          context: {
            route: pathname,
            conversation_id: conversationId || undefined,
            feature_area: featureArea || undefined,
          },
        }),
      });

      const payload: { error?: string } = await response.json();

      if (!response.ok) {
        setError(payload?.error || "Could not submit feedback. Please try again.");
        return;
      }

      const trackedFeatureArea = featureArea || null;

      setSuccess("Thanks — your feedback was submitted successfully.");
      setMessage("");
      setFeatureArea("");

      if (typeof window !== "undefined") {
        const analytics = (
          window as Window & {
            analytics?: {
              track?: (
                event: string,
                props: Record<string, unknown>
              ) => void;
            };
          }
        ).analytics;

        analytics?.track?.("feedback_submitted", {
          feedback_type: feedbackType,
          feature_area: trackedFeatureArea,
          route: pathname,
        });
      }
    } catch (submitError) {
      console.error("[FEEDBACK_SUBMIT_ERROR]", submitError);
      setError("Network error while submitting feedback. Please retry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle>Give feedback</CardTitle>
          <CardDescription>
            Report bugs, suggest improvements, or share general thoughts.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="feedback-type">Feedback type</Label>
              <select
                id="feedback-type"
                value={feedbackType}
                onChange={(event) =>
                  setFeedbackType(event.target.value as FeedbackType)
                }
                className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
              >
                {FEEDBACK_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {typeLabels[type]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-message">Message</Label>
              <Textarea
                id="feedback-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Tell us what happened or what you'd like to see."
                required
                rows={6}
                maxLength={4000}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feature-area">Feature area (optional)</Label>
              <select
                id="feature-area"
                value={featureArea}
                onChange={(event) => setFeatureArea(event.target.value)}
                className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
              >
                <option value="">Select an area</option>
                {FEATURE_AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            {conversationId ? (
              <p className="text-xs text-slate-400">
                Conversation context attached automatically.
              </p>
            ) : null}

            {error ? <p className="text-sm text-red-300">{error}</p> : null}
            {success ? (
              <p className="text-sm text-emerald-300">{success}</p>
            ) : null}

            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit feedback"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function FeedbackPageFallback() {
  return (
    <div className="max-w-2xl">
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle>Give feedback</CardTitle>
          <CardDescription>
            Loading feedback form...
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={<FeedbackPageFallback />}>
      <FeedbackForm />
    </Suspense>
  );
}