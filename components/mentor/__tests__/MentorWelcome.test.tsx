import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  CONVERSATION_STARTERS,
  MentorWelcome,
  getIntentCopy,
} from "@/components/mentor/MentorWelcome";

describe("MentorWelcome", () => {
  it("presents the Mentor, a greeting, the composer slot and starters", async () => {
    const onSelect = vi.fn();
    const { container } = render(
      <MentorWelcome
        mentorState="welcome"
        firstName="Misti"
        intent={null}
        composer={<div data-testid="composer" />}
        onSelectStarter={onSelect}
      />
    );

    expect(screen.getByRole("heading", { name: "What are we working on?" })).toBeInTheDocument();
    expect(screen.getByText("Good to see you, Misti")).toBeInTheDocument();
    expect(screen.getByTestId("composer")).toBeInTheDocument();

    // The character is decorative and uses the welcome asset.
    const figure = container.querySelector('[data-mentor-state="welcome"]');
    expect(figure).toHaveAttribute("aria-hidden", "true");
    expect(figure?.querySelector("img")).toHaveAttribute(
      "src",
      "/mentor/prospra-mentor-welcome.png"
    );

    const starters = screen.getByRole("list", { name: "Conversation starters" });
    expect(starters.querySelectorAll("button")).toHaveLength(CONVERSATION_STARTERS.length);

    await userEvent.click(screen.getByRole("button", { name: CONVERSATION_STARTERS[1].label }));
    expect(onSelect).toHaveBeenCalledWith(CONVERSATION_STARTERS[1]);
  });

  it("offers 3-4 starters", () => {
    expect(CONVERSATION_STARTERS.length).toBeGreaterThanOrEqual(3);
    expect(CONVERSATION_STARTERS.length).toBeLessThanOrEqual(4);
  });

  it("adapts copy to the entry intent", () => {
    expect(getIntentCopy("unblock")).toMatch(/stuck/);
    expect(getIntentCopy("funnel-review")).toBe("Let's tackle this with a funnel review lens.");
    expect(getIntentCopy(null)).toBeNull();
  });
});
