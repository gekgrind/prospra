import { createClient } from "@/lib/supabase/server";
import { isPremiumProfile } from "@/lib/identity/entitlements";
import { getBillingProfile } from "@/lib/identity/profile";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  // Read the same counters /api/chat enforces (messages has no user_id column,
  // so counting messages directly is not possible without a join).
  const { data: creditRow } = await supabase
    .from("profiles")
    .select("daily_credit_limit, daily_credits_used, last_credit_reset")
    .eq("id", user.id)
    .maybeSingle();

  const profile = await getBillingProfile(supabase, user.id);

  const isPremium = isPremiumProfile(profile);
  const today = new Date().toISOString().slice(0, 10);
  const limit = creditRow?.daily_credit_limit ?? 5;
  // Counter resets lazily on the next chat message; report 0 if it is stale.
  const used =
    creditRow?.last_credit_reset === today
      ? creditRow?.daily_credits_used ?? 0
      : 0;

  return new Response(
    JSON.stringify({
      used,
      remaining: isPremium ? Infinity : Math.max(0, limit - used),
      isPremium,
    }),
    { status: 200 }
  );
}
