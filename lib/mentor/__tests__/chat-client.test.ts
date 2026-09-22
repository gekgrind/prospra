// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  describeConversationOutputsError,
  describeMentorChatError,
  extractMessageText,
  firstNameFrom,
} from "@/lib/mentor/chat-client";

describe("extractMessageText", () => {
  it("reads text parts and ignores non-text parts", () => {
    expect(
      extractMessageText({
        parts: [{ type: "step-start" }, { type: "text", text: "Hello founder" }],
      })
    ).toBe("Hello founder");
  });

  it("prefers string content", () => {
    expect(extractMessageText({ content: "Plain" })).toBe("Plain");
  });

  it("handles empty input", () => {
    expect(extractMessageText(null)).toBe("");
    expect(extractMessageText({ parts: [] })).toBe("");
  });
});

describe("describeMentorChatError", () => {
  it("maps usage limits to the server's message", () => {
    const info = describeMentorChatError(
      new Error(JSON.stringify({ error: "USAGE_LIMIT", message: "Out of prompts" }))
    );
    expect(info).toEqual({ kind: "usage_limit", message: "Out of prompts" });
  });

  it("maps expired sessions", () => {
    expect(
      describeMentorChatError(new Error(JSON.stringify({ error: "UNAUTHORIZED" }))).kind
    ).toBe("unauthorized");
  });

  it("never surfaces raw internals", () => {
    const info = describeMentorChatError(new Error("TypeError: fetch failed at node:internal"));
    expect(info.kind).toBe("generic");
    expect(info.message).not.toMatch(/TypeError|internal/);
  });
});

describe("firstNameFrom", () => {
  it("returns the first word of a name and ignores emails", () => {
    expect(firstNameFrom("  Misti Grinder ")).toBe("Misti");
    expect(firstNameFrom("someone@example.com")).toBeNull();
    expect(firstNameFrom("")).toBeNull();
  });
});

describe("describeConversationOutputsError", () => {
  it("explains a missing AI provider configuration (503 NOT_CONFIGURED)", () => {
    const message = describeConversationOutputsError(
      503,
      "Action plan generation is not configured. Missing environment variables: OPENAI_API_KEY"
    );
    expect(message).toMatch(/AI provider isn't configured/);
    expect(message).not.toContain("OPENAI_API_KEY");
  });

  it("keeps the existing auth, premium, 422 and fallback messages", () => {
    expect(describeConversationOutputsError(401)).toMatch(/unavailable right now/);
    expect(describeConversationOutputsError(402, "Premium required")).toMatch(/available with Premium/);
    expect(describeConversationOutputsError(422, "Not enough conversation yet.")).toBe(
      "Not enough conversation yet."
    );
    expect(describeConversationOutputsError(500, "boom")).toMatch(/unavailable right now/);
  });
});
