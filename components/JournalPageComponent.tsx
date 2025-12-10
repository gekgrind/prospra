"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function JournalPageComponent() {
  const supabase = createClient();

  const [entry, setEntry] = useState("");
  const [mood, setMood] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function saveEntry() {
    setLoading(true);
    setMessage("");

    // Get current logged in user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("You must be logged in to save journal entries.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("daily_journal").insert({
      user_id: user.id,
      entry,
      mood: mood || null,
    });

    if (error) {
      setMessage("Failed to save journal entry.");
    } else {
      setMessage("Journal entry saved!");
      setEntry("");
      setMood("");
    }

    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-white mb-2">Daily Journal</h1>
      <p className="text-white/70">
        Reflect, release, and record your progress one day at a time.
      </p>

      {/* Journal Entry Box */}
      <textarea
        className="w-full border border-slate-700 bg-slate-900 text-white p-4 rounded-xl min-h-[200px] focus:outline-none focus:ring focus:ring-brandBlue/40"
        placeholder="Write your thoughts, progress, and reflections..."
        value={entry}
        onChange={(e) => setEntry(e.target.value)}
      />

      {/* Mood Input */}
      <input
        type="text"
        className="w-full border border-slate-700 bg-slate-900 text-white p-3 rounded-xl focus:outline-none focus:ring focus:ring-brandBlue/40"
        placeholder="Mood (optional) — e.g. motivated, overwhelmed, excited"
        value={mood}
        onChange={(e) => setMood(e.target.value)}
      />

      {/* Save Button */}
      <button
        onClick={saveEntry}
        disabled={loading}
        className="w-full bg-brandBlue text-white py-3 rounded-xl font-semibold hover:bg-brandBlue/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Saving..." : "Save Entry"}
      </button>

      {/* Message Feedback */}
      {message && (
        <p
          className={`text-center text-sm mt-2 ${
            message.includes("saved") ? "text-green-400" : "text-red-400"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
