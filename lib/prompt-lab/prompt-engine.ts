import { PromptLabFormState, PromptPlatform, PromptScore } from "@/lib/prompt-lab/types";

type FounderMemory = {
  businessType?: string | null;
  audience?: string | null;
  goals?: string | null;
  offers?: string | null;
  stage?: string | null;
  tonePreference?: string | null;
};

export function buildSystemPrompt(platform: PromptPlatform) {
  return `You are Prospra Prompt Lab: a senior prompt engineer helping founders and solopreneurs produce high-leverage prompts.

Role framing:
- Translate founder intent into expert prompts.
- Preserve founder voice while raising output quality.
- Teach prompting quality implicitly through structure.

Rules 1-11:
1) Always preserve user intent.
2) Never invent business facts not provided.
3) Ask for assumptions inside prompt when context is missing.
4) Prefer concrete constraints over generic language.
5) Include clear output format.
6) Include success criteria and quality bar.
7) Include reasoning guidance without chain-of-thought leakage.
8) Optimize syntax for selected platform.
9) Keep language founder-friendly and practical.
10) Avoid fluff and vague adjectives.
11) Return JSON ONLY matching the requested schema.

Platform optimization mode: ${platform}`;
}

export function buildPlatformInstruction(platform: PromptPlatform): string {
  switch (platform) {
    case "claude":
      return "Use XML-like tags (<context>, <task>, <constraints>, <output_format>) and explicit instruction hierarchy.";
    case "chatgpt":
      return "Use markdown sections, bullet constraints, and explicit role/task/context/output blocks.";
    case "gemini":
      return "Use concise structured blocks and explicit short directives.";
    case "midjourney":
      return "Use image-generation syntax with weighted descriptors, style cues, camera/lighting details, and negative prompts where useful.";
    case "perplexity":
      return "Frame for research quality with citations request, source quality constraints, and compare/contrast directives.";
    case "universal":
    default:
      return "Build a hybrid structure that ports cleanly across major LLMs with clear delimiters.";
  }
}

export function buildPromptLabUserPayload(input: PromptLabFormState, memory?: FounderMemory | null) {
  return {
    task: {
      type: input.taskType === "Other" ? input.taskTypeOther : input.taskType,
      objective: input.objective,
      deliverable: input.deliverable,
      constraints: input.constraints,
    },
    audience: {
      type: input.audienceType === "Other" ? input.audienceTypeOther : input.audienceType,
      details: input.audienceDetails,
      awarenessLevel: input.awarenessLevel,
    },
    tone: {
      primary: input.tonePrimary,
      secondary: input.toneSecondary,
      avoid: input.noGoTone,
    },
    platform: {
      target: input.platform,
      variant: input.platformVariant,
      optimization: buildPlatformInstruction(input.platform),
    },
    advanced: {
      outputLength: input.outputLength,
      formatPreference: input.formatPreference,
      includeExamples: input.includeExamples,
      includeFrameworks: input.includeFrameworks,
      successCriteria: input.successCriteria,
      contextDump: input.contextDump,
    },
    memoryContext: input.memoryEnabled ? memory ?? {} : null,
    responseSchema: {
      prompt: "string",
      platform: "claude|chatgpt|gemini|midjourney|perplexity|universal",
      techniques: ["string"],
      whyItWorks: ["string"],
    },
  };
}

export function createFallbackPrompt(input: PromptLabFormState): string {
  const taskType = input.taskType === "Other" ? input.taskTypeOther : input.taskType;
  const audience = input.audienceType === "Other" ? input.audienceTypeOther : input.audienceType;
  return `# Role\nYou are an expert assistant for ${taskType}.\n\n# Objective\n${input.objective}\n\n# Audience\n${audience}: ${input.audienceDetails}\n\n# Deliverable\n${input.deliverable}\n\n# Constraints\n${input.constraints || "Keep this practical, specific, and implementation-ready."}\n\n# Tone\nPrimary: ${input.tonePrimary}\nSecondary: ${input.toneSecondary.join(", ")}\nAvoid: ${input.noGoTone || "Jargon and fluff"}\n\n# Quality Bar\n${input.successCriteria || "High signal, founder-ready, action-oriented output."}`;
}

export function heuristicScore(prompt: string, platform: PromptPlatform): PromptScore {
  const lengthScore = Math.min(100, Math.max(45, Math.round(prompt.length / 16)));
  const hasStructure = /(##|#|<task>|constraints|output)/i.test(prompt);
  const hasContext = /(audience|context|objective|goal)/i.test(prompt);
  const hasSpecific = /(exactly|at least|no more than|step-by-step|bullet)/i.test(prompt);

  const categories = [
    { label: "Clarity" as const, score: hasStructure ? Math.min(100, lengthScore + 6) : lengthScore - 8, note: "Clear role and objective framing." },
    { label: "Specificity" as const, score: hasSpecific ? Math.min(100, lengthScore + 5) : lengthScore - 10, note: "Specific constraints and quality bars." },
    { label: "Context richness" as const, score: hasContext ? Math.min(100, lengthScore + 3) : lengthScore - 12, note: "Sufficient business and audience context." },
    { label: "Structure" as const, score: hasStructure ? Math.min(100, lengthScore + 8) : lengthScore - 14, note: "Logical sections and output instructions." },
    { label: "Platform optimization" as const, score: /(xml|markdown|--ar|citation|hybrid)/i.test(prompt) ? Math.min(100, lengthScore + 7) : lengthScore - 6, note: `Tailored directives for ${platform}.` },
  ];

  const overall = Math.max(0, Math.min(100, Math.round(categories.reduce((acc, item) => acc + item.score, 0) / categories.length)));

  const suggestions = [
    "Add one measurable success condition (e.g., conversion goal, max length, required sections).",
    "Clarify audience pains and objections in a single line for sharper outputs.",
    "Specify the exact output structure (table, bullets, JSON, or script).",
    "Include one negative constraint that prevents generic answers.",
  ].slice(0, overall > 84 ? 2 : 4);

  return { overall, categories, suggestions };
}
