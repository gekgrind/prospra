import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { createClient } from "@/lib/supabase/server";

type AppLayoutProfile = {
  full_name?: string | null;
  avatar_url?: string | null;
};

async function getSidebarUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      email: null,
      fullName: null,
      avatarUrl: null,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle<AppLayoutProfile>();

  return {
    email: user.email ?? null,
    fullName: profile?.full_name ?? user.user_metadata?.full_name ?? null,
    avatarUrl:
      profile?.avatar_url ??
      user.user_metadata?.avatar_url ??
      user.user_metadata?.picture ??
      null,
  };
}

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const sidebarUser = await getSidebarUser();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(0,212,255,0.08),transparent_28%),linear-gradient(180deg,#07111f_0%,#050c18_100%)]">
      <AppSidebar user={sidebarUser} />

      <main className="min-w-0 md:pl-[112px]">
        <div className="min-h-screen px-4 py-4 md:px-6 md:py-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}