/**
 * Client-side helpers for the Mentor chat. Pure functions so they can be unit
 * tested without rendering the workspace.
 */

export type MentorUIMessageLike = {
  id?: string;
  role?: string;
  content?: unknown;
  parts?: Array<{ type?: string; text?: unknown; content?: unknown }>;
};

export function extractMessageText(message: MentorUIMessageLike | null | undefined): string {
  if (!message) return "";

  if (typeof message.content === "string" && message.content.trim()) {
    return message.content;
  }

  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((part) => !part?.type || part.type === "text")
      .map((part) =>
        typeof part?.text === "string"
          ? part.text
          : typeof part?.content === "string"
            ? part.content
            : ""
      )
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  return "";
}

export type MentorChatErrorKind = "usage_limit" | "unauthorized" | "generic";

export type MentorChatErrorInfo = {
  kind: MentorChatErrorKind;
  message: string;
};

const GENERIC_REPLY_ERROR =
  "The Mentor couldn't finish that reply. Your message is saved, so you can try again.";

/**
 * The AI SDK transport surfaces a failed response as `Error(responseBody)`.
 * /api/chat returns `{ error: CODE, message }` for expected failures; anything
 * else is treated as a transient failure and never shown verbatim.
 */
export function describeMentorChatError(error: unknown): MentorChatErrorInfo {
  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";

  type ErrorPayload = { error?: unknown; message?: unknown };
  let payload: ErrorPayload | null = null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object") payload = parsed as ErrorPayload;
  } catch {
    payload = null;
  }

  const code = typeof payload?.error === "string" ? payload.error : "";
  const serverMessage =
    typeof payload?.message === "string" && payload.message.trim() ? payload.message.trim() : null;

  if (code === "USAGE_LIMIT") {
    return {
      kind: "usage_limit",
      message:
        serverMessage ??
        "You've used today's free Mentor messages. Upgrade to keep going, or come back tomorrow.",
    };
  }

  if (code === "UNAUTHORIZED") {
    return {
      kind: "unauthorized",
      message: "Your session has expired. Sign in again to continue with your mentor.",
    };
  }

  return { kind: "generic", message: GENERIC_REPLY_ERROR };
}

/**
 * Founder-facing message for /api/mentor/conversation-outputs failures
 * (Insights & action plan). Raw server text is only shown for 422s.
 */
export function describeConversationOutputsError(status: number, rawError?: unknown): string {
  const rawMessage = typeof rawError === "string" ? rawError.toLowerCase() : "";

  if (
    status === 401 ||
    status === 403 ||
    rawMessage.includes("unauthorized") ||
    rawMessage.includes("not authenticated")
  ) {
    return "Action plan generation is unavailable right now. Please try again.";
  }

  if (rawMessage.includes("premium")) {
    return "Action plan generation is available with Premium. Upgrade when you're ready to turn this thread into next steps.";
  }

  // 503 NOT_CONFIGURED from the route when provider/env keys are missing.
  if (rawMessage.includes("not configured") || rawMessage.includes("missing environment variable")) {
    return "Action plan generation isn't available yet because the AI provider isn't configured. Ask the workspace owner to add the required keys.";
  }

  if (status === 422 && typeof rawError === "string" && rawError.trim()) {
    return rawError;
  }

  return "Action plan generation is unavailable right now. Please try again.";
}

export function firstNameFrom(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const first = trimmed.split(/\s+/)[0];
  return first.includes("@") ? null : first;
}
