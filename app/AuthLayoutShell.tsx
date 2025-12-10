"use client";

import ProspraMenu from "@/components/ProspraMenu";
import ProfileMenu from "@/components/ProfileMenu";
import PageTransition from "@/components/PageTransition";
import MobileTabBar from "@/components/MobileTabBar";
import { usePathname } from "next/navigation";

export default function AuthLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage =
  pathname?.startsWith("/auth") ||
  pathname?.startsWith("/onboarding");

  if (isAuthPage) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <PageTransition>{children}</PageTransition>
      </main>
    );
  }

  return (
    <>
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-gradient-to-r from-brandNavy via-brandBlue to-brandNavyDark border-b border-brandBlue/40 backdrop-blur-xl flex items-center justify-between px-5 shadow-lg shadow-black/30">
        <h1 className="text-lg font-semibold text-brandBlueLight tracking-wide">Prospra</h1>
        <ProfileMenu />
      </header>

      {/* SUB-NAV */}
      <nav className="fixed top-14 left-0 right-0 z-40 h-10 bg-brandNavy/80 border-b border-brandBlue/30 backdrop-blur-xl flex items-center gap-6 px-5 text-sm text-brandBlueLight/80 overflow-x-auto whitespace-nowrap">
        <a href="/dashboard" className="hover:text-brandBlueLight transition">
          Dashboard
        </a>
        <a href="/mentor" className="hover:text-brandBlueLight transition">
          Mentor
        </a>
        <a href="/journal" className="hover:text-brandBlueLight transition">
          Journal
        </a>
        <a href="/settings" className="hover:text-brandBlueLight transition">
          Settings
        </a>
      </nav>

      {/* FLOATING MENU */}
      <ProspraMenu />

      {/* MOBILE BAR */}
      <MobileTabBar />

      {/* MAIN CONTENT */}
      <main className="pt-[calc(56px+40px)] pb-16 px-4 md:px-6 max-w-screen-xl mx-auto min-h-screen">
        <PageTransition>{children}</PageTransition>
      </main>
    </>
  );
}
