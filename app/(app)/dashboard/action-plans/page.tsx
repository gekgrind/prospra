import { createClient } from "@/lib/supabase/server";
import { sanitizeTasks, type ActionPlan } from "@/lib/action-plans";
import { ActionPlansExecutionCenter } from "@/components/action-plans/action-plans-execution-center";

export const dynamic = "force-dynamic";

type LoadActionPlansResult =
  | { actionPlan: ActionPlan | null; error: null }
  | { actionPlan: null; error: string };

async function loadLatestActionPlan(): Promise<LoadActionPlansResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        actionPlan: null,
        error: "Sign in again to load your saved action plans.",
      };
    }

    const { data, error } = await supabase
      .from("action_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return { actionPlan: null, error: null };
    }

    return {
      actionPlan: {
        ...data,
        tasks: sanitizeTasks(data.tasks),
      },
      error: null,
    };
  } catch (error) {
    console.error("[ACTION_PLANS_PAGE_LOAD_ERROR]", error);
    return {
      actionPlan: null,
      error:
        "Prospra could not load your action plans. Retry the page, or continue from AI Mentor while this recovers.",
    };
  }
}

export default async function DashboardActionPlansPage() {
  const { actionPlan, error } = await loadLatestActionPlan();

  return <ActionPlansExecutionCenter actionPlan={actionPlan} error={error} />;
}
