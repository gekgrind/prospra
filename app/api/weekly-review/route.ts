import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import {
  buildSummaryData,
  deriveFallbackNarrative,
  getRollingWeeklyWindow,
  type WeeklyReviewNarrative,
} from "@/lib/weekly-review";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const WEEKLY_REVIEWS_TABLE = "weekly_reviews" as unknown as "journal_entries";

type DbWeeklyReview = {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  window_type: "rolling_7d";
  summary_data: unknown;
  narrative: unknown;
  generated_with_ai: boolean;
  created_at: string;
  updated_at: string;
};

async function generateNarrative(summaryData: ReturnType<typeof buildSummaryData>) {
  const fallback = deriveFallbackNarrative(summaryData);

  if (!process.env.OPENAI_API_KEY) {
    return { narrative: fallback, generatedWithAi: false };
  }

  try {
    const prompt = `You are Prospra, an execution-focused founder coach.
Use only the provided structured facts. Do not invent achievements.
Return compact JSON with keys: reflectionSummary, focusRecommendation, suggestedMentorPrompt.

Facts:
${JSON.stringify(summaryData, null, 2)}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You write practical, founder-relevant weekly recaps." },
        { role: "user", content: prompt },
      ],
      max_tokens: 350,
    });

    const raw = completion.choices?.[0]?.message?.content;
    if (!raw) return { narrative: fallback, generatedWithAi: false };

    const parsed = JSON.parse(raw) as Partial<WeeklyReviewNarrative>;

    if (!parsed.reflectionSummary || !parsed.focusRecommendation || !parsed.suggestedMentorPrompt) {
      return { narrative: fallback, generatedWithAi: false };
    }

    return {
      narrative: {
        reflectionSummary: parsed.reflectionSummary,
        focusRecommendation: parsed.focusRecommendation,
        suggestedMentorPrompt: parsed.suggestedMentorPrompt,
      },
      generatedWithAi: true,
    };
  } catch {
    return { narrative: fallback, generatedWithAi: false };
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { periodStartIso, periodEndIso } = getRollingWeeklyWindow();

    const { data, error } = await supabase
      .from(WEEKLY_REVIEWS_TABLE)
      .select("*")
      .eq("user_id", user.id)
      .eq("window_type", "rolling_7d")
      .eq("period_start", periodStartIso)
      .eq("period_end", periodEndIso)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ review: (data as DbWeeklyReview | null) ?? null });
  } catch (error) {
    console.error("[WEEKLY_REVIEW_GET_ERROR]", error);
    return NextResponse.json({ error: "Failed to load weekly review" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const forceRegenerate = Boolean(body?.forceRegenerate);

    const { start, end, periodStartIso, periodEndIso } = getRollingWeeklyWindow();

    if (!forceRegenerate) {
      const { data: existing } = await supabase
        .from(WEEKLY_REVIEWS_TABLE)
        .select("*")
        .eq("user_id", user.id)
        .eq("window_type", "rolling_7d")
        .eq("period_start", periodStartIso)
        .eq("period_end", periodEndIso)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ review: existing, reused: true });
      }
    }

    const [journalResult, goalsResult, convoResult, insightsResult] = await Promise.all([
      supabase
        .from("journal_entries")
        .select("entry_date, created_at, wins, progress_notes, challenges")
        .eq("user_id", user.id)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString()),
      supabase
        .from("plans")
        .select("label, current_value, target_value")
        .eq("user_id", user.id),
      supabase
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("updated_at", start.toISOString())
        .lte("updated_at", end.toISOString()),
      supabase
        .from("mentor_sync_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString()),
    ]);

    if (journalResult.error) throw journalResult.error;
    if (goalsResult.error) throw goalsResult.error;
    if (convoResult.error) throw convoResult.error;
    if (insightsResult.error) throw insightsResult.error;

    const summaryData = buildSummaryData({
      journalEntries: journalResult.data ?? [],
      goals: goalsResult.data ?? [],
      mentorConversationCount: convoResult.count ?? 0,
      mentorInsightCount: insightsResult.count ?? 0,
    });

    const { narrative, generatedWithAi } = await generateNarrative(summaryData);

    const payload = {
      user_id: user.id,
      period_start: periodStartIso,
      period_end: periodEndIso,
      window_type: "rolling_7d",
      summary_data: summaryData,
      narrative,
      generated_with_ai: generatedWithAi,
    };

    const query = supabase.from(WEEKLY_REVIEWS_TABLE);

    let saved;
    if (forceRegenerate) {
      const { data, error } = await query
        .upsert(payload, {
          onConflict: "user_id,window_type,period_start,period_end",
        })
        .select("*")
        .single();
      if (error) throw error;
      saved = data;
    } else {
      const { data, error } = await query.insert(payload).select("*").single();
      if (error) throw error;
      saved = data;
    }

    return NextResponse.json({ review: saved, reused: false });
  } catch (error) {
    console.error("[WEEKLY_REVIEW_POST_ERROR]", error);
    return NextResponse.json({ error: "Failed to generate weekly review" }, { status: 500 });
  }
}
