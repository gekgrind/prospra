"use client";

import { useMemo, useState } from "react";
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

  const founderName = useMemo(() => {
    if (user.fullName?.trim()) return user.fullName.trim();
    if (user.email?.trim()) return user.email.split("@")[0];
    return "Founder";
  }, [user.email, user.fullName]);

  const avatarInitial = useMemo(() => {
    if (user.fullName?.trim()) return user.fullName.trim().charAt(0).toUpperCase();
    if (user.email?.trim()) return user.email.trim().charAt(0).toUpperCase();
    return "F";
  }, [user.email, user.fullName]);

  return (
    <aside
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={[
        "group/sidebar fixed left-0 top-0 z-40 hidden h-screen shrink-0 overflow-hidden border-r border-white/10 md:flex",
        "bg-[linear-gradient(180deg,rgba(7,17,31,0.98)_0%,rgba(5,12,24,0.985)_46%,rgba(4,10,20,0.99)_100%)]",
        "text-white backdrop-blur-2xl transition-[width,box-shadow] duration-300 ease-out",
        "shadow-[0_20px_60px_rgba(0,0,0,0.35)]",
        isExpanded ? "w-[292px]" : "w-[92px]",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,212,255,0.16),transparent_30%),radial-gradient(circle_at_18%_80%,rgba(79,124,167,0.16),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_24%)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-white/10" />

      <div className="relative z-10 flex h-full w-full flex-col">
        <div className="border-b border-white/10 px-4 py-5">
          <Link href="/dashboard" className="block">
            <div
              className={[
                "group/logo relative flex items-center rounded-[26px] border border-white/8 transition-all duration-300",
                isExpanded
                  ? "gap-3 bg-white/[0.025] px-3 py-3.5"
                  : "justify-center bg-white/[0.02] px-2 py-3.5",
              ].join(" ")}
            >
              <div className="absolute inset-0 rounded-[26px] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent)] opacity-70" />
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#00D4FF]/25 bg-[#00D4FF]/10 shadow-[0_0_30px_rgba(0,212,255,0.16)]">
                <Sparkles className="relative z-10 h-5 w-5 text-[#00D4FF]" />
                <div className="absolute inset-0 rounded-2xl bg-[#00D4FF]/12 blur-md" />
              </div>

              <div
                className={[
                  "min-w-0 overflow-hidden transition-all duration-300",
                  isExpanded
                    ? "max-w-[180px] translate-x-0 opacity-100"
                    : "max-w-0 -translate-x-2 opacity-0",
                ].join(" ")}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#00D4FF]">
                  Founder OS
                </p>
                <h1 className="mt-1 text-lg font-semibold tracking-[0.04em] text-white">
                  Prospra
                </h1>
                <p className="mt-0.5 truncate text-xs text-[#c7d8ea]/65">
                  Strategic AI for founders
                </p>
              </div>
            </div>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div
            className={[
              "mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8fb8d8]/75 transition-all duration-300",
              isExpanded
                ? "translate-x-0 opacity-100"
                : "pointer-events-none -translate-x-1 opacity-0",
            ].join(" ")}
          >
            Main Menu
          </div>

          <nav className="mt-2">
            <ul className="space-y-1.5">
              {DASHBOARD_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = item.matchPrefixes
                  ? item.matchPrefixes.some((prefix) =>
                      pathname?.startsWith(prefix)
                    )
                  : pathname === item.href;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={!isExpanded ? item.label : undefined}
                      className={[
                        "group/item relative flex w-full items-center overflow-hidden rounded-2xl border transition-all duration-300",
                        isExpanded
                          ? "gap-3 px-3 py-2.5"
                          : "justify-center px-2 py-2.5",
                        isActive
                          ? [
                              "border-[#00D4FF]/20 bg-[linear-gradient(180deg,rgba(0,212,255,0.12),rgba(255,255,255,0.03))]",
                              "text-white shadow-[0_8px_30px_rgba(0,212,255,0.10)]",
                            ].join(" ")
                          : [
                              "border-transparent text-[#dbe9f8]",
                              "hover:border-white/10 hover:bg-white/[0.04] hover:text-white",
                            ].join(" "),
                      ].join(" ")}
                    >
                      <div
                        className={[
                          "pointer-events-none absolute bottom-0 left-0 top-0 w-[3px] rounded-r-full transition-all duration-300",
                          isActive
                            ? "bg-[#00D4FF] shadow-[0_0_16px_rgba(0,212,255,0.8)] opacity-100"
                            : "bg-transparent opacity-0 group-hover/item:opacity-40",
                        ].join(" ")}
                      />

                      <div
                        className={[
                          "pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300",
                          isActive
                            ? "opacity-100 bg-[radial-gradient(circle_at_left_center,rgba(0,212,255,0.12),transparent_38%)]"
                            : "opacity-0 group-hover/item:opacity-100 bg-[radial-gradient(circle_at_left_center,rgba(255,255,255,0.05),transparent_42%)]",
                        ].join(" ")}
                      />

                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                        {isActive && (
                          <div className="absolute inset-0 rounded-xl bg-[#00D4FF]/12 blur-md" />
                        )}

                        <Icon
                          className={[
                            "relative z-10 h-[18px] w-[18px] transition-all duration-300",
                            isActive
                              ? "text-[#00D4FF]"
                              : "text-[#8fb8d8] group-hover/item:text-white",
                          ].join(" ")}
                        />
                      </div>

                      <div
                        className={[
                          "relative z-10 flex min-w-0 items-center justify-between overflow-hidden transition-all duration-300",
                          isExpanded
                            ? "max-w-[180px] flex-1 opacity-100"
                            : "max-w-0 opacity-0",
                        ].join(" ")}
                      >
                        <span className="truncate whitespace-nowrap text-sm font-medium">
                          {item.label}
                        </span>

                        {item.badge ? (
                          <span className="ml-2 rounded-full border border-[#00D4FF]/25 bg-[#00D4FF]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#00D4FF]">
                            {item.badge}
                          </span>
                        ) : null}
                      </div>

                      {!isExpanded && (
                        <div className="pointer-events-none absolute left-[78px] top-1/2 z-50 hidden -translate-y-1/2 rounded-xl border border-white/10 bg-[#08111f]/95 px-2.5 py-1.5 text-xs font-medium text-white shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-md group-hover/item:block">
                          {item.label}
                        </div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="mt-auto border-t border-white/10 px-3 pb-4 pt-3">
          <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-2 shadow-[0_18px_40px_rgba(0,0,0,0.25)] transition duration-300 hover:border-[#00D4FF]/14 hover:bg-white/[0.05]">
            <ProfileMenu>
              <div
                className={[
                  "flex w-full items-center rounded-[18px] transition-all duration-300",
                  isExpanded ? "gap-3 p-2" : "justify-center p-2",
                ].join(" ")}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brandBlue/60 bg-brandBlueLight font-bold text-brandNavy shadow-md transition-all">
                  {avatarInitial}
                </div>

                <div
                  className={[
                    "min-w-0 flex-1 overflow-hidden text-left transition-all duration-300",
                    isExpanded ? "max-w-[170px] opacity-100" : "max-w-0 opacity-0",
                  ].join(" ")}
                >
                  <p className="truncate text-sm font-semibold text-white">
                    {founderName}
                  </p>
                  <p className="truncate text-xs text-[#c7d8ea]/55">
                    {user.email || "No email available"}
                  </p>
                </div>
              </div>
            </ProfileMenu>
          </div>
        </div>
      </div>
    </aside>
  );
}