import { createClient } from "@/lib/supabase/server";
import { isPremiumProfile } from "@/lib/identity/entitlements";

export async function resetAndCheckCredits(userId: string) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("daily_credits_used, daily_credit_limit, last_credit_reset, is_premium, plan_tier, subscription_status")
    .eq("id", userId)
    .single();

  if (!profile) return { allowed: false };

  const today = new Date().toISOString().split("T")[0];

  if (profile.last_credit_reset !== today) {
    await supabase
      .from("profiles")
      .update({
        daily_credits_used: 0,
        last_credit_reset: today,
      })
      .eq("id", userId);

    profile.daily_credits_used = 0;
  }

  if (isPremiumProfile(profile as any)) {
    return { allowed: true, premium: true };
  }

  if (profile.daily_credits_used >= profile.daily_credit_limit) {
    return { allowed: false, premium: false };
  }

  await supabase
    .from("profiles")
    .update({
      daily_credits_used: profile.daily_credits_used + 1,
    })
    .eq("id", userId);

  return { allowed: true, premium: false };
}
