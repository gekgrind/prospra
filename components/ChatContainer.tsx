// components/ChatContainer.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";
import LoadingDots from "./LoadingDots";
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();

export default function ChatContainer() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  async function sendMessage(message: string) {
    setLoading(true);

    // Get logged in user
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "You must be logged in to chat with Prospra." }
      ]);
      setLoading(false);
      return;
    }

    // Add user's message to UI immediately
    setMessages((prev) => [...prev, { role: "user", content: message }]);

    // Send to mentor API
    const res = await fetch("/api/mentor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, message })
    });

    const data = await res.json();

    // Add mentor's reply
    setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);

    setLoading(false);
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="flex flex-col h-[90vh] w-full max-w-3xl mx-auto bg-brandNavyDark border border-brandNavy rounded-xl shadow-xl overflow-hidden">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-brandNavyDark">
        {messages.map((msg, index) => (
          <ChatBubble key={index} role={msg.role} content={msg.content} />
        ))}
        {loading && <LoadingDots />}
        <div ref={bottomRef} />
      </div>

      {/* Chat Input */}
      <ChatInput onSend={sendMessage} />
    </div>
  );
}
