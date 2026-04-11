export type ExperimentContext = {
  userId?: string | null;
  anonymousId?: string | null;
};

export type VariantDefinition = {
  key: string;
  weight: number;
};

export type FeatureFlagDefinition = {
  key: string;
  enabled: boolean;
  rolloutPercentage?: number;
  variants?: VariantDefinition[];
  metadata?: Record<string, string | number | boolean>;
};

export type FlagEvaluation = {
  key: string;
  enabled: boolean;
  inRollout: boolean;
  variant: string | null;
  reason: "disabled" | "enabled" | "rollout_excluded" | "missing_context";
  metadata?: Record<string, string | number | boolean>;
};
