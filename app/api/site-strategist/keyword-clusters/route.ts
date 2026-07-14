import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  generateKeywordClusters,
  type KeywordClusteringError,
  type KeywordClusteringResult,
} from "@/lib/web-intelligence/seo-keyword-clustering";

type KeywordClusterRequestBody = {
  seedKeyword?: unknown;
};

type KeywordClusterApiResponse = {
  status: number;
  body: KeywordClusteringResult | KeywordClusteringError;
};

async function handleRequest(body: unknown): Promise<KeywordClusterApiResponse> {
  try {
    if (!body || typeof body !== "object") {
      return { status: 400, body: { error: "Invalid request body." } };
    }

    const requestBody = body as KeywordClusterRequestBody;
    const seedKeyword = typeof requestBody.seedKeyword === "string"
      ? requestBody.seedKeyword.trim()
      : "";

    if (!seedKeyword) {
      return { status: 400, body: { error: "A seed keyword is required." } };
    }

    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return { status: 401, body: { error: "Not authenticated." } };

    const result = await generateKeywordClusters(seedKeyword);
    return { status: 200, body: result };
  } catch (error) {
    console.error("Keyword clustering error:", error);
    return { status: 500, body: { error: "Keyword clustering failed right now." } };
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const response = await handleRequest(body);
  return NextResponse.json(response.body, { status: response.status });
}
