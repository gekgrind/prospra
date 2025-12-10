import { createClient } from "@/lib/supabase/server";

export async function resetAndCheckCredits(userId: string) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!profile) return { allowed: false };

  const today = new Date().toISOString().split("T")[0];

  // Reset credits daily
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

  const isPremium =
    profile.plan_tier !== "free" &&
    profile.subscription_status === "active";

  if (isPremium) {
    return { allowed: true, premium: true };
  }

  if (profile.daily_credits_used >= profile.daily_credit_limit) {
    return { allowed: false, premium: false };
  }

  // Increment usage
  await supabase
    .from("profiles")
    .update({
      daily_credits_used: profile.daily_credits_used + 1,
    })
    .eq("id", userId);

  return { allowed: true, premium: false };
}
