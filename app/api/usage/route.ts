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

  const { count } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("role", "user")
    .gte("created_at", new Date().toISOString().slice(0, 10));

  const profile = await getBillingProfile(supabase, user.id);

  const isPremium = isPremiumProfile(profile);
  const DAILY_LIMIT = isPremium ? Infinity : 15;

  return new Response(
    JSON.stringify({
      used: count ?? 0,
      remaining: isPremium ? Infinity : Math.max(0, DAILY_LIMIT - (count ?? 0)),
      isPremium,
    }),
    { status: 200 }
  );
}
