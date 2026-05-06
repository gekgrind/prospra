import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  analyzeSiteStrategist,
  normalizeSiteStrategistUrl,
  type SiteStrategistError,
  type SiteStrategistResult,
} from "@/lib/web-intelligence/site-strategist";

type SiteAnalysisRequestBody = { url?: unknown };

type SiteAnalysisApiResponse = {
  status: number;
  body: SiteStrategistResult | SiteStrategistError;
};

function parseInput(body: SiteAnalysisRequestBody): { url: string } | { error: string } {
  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!url) return { error: "A website URL is required." };
  try {
    return { url: normalizeSiteStrategistUrl(url) };
  } catch {
    return { error: "Please enter a valid public http or https URL." };
  }
}

async function handleRequest(body: unknown): Promise<SiteAnalysisApiResponse> {
  try {
    if (!body || typeof body !== "object") {
      return { status: 400, body: { error: "Invalid request body." } };
    }

    const parsed = parseInput(body as SiteAnalysisRequestBody);
    if ("error" in parsed) return { status: 400, body: { error: parsed.error } };

    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return { status: 401, body: { error: "Not authenticated." } };

    const result = await analyzeSiteStrategist({ url: parsed.url });
    return { status: 200, body: result };
  } catch (error) {
    console.error("Site Strategist API error:", error);
    return { status: 500, body: { error: "Site analysis failed right now." } };
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const response = await handleRequest(body);
  return NextResponse.json(response.body, { status: response.status });
}
