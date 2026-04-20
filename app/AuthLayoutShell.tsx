"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ProspraMenu from "@/components/ProspraMenu";
import ProfileMenu from "@/components/ProfileMenu";
import PageTransition from "@/components/PageTransition";
import MobileTabBar from "@/components/MobileTabBar";

export default function AuthLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isAuthPage =
    pathname?.startsWith("/auth") || pathname?.startsWith("/onboarding");

  const isDashboardRoute = pathname?.startsWith("/dashboard");

  if (isDashboardRoute) {
    return <PageTransition>{children}</PageTransition>;
  }

  if (isAuthPage) {
    return <PageTransition>{children}</PageTransition>;
  }

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-brandBlue/40 bg-gradient-to-r from-brandNavy via-brandBlue to-brandNavyDark px-5 shadow-lg shadow-black/30 backdrop-blur-xl">
        <h1 className="text-lg font-semibold tracking-wide text-brandBlueLight">
          Prospra
        </h1>
        <ProfileMenu />
      </header>

      <nav className="fixed left-0 right-0 top-14 z-40 flex h-10 items-center gap-6 overflow-x-auto whitespace-nowrap border-b border-brandBlue/30 bg-brandNavy/80 px-5 text-sm text-brandBlueLight/80 backdrop-blur-xl">
        <Link
          href="/dashboard"
          className="transition hover:text-brandBlueLight"
        >
          Dashboard
        </Link>
        <Link href="/mentor" className="transition hover:text-brandBlueLight">
          Mentor
        </Link>
        <Link href="/journal" className="transition hover:text-brandBlueLight">
          Journal
        </Link>
        <Link
          href="/settings"
          className="transition hover:text-brandBlueLight"
        >
          Settings
        </Link>
      </nav>

      <ProspraMenu />
      <MobileTabBar />

      <main className="mx-auto min-h-screen max-w-screen-xl px-4 pb-16 pt-[calc(56px+40px)] md:px-6">
        <PageTransition>{children}</PageTransition>
      </main>
    </>
  );
}