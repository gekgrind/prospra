import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MentorThread, type MentorThreadProps } from "@/components/mentor/MentorThread";

const baseProps: MentorThreadProps = {
  conversationKey: "c1",
  messages: [],
  pendingUserText: null,
  isStreaming: false,
  isAwaitingReply: false,
  mentorState: "idle",
  isLoading: false,
  error: null,
};

describe("MentorThread", () => {
  it("renders authored messages with markdown for Mentor replies", () => {
    render(
      <MentorThread
        {...baseProps}
        messages={[
          { id: "1", role: "user", text: "How do I price?" },
          { id: "2", role: "assistant", text: "**Mentor Insight**\n\n- Start high\n- Test fast" },
        ]}
      />
    );

    expect(screen.getByRole("article", { name: "You" })).toHaveTextContent("How do I price?");
    const mentor = screen.getByRole("article", { name: "Mentor" });
    expect(mentor.querySelector("h5")).toHaveTextContent("Mentor Insight");
    expect(mentor.querySelectorAll("li")).toHaveLength(2);
  });

  it("acknowledges a submission immediately and shows the thinking state", () => {
    render(
      <MentorThread
        {...baseProps}
        pendingUserText="Help me focus"
        isAwaitingReply
        mentorState="thinking"
      />
    );
    expect(screen.getByRole("article", { name: "You" })).toHaveTextContent("Help me focus");
    expect(screen.getByText("Thinking it through…")).toBeInTheDocument();
  });

  it("shows a human error with retry that keeps the user's message", async () => {
    const onRetry = vi.fn();
    render(
      <MentorThread
        {...baseProps}
        messages={[{ id: "1", role: "user", text: "Still here?" }]}
        error={{ message: "The Mentor couldn't finish that reply.", canRetry: true }}
        onRetry={onRetry}
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent("couldn't finish");
    expect(screen.getByText("Still here?")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("offers an upgrade action instead of retry for usage limits", () => {
    render(
      <MentorThread
        {...baseProps}
        messages={[{ id: "1", role: "user", text: "One more" }]}
        error={{
          message: "Out of prompts",
          canRetry: false,
          action: { label: "Upgrade", href: "/upgrade" },
        }}
      />
    );
    expect(screen.getByRole("link", { name: "Upgrade" })).toHaveAttribute("href", "/upgrade");
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });

  it("renders the empty state and loading skeleton", () => {
    const { rerender } = render(
      <MentorThread {...baseProps} emptyState={<p>Empty conversation</p>} />
    );
    expect(screen.getByText("Empty conversation")).toBeInTheDocument();

    rerender(<MentorThread {...baseProps} isLoading />);
    expect(screen.getByLabelText("Loading conversation")).toBeInTheDocument();
  });
});
