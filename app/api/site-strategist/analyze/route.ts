import { NextResponse } from "next/server";

import { parseSiteHtml } from "@/lib/site-strategist/parser";
import { createClient } from "@/lib/supabase/server";
import { SHARED_AUTH_COOKIE_NAME } from "@/lib/supabase/shared-auth-cookie";

type AnalyzeRequestBody = {
  url?: unknown;
};

function normalizePublicUrl(value: string): string {
  const input = value.trim();
  const withProtocol = /^https?:\/\//i.test(input) ? input : `https://${input}`;
  const parsed = new URL(withProtocol);

  if (!/^https?:$/.test(parsed.protocol)) {
    throw new Error("Only http and https URLs are supported.");
  }

  if (parsed.username || parsed.password) {
    throw new Error("URLs with embedded credentials are not allowed.");
  }

  if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i.test(parsed.hostname)) {
    throw new Error("Local URLs are not supported.");
  }

  parsed.hash = "";
  return parsed.toString();
}

async function fetchHtml(normalizedUrl: string): Promise<string> {
  const response = await fetch(normalizedUrl, {
    method: "GET",
    headers: {
      "user-agent": "ProspraSiteStrategistBot/1.0",
      accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch the page (${response.status}).`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("text/html")) {
    throw new Error("The URL did not return HTML content.");
  }

  const html = await response.text();
  if (!html.trim()) {
    throw new Error("The page returned empty HTML.");
  }

  return html;
}

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") ?? "";
    if (!cookieHeader.includes(SHARED_AUTH_COOKIE_NAME)) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as AnalyzeRequestBody | null;
    const rawUrl = typeof body?.url === "string" ? body.url.trim() : "";

    if (!rawUrl) {
      return NextResponse.json({ error: "A website URL is required." }, { status: 400 });
    }

    const normalizedUrl = normalizePublicUrl(rawUrl);
    const html = await fetchHtml(normalizedUrl);
    const analysis = parseSiteHtml(html, normalizedUrl);

    return NextResponse.json({ success: true, analysis }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to analyze website.";

    if (/invalid url|only http and https|embedded credentials|local urls/i.test(message)) {
      return NextResponse.json({ error: "Please enter a valid public http or https URL." }, { status: 400 });
    }

    if (/unable to fetch|did not return html|empty html/i.test(message)) {
      return NextResponse.json(
        { error: "We could not fetch this website. Please verify the URL or try a different public page." },
        { status: 422 }
      );
    }

    console.error("Site Strategist analyze API error:", error);
    return NextResponse.json({ error: "Site analysis failed right now. Please try again." }, { status: 500 });
  }
}
