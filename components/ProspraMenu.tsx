"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  MessageSquareText,
  NotebookPen,
  Settings,
  Menu,
  X,
} from "lucide-react";

const HIDDEN_PATH_PREFIXES = [
  "/onboarding",
  "/welcome",
  "/getting-started",
];

const HIDDEN_EXACT_PATHS = ["/", "/login", "/sign-up"];

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Mentor",
    href: "/mentor",
    icon: MessageSquareText,
  },
  {
    label: "Journal",
    href: "/journal",
    icon: NotebookPen,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export default function ProspraMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const shouldHide =
    !pathname ||
    HIDDEN_EXACT_PATHS.includes(pathname) ||
    HIDDEN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (shouldHide) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prevOpen) => !prevOpen)}
        className="fixed bottom-6 left-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-brandBlue/70 bg-brandNavyDark shadow-lg shadow-black/40 transition-all duration-200 hover:border-brandOrangeLight hover:shadow-brandOrange/40"
        aria-label={open ? "Close Prospra menu" : "Open Prospra menu"}
        aria-expanded={open}
      >
        {open ? (
          <X className="h-5 w-5 text-brandBlueLight" />
        ) : (
          <Menu className="h-5 w-5 text-brandBlueLight" />
        )}
      </button>

      <aside
        className={`fixed bottom-20 left-4 top-4 z-30 flex w-60 flex-col overflow-hidden rounded-2xl border border-brandBlue/70 bg-brandNavy/95 shadow-2xl shadow-black/50 backdrop-blur-md transition-all duration-200 ${
          open
            ? "translate-x-0 opacity-100"
            : "pointer-events-none -translate-x-5 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-brandBlue/40 px-4 py-3">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wide text-brandBlueLight/60">
              Prospra
            </span>
            <span className="text-sm font-semibold text-brandBlueLight">
              Navigation
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition-all ${
                  active
                    ? "border-brandBlue bg-brandBlue/25 text-brandBlueLight"
                    : "border-transparent bg-transparent text-brandBlueLight/80 hover:border-brandBlue/60 hover:bg-brandNavyDark hover:text-brandBlueLight"
                }`}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                    active
                      ? "bg-gradient-to-br from-brandBlueLight to-brandBlue shadow-md"
                      : "border border-brandBlue/50 bg-brandNavyDark"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      active ? "text-white" : "text-brandBlueLight/80"
                    }`}
                  />
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}