"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DASHBOARD_ACCOUNT_ITEM,
  DASHBOARD_NAV_ITEMS,
} from "@/components/dashboard/nav-items";

type SidebarUser = {
  email?: string;
  fullName?: string;
  isAdmin?: boolean;
};

export function AppSidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const supabase = createClient();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch (error) {
      console.error("[APP_SIDEBAR_SIGN_OUT_ERROR]", error);
    }
  };

  return (
    <Sidebar
      className="border-r border-[#4f7ca7]/15 bg-[rgba(7,17,31,0.92)] text-white"
      variant="sidebar"
      collapsible="offcanvas"
    >
      <SidebarHeader className="relative overflow-hidden border-b border-[#4f7ca7]/10 px-4 py-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,212,255,0.12),transparent_35%),linear-gradient(180deg,rgba(10,20,38,0.92)_0%,rgba(7,17,31,0.98)_100%)]" />
        <div className="relative z-10">
          <Link href="/dashboard" className="block">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00D4FF]/20 bg-[#00D4FF]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#00D4FF]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00D4FF] shadow-[0_0_10px_rgba(0,212,255,0.8)]" />
              Founder OS
            </div>

            <h1 className="mt-4 text-xl font-semibold tracking-[0.04em] text-white">
              Prospra
            </h1>
            <p className="mt-1 text-xs text-[#c7d8ea]/60">
              AI Mentorship System
            </p>
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8fb8d8]">
            Main Menu
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="mt-2 space-y-1">
              {DASHBOARD_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = item.matchPrefixes
                  ? item.matchPrefixes.some((prefix) =>
                      pathname?.startsWith(prefix)
                    )
                  : pathname === item.href;

                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="group rounded-2xl border border-transparent px-3 py-2.5 text-[#dbe9f8] transition hover:border-[#4f7ca7]/15 hover:bg-[rgba(255,255,255,0.04)] hover:text-white data-[active=true]:border-[#00D4FF]/18 data-[active=true]:bg-[#00D4FF]/10 data-[active=true]:text-white"
                    >
                      <Link href={item.href}>
                        <Icon className="mr-2 h-4 w-4 text-[#8fb8d8] transition group-data-[active=true]:text-[#00D4FF]" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-[#4f7ca7]/10 px-3 pb-4 pt-3">
        <div className="rounded-[24px] border border-[#4f7ca7]/15 bg-[rgba(255,255,255,0.03)] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
          <p className="text-sm font-semibold text-white">
            {user.fullName || "Founder"}
          </p>
          <p className="mt-1 truncate text-xs text-[#c7d8ea]/55">
            {user.email || "No email available"}
          </p>

          <div className="mt-4 space-y-2">
            <Link
              href={DASHBOARD_ACCOUNT_ITEM.href}
              className="inline-flex w-full items-center rounded-2xl border border-[#4f7ca7]/15 bg-[rgba(255,255,255,0.03)] px-3 py-2 text-sm font-medium text-[#dbe9f8] transition hover:border-[#00D4FF]/18 hover:bg-[#00D4FF]/8 hover:text-white"
            >
              {DASHBOARD_ACCOUNT_ITEM.label}
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex w-full items-center gap-2 rounded-2xl border border-rose-400/15 bg-rose-400/8 px-3 py-2 text-sm font-medium text-rose-200 transition hover:border-rose-400/30 hover:bg-rose-400/12 hover:text-rose-100"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}