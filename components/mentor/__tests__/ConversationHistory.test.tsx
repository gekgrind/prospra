import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  ConversationHistory,
  groupConversations,
  type MentorConversation,
} from "@/components/mentor/ConversationHistory";

const now = new Date("2026-09-21T15:00:00");
const conversations: MentorConversation[] = [
  { id: "a", title: "Pricing for launch", updated_at: "2026-09-21T09:00:00" },
  { id: "b", title: "Hiring first contractor", updated_at: "2026-09-20T18:00:00" },
  { id: "c", title: null, updated_at: "2026-09-16T12:00:00" },
  { id: "d", title: "Old idea", updated_at: "2026-05-01T12:00:00" },
];

describe("groupConversations", () => {
  it("buckets by recency and skips empty groups", () => {
    const groups = groupConversations(conversations, now);
    expect(groups.map((g) => [g.label, g.items.map((i) => i.id)])).toEqual([
      ["Today", ["a"]],
      ["Yesterday", ["b"]],
      ["Previous 7 days", ["c"]],
      ["Older", ["d"]],
    ]);
  });
});

describe("ConversationHistory", () => {
  it("marks the active conversation and selects others", async () => {
    const onSelect = vi.fn();
    render(
      <ConversationHistory
        conversations={conversations}
        isLoading={false}
        activeConversationId="a"
        onSelectConversation={onSelect}
        onNewConversation={() => {}}
      />
    );

    const nav = screen.getByRole("navigation", { name: "Mentor conversation history" });
    expect(within(nav).getByRole("button", { name: /Pricing for launch/ })).toHaveAttribute(
      "aria-current",
      "true"
    );
    expect(within(nav).getByRole("button", { name: /Untitled conversation/ })).toBeInTheDocument();

    await userEvent.click(within(nav).getByRole("button", { name: /Hiring first contractor/ }));
    expect(onSelect).toHaveBeenCalledWith("b");
  });

  it("starts a new conversation, disabled while already fresh", async () => {
    const onNew = vi.fn();
    const { rerender } = render(
      <ConversationHistory
        conversations={[]}
        isLoading={false}
        activeConversationId={null}
        onSelectConversation={() => {}}
        onNewConversation={onNew}
        isFreshConversation
      />
    );
    expect(screen.getByRole("button", { name: "New conversation" })).toBeDisabled();
    expect(screen.getByText(/will appear here/)).toBeInTheDocument();

    rerender(
      <ConversationHistory
        conversations={conversations}
        isLoading={false}
        activeConversationId="a"
        onSelectConversation={() => {}}
        onNewConversation={onNew}
        onCollapse={() => {}}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: "New conversation" }));
    expect(onNew).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Hide conversation history" })).toBeInTheDocument();
  });
});
