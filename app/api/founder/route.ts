// /app/api/founder/score/route.ts

import { NextRequest, NextResponse } from "next/server";
import { computeFounderScore, FounderSignalInput } from "@/lib/founder/score-engine";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<FounderSignalInput> & {
      // optional: you can add userId here if you want
      userId?: string;
    };

    // For now we assume the frontend sends us normalized inputs (0–1 and 0–100).
    // Later you can fetch from Supabase using userId and map to this shape.
    const input: FounderSignalInput = {
      clarity: body.clarity ?? 0.4,
      execution: body.execution ?? 0.4,
      strategy: body.strategy ?? 0.4,
      consistency: body.consistency ?? 0.4,
      marketReadiness: body.marketReadiness ?? 0.4,
      websiteScore: body.websiteScore ?? 0,
      journalConsistency: body.journalConsistency ?? 0,
      goalProgress: body.goalProgress ?? 0,
    };

    const result = computeFounderScore(input);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[FOUNDER_SCORE_ERROR]", err);
    return NextResponse.json(
      { error: "Failed to compute founder score" },
      { status: 500 }
    );
  }
}
