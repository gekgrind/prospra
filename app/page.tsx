import { createClient } from "@/lib/supabase/server";
import { buildSharedSignupHref } from "@/lib/auth/redirects";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not logged in → send to signup
  if (!user) {
    redirect(buildSharedSignupHref());
  }

  // Check onboarding
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_complete")
    .eq("id", user.id)
    .maybeSingle();

  // Route based on onboarding state
  if (!profile?.onboarding_complete) {
    redirect("/onboarding");
  }

  // Fully onboarded → dashboard
  redirect("/dashboard");
}
