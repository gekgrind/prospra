import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { persistMentorMemory } from "@/lib/intelligence/shared-layer";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      memory: string;
      scope?: "mentor" | "journal" | "strategy" | "cross_app";
      source?: string;
      confidence?: number;
    };

    if (!body.memory?.trim()) {
      return NextResponse.json({ error: "Memory is required" }, { status: 400 });
    }

    await persistMentorMemory(supabase as never, {
      userId: user.id,
      scope: body.scope ?? "mentor",
      memory: body.memory.trim(),
      source: body.source ?? "manual",
      confidence: body.confidence,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("INTELLIGENCE_MEMORY_POST_ERROR", error);
    return NextResponse.json({ error: "Failed to save memory" }, { status: 500 });
  }
}
