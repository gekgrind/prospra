// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  MENTOR_STATES,
  MENTOR_STATE_ASSETS,
  isMentorBusy,
  resolveMentorState,
} from "@/lib/mentor/presence";

describe("resolveMentorState", () => {
  const base = { isWelcome: false, chatStatus: "ready" as const };

  it("greets on a fresh conversation", () => {
    expect(resolveMentorState({ ...base, isWelcome: true })).toBe("welcome");
  });

  it("rests when a conversation is open and nothing is happening", () => {
    expect(resolveMentorState(base)).toBe("idle");
  });

  it("thinks immediately after submission, including while the message saves", () => {
    expect(resolveMentorState({ ...base, chatStatus: "submitted" })).toBe("thinking");
    expect(resolveMentorState({ ...base, isWelcome: true, isSubmitting: true })).toBe("thinking");
  });

  it("escalates a long wait to analyzing", () => {
    expect(resolveMentorState({ ...base, chatStatus: "submitted", isLongWait: true })).toBe(
      "analyzing"
    );
  });

  it("explains while the reply streams", () => {
    expect(resolveMentorState({ ...base, chatStatus: "streaming", isCelebrating: true })).toBe(
      "explaining"
    );
  });

  it("analyzes during structured analysis and celebrates genuine completions", () => {
    expect(resolveMentorState({ ...base, isAnalyzing: true })).toBe("analyzing");
    expect(resolveMentorState({ ...base, isCelebrating: true })).toBe("success");
  });

  it("falls back to idle after an error", () => {
    expect(resolveMentorState({ ...base, chatStatus: "error" })).toBe("idle");
  });
});

describe("mentor state assets", () => {
  it("defines a full figure and portrait for all eight states", () => {
    expect(MENTOR_STATES).toHaveLength(8);
    for (const state of MENTOR_STATES) {
      expect(MENTOR_STATE_ASSETS[state].full).toBe(`/mentor/prospra-mentor-${state}.png`);
      expect(MENTOR_STATE_ASSETS[state].portrait).toBe(
        `/mentor/prospra-mentor-${state}-portrait.png`
      );
    }
  });

  it("marks only working states as busy", () => {
    expect(MENTOR_STATES.filter(isMentorBusy)).toEqual(["thinking", "analyzing", "explaining"]);
  });
});
