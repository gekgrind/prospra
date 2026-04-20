import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeWebsite } from "@/lib/web-intelligence/analyze-website";
import { saveWebsiteIntelligenceSnapshot } from "@/lib/web-intelligence/persistence";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const websiteUrl = typeof body?.websiteUrl === "string" ? body.websiteUrl.trim() : "";

    if (!websiteUrl) {
      return NextResponse.json({ error: "A website URL is required." }, { status: 400 });
    }

    const snapshot = await analyzeWebsite(websiteUrl);
    const savedSnapshot = await saveWebsiteIntelligenceSnapshot(user.id, snapshot);

    return NextResponse.json({ success: true, snapshot: savedSnapshot }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to analyze website.";

    const invalidUrl = /invalid url|only http and https/i.test(message);
    const blockedFetch = /unable to fetch|did not return html|empty or unreadable html/i.test(message);

    if (invalidUrl) {
      return NextResponse.json({ error: "Please enter a valid website URL." }, { status: 400 });
    }

    if (blockedFetch) {
      return NextResponse.json(
        { error: "We could not fetch this website. Please verify the URL or try a different public page." },
        { status: 422 }
      );
    }

    console.error("Web intelligence analysis error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}