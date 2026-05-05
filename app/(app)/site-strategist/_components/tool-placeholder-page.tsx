import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type ToolPlaceholderPageProps = {
  title: string;
  description: string;
  inputLabel: string;
  inputPlaceholder: string;
  resultTitle: string;
  resultDescription: string;
};

export function ToolPlaceholderPage({
  title,
  description,
  inputLabel,
  inputPlaceholder,
  resultTitle,
  resultDescription,
}: ToolPlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/web-intelligence"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#9eefff] transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Site Strategist
      </Link>

      <section className="rounded-[24px] border border-[#4f7ca7]/20 bg-[rgba(10,20,38,0.66)] p-5 shadow-[0_16px_50px_rgba(0,0,0,0.24)] md:p-6">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8fb8d8]">
            Site Strategist tool
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-3xl">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#c7d8ea]/78">
            {description}
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.82fr)]">
        <form className="rounded-[20px] border border-[#4f7ca7]/18 bg-[rgba(8,16,30,0.68)] p-4 md:p-5">
          <label
            htmlFor="tool-input"
            className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8fb8d8]"
          >
            {inputLabel}
          </label>
          <textarea
            id="tool-input"
            rows={8}
            placeholder={inputPlaceholder}
            className="mt-3 w-full resize-none rounded-2xl border border-[#4f7ca7]/24 bg-[#07111f]/75 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-[#8fb8d8]/48 focus:border-[#00D4FF]/45"
          />
          <button
            type="button"
            disabled
            className="mt-4 inline-flex cursor-not-allowed items-center justify-center rounded-full border border-[#4f7ca7]/24 bg-[#0d2039]/75 px-4 py-2 text-sm font-semibold text-[#d4e8fb]/70"
          >
            Analysis coming soon
          </button>
        </form>

        <aside className="rounded-[20px] border border-[#4f7ca7]/18 bg-[#07111f]/70 p-4 md:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8fb8d8]">
            Mock result
          </p>
          <h2 className="mt-2 text-lg font-semibold text-white">{resultTitle}</h2>
          <p className="mt-3 text-sm leading-6 text-[#c7d8ea]/76">
            {resultDescription}
          </p>
          <div className="mt-4 rounded-2xl border border-dashed border-[#4f7ca7]/24 bg-[#06101d]/70 px-4 py-5 text-sm text-[#c7d8ea]/62">
            Enter a page, offer, or funnel detail when this tool is connected to generate founder-ready recommendations.
          </div>
        </aside>
      </section>
    </div>
  );
}
