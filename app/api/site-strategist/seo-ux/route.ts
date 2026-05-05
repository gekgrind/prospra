import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { SHARED_AUTH_COOKIE_NAME } from "@/lib/supabase/shared-auth-cookie";
import {
  type SeoUxAnalysisError,
  type SeoUxAnalysisInput,
  type SeoUxAnalysisResult,
} from "@/lib/web-intelligence/seo-ux-analyzer";
import {
  analyzeSeoUxPage,
  normalizeSeoUxUrl,
} from "@/lib/web-intelligence/seo-ux-scanner";

type SeoUxRequestBody = {
  url?: unknown;
  primaryKeyword?: unknown;
  audienceOffer?: unknown;
};

type SeoUxApiResponse = {
  status: number;
  body: SeoUxAnalysisResult | SeoUxAnalysisError;
};

function getStringField(body: SeoUxRequestBody, key: keyof SeoUxRequestBody) {
  const value = body[key];
  return typeof value === "string" ? value.trim() : "";
}

function parseSeoUxInput(
  body: SeoUxRequestBody
): { input: SeoUxAnalysisInput } | { error: string } {
  const url = getStringField(body, "url");
  const primaryKeyword = getStringField(body, "primaryKeyword");
  const audienceOffer = getStringField(body, "audienceOffer");

  if (!url) {
    return { error: "A page URL is required." };
  }

  try {
    normalizeSeoUxUrl(url);
  } catch {
    return { error: "Please enter a valid public http or https URL." };
  }

  if (!primaryKeyword) {
    return { error: "A primary keyword is required." };
  }

  return {
    input: {
      url,
      primaryKeyword,
      audienceOffer,
    },
  };
}

async function handleSeoUxApiRequest(
  body: unknown,
  request: Request
): Promise<SeoUxApiResponse> {
  try {
    if (!body || typeof body !== "object") {
      return { status: 400, body: { error: "Invalid request body." } };
    }

    const parsed = parseSeoUxInput(body as SeoUxRequestBody);

    if ("error" in parsed) {
      return { status: 400, body: { error: parsed.error } };
    }

    const cookieHeader = request.headers.get("cookie") ?? "";
    if (!cookieHeader.includes(SHARED_AUTH_COOKIE_NAME)) {
      return { status: 401, body: { error: "Not authenticated." } };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { status: 401, body: { error: "Not authenticated." } };
    }

    const result = await analyzeSeoUxPage(parsed.input);
    return { status: 200, body: result };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "SEO/UX Analyzer could not analyze this page right now.";

    const invalidInput =
      /required|only http|embedded credentials|local or private|invalid url/i.test(
        message
      );

    if (invalidInput) {
      return {
        status: 400,
        body: { error: "Please enter a valid public http or https URL." },
      };
    }

    console.error("Site Strategist SEO/UX Analyzer error:", error);
    return {
      status: 500,
      body: { error: "SEO/UX Analyzer could not analyze this page right now." },
    };
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const response = await handleSeoUxApiRequest(body, request);

  return NextResponse.json(response.body, { status: response.status });
}
