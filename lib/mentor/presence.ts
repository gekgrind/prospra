/**
 * Mentor presence — the state model behind Prospra's Mentor character.
 *
 * The eight states are poses of the same character. This module is
 * deliberately UI-agnostic so the Mentor can later appear outside the
 * Mentor page (compact button, contextual drawer, "Ask Mentor" actions)
 * without rebuilding the mapping.
 */

export const MENTOR_STATES = [
  "welcome",
  "idle",
  "thinking",
  "analyzing",
  "explaining",
  "idea",
  "recommendation",
  "success",
] as const;

export type MentorState = (typeof MENTOR_STATES)[number];

export type MentorStateAsset = {
  /** Full figure, normalised to a 1:1 canvas with the feet at the same baseline. */
  full: string;
  /** Head-and-shoulders crop for avatars and compact presence. */
  portrait: string;
  /** Short human status, used for the single polite live region. */
  status: string;
};

export const MENTOR_STATE_ASSETS: Record<MentorState, MentorStateAsset> = {
  welcome: {
    full: "/mentor/prospra-mentor-welcome.png",
    portrait: "/mentor/prospra-mentor-welcome-portrait.png",
    status: "Ready when you are",
  },
  idle: {
    full: "/mentor/prospra-mentor-idle.png",
    portrait: "/mentor/prospra-mentor-idle-portrait.png",
    status: "Ready when you are",
  },
  thinking: {
    full: "/mentor/prospra-mentor-thinking.png",
    portrait: "/mentor/prospra-mentor-thinking-portrait.png",
    status: "Thinking it through",
  },
  analyzing: {
    full: "/mentor/prospra-mentor-analyzing.png",
    portrait: "/mentor/prospra-mentor-analyzing-portrait.png",
    status: "Working through your context",
  },
  explaining: {
    full: "/mentor/prospra-mentor-explaining.png",
    portrait: "/mentor/prospra-mentor-explaining-portrait.png",
    status: "Responding",
  },
  idea: {
    full: "/mentor/prospra-mentor-idea.png",
    portrait: "/mentor/prospra-mentor-idea-portrait.png",
    status: "Exploring ideas",
  },
  recommendation: {
    full: "/mentor/prospra-mentor-recommendation.png",
    portrait: "/mentor/prospra-mentor-recommendation-portrait.png",
    status: "Recommending next steps",
  },
  success: {
    full: "/mentor/prospra-mentor-success.png",
    portrait: "/mentor/prospra-mentor-success-portrait.png",
    status: "All set",
  },
};

/** States that indicate the Mentor is actively working on something. */
export const MENTOR_BUSY_STATES: ReadonlySet<MentorState> = new Set([
  "thinking",
  "analyzing",
  "explaining",
]);

/** A request that has produced no tokens for this long is shown as "analyzing". */
export const MENTOR_LONG_WAIT_MS = 4000;

/** How long a genuine success moment is shown before settling back to idle. */
export const MENTOR_SUCCESS_HOLD_MS = 3200;

export type MentorChatStatus = "ready" | "submitted" | "streaming" | "error";

export type MentorPresenceInput = {
  /** No active conversation and no messages: the welcome composition is showing. */
  isWelcome: boolean;
  /** AI SDK chat status for the active request. */
  chatStatus: MentorChatStatus;
  /** The message is being saved before the AI request starts. */
  isSubmitting?: boolean;
  /** The request has been waiting longer than MENTOR_LONG_WAIT_MS without tokens. */
  isLongWait?: boolean;
  /** A structured analysis (insights/action plan, board review) is running. */
  isAnalyzing?: boolean;
  /** A genuine completion just happened (plan generated, task completed). */
  isCelebrating?: boolean;
};

/**
 * Resolve the Mentor's pose from signals the product can determine reliably.
 * Content-based states (idea, recommendation) are intentionally not inferred
 * from response text; they are used only where the surface itself is
 * semantically an idea or recommendation (see MentorInsightsPanel).
 */
export function resolveMentorState(input: MentorPresenceInput): MentorState {
  const { chatStatus } = input;

  if (chatStatus === "streaming") return "explaining";

  if (chatStatus === "submitted" || input.isSubmitting) {
    return input.isLongWait ? "analyzing" : "thinking";
  }

  if (input.isAnalyzing) return "analyzing";
  if (input.isCelebrating) return "success";
  if (input.isWelcome) return "welcome";

  return "idle";
}

export function isMentorBusy(state: MentorState) {
  return MENTOR_BUSY_STATES.has(state);
}
