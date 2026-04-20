import { createClient } from "@/lib/supabase/server";
import {
  mapWebsiteIntelligenceRow,
} from "@/lib/web-intelligence/persistence";
import type { WebsiteIntelligenceSnapshot } from "@/lib/web-intelligence/types";

type WebsiteIntelligenceRow = Parameters<typeof mapWebsiteIntelligenceRow>[0];

export async function getLatestWebsiteIntelligence(
  userId: string
): Promise<WebsiteIntelligenceSnapshot | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("website_intelligence")
    .select(
      "id, website_url, homepage_summary, offer_clarity_score, seo_score, ux_score, cta_score, funnel_summary, key_issues, recommended_fixes, raw_signals, created_at, updated_at"
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<WebsiteIntelligenceRow>();

  if (error) {
    console.error("Failed to fetch latest website intelligence:", error);
    return null;
  }

  return data ? mapWebsiteIntelligenceRow(data) : null;
}
