// app/dashboard/business-roadmap/page.tsx
"use client";

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
  const { stages, steps, progress } = getDefaultRoadmap();

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
            const completedIds = new Set(progress.completedStepIds);

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
                        <div className="mt-1">
                          <div
                            className={`h-3 w-3 rounded-full border ${
                              done
                                ? "border-emerald-400 bg-emerald-500"
                                : "border-slate-500 bg-slate-800"
                            }`}
                          />
                        </div>
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
