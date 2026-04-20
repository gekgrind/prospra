import type { SupabaseClient } from "@supabase/supabase-js";

export type WebsiteIntelligence = {
  userId: string;
  websiteUrl: string | null;
  homepageSummary: string | null;
  offerClarityScore: number | null;
  seoScore: number | null;
  uxScore: number | null;
  ctaScore: number | null;
  funnelSummary: string | null;
  keyIssues: string[];
  recommendedFixes: string[];
  updatedAt: string | null;
};

type UnknownSupabase = SupabaseClient;

type WebsiteIntelligenceRow = {
  website_url?: unknown;
  homepage_summary?: unknown;
  offer_clarity_score?: unknown;
  seo_score?: unknown;
  ux_score?: unknown;
  cta_score?: unknown;
  funnel_summary?: unknown;
  key_issues?: unknown;
  recommended_fixes?: unknown;
  updated_at?: unknown;
};

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0
  );
}

export async function getWebsiteIntelligence({
  supabase,
  userId,
}: {
  supabase: UnknownSupabase;
  userId: string;
}): Promise<WebsiteIntelligence | null> {
  try {
    const { data, error } = await supabase
      .from("website_intelligence")
      .select(
        "website_url, homepage_summary, offer_clarity_score, seo_score, ux_score, cta_score, funnel_summary, key_issues, recommended_fixes, updated_at"
      )
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const row = data as WebsiteIntelligenceRow;

    return {
      userId,
      websiteUrl: asString(row.website_url),
      homepageSummary: asString(row.homepage_summary),
      offerClarityScore: asNumber(row.offer_clarity_score),
      seoScore: asNumber(row.seo_score),
      uxScore: asNumber(row.ux_score),
      ctaScore: asNumber(row.cta_score),
      funnelSummary: asString(row.funnel_summary),
      keyIssues: asStringArray(row.key_issues),
      recommendedFixes: asStringArray(row.recommended_fixes),
      updatedAt: asString(row.updated_at),
    };
  } catch {
    return null;
  }
}
