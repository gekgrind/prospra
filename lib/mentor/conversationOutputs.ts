import { z } from "zod";

export const mentorOutputSchema = z.object({
  summary: z.string().min(1).max(300),
  insights: z.array(z.string().min(1)).min(3).max(5),
  actionPlan: z.array(z.string().min(1)).min(3).max(7),
  recommendedPriority: z.string().min(1).max(180),
  riskOrBlocker: z.string().min(1).max(220),
});

export type MentorOutput = z.infer<typeof mentorOutputSchema>;

export type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

const cleanLine = (value: string) => value.replace(/\s+/g, " ").trim();

export function normalizeMessages(messages: ConversationMessage[]) {
  return messages
    .map((message) => `${message.role === "user" ? "Founder" : "Mentor"}: ${cleanLine(message.content)}`)
    .join("\n");
}

export function buildConversationOutputsPrompt({
  profileSummary,
  conversationText,
}: {
  profileSummary: string;
  conversationText: string;
}) {
  return `You are Prospra's strategic planning analyst.

Your task: turn the mentor conversation into specific momentum outputs for a startup founder.

Founder context:
${profileSummary}

Conversation transcript:
${conversationText}

Requirements:
- Write practical, strategic outputs grounded in the transcript.
- Avoid generic motivation or filler.
- Insights should reflect what actually happened in the conversation.
- Action plan steps must be concrete and immediately executable.
- Keep language concise, direct, and founder-relevant.
- If information is missing, infer the safest practical next move.

Output rules:
- summary: 1-2 sentences on the core strategic takeaway.
- insights: 3-5 bullets.
- actionPlan: 3-7 concrete steps.
- recommendedPriority: one priority for this week.
- riskOrBlocker: one blocker/risk to watch next.
`;
}

export function buildProfileSummary(profile: Record<string, unknown> | null) {
  if (!profile) {
    return "No saved founder profile available.";
  }

  const fields = [
    ["Name", profile.full_name ?? profile.name],
    ["Industry", profile.industry],
    ["Stage", profile.stage],
    ["Audience", profile.audience],
    ["Offer", profile.offer],
    ["90-day goal", profile.goal90],
    ["Main challenge", profile.challenge],
    ["Business idea", profile.business_idea],
    ["Experience", profile.experience_level],
  ];

  const lines = fields
    .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
    .map(([label, value]) => `${label}: ${String(value).trim()}`);

  return lines.length > 0 ? lines.join("\n") : "No saved founder profile available.";
}
