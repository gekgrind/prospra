export type InsightScoreInput = {
  insight: string;
  score: number;
};

export type PrioritizedTask = {
  priority: number;
  title: string;
  rationale: string;
  score: number;
};

export type StrategyInput = {
  focus: string;
  audience?: string;
  channel?: string;
  goal?: string;
};

export type CalendarDay = {
  day: number;
  theme: string;
  task: string;
  output: string;
};

const clampScore = (value: number) => Math.max(0, Math.min(100, value));

export function generateActionPlanTasks(inputs: InsightScoreInput[]): PrioritizedTask[] {
  const normalized = inputs
    .map((item) => ({
      insight: item.insight.trim(),
      score: clampScore(item.score),
    }))
    .filter((item) => item.insight.length > 0)
    .sort((a, b) => b.score - a.score);

  return normalized.map((item, index) => ({
    priority: index + 1,
    title: `Execute: ${item.insight}`,
    rationale: `Prioritized because impact score is ${item.score}/100 and this creates measurable momentum this week.`,
    score: item.score,
  }));
}

export function generateContentCalendar(strategy: StrategyInput): CalendarDay[] {
  const focus = strategy.focus.trim() || "Founder strategy";
  const audience = strategy.audience?.trim() || "ideal customers";
  const channel = strategy.channel?.trim() || "primary channel";
  const goal = strategy.goal?.trim() || "generate traction";

  return Array.from({ length: 30 }, (_, index) => {
    const day = index + 1;
    const weeklyTheme = `Week ${Math.floor(index / 7) + 1}: ${focus}`;

    return {
      day,
      theme: weeklyTheme,
      task: `Publish a ${channel} post for ${audience} that advances ${goal}. Day ${day} angle: ${focus}.`,
      output: `One shipped content asset + one CTA aligned to ${goal}.`,
    };
  });
}

export const executionSystemsExamples = {
  actionPlan: {
    input: {
      insights: [
        { insight: "Onboarding drop-off is highest at step 2", score: 92 },
        { insight: "Referral loop has no trigger", score: 84 },
      ],
    },
    output: [
      {
        priority: 1,
        title: "Execute: Onboarding drop-off is highest at step 2",
        rationale:
          "Prioritized because impact score is 92/100 and this creates measurable momentum this week.",
        score: 92,
      },
    ],
  },
  contentCalendar: {
    input: {
      strategy: {
        focus: "Trust-building founder proof",
        audience: "early-stage SaaS founders",
        channel: "LinkedIn",
        goal: "book strategy calls",
      },
    },
    output: [
      {
        day: 1,
        theme: "Week 1: Trust-building founder proof",
        task: "Publish a LinkedIn post for early-stage SaaS founders that advances book strategy calls. Day 1 angle: Trust-building founder proof.",
        output: "One shipped content asset + one CTA aligned to book strategy calls.",
      },
    ],
  },
};
