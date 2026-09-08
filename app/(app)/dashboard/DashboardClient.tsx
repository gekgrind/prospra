"use client";

import type { User } from "@supabase/supabase-js";
import type { FounderScoreResult } from "@/lib/founder/score-engine";
import type { BusinessHealthIndicator } from "@/lib/business/health";
import type { Goal } from "@/lib/goals";
import type { MomentumSummary } from "@/lib/momentum";
import type { ActionPlan } from "@/lib/action-plans";

import { motion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  computeActionPlanProgress,
  getNextActionableTask,
} from "@/lib/action-plans";
import { FounderScoreRing } from "@/components/dashboard/FounderScoreRing";
import { InteractiveGlowSurface } from "@/components/ui/interactive-glow";

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
  recentMentorSessions: Array<{
    id: string;
    title: string | null;
    updated_at: string | null;
    created_at: string | null;
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
  dashboardAlerts: Array<{
    key: string;
    label: string;
    message: string;
  }>;
  hasFounderScoreInputs: boolean;
  hasBusinessHealthInputs: boolean;
  hasWebsiteAnalysis: boolean;
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

function ShellCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <InteractiveGlowSurface
      className={cn(
        "relative overflow-hidden rounded-[28px] border border-[#4f7ca7]/20 bg-[rgba(10,20,38,0.72)] shadow-[0_20px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00D4FF]/55 to-transparent" />
      {children}
    </InteractiveGlowSurface>
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
    <InteractiveGlowSurface className={className}>
      {children}
    </InteractiveGlowSurface>
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
    <InteractiveCard className="rounded-2xl border border-[#4f7ca7]/15 bg-[rgba(255,255,255,0.03)] p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8fb8d8]">
          {label}
        </p>
        <div className="h-2.5 w-2.5 rounded-full bg-[#00D4FF] shadow-[0_0_18px_rgba(0,212,255,0.8)]" />
      </div>
      <div className="text-3xl font-semibold tracking-tight text-white">{value}</div>
      <p className="mt-2 text-sm leading-6 text-[#c7d8ea]/70">{helper}</p>
    </InteractiveCard>
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

function ActionLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition",
        variant === "primary" &&
          "border border-[#00D4FF]/25 bg-[#0f223d] text-white shadow-[0_0_24px_rgba(0,212,255,0.12)] hover:border-[#00D4FF]/45 hover:bg-[#143055]",
        variant === "secondary" &&
          "border border-white/10 bg-white/5 text-[#dce9f7] hover:bg-white/10"
      )}
    >
      {children}
    </Link>
  );
}

function EmptyGuidanceCard({
  title,
  body,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  title: string;
  body: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <InteractiveCard className="rounded-2xl border border-dashed border-[#4f7ca7]/25 bg-[rgba(255,255,255,0.025)] p-5">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-2 text-sm leading-6 text-[#c7d8ea]/72">{body}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <ActionLink href={primaryHref}>{primaryLabel}</ActionLink>
          {secondaryHref && secondaryLabel ? (
            <ActionLink href={secondaryHref} variant="secondary">
              {secondaryLabel}
            </ActionLink>
          ) : null}
        </div>
      </div>
    </InteractiveCard>
  );
}

function DashboardAlertList({
  alerts,
}: {
  alerts: DashboardClientProps["dashboardAlerts"];
}) {
  if (alerts.length === 0) return null;

  return (
    <div className="mb-8 grid gap-3">
      {alerts.map((alert) => (
        <div
          key={alert.key}
          className="rounded-2xl border border-[#ffe521]/20 bg-[#ffe521]/[0.06] px-4 py-3 text-sm text-[#fff6b0]"
        >
          <span className="font-semibold text-white">{alert.label}: </span>
          {alert.message}
        </div>
      ))}
    </div>
  );
}

function FirstRunGuidance({
  hasFounderScoreInputs,
  hasWebsiteAnalysis,
  hasMentorSessions,
  hasActionPlan,
}: {
  hasFounderScoreInputs: boolean;
  hasWebsiteAnalysis: boolean;
  hasMentorSessions: boolean;
  hasActionPlan: boolean;
}) {
  const items = [
    !hasFounderScoreInputs
      ? {
          title: "Finish your founder profile",
          body: "Add the missing founder inputs so Prospra can personalize your operating score and recommendations.",
          href: "/onboarding",
          label: "Start onboarding",
        }
      : null,
    !hasMentorSessions
      ? {
          title: "Open your first Mentor session",
          body: "Bring one current decision, blocker, or growth question and turn it into a clearer next move.",
          href: "/mentor",
          label: "Talk to AI Mentor",
        }
      : null,
    !hasWebsiteAnalysis
      ? {
          title: "Run your first Site Strategist scan",
          body: "Analyze your website so the dashboard can reflect real conversion and clarity signals.",
          href: "/site-strategist/website-coach",
          label: "Run Site Strategist",
        }
      : null,
    !hasActionPlan
      ? {
          title: "Create an execution lane",
          body: "Use Mentor to turn your current priority into a concrete action plan with next steps.",
          href: "/mentor?intent=action-plan",
          label: "Create an Action Plan",
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (items.length === 0) return null;

  return (
    <ShellCard className="mb-8 p-6 md:p-7">
      <SectionHeader
        eyebrow="Launch Setup"
        title="Complete your operating baseline"
        description="These first moves give Prospra enough context to make the dashboard useful instead of decorative."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <InteractiveCard
            key={item.title}
            className="rounded-2xl border border-[#4f7ca7]/15 bg-[rgba(255,255,255,0.03)] p-5"
          >
            <p className="text-sm font-semibold text-white">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-[#c7d8ea]/72">
              {item.body}
            </p>
            <div className="mt-4">
              <ActionLink href={item.href}>{item.label}</ActionLink>
            </div>
          </InteractiveCard>
        ))}
      </div>
    </ShellCard>
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
  recentMentorSessions,
  founderScore,
  businessHealth,
  goals,
  momentum,
  latestActionPlan,
  usageSnapshot,
  dashboardAlerts,
  hasFounderScoreInputs,
  hasBusinessHealthInputs,
  hasWebsiteAnalysis,
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
  const hasActionPlan = Boolean(latestActionPlan && rawTasks.length > 0);
  const hasMentorSessions = recentMentorSessions.length > 0;

  return (
    <div className="relative text-white">
      <div className="relative mx-auto max-w-7xl">
        <DashboardAlertList alerts={dashboardAlerts} />

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
                    href="/mentor"
                    className="inline-flex items-center justify-center rounded-full border border-[#00D4FF]/25 bg-[#0f223d] px-5 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(0,212,255,0.12)] transition hover:border-[#00D4FF]/45 hover:bg-[#143055]"
                  >
                    Talk to AI Mentor
                  </Link>

                  <Link
                    href="/site-strategist/website-coach"
                    className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-[#dce9f7] transition hover:bg-white/10"
                  >
                    Run Site Strategist
                  </Link>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <MetricPanel
                  label="Founder Score"
                  value={hasFounderScoreInputs ? `${founderScore.totalScore}` : "Setup"}
                  helper={
                    hasFounderScoreInputs
                      ? `${founderTier} - Your current founder operating score.`
                      : "Add your founder inputs to unlock a real baseline."
                  }
                />
                <MetricPanel
                  label="Mentor Sessions"
                  value={`${recentMentorSessions.length}`}
                  helper={
                    hasMentorSessions
                      ? "Recent mentor context is available for your dashboard."
                      : "No sessions yet. Start with one focused question."
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

        <FirstRunGuidance
          hasFounderScoreInputs={hasFounderScoreInputs}
          hasWebsiteAnalysis={hasWebsiteAnalysis}
          hasMentorSessions={hasMentorSessions}
          hasActionPlan={hasActionPlan}
        />

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

                    {hasFounderScoreInputs ? (
                      <>
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
                      </>
                    ) : (
                      <EmptyGuidanceCard
                        title="Founder score inputs are missing"
                        body="Your dashboard is using a neutral placeholder until the core founder inputs are complete. Finish onboarding to make this score meaningful."
                        primaryHref="/onboarding"
                        primaryLabel="Start onboarding"
                        secondaryHref="/mentor"
                        secondaryLabel="Ask Mentor where to start"
                      />
                    )}
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

                {hasBusinessHealthInputs ? (
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
                                "border border-[#ffe521]/20 bg-[#ffe521]/10 text-[#fff6b0]",
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
                ) : (
                  <EmptyGuidanceCard
                    title="Business signals are not connected yet"
                    body="Run a website analysis or complete the founder inputs so this section can reflect real traffic, funnel, and momentum signals."
                    primaryHref="/site-strategist/website-coach"
                    primaryLabel="Run Site Strategist"
                    secondaryHref="/onboarding"
                    secondaryLabel="Start onboarding"
                  />
                )}
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
                  <EmptyGuidanceCard
                    title="No activity goals yet"
                    body="Create one clear action plan before adding more metrics. The dashboard will become sharper once there is a real execution lane to track."
                    primaryHref="/mentor?intent=action-plan"
                    primaryLabel="Create an Action Plan"
                    secondaryHref="/mentor"
                    secondaryLabel="Talk to AI Mentor"
                  />
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
                  href="/mentor?intent=weekly-review"
                  className="inline-flex items-center justify-center rounded-full border border-[#00D4FF]/25 bg-[#0f223d] px-5 py-3 text-sm font-semibold text-white transition hover:border-[#00D4FF]/45 hover:bg-[#143055]"
                >
                  Generate Weekly Review
                </Link>
              </ShellCard>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.09, duration: 0.35 }}
            >
              <ShellCard className="p-6">
                <SectionHeader
                  eyebrow="Website Analysis"
                  title="Site Strategist signal"
                  description="Website clarity and conversion signals will show here after your first analysis."
                />

                {!hasWebsiteAnalysis ? (
                  <EmptyGuidanceCard
                    title="No website analysis yet"
                    body="Run Site Strategist once to replace generic website guidance with a real score and practical next actions."
                    primaryHref="/site-strategist/website-coach"
                    primaryLabel="Run Site Strategist"
                  />
                ) : (
                  <InteractiveCard className="rounded-2xl border border-[#4f7ca7]/15 bg-[rgba(255,255,255,0.03)] p-5">
                    <p className="text-sm font-semibold text-white">
                      Website analysis is connected.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#c7d8ea]/72">
                      Keep your site signals current as offers, pages, and calls to
                      action change.
                    </p>
                    <div className="mt-4">
                      <ActionLink href="/site-strategist/website-coach" variant="secondary">
                        Run another analysis
                      </ActionLink>
                    </div>
                  </InteractiveCard>
                )}
              </ShellCard>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.07, duration: 0.35 }}
            >
              <ShellCard className="p-6">
                <SectionHeader
                  eyebrow="Mentor Sessions"
                  title="Recent guidance"
                  description="Your last Mentor conversations will appear here once Prospra has context to carry forward."
                />

                {!hasMentorSessions ? (
                  <EmptyGuidanceCard
                    title="No mentor sessions yet"
                    body="Start with the decision or blocker that is taking up the most mental space. Prospra will keep the thread ready for follow-through."
                    primaryHref="/mentor"
                    primaryLabel="Talk to AI Mentor"
                  />
                ) : (
                  <div className="space-y-4">
                    {recentMentorSessions.map((session, idx) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + idx * 0.04, duration: 0.25 }}
                      >
                        <Link href={`/mentor?conversation=${session.id}`}>
                          <InteractiveCard className="rounded-2xl border border-[#4f7ca7]/15 bg-[rgba(255,255,255,0.03)] p-4 transition hover:border-[#00D4FF]/25">
                            <p className="text-sm font-semibold text-white">
                              {session.title?.trim() || "Untitled mentor session"}
                            </p>
                            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8fb8d8]">
                              {session.updated_at || session.created_at
                                ? new Date(
                                    session.updated_at ?? session.created_at ?? ""
                                  ).toLocaleDateString()
                                : "Recent"}
                            </p>
                          </InteractiveCard>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                )}
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
                  <EmptyGuidanceCard
                    title="No action plan yet"
                    body="Ask Mentor to turn your current priority into a short execution plan. Once tasks exist, progress and next steps will appear here."
                    primaryHref="/mentor?intent=action-plan"
                    primaryLabel="Create an Action Plan"
                    secondaryHref="/dashboard/action-plans"
                    secondaryLabel="Open Action Plans"
                  />
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
                  <EmptyGuidanceCard
                    title="No activity yet"
                    body="Your recent founder notes and activity will appear here after your first session or execution check-in."
                    primaryHref="/mentor"
                    primaryLabel="Talk to AI Mentor"
                    secondaryHref="/site-strategist/website-coach"
                    secondaryLabel="Run Site Strategist"
                  />
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
