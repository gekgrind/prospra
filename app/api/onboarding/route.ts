// @ts-nocheck

import { NextResponse, NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  try {
    // Use the incoming request's cookies directly (same as proxy.ts)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            // Read auth cookies from this request
            return request.cookies.get(name)?.value;
          },
          // We don't need to mutate cookies in this route,
          // so these are safe no-ops.
          set() {},
          remove() {},
        },
      }
    );

    const data = await request.json();

    // ---- Build update object ----
    const updateData: any = {};
    const fields = [
      "name",
      "industry",
      "stage",
      "website",
      "audience",
      "offer",
      "goal90",
      "challenge",
    ];

    fields.forEach((key) => {
      if (data[key] !== undefined && data[key] !== null) {
        updateData[key] = data[key];
      }
    });

    updateData.onboarding_complete = true;

    // ---- Get User from Supabase (using request cookies) ----
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    console.log("🔍 Onboarding API - User check:", {
      hasUser: !!user,
      userId: user?.id,
      userError: userError?.message,
      cookiesPresent: request.cookies.getAll().map(c => c.name),
    });

    if (userError || !user) {
      console.error("❌ User error in onboarding route:", userError);
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    // ---- Update profile ----
    const { error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    // ---- Get access token for Edge Function ----
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const access_token = session?.access_token;

    // ---- Trigger Website Analyzer (optional) ----
    if (access_token && updateData.website) {
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/website-analyzer`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${access_token}`,
            },
            body: JSON.stringify({
              website: updateData.website,
              user_id: user.id,
            }),
          }
        );
      } catch (err) {
        console.error("Website analyzer error:", err);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("Onboarding API Error:", err);
    return NextResponse.json(
      { error: err.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
