import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("[ONBOARDING_AUTH_GET_USER_ERROR]", userError);
  }

  if (!user) {
    redirect("/login?next=/onboarding");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[ONBOARDING_PROFILE_FETCH_ERROR]", profileError);
  }

  if (profile?.onboarding_complete) {
    redirect("/dashboard");
  }

  return <OnboardingClient />;
}