import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

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
    redirect("/auth/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // If no profile exists, redirect to onboarding
  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <SidebarProvider>
      {/* ⭐ Cockpit Styled Sidebar */}
      <AppSidebar
        user={{
          email: user.email || "",
          fullName: profile.full_name || undefined,
        }}
      />

      {/* ⭐ Main Dashboard Area */}
      <SidebarInset className="bg-brandNavyDark text-white">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-brandBlue/20 bg-brandNavyDark/80 backdrop-blur supports-[backdrop-filter]:bg-brandNavyDark/60 px-4">
          <SidebarTrigger className="text-brandBlueLight" />
        </header>

        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
