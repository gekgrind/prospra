import { NextRequest, NextResponse } from "next/server";
import {
  executionSystemsExamples,
  generateActionPlanTasks,
  generateContentCalendar,
  type InsightScoreInput,
  type StrategyInput,
} from "@/lib/execution-systems";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      workflow?: "action-plan-generator" | "content-calendar-generator" | "execution-systems";
      insights?: InsightScoreInput[];
      strategy?: StrategyInput;
    };

    const workflow = body.workflow ?? "execution-systems";

    if (workflow === "action-plan-generator") {
      return NextResponse.json({
        workflow,
        prioritizedTasks: generateActionPlanTasks(body.insights ?? []),
        example: executionSystemsExamples.actionPlan,
      });
    }

    if (workflow === "content-calendar-generator") {
      return NextResponse.json({
        workflow,
        contentCalendar: generateContentCalendar(body.strategy ?? { focus: "Founder strategy" }),
        example: executionSystemsExamples.contentCalendar,
      });
    }

    return NextResponse.json({
      workflow,
      actionPlanGenerator: {
        input: { insights: body.insights ?? [] },
        output: generateActionPlanTasks(body.insights ?? []),
      },
      contentCalendarGenerator: {
        input: { strategy: body.strategy ?? { focus: "Founder strategy" } },
        output: generateContentCalendar(body.strategy ?? { focus: "Founder strategy" }),
      },
      examples: executionSystemsExamples,
    });
  } catch (error) {
    console.error("[EXECUTION_SYSTEMS_ROUTE_ERROR]", error);
    return NextResponse.json({ error: "Failed to run execution systems workflow" }, { status: 500 });
  }
}
