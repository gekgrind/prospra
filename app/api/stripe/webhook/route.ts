import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Stripe webhook for subscription lifecycle. Verifies the Stripe-Signature
// header manually (no SDK dependency). Only active when
// STRIPE_WEBHOOK_SECRET is set; otherwise responds 503 so Stripe retries
// are not silently swallowed while billing is unconfigured.

function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string
): boolean {
  const parts = signatureHeader.split(",").reduce<Record<string, string>>(
    (acc, part) => {
      const [key, value] = part.split("=");
      if (key && value) acc[key.trim()] = value.trim();
      return acc;
    },
    {}
  );

  const timestamp = parts.t;
  const signature = parts.v1;

  if (!timestamp || !signature) {
    return false;
  }

  // Reject events older than 5 minutes to limit replay.
  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(ageSeconds) || ageSeconds > 300) {
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

type StripeEvent = {
  type: string;
  data: {
    object: {
      id?: string;
      customer?: string;
      subscription?: string;
      status?: string;
      client_reference_id?: string;
      metadata?: Record<string, string>;
    };
  };
};

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook not configured" },
      { status: 503 }
    );
  }

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";

  if (!verifyStripeSignature(payload, signature, webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(payload) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const object = event.data?.object ?? {};

    if (event.type === "checkout.session.completed") {
      const userId = object.client_reference_id || object.metadata?.user_id;

      if (userId) {
        const { error } = await supabase
          .from("profiles")
          .update({
            is_premium: true,
            plan_tier: "premium",
            subscription_status: "active",
            subscription_provider: "stripe",
            stripe_customer_id: object.customer ?? null,
            stripe_subscription_id: object.subscription ?? null,
          })
          .eq("id", userId);

        if (error) throw error;
      }
    }

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const status =
        event.type === "customer.subscription.deleted"
          ? "canceled"
          : object.status ?? "unknown";
      const isActive = ACTIVE_STATUSES.has(status);

      const update = {
        is_premium: isActive,
        plan_tier: isActive ? "premium" : "free",
        subscription_status: status,
      };

      const userId = object.metadata?.user_id;

      const query = supabase.from("profiles").update(update);
      const { error } = userId
        ? await query.eq("id", userId)
        : await query.eq("stripe_customer_id", object.customer ?? "");

      if (error) throw error;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[STRIPE_WEBHOOK_ERROR]", error);
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }
}
