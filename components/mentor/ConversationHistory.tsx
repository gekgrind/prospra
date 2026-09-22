"use client";

import { MessageSquarePlus, PanelRightClose } from "lucide-react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export type MentorConversation = {
  id: string;
  title: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ConversationGroup = { label: string; items: MentorConversation[] };

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function conversationTime(conversation: MentorConversation) {
  const raw = conversation.updated_at ?? conversation.created_at;
  const time = raw ? new Date(raw).getTime() : NaN;
  return Number.isNaN(time) ? null : time;
}

/** Buckets conversations (already sorted newest first) into recency groups. */
export function groupConversations(
  conversations: MentorConversation[],
  now: Date = new Date()
): ConversationGroup[] {
  const today = startOfDay(now);
  const buckets: ConversationGroup[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Previous 7 days", items: [] },
    { label: "Previous 30 days", items: [] },
    { label: "Older", items: [] },
  ];

  for (const conversation of conversations) {
    const time = conversationTime(conversation);
    const index =
      time === null
        ? 4
        : time >= today
          ? 0
          : time >= today - DAY_MS
            ? 1
            : time >= today - 7 * DAY_MS
              ? 2
              : time >= today - 30 * DAY_MS
                ? 3
                : 4;
    buckets[index].items.push(conversation);
  }

  return buckets.filter((bucket) => bucket.items.length > 0);
}

function formatShortTime(conversation: MentorConversation, now: Date) {
  const time = conversationTime(conversation);
  if (time === null) return null;
  const date = new Date(time);

  if (time >= startOfDay(now)) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  if (time >= startOfDay(now) - 6 * DAY_MS) {
    return date.toLocaleDateString([], { weekday: "short" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export type ConversationHistoryProps = {
  conversations: MentorConversation[];
  isLoading: boolean;
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  /** Desktop only: collapse the rail. Omitted inside the mobile sheet. */
  onCollapse?: () => void;
  /** Disable "New conversation" when already on a fresh one. */
  isFreshConversation?: boolean;
  className?: string;
};

export function ConversationHistory({
  conversations,
  isLoading,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onCollapse,
  isFreshConversation = false,
  className,
}: ConversationHistoryProps) {
  const now = new Date();
  const groups = groupConversations(conversations, now);

  return (
    <nav
      aria-label="Mentor conversation history"
      className={cn("flex h-full min-h-0 flex-col", className)}
    >
      <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8fb3cf]/80">
          History
        </h2>
        {onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            aria-label="Hide conversation history"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8fb3cf]/70 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4ff]/50"
          >
            <PanelRightClose className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={onNewConversation}
          disabled={isFreshConversation}
          className="flex w-full items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-[13px] font-medium text-[#e6f2fc] transition hover:border-[#00d4ff]/30 hover:bg-[#00d4ff]/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4ff]/50 disabled:cursor-default disabled:opacity-50 disabled:hover:border-white/[0.08] disabled:hover:bg-white/[0.03]"
        >
          <MessageSquarePlus className="h-4 w-4 text-[#00d4ff]" />
          New conversation
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4 [scrollbar-color:rgba(143,179,207,0.25)_transparent] [scrollbar-width:thin]">
        {isLoading ? (
          <div className="space-y-1 px-1" aria-busy="true" aria-label="Loading history">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="rounded-lg px-2.5 py-2.5">
                <Skeleton className="h-3.5 w-4/5 bg-white/[0.07]" />
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <p className="px-3 py-2 text-[12.5px] leading-relaxed text-[#9fb6ca]/80">
            Your conversations with the Mentor will appear here.
          </p>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="mb-3">
              <h3 className="px-3 pb-1 pt-2 text-[10.5px] font-medium uppercase tracking-[0.14em] text-[#7f9bb3]/70">
                {group.label}
              </h3>
              <ul className="space-y-px">
                {group.items.map((conversation) => {
                  const isActive = conversation.id === activeConversationId;
                  const title = conversation.title?.trim() || "Untitled conversation";
                  const time = formatShortTime(conversation, now);

                  return (
                    <li key={conversation.id}>
                      <button
                        type="button"
                        onClick={() => onSelectConversation(conversation.id)}
                        aria-current={isActive ? "true" : undefined}
                        title={title}
                        className={cn(
                          "group/item relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4ff]/50",
                          isActive
                            ? "bg-[#00d4ff]/[0.08] text-white"
                            : "text-[#bcd0e2]/85 hover:bg-white/[0.04] hover:text-[#eef6ff]"
                        )}
                      >
                        {isActive && (
                          <span className="absolute inset-y-2 left-0 w-[2px] rounded-full bg-[#00d4ff] shadow-[0_0_8px_rgba(0,212,255,0.7)]" />
                        )}
                        <span className="min-w-0 flex-1 truncate">{title}</span>
                        {time && (
                          <span className="shrink-0 text-[11px] tabular-nums text-[#7f9bb3]/70">
                            {time}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </div>
    </nav>
  );
}
