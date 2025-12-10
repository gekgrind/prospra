import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  // Count today's messages
  const { count } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte(
      "created_at",
      new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
    );

  // Fetch premium
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_premium")
    .eq("id", user.id)
    .single();

  const DAILY_LIMIT = profile?.is_premium ? Infinity : 15;

  return Response.json({
    used: count ?? 0,
    limit: DAILY_LIMIT,
    remaining: profile?.is_premium ? Infinity : Math.max(0, DAILY_LIMIT - (count ?? 0)),
    isPremium: profile?.is_premium ?? false,
  });
}
