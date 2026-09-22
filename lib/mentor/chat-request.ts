/**
 * Server-side request parsing for /api/chat (kept out of the route file,
 * which may only export HTTP handlers and route config).
 */

export type ChatTurn = {
  role: "user" | "assistant" | "system";
  content: string;
};

function normalizeRole(role: unknown): ChatTurn["role"] {
  if (role === "user" || role === "assistant" || role === "system") {
    return role;
  }

  return "user";
}

export function extractTextFromMessage(message: unknown): string {
  if (!message || typeof message !== "object") return "";

  const msg = message as {
    content?: unknown;
    parts?: Array<{ text?: unknown; content?: unknown }>;
  };

  if (typeof msg.content === "string") return msg.content;

  if (Array.isArray(msg.parts)) {
    return msg.parts
      .map((part) => {
        if (typeof part?.text === "string") return part.text;
        if (typeof part?.content === "string") return part.content;
        return "";
      })
      .join("");
  }

  return "";
}

/**
 * Only the conversation's user/assistant turns are accepted from the client.
 * System instructions are always assembled server-side, so a client-sent
 * "system" message can never override the Mentor's prompt.
 */
export function sanitizeIncomingMessages(raw: unknown[]): ChatTurn[] {
  return raw
    .map((message) => ({
      role: normalizeRole((message as { role?: unknown } | null)?.role),
      content: extractTextFromMessage(message),
    }))
    .filter(
      (message) => message.role !== "system" && message.content.trim().length > 0
    );
}

/** The client sends a small object; older callers sent a string. */
export function normalizeContextHint(hint: unknown): string {
  if (typeof hint === "string") return hint.trim().slice(0, 1000);
  if (hint && typeof hint === "object") {
    try {
      return JSON.stringify(hint).slice(0, 1000);
    } catch {
      return "";
    }
  }
  return "";
}
