// /components/dashboard/SuccessCoachDock.tsx

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
        "Hey founder – I’m your AI Success Coach. What’s the #1 thing you want help with this week?",
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
        content: data.reply ?? "I’m here – let’s break this down together.",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("[SUCCESS_COACH_ERROR]", err);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content:
          "Hmm, something glitched on my side. Try again in a moment – or refresh the page.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      {/* FAB button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          setIsMinimized(false);
        }}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/30 transition hover:scale-105 hover:shadow-xl"
      >
        <span>Success Coach</span>
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-40 flex w-full max-w-sm flex-col rounded-2xl bg-[#050816]/95 p-3 text-sm text-slate-100 shadow-2xl shadow-black/50 backdrop-blur-lg border border-white/10">
          <div className="flex items-center justify-between gap-2 pb-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-orange-300/80">
                AI Success Coach
              </p>
              <p className="text-[0.78rem] text-slate-400">
                Get a quick gameplan in 2–3 messages.
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsMinimized((prev) => !prev)}
                className="rounded-full p-1 hover:bg-white/10"
              >
                {isMinimized ? "▴" : "▾"}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 hover:bg-white/10"
              >
                ✕
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <div
                ref={containerRef}
                className="mb-2 max-h-64 space-y-2 overflow-y-auto pr-1 custom-scrollbar"
              >
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${
                      m.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`rounded-xl px-3 py-2 text-[0.8rem] leading-snug ${
                        m.role === "user"
                          ? "bg-blue-600/80 text-slate-50"
                          : "bg-white/5 text-slate-100 border border-white/5"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSend} className="flex items-center gap-2 pt-1">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your next move..."
                  className="flex-1 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[0.8rem] outline-none placeholder:text-slate-500 focus:border-orange-400/80"
                />
                <button
                  type="submit"
                  disabled={isSending || !input.trim()}
                  className="rounded-full bg-gradient-to-r from-orange-500 to-blue-500 px-3 py-1.5 text-[0.75rem] font-semibold text-white shadow-md shadow-black/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSending ? "..." : "Send"}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
