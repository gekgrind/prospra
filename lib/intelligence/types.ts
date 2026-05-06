export type MemoryScope = "mentor" | "journal" | "strategy" | "cross_app";

export type IntelligenceSignalSet = {
  actionPlanCompletion: number;
  mentorConsistency: number;
  websiteClarity: number;
  revenueReadiness: number;
  executionVelocity: number;
};

export type FounderScoreBreakdown = {
  execution: number;
  strategy: number;
  consistency: number;
  clarity: number;
  readiness: number;
};
