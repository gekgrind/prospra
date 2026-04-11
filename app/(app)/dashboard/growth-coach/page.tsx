// app/dashboard/growth-coach/page.tsx
"use client";

import {
  getDefaultRoadmap,
  computeOverallProgress,
  getFocusStage,
} from "@/lib/roadmap";
import { toolsLibrary } from "@/lib/tools-library";
import {
  PageHeader,
  SectionCard,
  MetricCard,
  CoachBubble,
  ToolPill,
} from "@/components/dashboard/SharedDashboard";

export default function GrowthCoachPage() {
  const { stages, steps, progress } = getDefaultRoadmap();
  const overall = computeOverallProgress(stages, steps, progress);
  const focus = getFocusStage(stages, steps, progress);

  const focusTools = focus
    ? toolsLibrary.filter((tool) =>
        tool.roadmapThemes.includes(focus.stage.theme)
      )
    : toolsLibrary;

  const topFocusTools = focusTools.slice(0, 3);

  const focusSteps =
    focus &&
    steps.filter((step) => step.stageId === focus.stage.id).slice(0, 3);

  return (
    <div className="space-y-8">
      <PageHeader
        label="Coach"
        title="Growth Coach"
        description="A zoomed-out view of where you are, what to do next, and which tools will actually move the needle—without the 47-tab overwhelm."
      />

      {/* Metrics row */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Overall Progress"
          value={`${overall.percent}%`}
          sublabel={`${overall.completedSteps}/${overall.totalSteps} roadmap steps complete`}
        />
        <MetricCard
          label="Current Focus Stage"
          value={focus ? focus.stage.title : "Not set"}
          sublabel={
            focus
              ? `${focus.completedSteps}/${focus.totalSteps} steps in this stage`
              : "We’ll infer this as you complete steps."
          }
        />
        <MetricCard
          label="Recommended Tools"
          value={String(topFocusTools.length)}
          sublabel={
            focus
              ? `Mapped to ${focus.stage.title}`
              : "Based on your overall roadmap."
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
        {/* Left side: Next steps + Coach thread */}
        <div className="space-y-6">
          <SectionCard
            title="Your Next Focus"
            description={
              focus
                ? `We’re prioritizing the “${focus.stage.title}” stage so you’re not juggling five eras of your business at once.`
                : "As you start checking off roadmap steps, we’ll auto-select a focus stage for you."
            }
          >
            {focus && focusSteps && focusSteps.length > 0 ? (
              <div className="space-y-4">
                <p className="text-xs md:text-sm text-slate-300">
                  Start with these next 2–3 moves in{" "}
                  <span className="font-medium text-slate-50">
                    {focus.stage.title}
                  </span>
                  . Completing these will unlock the next tier of complexity
                  without the chaos.
                </p>
                <div className="space-y-3">
                  {focusSteps.map((step, index) => (
                    <div
                      key={step.id}
                      className="rounded-xl border border-slate-700/60 bg-slate-950/70 px-3 py-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-sky-900/60 text-[11px] font-semibold text-sky-100 border border-sky-500/50">
                          {index + 1}
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs md:text-sm font-medium text-slate-50">
                              {step.title}
                            </p>
                            <span className="rounded-full bg-slate-900/90 px-2 py-0.5 text-[10px] text-slate-400">
                              {step.difficulty} · ~{step.estimatedTimeHours}h
                            </span>
                          </div>
                          <p className="text-[11px] md:text-xs text-slate-300 leading-snug">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                Once you’ve started your roadmap, this section will show your
                next 2–3 “no brainer” moves. For now, head to the Business
                Roadmap page and choose a starting step.
              </p>
            )}
          </SectionCard>

          <SectionCard
            title="Coach Thread"
            description="A quick readout of how the Growth Coach is thinking about your situation right now."
          >
            <div className="space-y-3">
              <CoachBubble
                role="coach"
                text={
                  overall.percent === 0
                    ? "Right now, everything is still in draft mode—and that’s okay. The win this week is picking your first foundation step and finishing it, not building Rome."
                    : overall.percent < 40
                    ? "You’ve got early momentum. Let’s keep you in the earlier stages until the basics feel boring—in a good way. Boring is bankable."
                    : overall.percent < 80
                    ? "You’re in mid-game now. The biggest gains come from tightening systems and doubling down on what’s actually working instead of chasing new shiny things."
                    : "You’re approaching endgame on this version of the roadmap. Time to think about leverage: productization, delegation, or building spin-off products."
                }
              />
              {focus && (
                <CoachBubble
                  role="coach"
                  text={`In the “${focus.stage.title}” stage, your job is to deliberately ignore anything that isn’t helping you move those ${focus.totalSteps} steps forward. Everything else is optional; these are mandatory.`}
                />
              )}
              <CoachBubble
                role="founder"
                text="Okay but… what should I actually do *this* week so it feels like progress instead of just vibes?"
              />
              {focus && (
                <CoachBubble
                  role="coach"
                  text={`Pick one of the next steps above, block 90 minutes on your calendar, and do nothing else until it’s finished. No new tools, no new tabs. Then come back and we’ll pick the next move.`}
                />
              )}
            </div>
          </SectionCard>
        </div>

        {/* Right side: Recommended tools */}
        <div className="space-y-6">
          <SectionCard
            title="Recommended Tools"
            description={
              focus
                ? `These tools are especially helpful in the “${focus.stage.title}” stage. Start here instead of wandering the entire stack.`
                : "These are generally useful tools; once you’ve picked a focus stage, we’ll narrow this list automatically."
            }
          >
            {topFocusTools.length === 0 ? (
              <p className="text-sm text-slate-400">
                No tools are mapped to this stage yet. Totally fine—your
                strategy comes first; tools will catch up.
              </p>
            ) : (
              <div className="space-y-3">
                {topFocusTools.map((tool) => (
                  <ToolPill key={tool.id} tool={tool} />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="How to Use This View"
            description="This isn’t a dashboard to stare at—it’s a decision aid. The Growth Coach view should answer two questions: ‘What’s my next move?’ and ‘What should I ignore right now?’"
          >
            <ul className="list-disc pl-5 space-y-2 text-xs md:text-sm text-slate-300">
              <li>Use the roadmap to pick a stage and one concrete step.</li>
              <li>
                Use the tools list to support that *specific* step, not to go
                on a tool binge.
              </li>
              <li>
                If you feel overwhelmed, you’re probably mixing stages. Pull
                back to the earliest incomplete stage.
              </li>
            </ul>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
