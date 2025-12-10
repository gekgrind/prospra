import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";

export const runtime = "edge"; // fast & cheap

// Make sure .env.local has:
// OPENAI_API_KEY=your_key_here

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

type Mode =
  | "summarize"
  | "positive"
  | "action_plan"
  | "tomorrow_focus"
  | "weekly_recap"
  | "monthly_recap"
  | "weekly_roadmap";

type JournalEntry = {
  id: string;
  user_id: string;
  entry_date: string | null;
  progress_notes: string | null;
  challenges: string | null;
  wins: string | null;
  mood: string | null;
  created_at: string;
};

function formatEntriesForHistory(entries: JournalEntry[]): string {
  if (!entries.length) return "(no historical entries found)";
  const trimmed = entries.slice(-20); // safety cap

  return trimmed
    .map((e) => {
      const date = e.entry_date || e.created_at;
      const mood = e.mood || "n/a";
      const progress = e.progress_notes?.slice(0, 400) || "(none)";
      const challenges = e.challenges?.slice(0, 400) || "(none)";
      const wins = e.wins?.slice(0, 400) || "(none)";
      return `Date: ${date}
Mood: ${mood}
Progress: ${progress}
Challenges: ${challenges}
Wins: ${wins}`;
    })
    .join("\n\n---\n\n");
}

async function getEntriesForPeriod(
  supabase: any,
  userId: string,
  days: number
): Promise<JournalEntry[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().slice(0, 10); // YYYY-MM-DD

  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", userId)
    .gte("entry_date", sinceStr)
    .order("entry_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data as JournalEntry[];
}

// Best-effort AI memory sync into ai_memory.
// This will NEVER break the response; errors are logged & ignored.
async function syncJournalMemory(opts: {
  supabase: any;
  userId: string;
  mode: Mode;
  text: string;
}) {
  const { supabase, userId, mode, text } = opts;

  try {
    const trimmed =
      text.length > 800 ? text.slice(0, 800) + "…" : text;

    // Crude importance heuristic
    const importance =
      mode === "weekly_roadmap" || mode === "action_plan"
        ? 5
        : mode === "weekly_recap" || mode === "monthly_recap"
        ? 4
        : mode === "tomorrow_focus"
        ? 4
        : 3;

    const memoryPayload = {
      user_id: userId,
      // Assuming your column is named "memory" + "importance"
      // (matches how we usually set up ai_memory with you)
      memory: `[journal/${mode}] ${trimmed}`,
      importance,
    };

    const { error } = await supabase
      .from("ai_memory")
      .insert(memoryPayload);

    if (error) {
      console.error("AI memory sync failed:", error);
    }
  } catch (err) {
    console.error("AI memory sync crashed:", err);
  }
}

function buildInstruction(mode: Mode): string {
  switch (mode) {
    case "summarize":
      return `
        Provide a warm, thoughtful summary of today's entry.
        Focus on clarity, encouragement, and key insights.
        Briefly call out any emerging trends you notice in the content.
        Keep it under 200 words.
      `;
    case "positive":
      return `
        Reframe the user's journal entry in a more positive, empowering,
        optimistic tone — without dismissing real struggles.
        Maintain authenticity. Focus on growth, resilience, and wins.
        You may point out subtle long-term improvements if visible.
        150 words or less.
      `;
    case "action_plan":
      return `
        Generate a clear, simple action plan based on today's entry.
        Include 3–5 steps.
        Steps should be doable, encouraging, and realistic.
        If possible, tie them to patterns or trends you notice.
      `;
    case "tomorrow_focus":
      return `
        Recommend the #1 most impactful focus for tomorrow
        based on the user's mood, progress, challenges, and wins.
        Include WHY it's the right focus and reference any trend you spot.
        Max 120 words.
      `;
    case "weekly_recap":
      return `
        Create a weekly recap using the last 7 days of entries.
        1) Start with a short narrative summary of the week.
        2) Explicitly call out trends in mood, energy, effort, and wins.
        3) Highlight 3–5 key insights the user should keep in mind.
        Keep it under 250 words.
      `;
    case "monthly_recap":
      return `
        Create a monthly recap using the last 30 days of entries.
        1) Summarize the overall arc of the month.
        2) Call out clear trends (improvements, recurring blocks, mood shifts).
        3) Highlight 3–5 big lessons or milestones.
        4) Close with a short encouragement.
        Aim for 250–350 words.
      `;
    case "weekly_roadmap":
      return `
        Using the last 7 days of entries and their patterns,
        design a concrete, step-by-step roadmap for the next 7 days.
        1) Briefly summarize the key trends you see (progress + friction).
        2) Propose 5–7 specific actions grouped by theme (e.g., Focus, Systems, Outreach).
        3) Make it very actionable and realistic for a solo entrepreneur.
        4) Include one mindset reminder for the week.
      `;
    default:
      return "Provide a helpful reflection based on the journal.";
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      mode,
      mood,
      progressNotes,
      challenges,
      wins,
      userId,
    }: {
      mode: Mode;
      mood?: string | null;
      progressNotes?: string;
      challenges?: string;
      wins?: string;
      userId: string;
    } = body;

    if (!mode || !userId) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseClient();

    // Build a snapshot of the current entry (if any)
    const journalText = `
Mood: ${mood || "Not selected"}

Progress Notes:
${progressNotes || "(empty)"}

Challenges:
${challenges || "(empty)"}

Wins:
${wins || "(empty)"}
    `.trim();

    // For weekly/monthly features, load history from Supabase
    let historyEntries: JournalEntry[] = [];
    let historyLabel = "";

    if (mode === "weekly_recap" || mode === "weekly_roadmap") {
      historyEntries = await getEntriesForPeriod(
        supabase,
        userId,
        7
      );
      historyLabel = "LAST 7 DAYS";
    } else if (mode === "monthly_recap") {
      historyEntries = await getEntriesForPeriod(
        supabase,
        userId,
        30
      );
      historyLabel = "LAST 30 DAYS";
    }

    const historyText = historyEntries.length
      ? formatEntriesForHistory(historyEntries)
      : "";

    const systemPrompt = `
      You are Prospra — an elite entrepreneurial mentor and emotional clarity assistant.
      You help founders reflect, spot patterns, and take focused action.
      You are warm, clear, encouraging, and never condescending.
      You ALWAYS respect the user's lived experience and avoid toxic positivity.
      You explicitly mention trends or patterns when relevant.
    `;

    const instruction = buildInstruction(mode);

    const userPromptParts = [
      `MODE: ${mode}`,
      `INSTRUCTION: ${instruction}`,
      "",
      "CURRENT ENTRY (if any):",
      journalText || "(no current entry provided)",
    ];

    if (historyText) {
      userPromptParts.push(
        "",
        `${historyLabel} JOURNAL HISTORY:`,
        historyText
      );
    }

    const userPrompt = userPromptParts.join("\n");

    // --- AI CALL ---
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini", // swap to "gpt-4.1" if desired
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 700,
      temperature: 0.8,
    });

    const text =
      completion.choices?.[0]?.message?.content ||
      "No response generated.";

    // 🔁 AI Memory Sync (non-blocking)
    // Fire and forget; don't delay the response if it fails.
    syncJournalMemory({
      supabase,
      userId,
      mode,
      text,
    }).catch((err) =>
      console.error("Memory sync background error:", err)
    );

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("Journal AI Error:", error);
    return NextResponse.json(
      { error: error.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
