"use client";

import * as React from "react";
import { InteractiveGlowSurface } from "@/components/ui/interactive-glow";

export type FounderFuelPromptRecord = {
  id: string;
  template_id: string | null;
  title: string;
  prompt_text: string;
  is_saved: boolean;
  created_at: string | null;
};

type FounderFuelSidebarProps = {
  refreshKey?: number;
  onSelectPrompt?: (prompt: FounderFuelPromptRecord) => void;
};

export default function FounderFuelSidebar({
  refreshKey = 0,
  onSelectPrompt,
}: FounderFuelSidebarProps) {
  const [saved, setSaved] = React.useState<FounderFuelPromptRecord[]>([]);
  const [recent, setRecent] = React.useState<FounderFuelPromptRecord[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function loadPrompts() {
      try {
        const res = await fetch("/api/founderfuel/prompts");
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (Array.isArray(data.saved)) setSaved(data.saved);
        if (Array.isArray(data.recent)) setRecent(data.recent);
      } catch {
        // Sidebar is non-critical; leave lists empty.
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    loadPrompts();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const renderPromptItem = (item: FounderFuelPromptRecord) => (
    <li key={item.id}>
      <button
        type="button"
        onClick={() => onSelectPrompt?.(item)}
        className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-left text-xs text-slate-300 transition hover:border-cyan-300/40 hover:text-slate-100"
        title={item.title}
      >
        {item.title}
      </button>
    </li>
  );

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
        <h3 className="text-sm font-semibold text-zinc-100">Saved Prompts</h3>
        {saved.length > 0 ? (
          <ul className="space-y-2">{saved.map(renderPromptItem)}</ul>
        ) : (
          <p className="text-xs text-slate-500">
            {loaded
              ? "No saved prompts yet. Generate a prompt and save it to keep it here."
              : "Loading…"}
          </p>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-700/80 bg-slate-900/65 p-4">
        <h3 className="text-sm font-semibold text-zinc-100">Recent Generations</h3>
        {recent.length > 0 ? (
          <ul className="space-y-2">{recent.map(renderPromptItem)}</ul>
        ) : (
          <p className="text-xs text-slate-500">
            {loaded
              ? "No generations yet. Your recent prompts will show up here."
              : "Loading…"}
          </p>
        )}
      </section>
    </InteractiveGlowSurface>
  );
}
