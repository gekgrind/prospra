import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Stripe checkout for the Premium plan. Uses Stripe's REST API directly
// (no SDK dependency), following the raw-fetch precedent used for
// Anthropic in /api/generate-prompt.
//
// BILLING CONFIG FLAG: checkout is only live when STRIPE_SECRET_KEY and
// STRIPE_PREMIUM_PRICE_ID are set. Without them this route degrades to a
// redirect back to /upgrade with a clear "billing unavailable" notice
// instead of the previous behavior (404 on form submit).

function appUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_PROSPRA_APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path}`;
}

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(appUrl("/upgrade?billing=signin"), 303);
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const premiumPriceId = process.env.STRIPE_PREMIUM_PRICE_ID;

    if (!stripeSecretKey || !premiumPriceId) {
      console.warn(
        "[UPGRADE] Stripe is not configured (STRIPE_SECRET_KEY / STRIPE_PREMIUM_PRICE_ID missing); checkout unavailable."
      );
      return NextResponse.redirect(appUrl("/upgrade?billing=unavailable"), 303);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("email, stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    const params = new URLSearchParams({
      mode: "subscription",
      "line_items[0][price]": premiumPriceId,
      "line_items[0][quantity]": "1",
      client_reference_id: user.id,
      success_url: appUrl("/upgrade?billing=success"),
      cancel_url: appUrl("/upgrade?billing=cancelled"),
      "subscription_data[metadata][user_id]": user.id,
      "metadata[user_id]": user.id,
    });

    if (profile?.stripe_customer_id) {
      params.set("customer", profile.stripe_customer_id);
    } else if (profile?.email || user.email) {
      params.set("customer_email", profile?.email ?? user.email ?? "");
    }

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await response.json().catch(() => null);

    if (!response.ok || typeof session?.url !== "string") {
      console.error("[UPGRADE_STRIPE_ERROR]", session?.error ?? session);
      return NextResponse.redirect(appUrl("/upgrade?billing=error"), 303);
    }

    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    console.error("[UPGRADE_ERROR]", error);
    return NextResponse.redirect(appUrl("/upgrade?billing=error"), 303);
  }
}
