import type { SupabaseClient } from "@supabase/supabase-js";

export type StrategicState = {
  userId: string;
  currentFocus: string | null;
  topPriorities: string[];
  knownProblems: string[];
  opportunities: string[];
  currentOfferSummary: string | null;
  currentGrowthStage: string | null;
  lastUpdated: string | null;
};

type UnknownSupabase = SupabaseClient;

type StrategicStateRow = {
  current_focus?: unknown;
  top_priorities?: unknown;
  known_problems?: unknown;
  opportunities?: unknown;
  current_offer_summary?: unknown;
  current_growth_stage?: unknown;
  last_updated?: unknown;
};

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0
  );
}

export async function getStrategicState({
  supabase,
  userId,
}: {
  supabase: UnknownSupabase;
  userId: string;
}): Promise<StrategicState | null> {
  try {
    const { data, error } = await supabase
      .from("strategic_state")
      .select(
        "current_focus, top_priorities, known_problems, opportunities, current_offer_summary, current_growth_stage, last_updated"
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const row = data as StrategicStateRow;

    return {
      userId,
      currentFocus: asString(row.current_focus),
      topPriorities: asStringArray(row.top_priorities),
      knownProblems: asStringArray(row.known_problems),
      opportunities: asStringArray(row.opportunities),
      currentOfferSummary: asString(row.current_offer_summary),
      currentGrowthStage: asString(row.current_growth_stage),
      lastUpdated: asString(row.last_updated),
    };
  } catch {
    return null;
  }
}
