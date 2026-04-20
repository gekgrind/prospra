export type PromptPlatform =
  | ""
  | "chatgpt"
  | "claude"
  | "gemini"
  | "perplexity"
  | "midjourney"
  | "dalle_image_generation"
  | "website_copy"
  | "landing_page"
  | "email_campaign"
  | "blog_post"
  | "instagram"
  | "facebook"
  | "linkedin"
  | "x_twitter"
  | "google_ads"
  | "meta_ads"
  | "youtube"
  | "other";

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
  customPlatform: string;
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
  platform: string;
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
  { value: "chatgpt", label: "ChatGPT", badge: "Structured reasoning" },
  { value: "claude", label: "Claude", badge: "Detailed strategy" },
  { value: "gemini", label: "Gemini", badge: "Concise structured" },
  { value: "perplexity", label: "Perplexity", badge: "Research-ready" },
  { value: "midjourney", label: "Midjourney", badge: "Visual prompting" },
  { value: "dalle_image_generation", label: "DALL·E / Image Generation", badge: "Image composition" },
  { value: "website_copy", label: "Website Copy", badge: "Conversion copy" },
  { value: "landing_page", label: "Landing Page", badge: "Headline + CTA" },
  { value: "email_campaign", label: "Email Campaign", badge: "Sequence + conversion" },
  { value: "blog_post", label: "Blog Post", badge: "Depth + structure" },
  { value: "instagram", label: "Instagram", badge: "Short-form social" },
  { value: "facebook", label: "Facebook", badge: "Community + engagement" },
  { value: "linkedin", label: "LinkedIn", badge: "Professional social" },
  { value: "x_twitter", label: "X / Twitter", badge: "Punchy concise" },
  { value: "google_ads", label: "Google Ads", badge: "Performance copy" },
  { value: "meta_ads", label: "Meta Ads", badge: "Paid social ads" },
  { value: "youtube", label: "YouTube", badge: "Retention scripting" },
  { value: "other", label: "Other", badge: "Custom destination" },
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
  platform: "",
  customPlatform: "",
  platformVariant: "",
  outputLength: "medium",
  formatPreference: "Step-by-step output",
  includeExamples: true,
  includeFrameworks: true,
  successCriteria: "",
  contextDump: "",
  memoryEnabled: true,
};
