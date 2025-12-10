"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  MessageSquareText,
  NotebookPen,
  Settings,
  Menu,
  X,
} from "lucide-react";

const HIDDEN_PATH_PREFIXES = [
  "/auth",
  "/onboarding",
  "/welcome",
  "/getting-started",
];

const HIDDEN_EXACT_PATHS = ["/", "/auth/login", "/auth/signup"];

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

  // Hide menu on onboarding/auth/welcome pages
  const shouldHide =
    !pathname ||
    HIDDEN_EXACT_PATHS.includes(pathname) ||
    HIDDEN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  useEffect(() => {
    // Close menu when route changes
    setOpen(false);
  }, [pathname]);

  if (shouldHide) return null;

  return (
    <>
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed left-4 bottom-6 z-40 flex items-center justify-center h-11 w-11 rounded-full 
          bg-brandNavyDark border border-brandBlue/70 shadow-lg shadow-black/40
          hover:border-brandOrangeLight hover:shadow-brandOrange/40 
          transition-all duration-200"
        aria-label="Open Prospra menu"
      >
        {open ? (
          <X className="h-5 w-5 text-brandBlueLight" />
        ) : (
          <Menu className="h-5 w-5 text-brandBlueLight" />
        )}
      </button>

      {/* Sidebar / Dock */}
      <aside
        className={`fixed left-4 top-4 bottom-20 z-30 w-60 rounded-2xl 
          bg-brandNavy/95 border border-brandBlue/70 shadow-2xl shadow-black/50
          backdrop-blur-md transition-all duration-200 overflow-hidden
          flex flex-col
          ${open ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-5 pointer-events-none"}`}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-brandBlue/40 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wide text-brandBlueLight/60">
              Prospra
            </span>
            <span className="text-sm font-semibold text-brandBlueLight">
              Navigation
            </span>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all
                  border 
                  ${
                    active
                      ? "bg-brandBlue/25 border-brandBlue text-brandBlueLight"
                      : "bg-transparent border-transparent text-brandBlueLight/80 hover:bg-brandNavyDark hover:border-brandBlue/60 hover:text-brandBlueLight"
                  }`}
              >
                <div
                  className={`h-7 w-7 rounded-lg flex items-center justify-center
                    ${
                      active
                        ? "bg-gradient-to-br from-brandBlueLight to-brandBlue shadow-md"
                        : "bg-brandNavyDark border border-brandBlue/50"
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
