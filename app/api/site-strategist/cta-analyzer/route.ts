import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  analyzeCta,
  type CtaAnalyzerError,
  type CtaAnalyzerRequestBody,
  type CtaAnalyzerResult,
  validateCtaAnalyzerInput,
} from "@/lib/web-intelligence/cta-analyzer";

type CtaAnalyzerApiResponse = {
  status: number;
  body: CtaAnalyzerResult | CtaAnalyzerError;
};

async function handleCtaAnalyzerApiRequest(
  body: unknown
): Promise<CtaAnalyzerApiResponse> {
  try {
    if (!body || typeof body !== "object") {
      return { status: 400, body: { error: "Invalid request body." } };
    }

    const parsed = validateCtaAnalyzerInput(body as CtaAnalyzerRequestBody);

    if ("error" in parsed) {
      return { status: 400, body: { error: parsed.error } };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { status: 401, body: { error: "Not authenticated." } };
    }

    const result = await analyzeCta(parsed.input);
    return { status: 200, body: result };
  } catch (error) {
    console.error("CTA Analyzer API error:", error);
    return {
      status: 500,
      body: {
        error: "CTA Analyzer could not generate recommendations right now.",
      },
    };
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const response = await handleCtaAnalyzerApiRequest(body);
  return NextResponse.json(response.body, { status: response.status });
}
