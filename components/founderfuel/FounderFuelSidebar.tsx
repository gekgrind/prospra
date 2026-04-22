import { InteractiveGlowSurface } from "@/components/ui/interactive-glow";

const savedPromptPlaceholders = [
  "Launch campaign angle v1",
  "Offer refinement prompt",
  "Pre-sell validation sprint",
];

const recentGenerationPlaceholders = [
  "Audience research brief",
  "Founder-led content pillar plan",
  "Growth experiments shortlist",
];

export default function FounderFuelSidebar() {
  return (
    <InteractiveGlowSurface className="space-y-4 rounded-3xl border border-slate-700/70 bg-slate-950/70 p-5 shadow-[0_20px_40px_rgba(2,6,23,0.35)] sm:p-6 lg:sticky lg:top-6">
      <section className="space-y-3 rounded-2xl border border-cyan-300/20 bg-cyan-400/5 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-100">
          Best Results
        </h3>
        <ul className="space-y-2 text-sm text-slate-300">
          <li>• Be specific about the business</li>
          <li>• Name the audience clearly</li>
          <li>• Define the exact goal</li>
          <li>• Add context when nuance matters</li>
        </ul>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-700/80 bg-slate-900/65 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-zinc-100">Saved Prompts</h3>
          <span className="rounded-full border border-slate-600 bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-slate-400">
            Coming soon
          </span>
        </div>
        <ul className="space-y-2">
          {savedPromptPlaceholders.map((item) => (
            <li
              key={item}
              className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs text-slate-300"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-700/80 bg-slate-900/65 p-4">
        <h3 className="text-sm font-semibold text-zinc-100">Recent Generations</h3>
        <ul className="space-y-2">
          {recentGenerationPlaceholders.map((item) => (
            <li
              key={item}
              className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs text-slate-300"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>
    </InteractiveGlowSurface>
  );
}
