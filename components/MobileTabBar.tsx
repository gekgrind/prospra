"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquareText,
  NotebookPen,
  Settings,
} from "lucide-react";

const items = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/mentor", label: "Mentor", icon: MessageSquareText },
  { href: "/journal", label: "Journal", icon: NotebookPen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function MobileTabBar() {
  const pathname = usePathname();

  // Hide on auth/onboarding root pages just like the main menu logic
  if (
    !pathname ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/onboarding") ||
    pathname === "/"
  ) {
    return null;
  }

  return (
    <div
      className="
        fixed bottom-0 left-0 right-0 z-40
        md:hidden
        bg-brandNavy/95
        border-t border-brandBlue/40
        backdrop-blur-xl
        flex justify-around items-center
        h-14
        shadow-[0_-4px_20px_rgba(0,0,0,0.5)]
      "
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-0.5 text-[11px]"
          >
            <div
              className={`
                h-7 w-7 rounded-full flex items-center justify-center mb-0.5
                transition-all
                ${
                  active
                    ? "bg-gradient-to-br from-brandBlueLight to-brandBlue shadow-md glow-soft"
                    : "bg-brandNavyDark border border-brandBlue/50"
                }
              `}
            >
              <Icon
                className={`h-4 w-4 ${
                  active ? "text-white" : "text-brandBlueLight/80"
                }`}
              />
            </div>
            <span
              className={
                active
                  ? "text-brandBlueLight font-medium"
                  : "text-brandBlueLight/70"
              }
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
