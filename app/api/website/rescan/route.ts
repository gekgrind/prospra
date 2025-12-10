// app/api/website/rescan/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();

    /* -------------------------------------------------------
       1. Verify authenticated user
    --------------------------------------------------------*/
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    /* -------------------------------------------------------
       2. Load profile - must contain website_url
    --------------------------------------------------------*/
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("website_url")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile?.website_url) {
      return NextResponse.json(
        { error: "No website is saved in your profile." },
        { status: 400 }
      );
    }

    /* -------------------------------------------------------
       3. Get access token (JWT-enforced Edge Functions)
    --------------------------------------------------------*/
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const accessToken = session?.access_token;
    if (!accessToken) {
      return NextResponse.json(
        { error: "Missing access token" },
        { status: 401 }
      );
    }

    /* -------------------------------------------------------
       4. Call the Website Analyzer Edge Function
    --------------------------------------------------------*/
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/website-analyzer`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`, // REQUIRED for JWT enforcement
        },
        body: JSON.stringify({
          website: profile.website_url,
          user_id: user.id,
        }),
      }
    );

    // Attempt to parse analyzer response
    let output: any = null;
    try {
      output = await response.json();
    } catch {
      output = null;
    }

    if (!response.ok) {
      console.error("Website Analyzer failed:", output);
      return NextResponse.json(
        {
          error: "Website analyzer failed",
          details: output,
        },
        { status: 500 }
      );
    }

    /* -------------------------------------------------------
       5. Update last scanned timestamp
          (Analyzer inserts embeddings itself)
    --------------------------------------------------------*/
    await supabase
      .from("profiles")
      .update({
        website_last_scanned: new Date().toISOString(),
      })
      .eq("id", user.id);

    /* -------------------------------------------------------
       6. Optional: If analyzer returns AI insights, store them
          (supports Dashboard Website Insights widget)
    --------------------------------------------------------*/
    if (output?.summary) {
      await supabase
        .from("profiles")
        .update({
          website_data: output.summary, // can store SEO insights, messaging analysis, etc.
        })
        .eq("id", user.id);
    }

    return NextResponse.json({
      success: true,
      message: "Website re-scanned successfully.",
      analyzer_response: output,
    });
  } catch (err: any) {
    console.error("Website rescan error:", err);
    return NextResponse.json(
      { error: err.message ?? "Unexpected server error" },
      { status: 500 }
    );
  }
}
