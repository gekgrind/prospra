import type { Goal } from "@/lib/goals";

export type MomentumState =
  | "no_plan_yet"
  | "not_started"
  | "in_motion"
  | "stalled"
  | "blocked"
  | "completed_recently";

export type MomentumCtaKind =
  | "generate_plan"
  | "start_first_step"
  | "continue_plan"
  | "resume_stalled"
  | "unblock_with_mentor"
  | "open_mentor"
  | "review_next_lever";

export interface MomentumSignals {
  hasPlan: boolean;
  totalGoals: number;
  completedGoals: number;
  startedGoals: number;
  activeGoals: number;
  hasRecentChallenges: boolean;
  lastGoalActivityAt: string | null;
  lastJournalActivityAt: string | null;
  lastConversationAt: string | null;
  daysSinceMeaningfulActivity: number | null;
  conversationWithoutFollowThrough: boolean;
}

export interface MomentumRecommendation {
  title: string;
  detail: string;
  ctaLabel: string;
  ctaHref: string;
  ctaKind: MomentumCtaKind;
  relatedGoalId?: string;
}

export interface MomentumSummary {
  state: MomentumState;
  signals: MomentumSignals;
  recommendation: MomentumRecommendation;
  nudgeTitle: string;
  nudgeBody: string;
}

type JournalLike = {
  entry_date?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  challenges?: string | null;
};

type ConversationLike = {
  updated_at?: string | null;
  created_at?: string | null;
};

const STALE_ACTIVITY_DAYS = 7;
const BLOCKED_ACTIVITY_DAYS = 10;
const COMPLETED_RECENT_DAYS = 4;

function parseDate(date?: string | null): Date | null {
  if (!date) return null;
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toIso(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

function latestDate(values: Array<string | null | undefined>): Date | null {
  const parsed = values
    .map((value) => parseDate(value))
    .filter((value): value is Date => Boolean(value));

  if (!parsed.length) return null;

  parsed.sort((a, b) => b.getTime() - a.getTime());
  return parsed[0];
}

function daysSince(from: Date | null, now: Date): number | null {
  if (!from) return null;
  const diffMs = now.getTime() - from.getTime();
  if (diffMs < 0) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function computeMomentumSummary({
  goals,
  journalEntries,
  latestConversation,
  now = new Date(),
}: {
  goals: Goal[];
  journalEntries: JournalLike[];
  latestConversation: ConversationLike | null;
  now?: Date;
}): MomentumSummary {
  const totalGoals = goals.length;
  const hasPlan = totalGoals > 0;

  const completedGoals = goals.filter(
    (goal) => goal.target_value > 0 && goal.current_value >= goal.target_value
  ).length;
  const startedGoals = goals.filter((goal) => goal.current_value > 0).length;
  const activeGoals = goals.filter(
    (goal) => goal.current_value > 0 && goal.target_value > goal.current_value
  ).length;

  const goalActivity = latestDate(
    goals.flatMap((goal) => [goal.updated_at, goal.created_at])
  );
  const journalActivity = latestDate(
    journalEntries.flatMap((entry) => [entry.updated_at, entry.created_at, entry.entry_date])
  );
  const conversationActivity = latestDate([
    latestConversation?.updated_at,
    latestConversation?.created_at,
  ]);

  const meaningfulActivity = latestDate([
    toIso(goalActivity),
    toIso(journalActivity),
    toIso(conversationActivity),
  ]);

  const daysSinceMeaningfulActivity = daysSince(meaningfulActivity, now);
  const hasRecentChallenges = journalEntries.some((entry) => Boolean(entry.challenges?.trim()));

  const goalOrJournalAfterConversation =
    conversationActivity &&
    [goalActivity, journalActivity].some(
      (value) => Boolean(value) && (value as Date).getTime() > conversationActivity.getTime()
    );

  const conversationWithoutFollowThrough =
    Boolean(conversationActivity) && !goalOrJournalAfterConversation;

  const signals: MomentumSignals = {
    hasPlan,
    totalGoals,
    completedGoals,
    startedGoals,
    activeGoals,
    hasRecentChallenges,
    lastGoalActivityAt: toIso(goalActivity),
    lastJournalActivityAt: toIso(journalActivity),
    lastConversationAt: toIso(conversationActivity),
    daysSinceMeaningfulActivity,
    conversationWithoutFollowThrough,
  };

  const firstUnstartedGoal = goals.find((goal) => goal.current_value <= 0);
  const firstActiveGoal = goals.find(
    (goal) => goal.current_value > 0 && goal.target_value > goal.current_value
  );

  if (!hasPlan) {
    return {
      state: "no_plan_yet",
      signals,
      recommendation: {
        title: "Create your first action plan",
        detail: "No active plan yet. Start with one measurable goal so your next step is concrete.",
        ctaLabel: "Set a goal",
        ctaHref: "/account",
        ctaKind: "generate_plan",
      },
      nudgeTitle: "No plan found",
      nudgeBody: "Define one goal with a clear target to turn strategy into execution.",
    };
  }

  if (completedGoals === totalGoals && totalGoals > 0 && (daysSinceMeaningfulActivity ?? 999) <= COMPLETED_RECENT_DAYS) {
    return {
      state: "completed_recently",
      signals,
      recommendation: {
        title: "Great run — pick your next lever",
        detail: "You completed your current goals. Capture your next growth target while momentum is high.",
        ctaLabel: "Set next goal",
        ctaHref: "/account",
        ctaKind: "review_next_lever",
      },
      nudgeTitle: "Momentum secured",
      nudgeBody: "Lock in your next measurable goal before this week’s progress fades.",
    };
  }

  if (hasRecentChallenges && (daysSinceMeaningfulActivity ?? 999) >= BLOCKED_ACTIVITY_DAYS) {
    return {
      state: "blocked",
      signals,
      recommendation: {
        title: "You may be blocked",
        detail: "Recent challenges were logged and progress has been quiet. Resolve the blocker with your mentor.",
        ctaLabel: "Ask mentor for unblock plan",
        ctaHref: "/mentor?intent=unblock",
        ctaKind: "unblock_with_mentor",
      },
      nudgeTitle: "Unblock the bottleneck",
      nudgeBody: "Bring your blocker to Mentor and leave with a concrete next move.",
    };
  }

  if (startedGoals === 0) {
    return {
      state: "not_started",
      signals,
      recommendation: {
        title: "Start your first step",
        detail: `Begin with ${firstUnstartedGoal?.label ?? "your first goal"} to create initial traction.`,
        ctaLabel: "Start now",
        ctaHref: "/account",
        ctaKind: "start_first_step",
        relatedGoalId: firstUnstartedGoal?.id,
      },
      nudgeTitle: "Plan exists, execution hasn’t started",
      nudgeBody: "Take one measurable action on your first goal today.",
    };
  }

  if ((daysSinceMeaningfulActivity ?? 0) >= STALE_ACTIVITY_DAYS || conversationWithoutFollowThrough) {
    return {
      state: "stalled",
      signals,
      recommendation: {
        title: "Resume with the easiest next move",
        detail: `Pick back up with ${firstActiveGoal?.label ?? firstUnstartedGoal?.label ?? "your active plan"} to regain momentum.`,
        ctaLabel: "Get restart plan",
        ctaHref: "/mentor?intent=resume",
        ctaKind: "resume_stalled",
        relatedGoalId: firstActiveGoal?.id ?? firstUnstartedGoal?.id,
      },
      nudgeTitle: "Momentum cooled",
      nudgeBody: "A small restart today is better than a perfect restart later.",
    };
  }

  return {
    state: "in_motion",
    signals,
    recommendation: {
      title: "Keep your current plan moving",
      detail: `Continue ${firstActiveGoal?.label ?? "your active goal"} while momentum is still warm.`,
      ctaLabel: "Continue plan",
      ctaHref: "/account",
      ctaKind: "continue_plan",
      relatedGoalId: firstActiveGoal?.id,
    },
    nudgeTitle: "You’re in motion",
    nudgeBody: "Stay focused on your current goal before switching context.",
  };
}

export function formatMomentumStateLabel(state: MomentumState): string {
  switch (state) {
    case "no_plan_yet":
      return "No Plan Yet";
    case "not_started":
      return "Not Started";
    case "in_motion":
      return "In Motion";
    case "stalled":
      return "Stalled";
    case "blocked":
      return "Blocked";
    case "completed_recently":
      return "Completed Recently";
    default:
      return "Momentum";
  }
}
