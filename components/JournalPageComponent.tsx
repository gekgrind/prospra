// components/JournalPageComponent.tsx

"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function JournalPageComponent() {
  const [entry, setEntry] = useState("");
  const [mood, setMood] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function saveEntry() {
    setLoading(true);
    setMessage("");

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("You must be logged in to save journal entries.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("daily_journal").insert({
      user_id: user.id,
      entry,
      mood: mood || null
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
      <h1 className="text-3xl font-bold text-white mb-4">Daily Journal</h1>

      <textarea
        className="w-full border border-slate-700 bg-slate-900 text-white p-4 rounded-xl min-h-[200px]"
        placeholder="Write your thoughts, progress, and reflections..."
        value={entry}
        onChange={(e) => setEntry(e.target.value)}
      />

      <input
        type="text"
        className="w-full border border-slate-700 bg-slate-900 text-white p-3 rounded-xl"
        placeholder="Mood (optional) — e.g. motivated, overwhelmed, excited"
        value={mood}
        onChange={(e) => setMood(e.target.value)}
      />

      <button
        onClick={saveE
