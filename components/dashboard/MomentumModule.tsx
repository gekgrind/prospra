import Link from "next/link";
import type { MomentumSummary } from "@/lib/momentum";
import { formatMomentumStateLabel } from "@/lib/momentum";

function getStateTone(state: string) {
  const normalized = state.toLowerCase();

  if (normalized.includes("risk") || normalized.includes("stalled")) {
    return "border-rose-400/20 bg-rose-400/10 text-rose-300";
  }

  if (normalized.includes("build") || normalized.includes("grow")) {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (normalized.includes("steady") || normalized.includes("stable")) {
    return "border-[#00D4FF]/20 bg-[#00D4FF]/10 text-[#9beeff]";
  }

  return "border-[#4f7ca7]/20 bg-[#4f7ca7]/10 text-[#cfe8ff]";
}

export function MomentumModule({ momentum }: { momentum: MomentumSummary }) {
  const { state, signals, recommendation, nudgeTitle, nudgeBody } = momentum;
  const stateLabel = formatMomentumStateLabel(state);
  const stateKey = String(state);

  return (
    <section className="mt-12">
      <div className="mb-5">
        <div className="mb-3 inline-flex items-center rounded-full border border-[#00D4FF]/20 bg-[#00D4FF]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#00D4FF]">
          Momentum
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-white md:text-2xl">
          Your current operating rhythm
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#c7d8ea]/72">
          A quick read on progress, activity, and whether your founder energy is
          building, steady, or quietly drifting into the void.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-[28px] border border-[#4f7ca7]/20 bg-[rgba(10,20,38,0.72)] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl md:p-7">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00D4FF]/55 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,212,255,0.10),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(79,124,167,0.10),transparent_32%)]" />

        <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8fb8d8]">
              Current State
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
                {stateLabel}
              </p>

              <span
                className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getStateTone(
                  stateKey
                )}`}
              >
                {stateKey.replace(/_/g, " ")}
              </span>
            </div>

            <p className="mt-3 text-sm leading-7 text-[#d7e5f4]/76">
              {recommendation.detail}
            </p>
          </div>

          <Link
            href={recommendation.ctaHref}
            className="inline-flex items-center justify-center rounded-full border border-[#00D4FF]/25 bg-[#0f223d] px-5 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(0,212,255,0.12)] transition hover:border-[#00D4FF]/45 hover:bg-[#143055]"
          >
            {recommendation.ctaLabel}
          </Link>
        </div>

        <div className="relative mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#4f7ca7]/15 bg-[rgba(255,255,255,0.03)] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8fb8d8]">
              Progress
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {signals.completedGoals}/{signals.totalGoals} goals complete
            </p>
          </div>

          <div className="rounded-2xl border border-[#4f7ca7]/15 bg-[rgba(255,255,255,0.03)] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8fb8d8]">
              In Progress
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {signals.activeGoals} active goals
            </p>
          </div>

          <div className="rounded-2xl border border-[#4f7ca7]/15 bg-[rgba(255,255,255,0.03)] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8fb8d8]">
              Last Activity
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {signals.daysSinceMeaningfulActivity === null
                ? "No activity yet"
                : `${signals.daysSinceMeaningfulActivity}d ago`}
            </p>
          </div>
        </div>

        <div className="relative mt-5 rounded-2xl border border-[#00D4FF]/15 bg-[#00D4FF]/[0.06] px-4 py-4">
          <p className="text-sm font-semibold text-white">{nudgeTitle}</p>
          <p className="mt-1 text-sm leading-6 text-[#d7e5f4]/74">
            {nudgeBody}
          </p>
        </div>
      </div>
    </section>
  );
}