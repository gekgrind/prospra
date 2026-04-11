import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ACTION_PLAN_STATUSES,
  ActionPlanTaskStatus,
  sanitizeTasks,
} from "@/lib/action-plans";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string; taskId: string }> }
) {
  try {
    const { planId, taskId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const status = body.status as string | undefined;
    const notes = body.notes as string | null | undefined;

    if (
      !status ||
      !ACTION_PLAN_STATUSES.includes(status as ActionPlanTaskStatus)
    ) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const { data: existingPlan, error: planError } = await supabase
      .from("action_plans")
      .select("*")
      .eq("id", planId)
      .eq("user_id", user.id)
      .single();

    if (planError) {
      throw planError;
    }

    const existingTasks = sanitizeTasks(existingPlan.tasks);
    const taskIndex = existingTasks.findIndex((task) => task.id === taskId);

    if (taskIndex === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const nowIso = new Date().toISOString();

    const updatedTasks = existingTasks.map((task, index) => {
      if (index !== taskIndex) return task;

      return {
        ...task,
        status: status as ActionPlanTaskStatus,
        notes: notes === undefined ? task.notes : notes,
        updated_at: nowIso,
      };
    });

    const { data, error } = await supabase
      .from("action_plans")
      .update({
        tasks: updatedTasks,
        updated_at: nowIso,
      })
      .eq("id", planId)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      actionPlan: {
        ...data,
        tasks: sanitizeTasks(data.tasks),
      },
    });
  } catch (error) {
    console.error("[ACTION_PLAN_TASK_PATCH_ERROR]", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
