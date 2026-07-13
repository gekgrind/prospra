// app/dashboard/business-roadmap/page.tsx
"use client";

import * as React from "react";

import {
  getDefaultRoadmap,
  computeOverallProgress,
  computeStageProgress,
} from "@/lib/roadmap";
import {
  PageHeader,
  MetricCard,
  SectionCard,
  StageProgressBar,
} from "@/components/dashboard/SharedDashboard";
import { Card } from "@/components/ui/card";

export default function BusinessRoadmapPage() {
  const { stages, steps } = getDefaultRoadmap();

  const [completedStepIds, setCompletedStepIds] = React.useState<string[]>([]);
  const [savingStepId, setSavingStepId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function loadProgress() {
      try {
        const res = await fetch("/api/roadmap-progress");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data.completedStepIds)) {
          setCompletedStepIds(data.completedStepIds);
        }
      } catch {
        // Leave progress empty; the page still renders.
      }
    }

    loadProgress();
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggleStep(stepId: string) {
    if (savingStepId) return;

    const wasCompleted = completedStepIds.includes(stepId);
    const optimistic = wasCompleted
      ? completedStepIds.filter((id) => id !== stepId)
      : [...completedStepIds, stepId];

    setSavingStepId(stepId);
    setError(null);
    setCompletedStepIds(optimistic);

    try {
      const res = await fetch("/api/roadmap-progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId, completed: !wasCompleted }),
      });

      if (!res.ok) {
        throw new Error("Failed to save");
      }

      const data = await res.json();
      if (Array.isArray(data.completedStepIds)) {
        setCompletedStepIds(data.completedStepIds);
      }
    } catch {
      setCompletedStepIds(completedStepIds);
      setError("Could not save your progress. Please try again.");
    } finally {
      setSavingStepId(null);
    }
  }

  const progress = { completedStepIds };
  const overall = computeOverallProgress(stages, steps, progress);

  const stageProgressList = stages
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((stage) => computeStageProgress(stage, steps, progress));

  return (
    <div className="space-y-8">
      <PageHeader
        label="Roadmap"
        title="Your Business Roadmap"
        description="A simple, staged path from idea to scale. Check your progress, see what’s next, and plug in tools that make each step easier."
      />

      {error ? (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Overall Progress"
          value={`${overall.percent}%`}
          sublabel={`${overall.completedSteps}/${overall.totalSteps} steps complete`}
        />
        <MetricCard
          label="Stages"
          value={String(stages.length)}
          sublabel="From foundation to scale"
        />
        <MetricCard
          label="Total Steps"
          value={String(steps.length)}
          sublabel="You can’t do them all at once—and you don’t have to."
        />
      </div>

      {/* Progress bars */}
      <SectionCard
        title="Stage Progress"
        description="Each band represents one phase of your business. Earlier phases are intentionally lighter—no more building skyscrapers on quicksand."
      >
        <div className="space-y-4">
          {stageProgressList.map((sp) => (
            <div key={sp.stage.id}>
              <StageProgressBar progress={sp} />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Stage details */}
      <div className="grid gap-6 lg:grid-cols-2">
        {stages
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((stage) => {
            const stageSteps = steps.filter(
              (step) => step.stageId === stage.id
            );
            const completedIds = new Set(completedStepIds);

            return (
              <SectionCard
                key={stage.id}
                title={stage.title}
                description={stage.description}
              >
                <div className="space-y-3">
                  {stageSteps.map((step) => {
                    const done = completedIds.has(step.id);
                    return (
                      <Card
                        key={step.id}
                        className="flex items-start gap-3 border-slate-700/60 bg-slate-950/60 px-3 py-3"
                      >
                        <button
                          type="button"
                          onClick={() => toggleStep(step.id)}
                          disabled={savingStepId === step.id}
                          aria-pressed={done}
                          aria-label={
                            done
                              ? `Mark "${step.title}" as not complete`
                              : `Mark "${step.title}" as complete`
                          }
                          className="mt-1 disabled:opacity-50"
                        >
                          <div
                            className={`h-3 w-3 rounded-full border transition-colors ${
                              done
                                ? "border-emerald-400 bg-emerald-500"
                                : "border-slate-500 bg-slate-800 hover:border-emerald-400/60"
                            }`}
                          />
                        </button>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs md:text-sm font-medium text-slate-50">
                              {step.title}
                            </p>
                            <span className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-300">
                              {step.difficulty}
                            </span>
                            <span className="rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-400">
                              ~{step.estimatedTimeHours}h
                            </span>
                          </div>
                          <p className="text-[11px] md:text-xs text-slate-300 leading-snug">
                            {step.description}
                          </p>
                          {step.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {step.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-400"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </SectionCard>
            );
          })}
      </div>
    </div>
  );
}
