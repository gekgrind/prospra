import { InteractiveGlowSurface } from "@/components/ui/interactive-glow";

export default function FounderFuelHero() {
  return (
    <InteractiveGlowSurface className="relative rounded-3xl border border-cyan-300/20 bg-slate-950/70 p-6 shadow-[0_0_0_1px_rgba(56,189,248,0.06),0_20px_60px_rgba(2,6,23,0.45)] backdrop-blur-sm sm:p-8">
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-sky-300/10 blur-3xl" />

      <div className="relative space-y-6">
        <div className="inline-flex items-center rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-cyan-100">
          FOUNDER TOOLKIT
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl">
            FounderFuel Prompt Generator
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Generate sharper, more strategic AI prompts tailored to your business goals. FounderFuel helps you turn messy ideas into precise instructions your AI can actually execute.
          </p>
          <p className="max-w-3xl text-sm leading-relaxed text-slate-400 sm:text-base">
            The more context you provide about your business, audience, and goal, the more powerful and actionable your generated prompt will be.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            "Strategy-ready",
            "Marketing-focused",
            "Founder-built",
          ].map((pill) => (
            <span
              key={pill}
              className="inline-flex items-center rounded-full border border-slate-700/80 bg-slate-900/70 px-3 py-1 text-xs font-medium text-slate-200"
            >
              {pill}
            </span>
          ))}
        </div>
      </div>
    </InteractiveGlowSurface>
  );
}
