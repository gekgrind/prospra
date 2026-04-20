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

function getPlatformLabel(platform: PromptPlatform) {
  const labels: Record<Exclude<PromptPlatform, "">, string> = {
    chatgpt: "ChatGPT",
    claude: "Claude",
    gemini: "Gemini",
    perplexity: "Perplexity",
    midjourney: "Midjourney",
    dalle_image_generation: "DALL·E / Image Generation",
    website_copy: "Website Copy",
    landing_page: "Landing Page",
    email_campaign: "Email Campaign",
    blog_post: "Blog Post",
    instagram: "Instagram",
    facebook: "Facebook",
    linkedin: "LinkedIn",
    x_twitter: "X / Twitter",
    google_ads: "Google Ads",
    meta_ads: "Meta Ads",
    youtube: "YouTube",
    other: "Other",
  };

  if (!platform) return "";
  return labels[platform];
}

function resolveDestination(input: PromptLabFormState): string {
  if (input.platform === "other" && input.customPlatform.trim()) return input.customPlatform.trim();
  return getPlatformLabel(input.platform) || "";
}

export function buildPlatformInstruction(platform: PromptPlatform): string {
  switch (platform) {
    case "chatgpt":
    case "claude":
    case "gemini":
    case "perplexity":
      return "Prioritize structured, high-quality outputs. Use clear sections, concise bullets where useful, deep but practical reasoning, and actionable recommendations.";
    case "midjourney":
    case "dalle_image_generation":
      return "Focus on visual specificity: composition, style, lighting, mood, focal details, quality settings, and constraints that prevent generic imagery.";
    case "website_copy":
    case "landing_page":
      return "Emphasize conversion-focused copy: clear positioning, strong headlines, skimmable structure, persuasive body sections, and explicit CTA language.";
    case "email_campaign":
      return "Design for email performance: compelling subject lines, sequencing logic, persuasive flow, clarity, and conversion-focused calls to action.";
    case "instagram":
    case "facebook":
    case "linkedin":
    case "x_twitter":
      return "Adapt to social-native writing: strong hooks, high readability, platform-fit tone, concise formatting, and engagement-oriented phrasing.";
    case "google_ads":
    case "meta_ads":
      return "Optimize for ad performance constraints: concise high-clarity copy, clear value proposition, sharp hooks, audience targeting cues, and direct CTAs.";
    case "blog_post":
      return "Prioritize blog depth and readability: logical structure, clear section flow, search-intent alignment, and actionable depth without fluff.";
    case "youtube":
      return "Optimize for video retention: compelling hook, narrative flow, sectional pacing, title ideas, and engagement prompts tuned for viewers.";
    case "other":
      return "Tailor the result to the specified destination with platform-native best practices, audience expectations, structure, and formatting.";
    case "":
    default:
      return "Use a premium, structured, founder-focused output that remains clear, actionable, and strategically strong.";
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
      target: resolveDestination(input) || null,
      variant: input.platformVariant,
      optimization: buildPlatformInstruction(input.platform || ""),
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
      platform: "string",
      techniques: ["string"],
      whyItWorks: ["string"],
    },
  };
}

export function createFallbackPrompt(input: PromptLabFormState): string {
  const taskType = input.taskType === "Other" ? input.taskTypeOther : input.taskType;
  const audience = input.audienceType === "Other" ? input.audienceTypeOther : input.audienceType;
  const platformDestination = resolveDestination(input);
  const toneSecondary = input.toneSecondary.length > 0 ? input.toneSecondary.join(", ") : "None specified";
  const additionalContext = input.contextDump || "No additional context provided.";
  const platformInstruction = platformDestination
    ? `\nThis prompt will be used for:\n${platformDestination}\n\nOptimize this response for use in ${platformDestination}. Adapt structure, formatting, tone, length, best practices, and audience expectations for this destination.\n\nPlatform-specific guidance:\n${buildPlatformInstruction(input.platform)}`
    : "";

  return `You are an expert strategist and execution partner focused on ${input.deliverable || taskType}.\n\nHelp me accomplish the following objective:\n${input.objective}\n\nBusiness / idea:\n${taskType}\n\nTarget audience:\n${audience}: ${input.audienceDetails}${platformInstruction}\n\nDesired tone / style:\nPrimary: ${input.tonePrimary}\nSecondary: ${toneSecondary}\nAvoid: ${input.noGoTone || "Jargon and fluff"}\n\nAdditional context:\n${additionalContext}\n\nConstraints:\n${input.constraints || "Keep this practical, specific, and implementation-ready."}\n\nSuccess criteria:\n${input.successCriteria || "Deliver a high-signal, founder-ready, action-oriented output."}\n\nDeliver a response that is clear, actionable, strategically strong, and tailored to this business, audience, and${platformDestination ? " platform." : " objective."}`;
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
