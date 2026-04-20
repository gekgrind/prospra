import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  buildTasksFromTitles,
  extractPlanTasksFromAssistantText,
  sanitizeTasks,
} from "@/lib/action-plans";
import { syncStrategicState } from "@/lib/mentor/sync-strategic-state";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const conversationId = body.conversationId as string | undefined;
    const assistantText = body.assistantText as string | undefined;
    const title = (body.title as string | undefined) ?? "Action Plan";

    if (!conversationId || !assistantText) {
      return NextResponse.json(
        { error: "conversationId and assistantText are required" },
        { status: 400 }
      );
    }

    const taskTitles = extractPlanTasksFromAssistantText(assistantText);
    if (taskTitles.length === 0) {
      return NextResponse.json({ actionPlan: null });
    }

    const nowIso = new Date().toISOString();

    const { data: existingPlan, error: existingError } = await supabase
      .from("action_plans")
      .select("*")
      .eq("user_id", user.id)
      .eq("conversation_id", conversationId)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    let tasks = buildTasksFromTitles(taskTitles, nowIso);

    if (existingPlan) {
      const existingTasks = sanitizeTasks(existingPlan.tasks);
      const existingByTitle = new Map(
        existingTasks.map((task) => [task.title.toLowerCase(), task])
      );

      tasks = taskTitles.map((taskTitle, index) => {
        const existingTask = existingByTitle.get(taskTitle.toLowerCase());
        if (existingTask) {
          return { ...existingTask, id: `${index + 1}` };
        }

        return {
          id: `${index + 1}`,
          title: taskTitle,
          status: "not_started",
          notes: null,
          created_at: nowIso,
          updated_at: nowIso,
        };
      });
    }

    const payload = {
      conversation_id: conversationId,
      user_id: user.id,
      title,
      tasks,
      updated_at: nowIso,
    };

    const { data, error } = await supabase
      .from("action_plans")
      .upsert(payload, { onConflict: "conversation_id" })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    await syncStrategicState(supabase, {
      userId: user.id,
      currentFocus: title,
      topPriorities: tasks.slice(0, 5).map((task) => task.title),
      knownProblems: [],
      opportunities: [],
      currentOfferSummary: null,
      currentGrowthStage: null,
      lastUpdated: nowIso,
    });

    return NextResponse.json({
      actionPlan: {
        ...data,
        tasks: sanitizeTasks(data.tasks),
      },
    });
  } catch (error) {
    console.error("[ACTION_PLAN_SYNC_POST_ERROR]", error);
    return NextResponse.json({ error: "Failed to sync action plan" }, { status: 500 });
  }
}
