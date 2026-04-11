import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendLifecycleEmail } from "@/lib/email/lifecycle";

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
    }

    if (!user.email) {
      return NextResponse.json({ ok: false, reason: "missing_email" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, name, full_name")
      .eq("id", user.id)
      .single();

    const firstName = profile?.name ?? profile?.full_name ?? user.email.split("@")[0];

    const result = await sendLifecycleEmail({
      type: "welcome",
      recipient: {
        userId: user.id,
        email: user.email,
        firstName,
      },
      payload: {
        firstName,
        ctaLabel: "Finish onboarding",
        ctaUrl: "/onboarding",
      },
      dedupeWindowHours: 24 * 30,
      triggerContext: {
        source: "signup_flow",
      },
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("welcome lifecycle send failed", error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
