import { redirect } from "next/navigation";

import { buildSharedLoginHref } from "@/lib/auth/redirects";
import { getCurrentProspraUrl } from "@/lib/auth/request-url";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildSharedLoginHref(await getCurrentProspraUrl("/dashboard")));
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, onboarding_complete, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[DASHBOARD_LAYOUT_PROFILE_ERROR]", profileError);
  }

  if (!profile || !profile.onboarding_complete) {
    redirect("/onboarding");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07111f] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(79,124,167,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(79,124,167,0.14)_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,212,255,0.10),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(79,124,167,0.12),transparent_28%),linear-gradient(180deg,rgba(7,17,31,0.94)_0%,rgba(7,17,31,0.98)_100%)]" />
      </div>

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-[#4f7ca7]/15 bg-[rgba(7,17,31,0.72)] px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-[rgba(7,17,31,0.58)]">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#00D4FF] shadow-[0_0_12px_rgba(0,212,255,0.85)]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8fb8d8]">
            Founder Workspace
          </span>
        </div>

          </header>

      <main className="relative z-10 p-6 md:p-8">{children}</main>
    </div>
  );
}
