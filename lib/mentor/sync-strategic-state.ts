import type { SupabaseClient } from "@supabase/supabase-js";

type UnknownSupabase = SupabaseClient;

type StrategicStateInput = {
  userId: string;
  currentFocus: string | null;
  topPriorities: string[];
  knownProblems: string[];
  opportunities: string[];
  currentOfferSummary: string | null;
  currentGrowthStage: string | null;
  lastUpdated?: string;
};

const COLUMN_OR_TABLE_MISSING_CODES = new Set(["42P01", "42703"]);

function sanitizeString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function sanitizeArray(items: unknown): string[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0
  );
}

export async function syncStrategicState(
  supabase: UnknownSupabase,
  input: StrategicStateInput
): Promise<void> {
  try {
    const payload = {
      user_id: input.userId,
      current_focus: sanitizeString(input.currentFocus),
      top_priorities: sanitizeArray(input.topPriorities),
      known_problems: sanitizeArray(input.knownProblems),
      opportunities: sanitizeArray(input.opportunities),
      current_offer_summary: sanitizeString(input.currentOfferSummary),
      current_growth_stage: sanitizeString(input.currentGrowthStage),
      last_updated: input.lastUpdated ?? new Date().toISOString(),
    };

    const { error } = await supabase
      .from("strategic_state")
      .upsert(payload, { onConflict: "user_id" });

    if (error && !COLUMN_OR_TABLE_MISSING_CODES.has(error.code ?? "")) {
      console.error("STRATEGIC_STATE_UPSERT_ERROR", error);
    }
  } catch (error) {
    console.error("STRATEGIC_STATE_UPSERT_EXCEPTION", error);
  }
}
