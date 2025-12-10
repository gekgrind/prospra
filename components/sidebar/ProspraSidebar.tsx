// app/mentor/page.tsx — Prospra Mentor Chat (Fully Branded)
// Uses /api/mentor route, ChatBubble, ChatInput, and Entrepreneuria UI

"use client";

import { useState } from "react";
import ChatBubble from "@/components/chat/ChatBubble";
import ChatInput from "@/components/chat/ChatInput";
import { Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function MentorChatPage() {
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Hey visionary! I’m Prospra — your AI mentor. What are we building today? 🚀",
  }]);

  const [isLoading, setIsLoading] = useState(false);

  async function sendMessage(message: string) {
    const userMessage: Message = { role: "user", content: message };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.reply,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Hmm… something went wrong. Try again?",
      }]);
    }

    setIsLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[85vh] p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl bg-brandBlue flex items-center justify-center shadow-lg">
          <Sparkles className="text-white h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold text-brandBlueLight">Prospra Mentor</h1>
      </div>

      {/* Chat Window */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-xl bg-brandNavy border border-brandBlue shadow-inner">
        {messages.map((msg, i) => (
          <ChatBubble key={i} role={msg.role} content={msg.content} />
        ))}

        {isLoading && (
          <ChatBubble
            role="assistant"
            content="Thinking through your question… ✨"
          />
        )}
      </div>

      {/* Input */}
      <div className="mt-4">
        <ChatInput onSend={sendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
