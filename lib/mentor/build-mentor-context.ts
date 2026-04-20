import type { SupabaseClient } from "@supabase/supabase-js";

import { getBusinessProfile, type BusinessProfile } from "@/lib/mentor/get-business-profile";
import {
  getWebsiteIntelligence,
  type WebsiteIntelligence,
} from "@/lib/mentor/get-website-intelligence";
import { getStrategicState, type StrategicState } from "@/lib/mentor/get-strategic-state";

export type MentorContext = {
  businessProfile: BusinessProfile | null;
  websiteIntelligence: WebsiteIntelligence | null;
  strategicState: StrategicState | null;
  recentConversationSummaries: Array<{
    conversationId: string;
    summary: string;
    recommendedPriority: string | null;
    riskOrBlocker: string | null;
    updatedAt: string | null;
  }>;
};

type UnknownSupabase = SupabaseClient;

type ConversationOutputRow = {
  conversation_id?: unknown;
  summary?: unknown;
  recommended_priority?: unknown;
  risk_or_blocker?: unknown;
  updated_at?: unknown;
};

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

async function getRecentConversationSummaries({
  supabase,
  userId,
  conversationId,
}: {
  supabase: UnknownSupabase;
  userId: string;
  conversationId?: string;
}): Promise<MentorContext["recentConversationSummaries"]> {
  try {
    let query = supabase
      .from("conversation_outputs")
      .select(
        "conversation_id, summary, recommended_priority, risk_or_blocker, updated_at"
      )
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(5);

    if (conversationId) {
      query = query.neq("conversation_id", conversationId);
    }

    const { data, error } = await query;

    if (error || !data) {
      return [];
    }

    return (data as ConversationOutputRow[])
      .map((row) => {
        const id = asString(row.conversation_id);
        const summary = asString(row.summary);

        if (!id || !summary) {
          return null;
        }

        return {
          conversationId: id,
          summary,
          recommendedPriority: asString(row.recommended_priority),
          riskOrBlocker: asString(row.risk_or_blocker),
          updatedAt: asString(row.updated_at),
        };
      })
      .filter(
        (
          row
        ): row is {
          conversationId: string;
          summary: string;
          recommendedPriority: string | null;
          riskOrBlocker: string | null;
          updatedAt: string | null;
        } => row !== null
      );
  } catch {
    return [];
  }
}

export async function buildMentorContext({
  supabase,
  userId,
  conversationId,
}: {
  supabase: UnknownSupabase;
  userId: string;
  conversationId?: string;
}): Promise<MentorContext> {
  const [businessProfile, websiteIntelligence, strategicState, recentConversationSummaries] =
    await Promise.all([
      getBusinessProfile({ supabase, userId }),
      getWebsiteIntelligence({ supabase, userId }),
      getStrategicState({ supabase, userId }),
      getRecentConversationSummaries({ supabase, userId, conversationId }),
    ]);

  return {
    businessProfile,
    websiteIntelligence,
    strategicState,
    recentConversationSummaries,
  };
}
