"use client";

import * as React from "react";

type FounderFuelOutputProps = {
  generatedPrompt: string;
};

export default function FounderFuelOutput({ generatedPrompt }: FounderFuelOutputProps) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setCopied(false);
    }, 1600);

    return () => window.clearTimeout(timeout);
  }, [copied]);

  const canCopy = Boolean(generatedPrompt.trim());

  const handleCopy = async () => {
    if (!canCopy) {
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="space-y-4 rounded-3xl border border-slate-700/70 bg-slate-950/65 p-5 shadow-[0_20px_40px_rgba(2,6,23,0.35)] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Generated Prompt</h2>
          <p className="mt-1 text-sm text-slate-400">
            Refine as needed, then copy directly into your preferred AI workflow.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!canCopy}
            className="inline-flex items-center rounded-lg border border-cyan-300/35 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
          >
            {copied ? "Copied" : "Copy Prompt"}
          </button>
          <button
            type="button"
            disabled
            className="inline-flex cursor-not-allowed items-center rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-500"
          >
            Use this in Mentor
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700/80 bg-slate-950/80 p-4 sm:p-5">
        {canCopy ? (
          <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-200">
            {generatedPrompt}
          </pre>
        ) : (
          <p className="text-sm leading-relaxed text-slate-400">
            No prompt generated yet. Choose a template, add your context, and generate your first FounderFuel prompt.
          </p>
        )}
      </div>
    </section>
  );
}
