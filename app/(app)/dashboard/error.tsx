"use client";

import Link from "next/link";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07111f] px-6 py-10 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(79,124,167,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(79,124,167,0.16)_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,212,255,0.14),transparent_24%),linear-gradient(180deg,rgba(7,17,31,0.82)_0%,rgba(7,17,31,0.98)_100%)]" />
      </div>

      <div className="relative mx-auto flex min-h-[70vh] max-w-3xl items-center">
        <div className="relative overflow-hidden rounded-[28px] border border-[#4f7ca7]/20 bg-[rgba(10,20,38,0.78)] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl md:p-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00D4FF]/55 to-transparent" />
          <div className="mb-4 inline-flex items-center rounded-full border border-[#ffe521]/20 bg-[#ffe521]/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#fff6b0]">
            Dashboard unavailable
          </div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Prospra could not load your dashboard.
          </h1>
          <p className="mt-4 text-sm leading-7 text-[#c7d8ea]/78 md:text-base">
            Your account is still intact. Retry the dashboard load, or open Mentor
            if you need to keep working while the dashboard recovers.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center rounded-full border border-[#00D4FF]/25 bg-[#0f223d] px-5 py-3 text-sm font-semibold text-white transition hover:border-[#00D4FF]/45 hover:bg-[#143055]"
            >
              Retry Dashboard
            </button>
            <Link
              href="/mentor"
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-[#dce9f7] transition hover:bg-white/10"
            >
              Talk to AI Mentor
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
