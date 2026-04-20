import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  FounderFuelFormValues,
  FounderFuelOutputType,
  FounderFuelTemplate,
  FounderFuelTone,
} from "@/components/founderfuel/founderfuel-templates";
import {
  founderFuelOutputTypeOptions,
  founderFuelToneOptions,
} from "@/components/founderfuel/founderfuel-templates";

type FounderFuelFormProps = {
  formValues: FounderFuelFormValues;
  activeTemplate: FounderFuelTemplate;
  onFieldChange: <K extends keyof FounderFuelFormValues>(
    field: K,
    value: FounderFuelFormValues[K]
  ) => void;
  onGenerate: () => void;
};

const inputClassName =
  "border-slate-700/80 bg-slate-950/80 text-zinc-100 placeholder:text-slate-500 focus-visible:border-cyan-300/70 focus-visible:ring-cyan-300/40";

export default function FounderFuelForm({
  formValues,
  activeTemplate,
  onFieldChange,
  onGenerate,
}: FounderFuelFormProps) {
  return (
    <section className="space-y-5 rounded-3xl border border-slate-700/70 bg-slate-950/65 p-5 shadow-[0_20px_40px_rgba(2,6,23,0.35)] sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">Prompt Inputs</h2>
        <p className="mt-1 text-sm text-slate-400">
          Fill in your context to generate a focused, high-leverage founder prompt.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="businessIdea" className="text-slate-200">
            Business / Idea
          </Label>
          <Input
            id="businessIdea"
            value={formValues.businessIdea}
            onChange={(event) => onFieldChange("businessIdea", event.target.value)}
            placeholder="Describe your business, product, or offer in one or two lines."
            className={inputClassName}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="targetAudience" className="text-slate-200">
            Target Audience
          </Label>
          <Input
            id="targetAudience"
            value={formValues.targetAudience}
            onChange={(event) => onFieldChange("targetAudience", event.target.value)}
            placeholder="Who exactly are you trying to reach?"
            className={inputClassName}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="goal" className="text-slate-200">
            Goal
          </Label>
          <Textarea
            id="goal"
            value={formValues.goal}
            onChange={(event) => onFieldChange("goal", event.target.value)}
            placeholder={activeTemplate.goalHint}
            className={`${inputClassName} min-h-[112px] resize-y`}
          />
          <p className="text-xs text-slate-500">
            Template default: {activeTemplate.defaultGoal}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="toneStyle" className="text-slate-200">
            Tone / Style
          </Label>
          <Select
            value={formValues.toneStyle}
            onValueChange={(value) => onFieldChange("toneStyle", value as FounderFuelTone)}
          >
            <SelectTrigger
              id="toneStyle"
              className="border-slate-700/80 bg-slate-950/80 text-zinc-100 focus:ring-cyan-300/40"
            >
              <SelectValue placeholder="Select tone" />
            </SelectTrigger>
            <SelectContent className="border-slate-700 bg-slate-900 text-zinc-100">
              {founderFuelToneOptions.map((tone) => (
                <SelectItem key={tone} value={tone}>
                  {tone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="outputType" className="text-slate-200">
            Output Type
          </Label>
          <Select
            value={formValues.outputType}
            onValueChange={(value) =>
              onFieldChange("outputType", value as FounderFuelOutputType)
            }
          >
            <SelectTrigger
              id="outputType"
              className="border-slate-700/80 bg-slate-950/80 text-zinc-100 focus:ring-cyan-300/40"
            >
              <SelectValue placeholder="Select output type" />
            </SelectTrigger>
            <SelectContent className="border-slate-700 bg-slate-900 text-zinc-100">
              {founderFuelOutputTypeOptions.map((outputType) => (
                <SelectItem key={outputType} value={outputType}>
                  {outputType}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="additionalContext" className="text-slate-200">
            Additional Context
          </Label>
          <Textarea
            id="additionalContext"
            value={formValues.additionalContext}
            onChange={(event) =>
              onFieldChange("additionalContext", event.target.value)
            }
            placeholder="Add constraints, timeline, channels, resources, or anything the AI must consider."
            className={`${inputClassName} min-h-[132px] resize-y`}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onGenerate}
        className="inline-flex items-center justify-center rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-yellow-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
      >
        Generate Prompt
      </button>
    </section>
  );
}
