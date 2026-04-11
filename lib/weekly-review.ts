export type WeeklyReviewSignalTask = {
  title: string;
  source: "journal_wins" | "journal_progress" | "goal_progress";
  date?: string;
};

export type WeeklyReviewSummaryData = {
  mentorConversationCount: number;
  mentorInsightCount: number;
  journalEntryCount: number;
  wins: string[];
  inMotion: string[];
  blockers: string[];
};

export type WeeklyReviewNarrative = {
  reflectionSummary: string;
  focusRecommendation: string;
  suggestedMentorPrompt: string;
};

export type WeeklyReviewRecord = {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  window_type: "rolling_7d";
  summary_data: WeeklyReviewSummaryData;
  narrative: WeeklyReviewNarrative;
  generated_with_ai: boolean;
  created_at: string;
  updated_at: string;
};

export function getRollingWeeklyWindow(reference = new Date()) {
  const end = new Date(reference);
  const start = new Date(reference);
  start.setUTCDate(start.getUTCDate() - 6);
  start.setUTCHours(0, 0, 0, 0);

  return {
    start,
    end,
    periodStartIso: start.toISOString(),
    periodEndIso: end.toISOString(),
    periodLabel: `${start.toISOString().slice(0, 10)} to ${end
      .toISOString()
      .slice(0, 10)} (UTC rolling 7 days)`,
  };
}

function splitText(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/\n|•|\-|\*|\d+\./g)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function sanitizeSection(items: string[], fallback: string) {
  const deduped = Array.from(new Set(items.map((i) => i.trim()).filter(Boolean)));
  if (!deduped.length) return [fallback];
  return deduped.slice(0, 5);
}

export function deriveFallbackNarrative(summary: WeeklyReviewSummaryData): WeeklyReviewNarrative {
  const reflectionSummary =
    summary.journalEntryCount === 0 &&
    summary.mentorConversationCount === 0 &&
    summary.wins.length === 0
      ? "This week was quieter, which is still useful signal. Use this review to reset around one concrete priority before momentum drifts further."
      : `You logged ${summary.journalEntryCount} journal ${
          summary.journalEntryCount === 1 ? "entry" : "entries"
        }, had ${summary.mentorConversationCount} mentor ${
          summary.mentorConversationCount === 1 ? "conversation" : "conversations"
        }, and captured ${summary.wins.length} concrete win${
          summary.wins.length === 1 ? "" : "s"
        }.`;

  const firstInMotion = summary.inMotion[0] ?? "your top unfinished priority";
  const firstBlocker = summary.blockers[0] ?? "where execution has been stalling";

  return {
    reflectionSummary,
    focusRecommendation: `Prioritize ${firstInMotion} first, and remove friction around ${firstBlocker}. Protect one focused block daily until it moves forward.`,
    suggestedMentorPrompt: `Help me unblock '${firstBlocker}' and turn '${firstInMotion}' into a realistic 7-day execution plan.`,
  };
}

export function buildSummaryData(input: {
  journalEntries: Array<{
    entry_date: string | null;
    created_at: string | null;
    wins: string | null;
    progress_notes: string | null;
    challenges: string | null;
  }>;
  goals: Array<{
    label: string;
    current_value: number;
    target_value: number;
  }>;
  mentorConversationCount: number;
  mentorInsightCount: number;
}) {
  const winItems = input.journalEntries.flatMap((entry) => splitText(entry.wins));
  const progressItems = input.journalEntries.flatMap((entry) => splitText(entry.progress_notes));
  const blockerItems = input.journalEntries.flatMap((entry) => splitText(entry.challenges));

  const inMotionFromGoals = input.goals
    .filter((goal) => goal.target_value > 0 && goal.current_value < goal.target_value)
    .map((goal) => {
      const remaining = Math.max(goal.target_value - goal.current_value, 0);
      return `${goal.label} (${goal.current_value}/${goal.target_value}, ${remaining} remaining)`;
    });

  return {
    mentorConversationCount: input.mentorConversationCount,
    mentorInsightCount: input.mentorInsightCount,
    journalEntryCount: input.journalEntries.length,
    wins: sanitizeSection(winItems.concat(progressItems.slice(0, 2)), "No clear shipped wins were logged this week."),
    inMotion: sanitizeSection(
      inMotionFromGoals.concat(progressItems),
      "Choose one priority to move from intention to execution next week."
    ),
    blockers: sanitizeSection(blockerItems, "No blockers were explicitly logged. Identify the biggest hidden friction point."),
  } satisfies WeeklyReviewSummaryData;
}
