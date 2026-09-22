"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { MENTOR_STATE_ASSETS, type MentorState } from "@/lib/mentor/presence";

import { MentorAvatar } from "./MentorFigure";
import { MentorMarkdown } from "./MentorMarkdown";

export type ThreadMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

export type ThreadError = {
  message: string;
  /** Retry the Mentor reply without re-sending the user's message. */
  canRetry: boolean;
  action?: { label: string; href: string };
};

export function UserMessage({ text }: { text: string }) {
  return (
    <article aria-label="You" className="flex justify-end">
      <div className="max-w-[min(85%,620px)] whitespace-pre-wrap break-words rounded-[20px] rounded-br-md border border-[#4f7ca7]/25 bg-[linear-gradient(180deg,rgba(22,44,74,0.85)_0%,rgba(15,33,58,0.85)_100%)] px-4 py-3 text-[15px] leading-6 text-[#eef6ff] shadow-[0_8px_24px_rgba(0,0,0,0.2)]">
        {text}
      </div>
    </article>
  );
}

export function MentorMessage({
  text,
  avatarState = "idle",
  isStreaming = false,
  footer,
}: {
  text: string;
  avatarState?: MentorState;
  isStreaming?: boolean;
  footer?: ReactNode;
}) {
  return (
    <article
      aria-label="Mentor"
      aria-busy={isStreaming || undefined}
      className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 sm:gap-x-4 sm:gap-y-1.5"
    >
      <MentorAvatar state={avatarState} size={32} />
      <p className="text-[12.5px] font-medium text-[#8fb3cf]">Mentor</p>
      {/* Full width on phones; aligned under the label from sm up. */}
      <div className="col-span-2 min-w-0 sm:col-span-1 sm:col-start-2">
        <MentorMarkdown content={text} />
        {footer && <div className="mt-3">{footer}</div>}
      </div>
    </article>
  );
}

/** Shown between submission and the first streamed token. */
export function MentorPendingMessage({ state }: { state: MentorState }) {
  return (
    <div className="flex gap-3 sm:gap-4 motion-safe:animate-[mentor-rise_0.35s_ease-out_both]">
      <MentorAvatar state={state} size={32} className="mt-0.5" />
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="mb-1.5 text-[12.5px] font-medium text-[#8fb3cf]">Mentor</p>
        <div className="flex items-center gap-2.5 text-[14px] text-[#a9c3d8]">
          <span className="flex items-center gap-1" aria-hidden="true">
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className="h-1.5 w-1.5 rounded-full bg-[#00d4ff] motion-safe:animate-[mentor-dot_1.2s_ease-in-out_infinite]"
                style={{ animationDelay: `${dot * 0.16}s` }}
              />
            ))}
          </span>
          <span>{MENTOR_STATE_ASSETS[state].status}…</span>
        </div>
      </div>
    </div>
  );
}

function ThreadErrorNotice({
  error,
  onRetry,
  isRetrying,
}: {
  error: ThreadError;
  onRetry?: () => void;
  isRetrying?: boolean;
}) {
  return (
    <div
      role="alert"
      className="ml-0 flex flex-col gap-3 rounded-2xl border border-[#ff8a7a]/25 bg-[#ff6b5a]/[0.06] px-4 py-3.5 text-[14px] text-[#ffd9d3] sm:ml-12 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-2.5">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#ff9d8f]" />
        <p className="leading-relaxed">{error.message}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {error.action && (
          <Link
            href={error.action.href}
            className="rounded-full bg-brandYellow px-3.5 py-1.5 text-[13px] font-semibold text-brandNavyDark transition hover:bg-brandYellowLight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brandYellow/60"
          >
            {error.action.label}
          </Link>
        )}
        {error.canRetry && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className="flex items-center gap-1.5 rounded-full border border-[#ffb4a8]/30 px-3.5 py-1.5 text-[13px] font-medium text-[#ffe4df] transition hover:bg-[#ff8a7a]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb4a8]/50 disabled:opacity-60"
          >
            <RotateCcw className={cn("h-3.5 w-3.5", isRetrying && "motion-safe:animate-spin")} />
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

function ThreadLoading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading conversation">
      <div className="flex justify-end">
        <Skeleton className="h-11 w-2/3 max-w-sm rounded-[20px] bg-white/[0.06]" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-8 w-8 shrink-0 rounded-full bg-white/[0.07]" />
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-3 w-16 bg-white/[0.07]" />
          <Skeleton className="h-4 w-11/12 bg-white/[0.06]" />
          <Skeleton className="h-4 w-4/5 bg-white/[0.05]" />
          <Skeleton className="h-4 w-2/3 bg-white/[0.05]" />
        </div>
      </div>
    </div>
  );
}

const NEAR_BOTTOM_PX = 140;

export type MentorThreadProps = {
  conversationKey: string | null;
  messages: ThreadMessage[];
  /** User text acknowledged locally before it reaches the chat state. */
  pendingUserText: string | null;
  isStreaming: boolean;
  /** Between submission and the first streamed token. */
  isAwaitingReply: boolean;
  mentorState: MentorState;
  isLoading: boolean;
  error: ThreadError | null;
  onRetry?: () => void;
  isRetrying?: boolean;
  header?: ReactNode;
  emptyState?: ReactNode;
  renderMessageFooter?: (message: ThreadMessage) => ReactNode;
};

export function MentorThread({
  conversationKey,
  messages,
  pendingUserText,
  isStreaming,
  isAwaitingReply,
  mentorState,
  isLoading,
  error,
  onRetry,
  isRetrying,
  header,
  emptyState,
  renderMessageFooter,
}: MentorThreadProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const stickToBottomRef = useRef(true);
  const lastMessage = messages[messages.length - 1];

  // Follow new content only while the reader is already near the bottom, so
  // scrolling back to re-read an answer is never interrupted.
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
  };

  useLayoutEffect(() => {
    stickToBottomRef.current = true;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [conversationKey, isLoading]);

  // The founder's own submission always brings the conversation back into view.
  useEffect(() => {
    if (pendingUserText || lastMessage?.role === "user") stickToBottomRef.current = true;
  }, [pendingUserText, lastMessage?.role, lastMessage?.id]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !stickToBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, lastMessage?.text, pendingUserText, isAwaitingReply, error]);

  const hasContent = messages.length > 0 || Boolean(pendingUserText);

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-color:rgba(143,179,207,0.22)_transparent] [scrollbar-width:thin]"
    >
      <div className="mx-auto w-full max-w-[760px] px-4 pb-10 pt-6 sm:px-6 md:pt-8">
        {header}

        {isLoading ? (
          <ThreadLoading />
        ) : !hasContent ? (
          emptyState
        ) : (
          <div className="space-y-8">
            {messages.map((message, index) => {
              if (message.role === "user") {
                return <UserMessage key={message.id} text={message.text} />;
              }

              const streamingThis = isStreaming && index === messages.length - 1;
              return (
                <MentorMessage
                  key={message.id}
                  text={message.text}
                  avatarState={streamingThis ? mentorState : "idle"}
                  isStreaming={streamingThis}
                  footer={streamingThis ? undefined : renderMessageFooter?.(message)}
                />
              );
            })}

            {pendingUserText && <UserMessage text={pendingUserText} />}
            {isAwaitingReply && <MentorPendingMessage state={mentorState} />}
            {error && (
              <ThreadErrorNotice error={error} onRetry={onRetry} isRetrying={isRetrying} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
