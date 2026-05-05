import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  analyzeCopyArchitect,
  type CopyArchitectError,
  type CopyArchitectRequestBody,
  type CopyArchitectResult,
  validateCopyArchitectInput,
} from "@/lib/web-intelligence/copy-architect";

type CopyArchitectApiResponse = {
  status: number;
  body: CopyArchitectResult | CopyArchitectError;
};

async function handleCopyArchitectApiRequest(
  body: unknown
): Promise<CopyArchitectApiResponse> {
  try {
    if (!body || typeof body !== "object") {
      return { status: 400, body: { error: "Invalid request body." } };
    }

    const parsed = validateCopyArchitectInput(body as CopyArchitectRequestBody);

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

    const result = await analyzeCopyArchitect(parsed.input);
    return { status: 200, body: result };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Copy Architect could not generate recommendations right now.";

    const invalidUrl =
      /only public http|embedded credentials|invalid url/i.test(message);

    if (invalidUrl) {
      return {
        status: 400,
        body: { error: "Please enter a valid public http or https URL." },
      };
    }

    console.error("Site Strategist Copy Architect error:", error);
    return {
      status: 500,
      body: {
        error: "Copy Architect could not generate recommendations right now.",
      },
    };
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const response = await handleCopyArchitectApiRequest(body);

  return NextResponse.json(response.body, { status: response.status });
}
