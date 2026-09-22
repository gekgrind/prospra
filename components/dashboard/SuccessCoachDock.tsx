"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";

import {
  describeMentorChatError,
  extractMessageText,
  type MentorUIMessageLike,
} from "@/lib/mentor/chat-client";

const COACH_MODE = "success-coach";

const WELCOME_MESSAGE: UIMessage = {
  id: "welcome",
  role: "assistant",
  parts: [
    {
      type: "text",
      text: "Hey founder, I’m your AI Success Coach. What’s the #1 thing you want help with this week?",
    },
  ],
};

/**
 * Dashboard Success Coach: a quick, ephemeral chat. It streams from /api/chat
 * like the Mentor, but sends no conversationId, so nothing is written to the
 * founder's Mentor conversation history. The coach persona and format live
 * server-side (mode "success-coach").
 */
export function SuccessCoachDock() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const submitLockRef = useRef(false);

  const { messages, sendMessage, regenerate, status, error, clearError } = useChat({
    id: "success-coach-dock",
    messages: [WELCOME_MESSAGE],
  });

  const isSending = status === "submitted" || status === "streaming";
  const visibleMessages = messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({
      id: message.id,
      role: message.role as "user" | "assistant",
      content: extractMessageText(message as MentorUIMessageLike),
    }))
    .filter((message) => message.content.trim().length > 0);
  const lastVisible = visibleMessages[visibleMessages.length - 1];
  const isAwaitingFirstToken =
    status === "submitted" || (status === "streaming" && lastVisible?.role !== "assistant");
  const errorInfo = error ? describeMentorChatError(error) : null;

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [lastVisible?.content, visibleMessages.length, isOpen, error]);

  useEffect(() => {
    if (status !== "submitted" && status !== "streaming") submitLockRef.current = false;
  }, [status]);

  function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isSending || submitLockRef.current) return;

    submitLockRef.current = true;
    clearError();
    setInput("");
    void sendMessage({ text }, { body: { mode: COACH_MODE } });
  }

  function handleRetry() {
    if (isSending || submitLockRef.current) return;
    submitLockRef.current = true;
    clearError();
    void regenerate({ body: { mode: COACH_MODE } });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          setIsMinimized(false);
        }}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-[#00D4FF]/25 bg-[linear-gradient(135deg,rgba(15,34,61,0.96)_0%,rgba(10,20,38,0.96)_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl transition hover:scale-[1.02] hover:border-[#00D4FF]/45"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00D4FF]/60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#00D4FF] shadow-[0_0_14px_rgba(0,212,255,0.85)]" />
        </span>
        <span>Success Coach</span>
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-5 z-40 flex w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-[28px] border border-[#4f7ca7]/20 bg-[rgba(10,20,38,0.88)] text-sm text-white shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,212,255,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(79,124,167,0.12),transparent_34%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00D4FF]/60 to-transparent" />

          <div className="relative flex items-start justify-between gap-3 border-b border-white/5 px-4 py-4">
            <div>
              <p className="inline-flex items-center rounded-full border border-[#00D4FF]/20 bg-[#00D4FF]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#00D4FF]">
                AI Success Coach
              </p>
              <p className="mt-2 text-[0.78rem] leading-5 text-[#c7d8ea]/72">
                Get a quick game plan in 2 to 3 messages.
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsMinimized((prev) => !prev)}
                className="rounded-full border border-transparent px-2 py-1 text-[#c7d8ea]/72 transition hover:border-white/10 hover:bg-white/5 hover:text-white"
                aria-label={isMinimized ? "Expand coach dock" : "Minimize coach dock"}
              >
                {isMinimized ? "▴" : "▾"}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-transparent px-2 py-1 text-[#c7d8ea]/72 transition hover:border-white/10 hover:bg-white/5 hover:text-white"
                aria-label="Close coach dock"
              >
                ✕
              </button>
            </div>
          </div>

          {!isMinimized && (
            <div className="relative flex flex-col">
              <div
                ref={containerRef}
                className="max-h-80 space-y-3 overflow-y-auto px-4 py-4"
              >
                {visibleMessages.map((message) => {
                  const isUser = message.role === "user";

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl border px-3.5 py-2.5 text-[0.82rem] leading-6 ${
                          isUser
                            ? "border-[#4f7ca7]/20 bg-[rgba(255,255,255,0.05)] text-[#eef6ff]"
                            : "border-[#00D4FF]/18 bg-[#00D4FF]/8 text-[#e8fbff]"
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  );
                })}

                {isAwaitingFirstToken && (
                  <div className="flex justify-start" aria-label="Coach is thinking">
                    <div className="rounded-2xl border border-[#00D4FF]/18 bg-[#00D4FF]/8 px-3.5 py-2.5 text-[0.82rem] text-[#e8fbff]">
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00D4FF]" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00D4FF] [animation-delay:120ms]" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00D4FF] [animation-delay:240ms]" />
                      </span>
                    </div>
                  </div>
                )}

                {errorInfo && !isSending && (
                  <div className="flex justify-start" role="alert">
                    <div className="max-w-[85%] rounded-2xl border border-[#ff8a7a]/25 bg-[#ff6b5a]/[0.06] px-3.5 py-2.5 text-[0.82rem] leading-6 text-[#ffd9d3]">
                      <p>
                        {errorInfo.kind === "generic"
                          ? "Something glitched on my side. Give it another shot."
                          : errorInfo.message}
                      </p>
                      {errorInfo.kind === "generic" && (
                        <button
                          type="button"
                          onClick={handleRetry}
                          className="mt-1.5 text-[0.75rem] font-semibold text-[#ffe4df] underline underline-offset-2 hover:text-white"
                        >
                          Try again
                        </button>
                      )}
                      {errorInfo.kind === "usage_limit" && (
                        <Link
                          href="/upgrade"
                          className="mt-1.5 inline-block text-[0.75rem] font-semibold text-brandYellow underline underline-offset-2"
                        >
                          Upgrade
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <form
                onSubmit={handleSend}
                className="border-t border-white/5 px-4 py-3"
              >
                <div className="flex items-center gap-2 rounded-full border border-[#4f7ca7]/20 bg-[#07111f]/90 p-1.5">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about your next move..."
                    aria-label="Message your Success Coach"
                    className="flex-1 bg-transparent px-3 py-1.5 text-[0.82rem] text-white outline-none placeholder:text-[#8aa6c1]"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !input.trim()}
                    className="inline-flex items-center justify-center rounded-full border border-[#00D4FF]/25 bg-[#0f223d] px-3.5 py-2 text-[0.75rem] font-semibold text-white transition hover:border-[#00D4FF]/45 hover:bg-[#143055] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSending ? "..." : "Send"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  );
}