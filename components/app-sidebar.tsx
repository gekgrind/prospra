"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

import ProfileMenu from "@/components/ProfileMenu";
import { DASHBOARD_NAV_ITEMS } from "@/components/dashboard/nav-items";

type SidebarUser = {
  email?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  isAdmin?: boolean;
};

export function AppSidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <aside
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={[
        "group/sidebar fixed left-0 top-0 z-40 hidden h-screen shrink-0 border-r border-white/10",
        "bg-[linear-gradient(180deg,rgba(7,17,31,0.98)_0%,rgba(5,12,24,0.98)_100%)]",
        "text-white backdrop-blur-xl transition-[width] duration-300 ease-out md:flex",
        isExpanded ? "w-[280px]" : "w-[88px]",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,212,255,0.14),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(79,124,167,0.12),transparent_28%)]" />

      <div className="relative z-10 flex h-full w-full flex-col">
        <div className="border-b border-white/10 px-4 py-5">
          <Link href="/dashboard" className="block">
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#00D4FF]/25 bg-[#00D4FF]/10 shadow-[0_0_24px_rgba(0,212,255,0.14)]">
                <Sparkles className="h-5 w-5 text-[#00D4FF]" />
                <div className="absolute inset-0 rounded-2xl bg-[#00D4FF]/10 blur-md" />
              </div>

              <div
                className={[
                  "overflow-hidden transition-all duration-300",
                  isExpanded
                    ? "max-w-[180px] translate-x-0 opacity-100"
                    : "max-w-0 -translate-x-2 opacity-0",
                ].join(" ")}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#00D4FF]">
                  Founder OS
                </p>
                <h1 className="mt-1 text-lg font-semibold tracking-[0.04em] text-white">
                  Prospra
                </h1>
                <p className="mt-0.5 text-xs text-[#c7d8ea]/65">
                  AI Mentorship System
                </p>
              </div>
            </div>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div
            className={[
              "mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8fb8d8]/80 transition-opacity duration-300",
              isExpanded ? "opacity-100" : "opacity-0",
            ].join(" ")}
          >
            Main Menu
          </div>

          <nav className="mt-2">
            <ul className="space-y-1">
              {DASHBOARD_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = item.matchPrefixes
                  ? item.matchPrefixes.some((prefix) =>
                      pathname?.startsWith(prefix)
                    )
                  : pathname === item.href;

                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      title={!isExpanded ? item.label : undefined}
                      className={[
                        "group relative flex w-full items-center rounded-2xl border px-3 py-2.5 text-[#dbe9f8] transition",
                        "hover:border-[#4f7ca7]/15 hover:bg-[rgba(255,255,255,0.04)] hover:text-white",
                        isActive
                          ? "border-[#00D4FF]/18 bg-[#00D4FF]/10 text-white"
                          : "border-transparent",
                        isExpanded ? "gap-3" : "justify-center px-2",
                      ].join(" ")}
                    >
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                        {isActive && (
                          <div className="absolute inset-0 rounded-xl bg-[#00D4FF]/10 blur-md" />
                        )}
                        <Icon
                          className={[
                            "relative z-10 h-4 w-4 transition",
                            isActive ? "text-[#00D4FF]" : "text-[#8fb8d8]",
                          ].join(" ")}
                        />
                      </div>

                      <span
                        className={[
                          "overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-300",
                          isExpanded
                            ? "max-w-[160px] opacity-100"
                            : "max-w-0 opacity-0",
                        ].join(" ")}
                      >
                        {item.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="mt-auto border-t border-[#4f7ca7]/10 px-3 pb-4 pt-3">
          <div className="rounded-[24px] border border-[#4f7ca7]/15 bg-[rgba(255,255,255,0.03)] p-2 shadow-[0_12px_40px_rgba(0,0,0,0.22)] transition hover:bg-white/5">
            <div
              className={[
                "flex items-center rounded-lg p-2 transition hover:bg-white/5",
                isExpanded ? "gap-3" : "justify-center",
              ].join(" ")}
            >
              <ProfileMenu />

              <div
                className={[
                  "min-w-0 flex-1 overflow-hidden transition-all duration-300",
                  isExpanded
                    ? "max-w-[160px] opacity-100"
                    : "max-w-0 opacity-0",
                ].join(" ")}
              >
                <p className="truncate text-sm font-semibold text-white">
                  {user.fullName || "Founder"}
                </p>
                <p className="truncate text-xs text-[#c7d8ea]/55">
                  {user.email || "No email available"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}