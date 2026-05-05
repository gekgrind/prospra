import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  analyzeFunnelMapping,
  type FunnelMappingError,
  type FunnelMappingRequestBody,
  type FunnelMappingResult,
  validateFunnelMappingInput,
} from "@/lib/web-intelligence/funnel-mapping";

type FunnelMappingApiResponse = {
  status: number;
  body: FunnelMappingResult | FunnelMappingError;
};

async function handleFunnelMappingApiRequest(
  body: unknown
): Promise<FunnelMappingApiResponse> {
  try {
    if (!body || typeof body !== "object") {
      return { status: 400, body: { error: "Invalid request body." } };
    }

    const parsed = validateFunnelMappingInput(body as FunnelMappingRequestBody);

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

    const result = await analyzeFunnelMapping(parsed.input);
    return { status: 200, body: result };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Funnel Mapping could not analyze this funnel right now.";

    const invalidInput =
      /required|only public http|embedded credentials|local or private|invalid url/i.test(
        message
      );

    if (invalidInput) {
      return {
        status: 400,
        body: { error: "Please enter a valid public http or https URL." },
      };
    }

    console.error("Site Strategist Funnel Mapping error:", error);
    return {
      status: 500,
      body: { error: "Funnel Mapping could not analyze this funnel right now." },
    };
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const response = await handleFunnelMappingApiRequest(body);

  return NextResponse.json(response.body, { status: response.status });
}
