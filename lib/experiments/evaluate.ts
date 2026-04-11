import { FEATURE_FLAGS, FeatureFlagKey } from "@/lib/experiments/definitions";
import {
  ExperimentContext,
  FeatureFlagDefinition,
  FlagEvaluation,
  VariantDefinition,
} from "@/lib/experiments/types";

function hashToBucket(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) % 100;
}

function parseBoolean(value?: string): boolean | undefined {
  if (!value) return undefined;
  if (value === "1" || value.toLowerCase() === "true") return true;
  if (value === "0" || value.toLowerCase() === "false") return false;
  return undefined;
}

function parseRollout(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.min(100, Math.max(0, parsed));
}

function getContextKey(context?: ExperimentContext): string | null {
  if (context?.userId) return `user:${context.userId}`;
  if (context?.anonymousId) return `anon:${context.anonymousId}`;
  return null;
}

function resolveVariant(
  variants: VariantDefinition[] | undefined,
  bucket: number,
): string | null {
  if (!variants?.length) return null;

  const totalWeight = variants.reduce((sum, variant) => sum + Math.max(0, variant.weight), 0);
  if (totalWeight <= 0) return variants[0]?.key ?? null;

  const scaled = (bucket / 100) * totalWeight;
  let cumulative = 0;

  for (const variant of variants) {
    cumulative += Math.max(0, variant.weight);
    if (scaled < cumulative) {
      return variant.key;
    }
  }

  return variants[variants.length - 1]?.key ?? null;
}

function applyEnvOverride(definition: FeatureFlagDefinition): FeatureFlagDefinition {
  const envPrefix = `FF_${definition.key.toUpperCase()}`;
  const globalConfigRaw = process.env.FEATURE_FLAGS_JSON;
  let globalConfig: Record<string, Partial<FeatureFlagDefinition>> = {};

  if (globalConfigRaw) {
    try {
      globalConfig = JSON.parse(globalConfigRaw) as Record<string, Partial<FeatureFlagDefinition>>;
    } catch {
      globalConfig = {};
    }
  }

  const globalForFlag = globalConfig[definition.key];
  const enabledOverride = parseBoolean(process.env[`${envPrefix}_ENABLED`]);
  const rolloutOverride = parseRollout(process.env[`${envPrefix}_ROLLOUT`]);

  return {
    ...definition,
    ...globalForFlag,
    enabled: enabledOverride ?? globalForFlag?.enabled ?? definition.enabled,
    rolloutPercentage:
      rolloutOverride ??
      globalForFlag?.rolloutPercentage ??
      definition.rolloutPercentage,
    variants: globalForFlag?.variants ?? definition.variants,
    metadata: {
      ...definition.metadata,
      ...globalForFlag?.metadata,
    },
  };
}

export function evaluateFlag(key: FeatureFlagKey, context?: ExperimentContext): FlagEvaluation {
  const definition = applyEnvOverride(FEATURE_FLAGS[key]);
  const contextKey = getContextKey(context);

  if (!definition.enabled) {
    return {
      key,
      enabled: false,
      inRollout: false,
      variant: definition.variants?.[0]?.key ?? null,
      reason: "disabled",
      metadata: definition.metadata,
    };
  }

  const rollout = Math.min(100, Math.max(0, definition.rolloutPercentage ?? 100));

  if (rollout < 100 && !contextKey) {
    return {
      key,
      enabled: false,
      inRollout: false,
      variant: definition.variants?.[0]?.key ?? null,
      reason: "missing_context",
      metadata: definition.metadata,
    };
  }

  const bucketSource = `${key}:${contextKey ?? "global"}`;
  const bucket = hashToBucket(bucketSource);
  const inRollout = bucket < rollout;

  if (!inRollout) {
    return {
      key,
      enabled: false,
      inRollout: false,
      variant: definition.variants?.[0]?.key ?? null,
      reason: "rollout_excluded",
      metadata: definition.metadata,
    };
  }

  return {
    key,
    enabled: true,
    inRollout: true,
    variant: resolveVariant(definition.variants, bucket),
    reason: "enabled",
    metadata: definition.metadata,
  };
}

export function getExperimentVariant(
  key: FeatureFlagKey,
  context?: ExperimentContext,
  fallback = "control",
): string {
  const evaluation = evaluateFlag(key, context);
  return evaluation.enabled ? (evaluation.variant ?? fallback) : fallback;
}

export function getAllFlagEvaluations(context?: ExperimentContext) {
  return Object.keys(FEATURE_FLAGS).reduce<Record<FeatureFlagKey, FlagEvaluation>>((acc, key) => {
    const typedKey = key as FeatureFlagKey;
    acc[typedKey] = evaluateFlag(typedKey, context);
    return acc;
  }, {} as Record<FeatureFlagKey, FlagEvaluation>);
}
