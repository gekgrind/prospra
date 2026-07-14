"use client";

import * as React from "react";
import FounderFuelHero from "@/components/founderfuel/FounderFuelHero";
import FounderFuelTemplatePicker from "@/components/founderfuel/FounderFuelTemplatePicker";
import FounderFuelForm from "@/components/founderfuel/FounderFuelForm";
import FounderFuelOutput from "@/components/founderfuel/FounderFuelOutput";
import FounderFuelSidebar from "@/components/founderfuel/FounderFuelSidebar";
import {
  defaultFounderFuelFormValues,
  founderFuelTemplates,
  type FounderFuelFormValues,
} from "@/components/founderfuel/founderfuel-templates";

function buildFounderFuelPrompt(values: FounderFuelFormValues) {
  const outputType = values.outputType || "Strategy";
  const goal = values.goal || "Clarify a high-impact next step for my business.";
  const businessIdea = values.businessIdea || "Not provided";
  const targetAudience = values.targetAudience || "Not provided";
  const toneStyle = values.toneStyle || "Professional";
  const additionalContext = values.additionalContext || "No additional context provided.";

  return `You are a senior business advisor and execution strategist specializing in ${outputType.toLowerCase()}.

I want your support with this objective:
${goal}

Business / idea:
${businessIdea}

Target audience:
${targetAudience}

Desired tone and style:
${toneStyle}

Additional context and constraints:
${additionalContext}

Please deliver a response that is clear, practical, and strategically strong. Prioritize actionable steps, decision quality, and recommendations tailored specifically to this business stage and audience.`;
}

export default function FounderFuelPage() {
  const [selectedTemplateId, setSelectedTemplateId] = React.useState(
    founderFuelTemplates[0].id
  );
  const [formValues, setFormValues] = React.useState<FounderFuelFormValues>({
    ...defaultFounderFuelFormValues,
    goal: founderFuelTemplates[0].defaultGoal,
    outputType: founderFuelTemplates[0].defaultOutputType,
  });
  const [generatedPrompt, setGeneratedPrompt] = React.useState("");
  const [generationId, setGenerationId] = React.useState<string | null>(null);
  const [isSaved, setIsSaved] = React.useState(false);
  const [sidebarRefreshKey, setSidebarRefreshKey] = React.useState(0);

  const activeTemplate = React.useMemo(
    () =>
      founderFuelTemplates.find((template) => template.id === selectedTemplateId) ??
      founderFuelTemplates[0],
    [selectedTemplateId]
  );

  const handleTemplateSelect = (template: (typeof founderFuelTemplates)[number]) => {
    setSelectedTemplateId(template.id);
    setFormValues((current) => ({
      ...current,
      goal: template.defaultGoal,
      outputType: template.defaultOutputType,
    }));
  };

  const handleFieldChange = <K extends keyof FounderFuelFormValues>(
    field: K,
    value: FounderFuelFormValues[K]
  ) => {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleGenerate = async () => {
    const prompt = buildFounderFuelPrompt(formValues);
    setGeneratedPrompt(prompt);
    setGenerationId(null);
    setIsSaved(false);

    // Record the generation; the prompt is still usable if this fails.
    try {
      const res = await fetch("/api/founderfuel/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: activeTemplate.id,
          title: activeTemplate.title,
          promptText: prompt,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.prompt?.id) {
          setGenerationId(data.prompt.id);
        }
        setSidebarRefreshKey((key) => key + 1);
      }
    } catch {
      // Non-critical; the generated prompt still renders.
    }
  };

  const handleSave = async (): Promise<boolean> => {
    try {
      if (generationId) {
        const res = await fetch("/api/founderfuel/prompts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: generationId, isSaved: true }),
        });
        if (!res.ok) return false;
      } else {
        const res = await fetch("/api/founderfuel/prompts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateId: activeTemplate.id,
            title: activeTemplate.title,
            promptText: generatedPrompt,
            isSaved: true,
          }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        if (data?.prompt?.id) {
          setGenerationId(data.prompt.id);
        }
      }

      setIsSaved(true);
      setSidebarRefreshKey((key) => key + 1);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <FounderFuelHero />
          <FounderFuelTemplatePicker
            templates={founderFuelTemplates}
            activeTemplateId={selectedTemplateId}
            onSelect={handleTemplateSelect}
          />
          <FounderFuelForm
            formValues={formValues}
            activeTemplate={activeTemplate}
            onFieldChange={handleFieldChange}
            onGenerate={handleGenerate}
          />
          <FounderFuelOutput
            generatedPrompt={generatedPrompt}
            onSave={handleSave}
            isSaved={isSaved}
          />
        </div>

        <FounderFuelSidebar
          refreshKey={sidebarRefreshKey}
          onSelectPrompt={(prompt) => {
            setGeneratedPrompt(prompt.prompt_text);
            setGenerationId(prompt.id);
            setIsSaved(prompt.is_saved);
          }}
        />
      </div>
    </div>
  );
}
