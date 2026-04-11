import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPremiumProfile } from "@/lib/identity/entitlements";
import { getBillingProfile } from "@/lib/identity/profile";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          used: 0,
          limit: 20,
          isPremium: false,
          remaining: 20,
          resetWindow: "daily",
        },
        { status: 200 }
      );
    }

    const profile = await getBillingProfile(supabase, user.id);
    const isPremium = isPremiumProfile(profile);

    if (isPremium) {
      return NextResponse.json(
        {
          used: 0,
          limit: null,
          isPremium: true,
          remaining: null,
          resetWindow: "daily",
        },
        { status: 200 }
      );
    }

    const DAILY_LIMIT = 20;

    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).toISOString();

    const { count, error } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("role", "user")
      .eq("user_id", user.id)
      .gte("created_at", startOfDay);

    if (error) {
      throw error;
    }

    const used = count ?? 0;
    const limit = DAILY_LIMIT;

    return NextResponse.json(
      {
        used,
        limit,
        isPremium: false,
        remaining: Math.max(0, limit - used),
        resetWindow: "daily",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CREDITS_API_ERROR", error);

    return NextResponse.json(
      {
        used: 0,
        limit: 20,
        isPremium: false,
        remaining: 20,
        resetWindow: "daily",
      },
      { status: 200 }
    );
  }
}