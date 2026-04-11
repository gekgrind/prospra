import { z } from "zod";

export const mentorModeSchema = z.enum([
  "mentor",
  "website-coach",
  "seo-ux",
  "funnel-mapping",
  "cta-analyzer",
]);

export type MentorMode = z.infer<typeof mentorModeSchema>;

export type StoredMessage = {
  role: "user" | "assistant";
  content: string;
};

const MAX_HISTORY_MESSAGES = 24;
const MAX_MESSAGE_CHARS = 4_000;

function truncateContent(content: string): string {
  const trimmed = content.trim();
  if (trimmed.length <= MAX_MESSAGE_CHARS) return trimmed;
  return `${trimmed.slice(0, MAX_MESSAGE_CHARS)}…`;
}

export function buildMentorSystemPrompt(mode: MentorMode, profile?: Record<string, unknown> | null): string {
  const profileSnapshot = [
    `Name: ${String(profile?.full_name ?? "unknown")}`,
    `Industry: ${String(profile?.industry ?? "unknown")}`,
    `Experience: ${String(profile?.experience_level ?? "unknown")}`,
    `Business idea: ${String(profile?.business_idea ?? "unknown")}`,
  ].join("\n");

  const sharedVoice = `You are Prospra Mentor, a sharp startup advisor for founders.

Core behavior:
- Be strategic, practical, and founder-focused.
- Be direct but supportive; avoid fluff.
- Explain tradeoffs clearly.
- End with concrete next actions.
- If details are missing, ask 1-2 high-value follow-up questions.
- Never fabricate user data or outcomes.

User profile snapshot:
${profileSnapshot}`;

  if (mode === "website-coach") {
    return `${sharedVoice}

Mode: Website Coach
Focus on messaging clarity, conversion friction, UX hierarchy, and page-level improvements.`;
  }

  if (mode === "seo-ux") {
    return `${sharedVoice}

Mode: SEO/UX Scoring
Give concise diagnostic feedback, identify high-impact fixes, and prioritize execution order.`;
  }

  if (mode === "funnel-mapping") {
    return `${sharedVoice}

Mode: Funnel Mapping
Map funnel stages, spot leaks, and suggest measurable improvements per stage.`;
  }

  if (mode === "cta-analyzer") {
    return `${sharedVoice}

Mode: CTA Analyzer
Evaluate clarity, specificity, emotional pull, and urgency. Offer stronger CTA rewrites with rationale.`;
  }

  return `${sharedVoice}

Mode: Mentor
Coach the founder on positioning, offers, pricing, launch planning, prioritization, and momentum.`;
}

export function formatConversationForModel(messages: StoredMessage[]) {
  return messages
    .slice(-MAX_HISTORY_MESSAGES)
    .map((message) => ({
      role: message.role,
      content: truncateContent(message.content),
    }));
}

export function extractAssistantText(text: string): string {
  return text.trim();
}
