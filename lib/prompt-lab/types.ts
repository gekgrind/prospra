export type PromptPlatform =
  | "claude"
  | "chatgpt"
  | "gemini"
  | "midjourney"
  | "perplexity"
  | "universal";

export type PromptScoreCategory = {
  label: "Clarity" | "Specificity" | "Context richness" | "Structure" | "Platform optimization";
  score: number;
  note: string;
};

export type PromptScore = {
  overall: number;
  categories: PromptScoreCategory[];
  suggestions: string[];
};

export type PromptLabFormState = {
  taskType: string;
  taskTypeOther: string;
  objective: string;
  deliverable: string;
  constraints: string;
  audienceType: string;
  audienceTypeOther: string;
  audienceDetails: string;
  awarenessLevel: "cold" | "warm" | "hot";
  tonePrimary: string;
  toneSecondary: string[];
  noGoTone: string;
  platform: PromptPlatform;
  platformVariant: string;
  outputLength: "short" | "medium" | "long";
  formatPreference: string;
  includeExamples: boolean;
  includeFrameworks: boolean;
  successCriteria: string;
  contextDump: string;
  memoryEnabled: boolean;
};

export type GeneratedPrompt = {
  id: string;
  createdAt: string;
  platform: PromptPlatform;
  prompt: string;
  techniques: string[];
  whyItWorks: string[];
  score?: PromptScore;
};

export type PromptLabAction =
  | { type: "SET_FIELD"; field: keyof PromptLabFormState; value: string | boolean | string[] }
  | { type: "TOGGLE_CHIP"; field: "toneSecondary"; value: string }
  | { type: "RESET"; payload?: Partial<PromptLabFormState> };

export const SECONDARY_TONES = ["Authoritative", "Empathetic", "Playful", "Direct", "Data-driven", "Story-led", "Urgent", "Minimalist"];

export const TASK_TYPES = [
  "Landing page copy",
  "Offer positioning",
  "Cold outreach",
  "Sales call script",
  "Content strategy",
  "Product messaging",
  "Investor update",
  "Other",
];

export const AUDIENCE_TYPES = ["B2B founders", "Consumers", "SMBs", "Enterprise buyers", "Creators", "Freelancers", "Investors", "Other"];

export const PLATFORM_OPTIONS: { value: PromptPlatform; label: string; badge: string }[] = [
  { value: "claude", label: "Claude", badge: "XML structured" },
  { value: "chatgpt", label: "ChatGPT", badge: "Markdown structured" },
  { value: "gemini", label: "Gemini", badge: "Concise structured" },
  { value: "midjourney", label: "Midjourney", badge: "Image prompt syntax" },
  { value: "perplexity", label: "Perplexity", badge: "Research framing" },
  { value: "universal", label: "Universal", badge: "Cross-platform hybrid" },
];

export const initialPromptLabFormState: PromptLabFormState = {
  taskType: "",
  taskTypeOther: "",
  objective: "",
  deliverable: "",
  constraints: "",
  audienceType: "",
  audienceTypeOther: "",
  audienceDetails: "",
  awarenessLevel: "warm",
  tonePrimary: "Strategic and clear",
  toneSecondary: ["Empathetic"],
  noGoTone: "",
  platform: "chatgpt",
  platformVariant: "gpt-4.1",
  outputLength: "medium",
  formatPreference: "Step-by-step output",
  includeExamples: true,
  includeFrameworks: true,
  successCriteria: "",
  contextDump: "",
  memoryEnabled: true,
};
