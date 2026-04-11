import { FeatureFlagDefinition } from "@/lib/experiments/types";

export const FEATURE_FLAGS = {
  onboarding_flow_v1: {
    key: "onboarding_flow_v1",
    enabled: false,
    rolloutPercentage: 100,
    variants: [
      { key: "control", weight: 50 },
      { key: "fast_track", weight: 50 },
    ],
    metadata: {
      owner: "growth",
      type: "experiment",
    },
  },
  directorium_entry_rollout: {
    key: "directorium_entry_rollout",
    enabled: false,
    rolloutPercentage: 0,
    metadata: {
      owner: "product",
      type: "feature",
    },
  },
} as const satisfies Record<string, FeatureFlagDefinition>;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;
