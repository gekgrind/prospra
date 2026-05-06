import type { FounderScoreBreakdown, IntelligenceSignalSet } from "@/lib/intelligence/types";

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function to100(value: number) {
  return Math.round(clamp01(value) * 100);
}

export function computeMultiFactorFounderScore(signals: IntelligenceSignalSet) {
  const normalized: IntelligenceSignalSet = {
    actionPlanCompletion: clamp01(signals.actionPlanCompletion),
    mentorConsistency: clamp01(signals.mentorConsistency),
    websiteClarity: clamp01(signals.websiteClarity),
    revenueReadiness: clamp01(signals.revenueReadiness),
    executionVelocity: clamp01(signals.executionVelocity),
  };

  const breakdown: FounderScoreBreakdown = {
    execution: to100((normalized.executionVelocity * 0.7) + (normalized.actionPlanCompletion * 0.3)),
    strategy: to100((normalized.actionPlanCompletion * 0.6) + (normalized.revenueReadiness * 0.4)),
    consistency: to100(normalized.mentorConsistency),
    clarity: to100(normalized.websiteClarity),
    readiness: to100((normalized.revenueReadiness * 0.6) + (normalized.websiteClarity * 0.4)),
  };

  const totalScore = Math.round(
    breakdown.execution * 0.28 +
    breakdown.strategy * 0.24 +
    breakdown.consistency * 0.18 +
    breakdown.clarity * 0.15 +
    breakdown.readiness * 0.15
  );

  return { totalScore, breakdown };
}
