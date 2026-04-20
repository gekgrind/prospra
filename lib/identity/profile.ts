import { SupabaseClient } from "@supabase/supabase-js";

export const SHARED_PROFILE_COLUMNS = [
  "id",
  "email",
  "full_name",
  "avatar_url",
  "plan_tier",
  "stripe_customer_id",
  "stripe_subscription_id",
  "subscription_status",
  "subscription_provider",
  "has_prospra_access",
  "has_synceri_access",
  "created_at",
  "updated_at",
] as const;

export const SHARED_PROFILE_SELECT = SHARED_PROFILE_COLUMNS.join(",");

export type SharedProfile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan_tier: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  subscription_provider: string | null;
  has_prospra_access: boolean;
  has_synceri_access: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export type BillingProfile = {
  id: string;
  is_premium?: boolean | null;
  plan_tier: string;
  subscription_status: string | null;
  subscription_provider: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};

export async function getBillingProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<BillingProfile | null> {
  const { data } = await supabase
    .from("profiles")
    .select(
      "id,is_premium,plan_tier,subscription_status,subscription_provider,stripe_customer_id,stripe_subscription_id"
    )
    .eq("id", userId)
    .maybeSingle();

  return (data as BillingProfile | null) ?? null;
}