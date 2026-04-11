export const LIFECYCLE_EMAIL_TYPES = [
  "welcome",
  "onboarding_reminder",
  "weekly_review_ready",
  "momentum_nudge",
] as const;

export type LifecycleEmailType = (typeof LIFECYCLE_EMAIL_TYPES)[number];

export type LifecycleEmailStatus = "sent" | "failed" | "skipped";

export type LifecycleEmailTemplatePayload = {
  firstName?: string | null;
  ctaUrl: string;
  ctaLabel: string;
  summary?: string;
  triggerDetail?: string;
};

export type EmailRecipient = {
  userId: string;
  email: string;
  firstName?: string | null;
  planTier?: string | null;
};

export type SendLifecycleEmailInput = {
  type: LifecycleEmailType;
  recipient: EmailRecipient;
  payload: LifecycleEmailTemplatePayload;
  dedupeWindowHours: number;
  relatedEntityId?: string | null;
  triggerContext?: Record<string, unknown>;
  respectProductUpdatesPreference?: boolean;
  respectWeeklySummaryPreference?: boolean;
};
