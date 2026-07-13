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

    // Read the same counters /api/chat enforces (messages has no user_id column,
    // so counting messages directly is not possible without a join).
    const { data: creditRow, error } = await supabase
      .from("profiles")
      .select("daily_credit_limit, daily_credits_used, last_credit_reset")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const today = new Date().toISOString().slice(0, 10);
    const limit = creditRow?.daily_credit_limit ?? 5;
    // Counter resets lazily on the next chat message; report 0 if it is stale.
    const used =
      creditRow?.last_credit_reset === today
        ? creditRow?.daily_credits_used ?? 0
        : 0;

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