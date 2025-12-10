// /lib/founder/score-engine.ts

export type FounderSignalInput = {
  // 0–1 normalized scores (you can map your real data into these)
  clarity: number; // how clear their positioning/offer is
  execution: number; // how much they ship / show momentum
  strategy: number; // strength of roadmap, funnel, etc.
  consistency: number; // how regularly they take action
  marketReadiness: number; // offer–market fit

  // Optional “bonus” inputs
  websiteScore?: number; // 0–100
  journalConsistency?: number; // 0–1
  goalProgress?: number; // 0–1 average across goals
};

export type FounderSubscores = {
  clarity: number;
  execution: number;
  strategy: number;
  consistency: number;
  marketReadiness: number;
};

export type FounderScoreResult = {
  totalScore: number; // 0–100
  subscores: FounderSubscores;
  tier:
    | "Struggling Starter"
    | "Finding Their Footing"
    | "Emerging Operator"
    | "Momentum Builder"
    | "Scaling Strategist"
    | "Elite Founder";
  summary: string;
  recommendations: string[];
};

function clamp01(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function normalize100(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export function computeFounderScore(input: FounderSignalInput): FounderScoreResult {
  const clarity = clamp01(input.clarity);
  const execution = clamp01(input.execution);
  const strategy = clamp01(input.strategy);
  const consistency = clamp01(input.consistency);
  const marketReadiness = clamp01(input.marketReadiness);

  const websiteBoost = normalize100(input.websiteScore ?? 0) / 100;
  const journalBoost = clamp01(input.journalConsistency ?? 0);
  const goalBoost = clamp01(input.goalProgress ?? 0);

  // base subscores (0–100)
  const subscores: FounderSubscores = {
    clarity: Math.round(clarity * 100),
    execution: Math.round(execution * 100),
    strategy: Math.round(strategy * 100),
    consistency: Math.round(consistency * 100),
    marketReadiness: Math.round(marketReadiness * 100),
  };

  // Weighted blend
  const baseScore =
    clarity * 0.22 +
    execution * 0.24 +
    strategy * 0.22 +
    consistency * 0.18 +
    marketReadiness * 0.14;

  const bonus =
    (websiteBoost * 0.15 + journalBoost * 0.1 + goalBoost * 0.15) * 0.4; // max ~0.16

  let total = (baseScore + bonus) * 100;
  total = Math.round(Math.min(100, Math.max(0, total)));

  let tier: FounderScoreResult["tier"];
  if (total < 30) tier = "Struggling Starter";
  else if (total < 45) tier = "Finding Their Footing";
  else if (total < 60) tier = "Emerging Operator";
  else if (total < 75) tier = "Momentum Builder";
  else if (total < 90) tier = "Scaling Strategist";
  else tier = "Elite Founder";

  const recommendations: string[] = [];

  const lowestKey = Object.entries(subscores).sort((a, b) => a[1] - b[1])[0]?.[0];

  if (lowestKey === "clarity") {
    recommendations.push(
      "Tighten your core offer and one-liner. Make sure a stranger can understand exactly who you help and how in under 10 seconds."
    );
  } else if (lowestKey === "execution") {
    recommendations.push(
      "Shift from planning to shipping. Commit to one needle-moving task per day and track it in your system."
    );
  } else if (lowestKey === "strategy") {
    recommendations.push(
      "Zoom out and map your funnel: traffic → leads → conversations → sales. Make sure each step has at least one reliable tactic."
    );
  } else if (lowestKey === "consistency") {
    recommendations.push(
      "Set smaller, repeatable commitments instead of big sporadic pushes. Momentum > intensity."
    );
  } else if (lowestKey === "marketReadiness") {
    recommendations.push(
      "Talk to 5–10 ideal customers this week. Validate pains, language, and willingness to pay before overbuilding."
    );
  }

  if ((input.websiteScore ?? 0) < 60) {
    recommendations.push(
      "Run a website UX & clarity pass. Your homepage should clearly say who you help, what outcome you deliver, and your main call-to-action."
    );
  }

  if ((input.goalProgress ?? 0) < 0.5) {
    recommendations.push(
      "Rework your goals into smaller, weekly milestones and add an explicit 'next action' for each."
    );
  }

  const summary = `Your current Founder Score is ${total}/100 – you’re in the “${tier}” tier. Focus on your weakest pillar first to unlock the biggest jump in momentum.`;

  return {
    totalScore: total,
    subscores,
    tier,
    summary,
    recommendations,
  };
}
