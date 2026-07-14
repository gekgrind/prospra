"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { InteractiveGlowSurface } from "@/components/ui/interactive-glow";

type FounderFuelOutputProps = {
  generatedPrompt: string;
  onSave?: () => Promise<boolean>;
  isSaved?: boolean;
};

export default function FounderFuelOutput({
  generatedPrompt,
  onSave,
  isSaved = false,
}: FounderFuelOutputProps) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
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
    <InteractiveGlowSurface className="space-y-4 rounded-3xl border border-slate-700/70 bg-slate-950/65 p-5 shadow-[0_20px_40px_rgba(2,6,23,0.35)] sm:p-6">
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
          {onSave ? (
            <button
              type="button"
              onClick={async () => {
                if (!canCopy || saving || isSaved) return;
                setSaving(true);
                try {
                  await onSave();
                } finally {
                  setSaving(false);
                }
              }}
              disabled={!canCopy || saving || isSaved}
              className="inline-flex items-center rounded-lg border border-cyan-300/35 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
            >
              {isSaved ? "Saved" : saving ? "Saving…" : "Save Prompt"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              if (!canCopy) return;
              router.push(`/mentor?prompt=${encodeURIComponent(generatedPrompt)}`);
            }}
            disabled={!canCopy}
            className="inline-flex items-center rounded-lg border border-cyan-300/35 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
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
    </InteractiveGlowSurface>
  );
}
