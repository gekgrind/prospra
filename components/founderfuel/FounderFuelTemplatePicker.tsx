import type { FounderFuelTemplate } from "@/components/founderfuel/founderfuel-templates";
import { InteractiveGlowSurface } from "@/components/ui/interactive-glow";

type FounderFuelTemplatePickerProps = {
  templates: FounderFuelTemplate[];
  activeTemplateId: string;
  onSelect: (template: FounderFuelTemplate) => void;
};

export default function FounderFuelTemplatePicker({
  templates,
  activeTemplateId,
  onSelect,
}: FounderFuelTemplatePickerProps) {
  return (
    <InteractiveGlowSurface className="space-y-4 rounded-3xl border border-slate-700/70 bg-slate-950/65 p-5 shadow-[0_20px_40px_rgba(2,6,23,0.35)] sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">Template Library</h2>
        <p className="mt-1 text-sm text-slate-400">
          Choose a category to get smarter defaults for goal and output structure.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => {
          const isActive = template.id === activeTemplateId;

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template)}
              className={`group rounded-2xl border px-4 py-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 ${
                isActive
                  ? "border-cyan-300/50 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(34,211,238,0.18)]"
                  : "border-slate-700/80 bg-slate-900/70 hover:border-slate-500/80 hover:bg-slate-900"
              }`}
            >
              <p
                className={`text-sm font-semibold ${
                  isActive ? "text-cyan-100" : "text-zinc-100"
                }`}
              >
                {template.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400 group-hover:text-slate-300">
                {template.description}
              </p>
            </button>
          );
        })}
      </div>
    </InteractiveGlowSurface>
  );
}
