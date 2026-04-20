import type { SupabaseClient } from "@supabase/supabase-js";

export type BusinessProfile = {
  userId: string;
  fullName: string | null;
  profileName: string | null;
  businessIdea: string | null;
  industry: string | null;
  experienceLevel: string | null;
  goals: string[];
  businessName: string | null;
  businessDescription: string | null;
  targetAudience: string | null;
  primaryOffer: string | null;
  pricingModel: string | null;
  businessStage: string | null;
  constraints: string[] | null;
  websiteUrl: string | null;
};

type UnknownSupabase = SupabaseClient;

type ProfilesRow = {
  full_name?: unknown;
  profileName?: unknown;
  business_idea?: unknown;
  industry?: unknown;
  experience_level?: unknown;
  goals?: unknown;
  business_name?: unknown;
  business_description?: unknown;
  target_audience?: unknown;
  primary_offer?: unknown;
  pricing_model?: unknown;
  business_stage?: unknown;
  constraints?: unknown;
  website_url?: unknown;
};

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter(
      (goal): goal is string => typeof goal === "string" && goal.trim().length > 0
    );
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return [value.trim()];
  }

  return [];
}

async function queryProfile(
  supabase: UnknownSupabase,
  userId: string,
  selectClause: string
): Promise<ProfilesRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(selectClause)
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as ProfilesRow;
}

export async function getBusinessProfile({
  supabase,
  userId,
}: {
  supabase: UnknownSupabase;
  userId: string;
}): Promise<BusinessProfile | null> {
  try {
    const baseSelect =
      "full_name, profileName, business_idea, industry, experience_level, goals";
    const expandedSelect =
      `${baseSelect}, business_name, business_description, target_audience, primary_offer, pricing_model, business_stage, constraints, website_url`;

    const row =
      (await queryProfile(supabase, userId, expandedSelect)) ??
      (await queryProfile(supabase, userId, baseSelect));

    if (!row) {
      return null;
    }

    return {
      userId,
      fullName: asString(row.full_name),
      profileName: asString(row.profileName),
      businessIdea: asString(row.business_idea),
      industry: asString(row.industry),
      experienceLevel: asString(row.experience_level),
      goals: asStringArray(row.goals),
      businessName: asString(row.business_name),
      businessDescription: asString(row.business_description),
      targetAudience: asString(row.target_audience),
      primaryOffer: asString(row.primary_offer),
      pricingModel: asString(row.pricing_model),
      businessStage: asString(row.business_stage),
      constraints: (() => {
        const arr = asStringArray(row.constraints);
        return arr.length > 0 ? arr : null;
      })(),
      websiteUrl: asString(row.website_url),
    };
  } catch {
    return null;
  }
}
