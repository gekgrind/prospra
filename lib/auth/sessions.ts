import { redirect } from "next/navigation";
import { buildSharedLoginHref } from "@/lib/auth/redirects";
import { getCurrentProspraUrl } from "@/lib/auth/request-url";
import { createClient } from "@/lib/supabase/server";

export async function getAuthenticatedUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.warn("[AUTH_GET_USER_ERROR]", {
      message: error.message,
      name: error.name,
      status: error.status,
    });
  }

  return user ?? null;
}

export async function requireAuthenticatedUser(next?: string) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect(
      buildSharedLoginHref(next ?? (await getCurrentProspraUrl("/dashboard")))
    );
  }

  return user;
}
