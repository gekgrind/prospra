import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { used: 0, limit: 20, isPremium: false },
        { status: 200 }
      );
    }

    // Fetch profile for premium check
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_premium, plan_tier, subscription_status")
      .eq("id", user.id)
      .single();

    const isPremium =
      profile?.is_premium ||
      profile?.plan_tier === "premium" ||
      profile?.subscription_status === "active";

    // Premium users get unlimited credits
    if (isPremium) {
      return NextResponse.json(
        { used: 0, limit: 9999, isPremium: true },
        { status: 200 }
      );
    }

    // Free user daily limit
    const DAILY_LIMIT = 20;

    // Get today's message count
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).toISOString();

    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("role", "user")
      .eq("created_at", `gte.${startOfDay}`)
      .eq("user_id", user.id);

    return NextResponse.json(
      {
        used: count ?? 0,
        limit: DAILY_LIMIT,
        isPremium: false,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CREDITS API ERROR:", error);
    return NextResponse.json({ used: 0, limit: 20 }, { status: 200 });
  }
}
