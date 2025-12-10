// /app/dashboard/ux-scanner/page.tsx

"use client";

import { useState } from "react";

type SectionInsight = {
  id: string;
  label: string;
  score: number;
  issues: string[];
};

type UxScanResult = {
  url: string;
  seoScore: number;
  uxScore: number;
  clarityScore: number;
  ctaScore: number;
  mobileScore: number;
  notes: string[];
  sections: SectionInsight[];
};

function scoreColor(score: number) {
  if (score < 50) return "bg-red-500/80";
  if (score < 70) return "bg-yellow-500/80";
  return "bg-emerald-500/80";
}

export default function UxScannerPage() {
  const [url, setUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<UxScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setIsScanning(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/website/ux-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to run UX scan");
      }

      const data = (await res.json()) as UxScanResult;
      setResult(data);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setIsScanning(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-b from-[#050816] via-[#050816] to-[#02010a] px-4 py-8 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
              Website UX Scanner
            </h1>
            <p className="mt-1 max-w-xl text-sm text-slate-400">
              Drop in a URL and get a fast breakdown of your SEO, clarity,
              calls-to-action, and mobile-friendliness – through a founder-first lens.
            </p>
          </div>
        </header>

        <form
          onSubmit={handleScan}
          className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-xl md:flex-row md:items-center"
        >
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-orange-300">
              Website URL
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-website.com"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-orange-400/80"
            />
          </div>
          <button
            type="submit"
            disabled={isScanning}
            className="mt-1 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/40 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 md:mt-6"
          >
            {isScanning ? "Scanning..." : "Run UX Scan"}
          </button>
        </form>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {result && (
          <div className="grid gap-4 md:grid-cols-[2fr,3fr]">
            {/* Left: Scores */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Overview
                </p>
                <p className="mt-1 text-sm text-slate-300 break-all">{result.url}</p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <ScorePill label="Overall UX" value={result.uxScore} />
                  <ScorePill label="SEO" value={result.seoScore} />
                  <ScorePill label="Clarity" value={result.clarityScore} />
                  <ScorePill label="CTAs" value={result.ctaScore} />
                  <ScorePill label="Mobile" value={result.mobileScore} />
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  High-Level Notes
                </p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {result.notes.map((note, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-400" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right: Section breakdown */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Section Breakdown
                </p>
                <div className="mt-3 space-y-3">
                  {result.sections.map((section) => (
                    <div
                      key={section.id}
                      className="rounded-xl border border-white/5 bg-white/5 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-slate-100">
                          {section.label}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-700/60">
                            <div
                              className={`h-full ${scoreColor(
                                section.score
                              )} transition-all`}
                              style={{ width: `${section.score}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-300">
                            {section.score}/100
                          </span>
                        </div>
                      </div>
                      {section.issues?.length > 0 && (
                        <ul className="mt-2 space-y-1 text-xs text-slate-300">
                          {section.issues.map((issue, idx) => (
                            <li key={idx} className="flex gap-2">
                              <span className="mt-[5px] h-1 w-1 rounded-full bg-slate-400" />
                              <span>{issue}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ScorePill({ label, value }: { label: string; value: number }) {
  const barClass = scoreColor(value);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center justify-between text-xs text-slate-300">
        <span>{label}</span>
        <span className="font-semibold text-slate-100">{value}/100</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800/70">
        <div className={`h-full ${barClass}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
