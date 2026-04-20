import { Sparkles } from "lucide-react";

export function WebIntelligenceHero() {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-[#4f7ca7]/20 bg-[rgba(10,20,38,0.72)] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.3)] backdrop-blur-xl md:p-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00D4FF]/60 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,212,255,0.16),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(79,124,167,0.14),transparent_30%)]" />

      <div className="relative z-10 space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#00D4FF]/25 bg-[#00D4FF]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#bdefff]">
          <Sparkles className="h-3.5 w-3.5 text-[#00D4FF]" />
          Site Strategist
        </div>

        <div className="max-w-3xl space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight text-white md:text-4xl">
            Analyze the site your customers actually experience.
          </h1>
          <p className="text-sm leading-7 text-[#c7d8ea]/80 md:text-base">
            Turn your website into a sharper growth asset with diagnostics for
            clarity, SEO, UX, CTAs, funnel flow, and conversion messaging.
          </p>
        </div>
      </div>
    </section>
  );
}