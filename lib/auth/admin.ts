import "server-only";

import { createClient } from "@/lib/supabase/server";

type AdminCheckResult = {
  authorized: boolean;
  reason?: "unauthenticated" | "forbidden";
  userId?: string;
  email?: string;
};

function getEmailAllowlist() {
  return (process.env.INTERNAL_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function checkInternalAdminAccess(): Promise<AdminCheckResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false, reason: "unauthenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, email")
    .eq("id", user.id)
    .maybeSingle();

  const allowlist = getEmailAllowlist();
  const userEmail = (user.email ?? profile?.email ?? "").toLowerCase();
  const isAllowlisted = userEmail ? allowlist.includes(userEmail) : false;

  if (profile?.is_admin || isAllowlisted) {
    return {
      authorized: true,
      userId: user.id,
      email: user.email ?? profile?.email ?? undefined,
    };
  }

  return { authorized: false, reason: "forbidden", userId: user.id, email: user.email ?? undefined };
}
