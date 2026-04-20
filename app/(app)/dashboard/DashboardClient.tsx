"use client";

import type { User } from "@supabase/supabase-js";
import type { FounderScoreResult } from "@/lib/founder/score-engine";
import type { BusinessHealthIndicator } from "@/lib/business/health";
import type { Goal } from "@/lib/goals";
import type { MomentumSummary } from "@/lib/momentum";
import type { ActionPlan } from "@/lib/action-plans";

import { motion } from "framer-motion";
import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";

import {
  computeActionPlanProgress,
  getNextActionableTask,
} from "@/lib/action-plans";
import { FounderScoreRing } from "@/components/dashboard/FounderScoreRing";

interface DashboardClientProps {
  user: User;
  profile: {
    full_name?: string | null;
  } | null;
  recentEntries: Array<{
    id: string;
    entry_date: string;
    content?: string | null;
    entry_text?: string | null;
  }>;
  founderScore: FounderScoreResult;
  businessHealth: BusinessHealthIndicator[];
  goals: Goal[];
  momentum: MomentumSummary;
  latestActionPlan: ActionPlan | null;
  usageSnapshot: {
    plan: "free" | "premium";
    limits: { mentor_message: number | null; board_review: number | null };
    usage: { mentor_message: number; board_review: number };
  };
}

type ProgressTasksInput = Parameters<typeof computeActionPlanProgress>[0];
type NextTaskInput = Parameters<typeof getNextActionableTask>[0];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatLabel(key: string) {
  const normalized = key.toLowerCase().replace(/[^a-z]/g, "");

  if (normalized === "marketreadiness") {
    return (
      <>
        MARKET-
        <br />
        READINESS
      </>
    );
  }

  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toUpperCase();
}

function applyInteractiveMotion(event: MouseEvent<HTMLDivElement>) {
  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();

  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const px = x / rect.width;
  const py = y / rect.height;

  const centerX = px - 0.5;
  const centerY = py - 0.5;

  const rotateY = centerX * 10;
  const rotateX = centerY * -10;

  const moveX = centerX * 18;
  const moveY = centerY * 18;

  card.style.setProperty("--mouse-x", `${px * 100}%`);
  card.style.setProperty("--mouse-y", `${py * 100}%`);
  card.style.setProperty("--rotate-x", `${rotateX}deg`);
  card.style.setProperty("--rotate-y", `${rotateY}deg`);
  card.style.setProperty("--move-x", `${moveX}px`);
  card.style.setProperty("--move-y", `${moveY}px`);
  card.style.setProperty("--glow-opacity", "1");
  card.style.setProperty("--ripple-x", `${px * 100}%`);
  card.style.setProperty("--ripple-y", `${py * 100}%`);
}

function handleInteractiveEnter(event: MouseEvent<HTMLDivElement>) {
  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();

  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const px = (x / rect.width) * 100;
  const py = (y / rect.height) * 100;

  card.style.setProperty("--mouse-x", `${px}%`);
  card.style.setProperty("--mouse-y", `${py}%`);
  card.style.setProperty("--ripple-x", `${px}%`);
  card.style.setProperty("--ripple-y", `${py}%`);
  card.style.setProperty("--glow-opacity", "1");
  card.style.setProperty("--ripple-opacity", "0.9");
  card.style.setProperty("--ripple-size", "0");

  requestAnimationFrame(() => {
    card.style.setProperty("--ripple-size", "220");
  });
}

function handleInteractiveLeave(event: MouseEvent<HTMLDivElement>) {
  const card = event.currentTarget;

  card.style.setProperty("--rotate-x", "0deg");
  card.style.setProperty("--rotate-y", "0deg");
  card.style.setProperty("--move-x", "0px");
  card.style.setProperty("--move-y", "0px");
  card.style.setProperty("--glow-opacity", "0");
  card.style.setProperty("--ripple-opacity", "0");
  card.style.setProperty("--ripple-size", "0");
}

function handleInteractiveClick(event: MouseEvent<HTMLDivElement>) {
  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();

  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;

  card.style.setProperty("--ripple-x", `${x}%`);
  card.style.setProperty("--ripple-y", `${y}%`);
  card.style.setProperty("--ripple-opacity", "1");
  card.style.setProperty("--ripple-size", "0");

  requestAnimationFrame(() => {
    card.style.setProperty("--ripple-size", "320");
  });

  window.setTimeout(() => {
    card.style.setProperty("--ripple-opacity", "0");
  }, 260);
}

const interactiveCardHandlers = {
  onMouseMove: applyInteractiveMotion,
  onMouseEnter: handleInteractiveEnter,
  onMouseLeave: handleInteractiveLeave,
  onClick: handleInteractiveClick,
};

function ShellCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      {...interactiveCardHandlers}
      className={cn(
        "interactive-card relative overflow-hidden rounded-[28px] border border-[#4f7ca7]/20 bg-[rgba(10,20,38,0.72)] shadow-[0_20px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00D4FF]/55 to-transparent" />
      {children}
    </div>
  );
}

function InteractiveCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div {...interactiveCardHandlers} className={cn("interactive-card", className)}>
      {children}
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5">
      {eyebrow ? (
        <div className="mb-3 inline-flex items-center rounded-full border border-[#00D4FF]/20 bg-[#00D4FF]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#00D4FF]">
          {eyebrow}
        </div>
      ) : null}
      <h2 className="text-xl font-semibold tracking-tight text-white md:text-2xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#c7d8ea]/72">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function MetricPanel({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <ShellCard className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8fb8d8]">
          {label}
        </p>
        <div className="h-2.5 w-2.5 rounded-full bg-[#00D4FF] shadow-[0_0_18px_rgba(0,212,255,0.8)]" />
      </div>
      <div className="text-3xl font-semibold tracking-tight text-white">{value}</div>
      <p className="mt-2 text-sm leading-6 text-[#c7d8ea]/70">{helper}</p>
    </ShellCard>
  );
}

function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className="mt-3 h-3 overflow-hidden rounded-full border border-white/5 bg-[#07111f]">
      <motion.div
        className="h-full rounded-full bg-[linear-gradient(90deg,#00D4FF_0%,#4f7ca7_100%)] shadow-[0_0_18px_rgba(0,212,255,0.22)]"
        initial={{ width: 0 }}
        animate={{ width: `${safeValue}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </div>
  );
}

function UsageTile({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number | null;
}) {
  const percentage =
    limit && limit > 0 ? Math.min((used / limit) * 100, 100) : used > 0 ? 100 : 0;

  return (
    <InteractiveCard className="rounded-2xl border border-[#4f7ca7]/15 bg-[rgba(255,255,255,0.03)] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8fb8d8]">
        {label}
      </p>
      <p className="mt-2 text-sm text-[#dce9f7]">
        {used}
        {limit === null ? " used (unlimited)" : ` of ${limit} used`}
      </p>
      {limit !== null ? <ProgressBar value={percentage} /> : null}
    </InteractiveCard>
  );
}

function MomentumCard({ momentum }: { momentum: MomentumSummary }) {
  const summary =
    typeof momentum === "object" &&
    momentum !== null &&
    "summary" in momentum &&
    typeof (momentum as { summary?: unknown }).summary === "string"
      ? (momentum as { summary: string }).summary
      : "Your momentum snapshot will appear here as you build consistency.";

  return (
    <ShellCard className="p-6 md:p-7">
      <SectionHeader
        eyebrow="Momentum"
        title="Your current operating rhythm"
        description="A quick read on consistency, traction, and whether your founder energy is compounding or getting eaten by chaos."
      />
      <p className="text-sm leading-7 text-[#d7e5f4]/78">{summary}</p>
    </ShellCard>
  );
}

export default function DashboardClient({
  user,
  profile,
  recentEntries,
  founderScore,
  businessHealth,
  goals,
  momentum,
  latestActionPlan,
  usageSnapshot,
}: DashboardClientProps) {
  const rawTasks = Array.isArray(latestActionPlan?.tasks) ? latestActionPlan.tasks : [];

  const progressTasks = rawTasks as ProgressTasksInput;
  const nextTaskTasks = rawTasks as NextTaskInput;

  const planProgress =
    progressTasks.length > 0
      ? computeActionPlanProgress(progressTasks)
      : { completed: 0, total: 0, percentage: 0 };

  const nextTask =
    nextTaskTasks.length > 0 ? getNextActionableTask(nextTaskTasks) : null;

  const displayName =
    typeof profile?.full_name === "string" && profile.full_name.trim().length > 0
      ? profile.full_name.trim()
      : user.email ?? "Founder";

  const firstName = displayName.split(" ")[0] ?? displayName;

  const founderTier =
    typeof founderScore?.tier === "string" && founderScore.tier.trim().length > 0
      ? founderScore.tier
      : "In Motion";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07111f] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(79,124,167,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(79,124,167,0.16)_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,212,255,0.14),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(79,124,167,0.16),transparent_28%),linear-gradient(180deg,rgba(7,17,31,0.82)_0%,rgba(7,17,31,0.98)_100%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-8 md:px-8 md:py-10">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mb-8"
        >
          <ShellCard className="p-6 md:p-8">
            <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
              <div>
                <div className="mb-4 inline-flex items-center rounded-full border border-[#00D4FF]/20 bg-[#00D4FF]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#00D4FF]">
                  Founder Control Center
                </div>

                <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-white md:text-5xl">
                  Welcome back, {firstName}.
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#c7d8ea]/78 md:text-base">
                  Here’s your live blueprint for what matters now: momentum, goals,
                  business health, and the next move that actually deserves your energy.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/dashboard/weekly-review"
                    className="inline-flex items-center justify-center rounded-full border border-[#00D4FF]/25 bg-[#0f223d] px-5 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(0,212,255,0.12)] transition hover:border-[#00D4FF]/45 hover:bg-[#143055]"
                  >
                    Open Weekly Review
                  </Link>

                  <Link
                    href="/dashboard/action-plans"
                    className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-[#dce9f7] transition hover:bg-white/10"
                  >
                    View Action Plans
                  </Link>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <MetricPanel
                  label="Founder Score"
                  value={`${founderScore.totalScore}`}
                  helper={`${founderTier} • Your current founder operating score.`}
                />
                <MetricPanel
                  label="Active Goals"
                  value={`${goals.length}`}
                  helper={
                    goals.length > 0
                      ? "Track what’s in motion and keep momentum visible."
                      : "No goals set yet. Time to give Future You a map."
                  }
                />
              </div>
            </div>
          </ShellCard>
        </motion.section>

        <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricPanel
            label="Plan"
            value={usageSnapshot.plan === "premium" ? "Premium" : "Free"}
            helper="Your current subscription tier and usage window."
          />
          <MetricPanel
            label="Mentor Messages"
            value={
              usageSnapshot.limits.mentor_message === null
                ? `${usageSnapshot.usage.mentor_message}`
                : `${usageSnapshot.usage.mentor_message}/${usageSnapshot.limits.mentor_message}`
            }
            helper="Monthly mentor conversation usage."
          />
          <MetricPanel
            label="Board Reviews"
            value={
              usageSnapshot.limits.board_review === null
                ? `${usageSnapshot.usage.board_review}`
                : `${usageSnapshot.usage.board_review}/${usageSnapshot.limits.board_review}`
            }
            helper="Strategic review usage across your workspace."
          />
          <MetricPanel
            label="Action Plan Progress"
            value={`${planProgress.percentage}%`}
            helper={
              planProgress.total > 0
                ? `${planProgress.completed} of ${planProgress.total} tasks completed.`
                : "No active plan yet."
            }
          />
        </section>

        <section className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.35 }}
            >
              <ShellCard className="p-6 md:p-8">
                <div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:items-center">
                  <div className="flex flex-col items-center justify-center">
                    <FounderScoreRing
                      score={founderScore.totalScore}
                      tier={founderTier}
                    />
                  </div>

                  <div>
                    <SectionHeader
                      eyebrow="Founder Profile"
                      title="How you’re showing up as a founder"
                      description="A synthesized read on your current operating mode, strengths, and where to focus next."
                    />

                    <p className="text-sm leading-7 text-[#d7e5f4]/78">
                      {founderScore.summary}
                    </p>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {Object.entries(founderScore.subscores).map(([key, value]) => (
                        <InteractiveCard
                          key={key}
                          className="rounded-2xl border border-[#4f7ca7]/15 bg-[rgba(255,255,255,0.03)] px-4 py-4"
                        >
                          <p className="text-[8px] font-semibold uppercase leading-tight tracking-[0.12em] text-[#8fb8d8] whitespace-normal">
                            {formatLabel(key)}
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
                        </InteractiveCard>
                      ))}
                    </div>
                  </div>
                </div>
              </ShellCard>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.35 }}
            >
              <MomentumCard momentum={momentum} />
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.35 }}
            >
              <ShellCard className="p-6 md:p-7">
                <SectionHeader
                  eyebrow="Business Health"
                  title="Your operating signals"
                  description="A high-level scan of the areas that are strong, shaky, or quietly begging for attention."
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {businessHealth.map((metric, index) => (
                    <motion.div
                      key={metric.key}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12 + index * 0.05, duration: 0.28 }}
                    >
                      <InteractiveCard className="relative overflow-hidden rounded-2xl border border-[#4f7ca7]/15 bg-[rgba(255,255,255,0.03)] p-5">
                        <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(0,212,255,0.18),transparent_65%)] blur-xl" />

                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8fb8d8]">
                          {metric.label}
                        </p>

                        <p className="mt-3 text-4xl font-semibold tracking-tight text-white">
                          {metric.score}
                        </p>

                        <div className="mt-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                              metric.status === "high" &&
                                "border border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
                              metric.status === "medium" &&
                                "border border-amber-400/20 bg-amber-400/10 text-amber-300",
                              metric.status === "low" &&
                                "border border-rose-400/20 bg-rose-400/10 text-rose-300"
                            )}
                          >
                            {metric.status}
                          </span>
                        </div>

                        <p className="mt-4 text-sm leading-6 text-[#c7d8ea]/72">
                          {metric.description}
                        </p>
                      </InteractiveCard>
                    </motion.div>
                  ))}
                </div>
              </ShellCard>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.35 }}
            >
              <ShellCard className="p-6 md:p-7">
                <SectionHeader
                  eyebrow="Goals"
                  title="What you’re building toward"
                  description="Keep your key outcomes visible so progress doesn’t turn into a scavenger hunt."
                />

                {goals.length === 0 ? (
                  <InteractiveCard className="rounded-2xl border border-dashed border-[#4f7ca7]/20 bg-[rgba(255,255,255,0.02)] p-6 text-sm text-[#c7d8ea]/70">
                    No goals yet. Add one and let the dashboard start behaving like your second brain instead of a polite wall.
                  </InteractiveCard>
                ) : (
                  <div className="space-y-4">
                    {goals.map((goal, idx) => {
                      const currentValue =
                        typeof goal.current_value === "number" ? goal.current_value : 0;
                      const targetValue =
                        typeof goal.target_value === "number" ? goal.target_value : 0;

                      const progress =
                        targetValue > 0
                          ? Math.min((currentValue / targetValue) * 100, 100)
                          : 0;

                      return (
                        <motion.div
                          key={goal.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.14 + idx * 0.04, duration: 0.25 }}
                        >
                          <InteractiveCard className="rounded-2xl border border-[#4f7ca7]/15 bg-[rgba(255,255,255,0.03)] p-5">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <p className="text-lg font-semibold text-white">{goal.label}</p>
                              <p className="text-sm text-[#d7e5f4]/74">
                                {currentValue} / {targetValue}
                              </p>
                            </div>

                            <ProgressBar value={progress} />

                            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#8fb8d8]">
                              {progress.toFixed(0)}% complete
                            </p>
                          </InteractiveCard>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </ShellCard>
            </motion.section>
          </div>

          <div className="space-y-8">
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06, duration: 0.35 }}
            >
              <ShellCard className="p-6">
                <SectionHeader
                  eyebrow="Weekly Rhythm"
                  title="Run the week on purpose"
                  description="Review wins, unfinished priorities, blockers, and the next focus before the week starts freestyling."
                />

                <Link
                  href="/dashboard/weekly-review"
                  className="inline-flex items-center justify-center rounded-full border border-[#00D4FF]/25 bg-[#0f223d] px-5 py-3 text-sm font-semibold text-white transition hover:border-[#00D4FF]/45 hover:bg-[#143055]"
                >
                  Generate Weekly Review
                </Link>
              </ShellCard>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.35 }}
            >
              <ShellCard className="p-6">
                <SectionHeader
                  eyebrow="Usage"
                  title="Plan and capacity"
                  description="A clean read on what you’ve used and what runway you still have this month."
                />

                <div className="grid gap-4">
                  <UsageTile
                    label="Mentor Messages"
                    used={usageSnapshot.usage.mentor_message}
                    limit={usageSnapshot.limits.mentor_message}
                  />
                  <UsageTile
                    label="Board Reviews"
                    used={usageSnapshot.usage.board_review}
                    limit={usageSnapshot.limits.board_review}
                  />
                </div>
              </ShellCard>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.35 }}
            >
              <ShellCard className="p-6">
                <SectionHeader
                  eyebrow="Action Plan"
                  title="Current execution lane"
                  description="The next move should be obvious, not buried under six tabs and a panic spiral."
                />

                {!latestActionPlan || rawTasks.length === 0 ? (
                  <InteractiveCard className="rounded-2xl border border-dashed border-[#4f7ca7]/20 bg-[rgba(255,255,255,0.02)] p-5 text-sm leading-6 text-[#c7d8ea]/72">
                    No active action plan yet. Ask your mentor for a step-by-step action plan to turn ideas into actual motion.
                  </InteractiveCard>
                ) : (
                  <InteractiveCard className="rounded-2xl border border-[#4f7ca7]/15 bg-[rgba(255,255,255,0.03)] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-lg font-semibold text-white">
                        {planProgress.completed}/{planProgress.total} tasks completed
                      </p>
                      <p className="text-sm text-[#d7e5f4]/70">
                        {planProgress.percentage}%
                      </p>
                    </div>

                    <ProgressBar value={planProgress.percentage} />

                    {nextTask ? (
                      <div className="mt-4 rounded-2xl border border-[#00D4FF]/15 bg-[#00D4FF]/6 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#00D4FF]">
                          Next Step
                        </p>
                        <p className="mt-2 text-sm text-white">{nextTask.title}</p>
                      </div>
                    ) : null}
                  </InteractiveCard>
                )}
              </ShellCard>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.35 }}
            >
              <ShellCard className="p-6">
                <SectionHeader
                  eyebrow="Journal"
                  title="Recent founder notes"
                  description="Your latest thoughts, captured before they evaporate into the entrepreneurial void."
                />

                {recentEntries.length === 0 ? (
                  <InteractiveCard className="rounded-2xl border border-dashed border-[#4f7ca7]/20 bg-[rgba(255,255,255,0.02)] p-5 text-sm text-[#c7d8ea]/70">
                    No entries yet.
                  </InteractiveCard>
                ) : (
                  <div className="space-y-4">
                    {recentEntries.map((entry, idx) => {
                      const entryContent = entry.content ?? entry.entry_text ?? "No text available.";

                      return (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.14 + idx * 0.04, duration: 0.25 }}
                        >
                          <InteractiveCard className="rounded-2xl border border-[#4f7ca7]/15 bg-[rgba(255,255,255,0.03)] p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8fb8d8]">
                              {new Date(entry.entry_date).toLocaleDateString()}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-[#d7e5f4]/76">
                              {entryContent}
                            </p>
                          </InteractiveCard>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </ShellCard>
            </motion.section>
          </div>
        </section>
      </div>
    </div>
  );
}