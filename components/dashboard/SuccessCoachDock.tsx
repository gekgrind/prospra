"use client";

import { useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function SuccessCoachDock() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hey founder, I’m your AI Success Coach. What’s the #1 thing you want help with this week?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [messages, isOpen]);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim() || isSending) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "success-coach",
          messages: [
            {
              role: "system",
              content:
                "You are Prospra, an AI Success Coach for entrepreneurs. Be practical, encouraging, and focused on concrete next steps tied to their goals and founder score.",
            },
            ...messages,
            userMessage,
          ].map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

      const data = await res.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.reply ?? "I’m here. Let’s break this into the next best move.",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("[SUCCESS_COACH_ERROR]", err);

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content:
          "Something glitched on my side. Give it another shot in a second, or refresh the page.",
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
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
                {messages.map((message) => {
                  const isUser = message.role === "user";

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl border px-3.5 py-2.5 text-[0.82rem] leading-6 ${
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

                {isSending && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl border border-[#00D4FF]/18 bg-[#00D4FF]/8 px-3.5 py-2.5 text-[0.82rem] text-[#e8fbff]">
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00D4FF]" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00D4FF] [animation-delay:120ms]" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00D4FF] [animation-delay:240ms]" />
                      </span>
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