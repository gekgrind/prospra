// components/ChatInput.tsx

"use client";

import { useState } from "react";
import { SendHorizonal } from "lucide-react";

export default function ChatInput({ onSend }: { onSend: (msg: string) => void }) {
  const [value, setValue] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function handleSend() {
    if (!value.trim() || isSending) return;

    setIsSending(true);
    await onSend(value.trim());
    setValue("");
    setIsSending(false);
  }

  return (
    <div className="flex items-center gap-3 p-4 border-t border-brandNavy bg-brandNavyDark">
      <input
        className="flex-1 rounded-xl p-3 bg-brandNavy text-white border border-brandBlue placeholder-brandBlueLight focus:outline-none focus:ring-2 focus:ring-brandBlueLight"
        placeholder="Ask Prospra anything…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSend();
        }}
      />

      <button
        onClick={handleSend}
        disabled={isSending}
        className={`flex items-center gap-2 px-5 py-3 rounded-xl shadow-md transition-all
          ${isSending ? "bg-brandBlueLight cursor-not-allowed" : "bg-brandOrange hover:bg-brandOrangeLight"}
          text-white font-semibold`
        }
      >
        {isSending ? "Sending…" : <SendHorizonal size={20} />}
      </button>
    </div>
  );
}
