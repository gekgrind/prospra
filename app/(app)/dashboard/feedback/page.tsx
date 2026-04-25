import { redirect } from "next/navigation";
import { buildSharedLoginHref } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";
import FeedbackAdminClient from "./FeedbackAdminClient";
import type { FeedbackAdminItem } from "./types";

export default async function FeedbackAdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(buildSharedLoginHref("/dashboard/feedback"));
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile?.is_admin) {
    redirect("/dashboard");
  }

  const { data: feedbackItems, error: feedbackError } = await supabase
    .from("feedback_items")
    .select(
      "id, user_id, feedback_type, message, context, status, created_at, updated_at"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (feedbackError) {
    console.error("Failed to load feedback items:", feedbackError);
  }

  return (
    <FeedbackAdminClient
      initialItems={(feedbackItems ?? []) as FeedbackAdminItem[]}
    />
  );
}
