import { redirect } from "next/navigation";
import { buildSharedLoginHref } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";
import WeeklyReviewClient from "./weekly-review-client";

export default async function WeeklyReviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(buildSharedLoginHref("/dashboard/internal/weekly-review"));

  return <WeeklyReviewClient />;
}
