export const FEEDBACK_TYPES = ["bug", "feature_request", "general_feedback"] as const;
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

export const FEEDBACK_STATUSES = ["new", "in_review", "resolved", "ignored"] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export const FEATURE_AREAS = [
  "mentor",
  "plans",
  "execution",
  "directorium",
  "billing",
  "dashboard",
  "account",
  "other",
] as const;

export type FeedbackContext = {
  route?: string;
  conversation_id?: string;
  feature_area?: (typeof FEATURE_AREAS)[number] | string;
  user_plan?: string;
};

export function isFeedbackType(value: string): value is FeedbackType {
  return FEEDBACK_TYPES.includes(value as FeedbackType);
}

export function isFeedbackStatus(value: string): value is FeedbackStatus {
  return FEEDBACK_STATUSES.includes(value as FeedbackStatus);
}

export function sanitizeFeedbackMessage(message: unknown): string {
  if (typeof message !== "string") return "";
  return message.trim();
}

export function sanitizeContext(input: unknown): FeedbackContext {
  if (!input || typeof input !== "object") return {};

  const obj = input as Record<string, unknown>;
  const context: FeedbackContext = {};

  if (typeof obj.route === "string") context.route = obj.route.slice(0, 200);
  if (typeof obj.conversation_id === "string") {
    context.conversation_id = obj.conversation_id.slice(0, 100);
  }
  if (typeof obj.feature_area === "string") {
    context.feature_area = obj.feature_area.slice(0, 100);
  }
  if (typeof obj.user_plan === "string") {
    context.user_plan = obj.user_plan.slice(0, 50);
  }

  return context;
}
