"use client";

import { useId, type ReactNode } from "react";
import { AlertCircle, Check, ChevronDown, RefreshCcw } from "lucide-react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { MentorState } from "@/lib/mentor/presence";

import { MentorAvatar } from "./MentorFigure";

export type ConversationOutputs = {
  summary: string;
  insights: string[];
  action_plan: string[];
  recommended_priority: string;
  risk_or_blocker: string;
  updated_at: string;
};

export type ActionPlanTaskStatus = "pending" | "in_progress" | "completed";

export type ActionPlanTask = {
  id: string;
  title: string;
  status: ActionPlanTaskStatus;
  updated_at?: string | null;
};

export type ActionPlan = { id: string; tasks: ActionPlanTask[] };

const STATUS_OPTIONS: Array<{ value: ActionPlanTaskStatus; label: string }> = [
  { value: "pending", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Done" },
];

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#8fb3cf]/80">
      {children}
    </p>
  );
}

export type MentorInsightsPanelProps = {
  outputs: ConversationOutputs | null;
  isLoadingOutputs: boolean;
  outputsError: string | null;
  isGenerating: boolean;
  onGenerate: () => void;
  generateDisabled: boolean;
  actionPlan: ActionPlan | null;
  actionPlanError: string | null;
  updatingTaskId: string | null;
  onUpdateTask: (task: ActionPlanTask, status: ActionPlanTaskStatus) => void;
  /** Mentor pose for this surface: recommendation at rest, analyzing/success when relevant. */
  presenceState: MentorState;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MentorInsightsPanel({
  outputs,
  isLoadingOutputs,
  outputsError,
  isGenerating,
  onGenerate,
  generateDisabled,
  actionPlan,
  actionPlanError,
  updatingTaskId,
  onUpdateTask,
  presenceState,
  open,
  onOpenChange,
}: MentorInsightsPanelProps) {
  const contentId = useId();
  const tasks = actionPlan?.tasks ?? [];
  const completed = tasks.filter((task) => task.status === "completed").length;
  const percentage = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  const meta = isGenerating
    ? "Reading this conversation…"
    : tasks.length > 0
      ? `${completed} of ${tasks.length} steps done`
      : outputs
        ? "Summary ready"
        : "Turn this thread into next steps";

  return (
    <section
      aria-label="Insights and action plan"
      className="mb-8 overflow-hidden rounded-2xl border border-white/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.012)_100%)]"
    >
      <div className="flex items-center gap-3 px-3.5 py-2.5 sm:px-4">
        <button
          type="button"
          onClick={() => onOpenChange(!open)}
          aria-expanded={open}
          aria-controls={open ? contentId : undefined}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4ff]/50"
        >
          <MentorAvatar state={presenceState} size={30} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-medium text-[#eef6ff]">
              Insights &amp; action plan
            </span>
            <span className="block truncate text-[12px] text-[#94adc2]">{meta}</span>
          </span>
          {tasks.length > 0 && (
            <span className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-white/[0.08] sm:block" aria-hidden="true">
              <span
                className="block h-full rounded-full bg-[#00d4ff] transition-[width] duration-500"
                style={{ width: `${percentage}%` }}
              />
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-[#8fb3cf] transition-transform duration-300",
              open && "rotate-180"
            )}
          />
        </button>

        <button
          type="button"
          onClick={onGenerate}
          disabled={generateDisabled}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#00d4ff]/30 bg-[#00d4ff]/[0.08] px-3 py-1.5 text-[12.5px] font-medium text-[#bff3ff] transition hover:bg-[#00d4ff]/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4ff]/50 disabled:opacity-50"
        >
          <RefreshCcw className={cn("h-3.5 w-3.5", isGenerating && "motion-safe:animate-spin")} />
          {isGenerating ? "Generating…" : outputs ? "Regenerate" : "Generate"}
        </button>
      </div>

      {open && (
        <div
          id={contentId}
          className="space-y-5 border-t border-white/[0.06] px-4 py-4 sm:px-5 motion-safe:animate-[mentor-rise_0.3s_ease-out_both]"
        >
          {isLoadingOutputs ? (
            <div className="space-y-2">
              <Skeleton className="h-3 w-20 bg-white/[0.07]" />
              <Skeleton className="h-4 w-full bg-white/[0.06]" />
              <Skeleton className="h-4 w-4/5 bg-white/[0.05]" />
            </div>
          ) : outputsError ? (
            <div className="flex items-start gap-2 rounded-xl border border-[#ff8a7a]/25 bg-[#ff6b5a]/[0.06] p-3 text-[13px] text-[#ffd9d3]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{outputsError}</p>
            </div>
          ) : !outputs ? (
            <p className="text-[13.5px] leading-relaxed text-[#a9bfd3]">
              No insights yet. Generate a concise readout when this thread has enough
              signal to turn into next steps.
            </p>
          ) : (
            <>
              <div>
                <SectionLabel>Summary</SectionLabel>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[#e2eef9]">{outputs.summary}</p>
              </div>

              {outputs.insights.length > 0 && (
                <div>
                  <SectionLabel>Key insights</SectionLabel>
                  <ul className="mt-2 space-y-1.5 pl-5 text-[14px] leading-relaxed text-[#d9e7f4] marker:text-[#00d4ff]/70 [list-style-type:disc]">
                    {outputs.insights.map((item, index) => (
                      <li key={`insight-${index}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3">
                  <SectionLabel>This week&apos;s priority</SectionLabel>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#e2eef9]">
                    {outputs.recommended_priority}
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3">
                  <SectionLabel>Risk to watch</SectionLabel>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#e2eef9]">
                    {outputs.risk_or_blocker}
                  </p>
                </div>
              </div>

              {outputs.action_plan.length > 0 && (
                <div>
                  <SectionLabel>Recommended plan</SectionLabel>
                  <ol className="mt-2 space-y-1.5 pl-5 text-[14px] leading-relaxed text-[#d9e7f4] marker:text-[#8fc9e6] [list-style-type:decimal]">
                    {outputs.action_plan.map((step, index) => (
                      <li key={`action-${index}`}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}

          {tasks.length > 0 && (
            <div>
              <div className="flex items-center justify-between gap-3">
                <SectionLabel>Action plan progress</SectionLabel>
                <p className="text-[12px] tabular-nums text-[#94adc2]">
                  {completed}/{tasks.length} complete · {percentage}%
                </p>
              </div>
              <ul className="mt-2.5 space-y-1.5">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <p
                      className={cn(
                        "flex min-w-0 items-start gap-2 text-[13.5px] leading-snug",
                        task.status === "completed" ? "text-[#8fa7bb] line-through decoration-white/25" : "text-[#e2eef9]"
                      )}
                    >
                      {task.status === "completed" && (
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#00d4ff]" />
                      )}
                      {task.title}
                    </p>
                    <div
                      role="group"
                      aria-label={`Status for ${task.title}`}
                      className="flex shrink-0 rounded-full border border-white/[0.08] bg-black/20 p-0.5"
                    >
                      {STATUS_OPTIONS.map((option) => {
                        const selected = task.status === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            aria-pressed={selected}
                            disabled={Boolean(updatingTaskId) || selected}
                            onClick={() => onUpdateTask(task, option.value)}
                            className={cn(
                              "rounded-full px-2.5 py-1 text-[11.5px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4ff]/50",
                              selected
                                ? "bg-[#00d4ff]/15 text-[#bff3ff]"
                                : "text-[#94adc2] hover:text-white disabled:opacity-50"
                            )}
                          >
                            {updatingTaskId === task.id && !selected ? "…" : option.label}
                          </button>
                        );
                      })}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {actionPlanError && (
            <p role="status" className="text-[12px] text-[#ffb4a8]">
              {actionPlanError}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
