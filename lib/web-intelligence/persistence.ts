import { createClient } from "@/lib/supabase/server";
import type { WebsiteIntelligenceSnapshot } from "@/lib/web-intelligence/types";

type WebsiteIntelligenceRow = {
  id: string;
  website_url: string | null;
  homepage_summary: string | null;
  offer_clarity_score: number | null;
  seo_score: number | null;
  ux_score: number | null;
  cta_score: number | null;
  funnel_summary: string | null;
  key_issues: unknown;
  recommended_fixes: unknown;
  raw_signals: unknown;
  created_at: string | null;
  updated_at: string | null;
};

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function mapWebsiteIntelligenceRow(row: WebsiteIntelligenceRow): WebsiteIntelligenceSnapshot {
  return {
    id: row.id,
    websiteUrl: row.website_url,
    homepageSummary: row.homepage_summary,
    offerClarityScore: row.offer_clarity_score,
    seoScore: row.seo_score,
    uxScore: row.ux_score,
    ctaScore: row.cta_score,
    funnelSummary: row.funnel_summary,
    keyIssues: normalizeStringArray(row.key_issues),
    recommendedFixes: normalizeStringArray(row.recommended_fixes),
    rawSignals: typeof row.raw_signals === "object" && row.raw_signals !== null ? (row.raw_signals as Record<string, unknown>) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function saveWebsiteIntelligenceSnapshot(
  userId: string,
  snapshot: WebsiteIntelligenceSnapshot
): Promise<WebsiteIntelligenceSnapshot> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("website_intelligence")
    .insert({
      user_id: userId,
      website_url: snapshot.websiteUrl,
      homepage_summary: snapshot.homepageSummary,
      offer_clarity_score: snapshot.offerClarityScore,
      seo_score: snapshot.seoScore,
      ux_score: snapshot.uxScore,
      cta_score: snapshot.ctaScore,
      funnel_summary: snapshot.funnelSummary,
      key_issues: snapshot.keyIssues,
      recommended_fixes: snapshot.recommendedFixes,
      raw_signals: snapshot.rawSignals ?? {},
    })
    .select(
      "id, website_url, homepage_summary, offer_clarity_score, seo_score, ux_score, cta_score, funnel_summary, key_issues, recommended_fixes, raw_signals, created_at, updated_at"
    )
    .single<WebsiteIntelligenceRow>();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not save website intelligence snapshot.");
  }

  return mapWebsiteIntelligenceRow(data);
}
