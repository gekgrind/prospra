import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDefaultRoadmap } from "@/lib/roadmap";

export const dynamic = "force-dynamic";

function sanitizeStepIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const knownIds = new Set(getDefaultRoadmap().steps.map((step) => step.id));

  return [
    ...new Set(
      value.filter(
        (id): id is string => typeof id === "string" && knownIds.has(id)
      )
    ),
  ];
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("roadmap_progress")
      .select("completed_step_ids")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      completedStepIds: sanitizeStepIds(data?.completed_step_ids),
    });
  } catch (error) {
    console.error("[ROADMAP_PROGRESS_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to load roadmap progress" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const stepId = typeof body?.stepId === "string" ? body.stepId : "";
    const completed = body?.completed;

    const knownIds = new Set(getDefaultRoadmap().steps.map((step) => step.id));

    if (!stepId || !knownIds.has(stepId) || typeof completed !== "boolean") {
      return NextResponse.json(
        { error: "A valid stepId and completed flag are required" },
        { status: 400 }
      );
    }

    const { data: existing, error: readError } = await supabase
      .from("roadmap_progress")
      .select("completed_step_ids")
      .eq("user_id", user.id)
      .maybeSingle();

    if (readError) {
      throw readError;
    }

    const current = new Set(sanitizeStepIds(existing?.completed_step_ids));
    if (completed) {
      current.add(stepId);
    } else {
      current.delete(stepId);
    }

    const completedStepIds = [...current];

    const { error: writeError } = await supabase
      .from("roadmap_progress")
      .upsert(
        { user_id: user.id, completed_step_ids: completedStepIds },
        { onConflict: "user_id" }
      );

    if (writeError) {
      throw writeError;
    }

    return NextResponse.json({ completedStepIds });
  } catch (error) {
    console.error("[ROADMAP_PROGRESS_PATCH_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to update roadmap progress" },
      { status: 500 }
    );
  }
}
