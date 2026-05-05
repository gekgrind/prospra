"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

import ProfileMenu from "@/components/ProfileMenu";
import {
  DASHBOARD_NAV_ITEMS,
  type DashboardNavItem,
} from "@/components/dashboard/nav-items";
import { getCommandCenterUrl } from "@/lib/config/ecosystem";

type SidebarUser = {
  email?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  isAdmin?: boolean;
};

function matchesRoute(pathname: string | null, route: string) {
  return pathname === route || pathname?.startsWith(`${route}/`);
}

function isNavItemActive(pathname: string | null, item: DashboardNavItem) {
  return item.href === "/dashboard"
    ? pathname === item.href
    : item.matchPrefixes
      ? item.matchPrefixes.some((prefix) => matchesRoute(pathname, prefix))
      : pathname === item.href;
}

export function AppSidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const commandCenterHref = getCommandCenterUrl();
  const navItems = useMemo(
    () =>
      DASHBOARD_NAV_ITEMS.map((item) =>
        item.label === "Command Center"
          ? { ...item, href: commandCenterHref }
          : item
      ),
    [commandCenterHref]
  );

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

        <div className="flex-1 overflow-hidden px-3 py-2.5">
          <div
            className={[
              "mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8fb8d8]/75 transition-all duration-300",
              isExpanded
                ? "translate-x-0 opacity-100"
                : "pointer-events-none -translate-x-1 opacity-0",
            ].join(" ")}
          >
            Navigation
          </div>

          <nav className="mt-1" aria-label="Primary">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <NavItemLink
                  key={`${item.label}-${item.href}`}
                  item={item}
                  isActive={isNavItemActive(pathname, item)}
                  isExpanded={isExpanded}
                />
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-auto border-t border-white/10 px-3 pb-3 pt-2.5">
          <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.25)] transition duration-300 hover:border-[#00D4FF]/14 hover:bg-white/[0.05]">
            <ProfileMenu>
              <div
                className={[
                  "flex w-full items-center rounded-[18px] transition-all duration-300",
                  isExpanded ? "gap-2.5 p-1.5" : "justify-center p-1.5",
                ].join(" ")}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brandBlue/60 bg-brandBlueLight text-sm font-bold text-brandNavy shadow-md transition-all">
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

function NavItemLink({
  item,
  isActive,
  isExpanded,
}: {
  item: DashboardNavItem;
  isActive: boolean;
  isExpanded: boolean;
}) {
  const Icon = item.icon;
  const isExternal = /^https?:\/\//.test(item.href);
  const rowPadding = isExpanded
    ? "gap-2.5 px-2.5 py-1.5"
    : "justify-center px-2 py-1.5";

  return (
    <li>
      <Link
        href={item.href}
        prefetch={isExternal ? false : undefined}
        title={!isExpanded ? item.label : undefined}
        className={[
          "group/item relative flex w-full items-center overflow-hidden rounded-2xl border transition-[transform,border-color,background-color,box-shadow,color] duration-200 ease-out motion-safe:hover:-translate-y-0.5",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050c18]",
          rowPadding,
          isActive
            ? [
                "border-[#00D4FF]/35 bg-[linear-gradient(180deg,rgba(0,212,255,0.14),rgba(255,255,255,0.04))]",
                "text-white shadow-[0_0_28px_rgba(0,212,255,0.22),inset_0_0_0_1px_rgba(0,212,255,0.10)]",
              ].join(" ")
            : [
                "border-transparent text-[#dbe9f8]",
                "hover:border-[#00D4FF]/22 hover:bg-white/[0.045] hover:text-white hover:shadow-[0_0_24px_rgba(0,212,255,0.16),inset_0_0_0_1px_rgba(0,212,255,0.08)]",
              ].join(" "),
        ].join(" ")}
      >
        <div
          className={[
            "pointer-events-none absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-r-full transition-all duration-200",
            isActive
              ? "bg-[#00D4FF] opacity-100 shadow-[0_0_18px_rgba(0,212,255,0.9)]"
              : "bg-[#00D4FF] opacity-0 shadow-[0_0_16px_rgba(0,212,255,0.7)] group-hover/item:opacity-55 group-focus-visible/item:opacity-70",
          ].join(" ")}
        />

        <div
          className={[
            "pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-200",
            isActive
              ? "bg-[radial-gradient(circle_at_left_center,rgba(0,212,255,0.18),transparent_42%)] opacity-100"
              : "bg-[radial-gradient(circle_at_left_center,rgba(0,212,255,0.13),transparent_44%)] opacity-0 group-hover/item:opacity-100 group-focus-visible/item:opacity-100",
          ].join(" ")}
        />
        <div
          className={[
            "pointer-events-none absolute inset-px rounded-2xl transition-opacity duration-200",
            isActive
              ? "opacity-100 shadow-[inset_0_0_24px_rgba(0,212,255,0.10)]"
              : "opacity-0 shadow-[inset_0_0_22px_rgba(0,212,255,0.08)] group-hover/item:opacity-100 group-focus-visible/item:opacity-100",
          ].join(" ")}
        />
        <div
          className={[
            "relative flex shrink-0 items-center justify-center rounded-xl",
            "h-8 w-8",
          ].join(" ")}
        >
          {isActive && (
            <div className="absolute inset-0 rounded-xl bg-[#00D4FF]/16 blur-md motion-safe:animate-pulse motion-reduce:animate-none" />
          )}
          {!isActive && (
            <div className="absolute inset-0 rounded-xl bg-[#00D4FF]/12 opacity-0 blur-md transition-opacity duration-200 group-hover/item:opacity-80 group-focus-visible/item:opacity-80" />
          )}

          <Icon
            className={[
              "relative z-10 transition-all duration-300",
              "h-4 w-4",
              isActive
                ? "text-[#00D4FF]"
                : "text-[#8fb8d8] group-hover/item:text-white",
            ].join(" ")}
          />
        </div>

        <div
          className={[
            "relative z-10 flex min-w-0 items-center justify-between overflow-hidden transition-all duration-300",
            isExpanded ? "max-w-[180px] flex-1 opacity-100" : "max-w-0 opacity-0",
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
}
