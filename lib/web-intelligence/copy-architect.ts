export type CopyArchitectTone =
  | "Clear and confident"
  | "Warm and supportive"
  | "Premium and strategic"
  | "Direct and conversion-focused"
  | "Calm and expert";

export type CopyArchitectInput = {
  websiteUrl: string;
  existingCopy: string;
  businessOffer: string;
  targetAudience: string;
  copyGoal: string;
  desiredTone: CopyArchitectTone;
};

export type CopyArchitectComparison = {
  before: string;
  after: string;
};

export type CopyArchitectResult = {
  analyzedUrl: string;
  clarityScore: number;
  conversionScore: number;
  headline: string;
  subheadline: string;
  cta: string;
  shortWebsiteHeroCopy: string;
  quickImprovementNotes: string[];
  comparison: CopyArchitectComparison;
  headlineOptions: string[];
  subheadlineOptions: string[];
  rewrittenHero: {
    headline: string;
    subheadline: string;
    body: string;
    cta: string;
  };
  trustBuildingSuggestions: string[];
  ctaSuggestions: string[];
  notes: string[];
};

export type CopyArchitectError = {
  error: string;
};

export type CopyArchitectRequestBody = {
  websiteUrl?: unknown;
  existingCopy?: unknown;
  businessOffer?: unknown;
  targetAudience?: unknown;
  copyGoal?: unknown;
  desiredTone?: unknown;
};

type CopyArchitectPromptInput = CopyArchitectInput & {
  boundedExistingCopy: string;
};

export const copyArchitectToneOptions: CopyArchitectTone[] = [
  "Clear and confident",
  "Warm and supportive",
  "Premium and strategic",
  "Direct and conversion-focused",
  "Calm and expert",
];

const MAX_EXISTING_COPY_LENGTH = 6000;
const AI_GENERATION_TIMEOUT_MS = 15000;

export function isCopyArchitectTone(value: unknown): value is CopyArchitectTone {
  return (
    typeof value === "string" &&
    copyArchitectToneOptions.includes(value as CopyArchitectTone)
  );
}

export function normalizeCopyArchitectUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (/^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    throw new Error("Only public http and https URLs are supported.");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(withProtocol);

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only public http and https URLs are supported.");
  }

  if (parsed.username || parsed.password) {
    throw new Error("URLs with embedded credentials are not supported.");
  }

  parsed.hash = "";
  return parsed.toString();
}

export function validateCopyArchitectInput(
  body: CopyArchitectRequestBody
): { input: CopyArchitectInput } | { error: string } {
  const websiteUrl = getStringField(body, "websiteUrl");
  const existingCopy = getStringField(body, "existingCopy");
  const businessOffer = getStringField(body, "businessOffer");
  const targetAudience = getStringField(body, "targetAudience");
  const copyGoal = getStringField(body, "copyGoal");
  const desiredTone = body.desiredTone;

  if (!businessOffer) {
    return { error: "Offer is required." };
  }

  if (!targetAudience) {
    return { error: "Audience is required." };
  }

  if (!copyGoal) {
    return { error: "Goal is required." };
  }

  if (!isCopyArchitectTone(desiredTone)) {
    return { error: "Please choose a valid tone." };
  }

  try {
    normalizeCopyArchitectUrl(websiteUrl);
  } catch {
    return { error: "Please enter a valid public http or https URL." };
  }

  return {
    input: {
      websiteUrl,
      existingCopy,
      businessOffer,
      targetAudience,
      copyGoal,
      desiredTone,
    },
  };
}

export async function analyzeCopyArchitectFallback(
  input: CopyArchitectInput
): Promise<CopyArchitectResult> {
  const analyzedUrl = normalizeCopyArchitectUrl(input.websiteUrl);
  const existingCopy = input.existingCopy.trim();
  const offer = input.businessOffer.trim();
  const audience = input.targetAudience.trim();
  const goal = input.copyGoal.trim();
  const tone = input.desiredTone;
  const promise = getPromisePhrase(offer);
  const audiencePhrase = audience || "the right-fit founder";
  const actionPhrase = getActionPhrase(offer);
  const hasSpecificAudience = audience.length >= 18;
  const hasSpecificOffer = offer.length >= 24;
  const hasProofCue = /\b(result|client|case|proof|trusted|testimonial|revenue|growth|save|faster)\b/i.test(
    existingCopy
  );
  const hasClearAction = /\b(book|start|get|join|request|download|schedule|try|build)\b/i.test(
    existingCopy
  );

  const clarityScore = clampScore(
    44 +
      (hasSpecificOffer ? 16 : 7) +
      (hasSpecificAudience ? 14 : 5) +
      (existingCopy.length > 120 ? 10 : 4) +
      (hasClearAction ? 8 : 2) +
      (tone.length % 6)
  );
  const conversionScore = clampScore(
    40 +
      (hasClearAction ? 16 : 5) +
      (hasProofCue ? 14 : 4) +
      (hasSpecificOffer ? 12 : 5) +
      (hasSpecificAudience ? 8 : 3) +
      (analyzedUrl.length % 7)
  );

  const primaryHeadline = `${promise} for ${audiencePhrase}`;
  const cta = getRecommendedCta(tone);
  const primarySubheadline = `Show ${audiencePhrase} exactly how ${offer || "your offer"} helps them reach ${goal || "the next step"} with less guesswork.`;
  const shortWebsiteHeroCopy = `${primaryHeadline}\n\n${primarySubheadline}\n\n${cta}`;
  const quickImprovementNotes = [
    "Lead with the audience and outcome before explaining features.",
    "Keep the CTA tied to a useful next step, not a generic transaction.",
    "Add one proof cue near the hero to reduce hesitation before the click.",
  ];

  return {
    analyzedUrl,
    clarityScore,
    conversionScore,
    headline: primaryHeadline,
    subheadline: primarySubheadline,
    cta,
    shortWebsiteHeroCopy,
    quickImprovementNotes,
    comparison: {
      before: summarizeBeforeCopy(existingCopy),
      after: `${primaryHeadline}. The revised message names the audience, clarifies the outcome, and gives visitors a lower-friction next step.`,
    },
    headlineOptions: [
      primaryHeadline,
      `${actionPhrase} without losing clarity`,
      `Turn your website into a clearer path to ${promise.toLowerCase()}`,
    ],
    subheadlineOptions: [
      `A sharper page message for ${audiencePhrase} that explains what you do, why it matters, and what to do next.`,
      `Clarify the offer, reduce hesitation, and make the next step feel useful before visitors leave the page.`,
      `Position ${offer || "your offer"} with stronger trust cues, cleaner structure, and more specific conversion language.`,
    ],
    rewrittenHero: {
      headline: primaryHeadline,
      subheadline: primarySubheadline,
      body: `This version leads with the outcome, supports it with practical context, and keeps the ask focused. It gives visitors enough confidence to understand the offer before they are asked to take action.`,
      cta,
    },
    trustBuildingSuggestions: [
      "Add one proof point directly under the hero promise, such as a client result, testimonial, or credible operating detail.",
      "Name who the offer is best for so qualified visitors feel recognized and unqualified visitors self-select out.",
      "Place a short reassurance line near the CTA that explains what happens after the click.",
    ],
    ctaSuggestions: [
      cta,
      "See how it works",
      "Get the clarity plan",
      "Review my next step",
    ],
    notes: [
      "The rewrite moves from broad description to a specific promise, which helps visitors understand relevance faster.",
      "The audience language makes the page feel more personal without overexplaining the offer.",
      "The CTA is framed around progress and clarity, so the action feels useful instead of purely transactional.",
      "Trust cues are placed close to the decision moment because conversion friction usually appears right before the click.",
    ],
  };
}

export async function analyzeCopyArchitect(
  input: CopyArchitectInput
): Promise<CopyArchitectResult> {
  const normalizedInput = normalizeCopyArchitectInput(input);
  const promptInput = prepareCopyArchitectPromptInput(normalizedInput);
  const prompt = buildCopyArchitectPrompt(promptInput);
  const aiResult = await generateCopyWithAI(promptInput, prompt);

  if (aiResult) {
    return shapeCopyArchitectResult(aiResult);
  }

  return shapeCopyArchitectResult(
    await analyzeCopyArchitectFallback(normalizedInput)
  );
}

function getStringField(
  body: CopyArchitectRequestBody,
  key: keyof Omit<CopyArchitectInput, "desiredTone">
) {
  const value = body[key];
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCopyArchitectInput(
  input: CopyArchitectInput
): CopyArchitectInput {
  return {
    websiteUrl: normalizeCopyArchitectUrl(input.websiteUrl),
    existingCopy: input.existingCopy.trim(),
    businessOffer: input.businessOffer.trim(),
    targetAudience: input.targetAudience.trim(),
    copyGoal: input.copyGoal.trim(),
    desiredTone: input.desiredTone,
  };
}

function prepareCopyArchitectPromptInput(
  input: CopyArchitectInput
): CopyArchitectPromptInput {
  return {
    ...input,
    boundedExistingCopy: boundExistingCopy(input.existingCopy),
  };
}

export function buildCopyArchitectPrompt(input: CopyArchitectPromptInput) {
  return `You are Copy Architect inside Prospra, an AI mentor and strategy product for founders.

Rewrite the supplied website copy for clarity, trust, and conversion while preserving the core offer.

Inputs:
- Website URL: ${input.websiteUrl || "Not provided"}
- Business/offer: ${input.businessOffer || "Not provided"}
- Target audience: ${input.targetAudience || "Not provided"}
- Goal: ${input.copyGoal || "Not provided"}
- Desired tone: ${input.desiredTone}
- Optional website/context:
${input.boundedExistingCopy || "Not provided"}

Return strict JSON only. Do not include markdown, commentary, or code fences.

Expected JSON schema:
{
  "analyzedUrl": "string",
  "clarityScore": 0,
  "conversionScore": 0,
  "headline": "string",
  "subheadline": "string",
  "cta": "string",
  "shortWebsiteHeroCopy": "string",
  "quickImprovementNotes": ["string", "string", "string"],
  "comparison": {
    "before": "string",
    "after": "string"
  },
  "headlineOptions": ["string", "string", "string"],
  "subheadlineOptions": ["string", "string", "string"],
  "rewrittenHero": {
    "headline": "string",
    "subheadline": "string",
    "body": "string",
    "cta": "string"
  },
  "trustBuildingSuggestions": ["string", "string", "string"],
  "ctaSuggestions": ["string", "string", "string"],
  "notes": ["string", "string", "string"]
}

Rules:
- clarityScore and conversionScore must be integers from 0 to 100.
- headline, subheadline, cta, shortWebsiteHeroCopy, and quickImprovementNotes are the primary UI outputs.
- Return 3 to 5 headlineOptions.
- Return 3 to 5 subheadlineOptions.
- Return 3 to 5 quickImprovementNotes.
- Return 3 to 5 trustBuildingSuggestions.
- Return 3 to 5 ctaSuggestions.
- Return 3 to 5 notes explaining why the rewrite works.
- Keep all strings concise enough for dashboard cards and panels.
- Use founder-aware, strategic language. Avoid generic SaaS filler.
- If website URL is not provided, set analyzedUrl to an empty string.`;
}

async function generateCopyWithAI(
  input: CopyArchitectPromptInput,
  prompt: string
): Promise<CopyArchitectResult | null> {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  try {
    if (process.env.COPY_ARCHITECT_SIMULATE_AI_FAILURE === "1") {
      throw new Error("Simulated Copy Architect AI failure.");
    }

    // TODO: Add brand voice memory and saved copy history context once those product surfaces exist.
    const [{ generateObject }, { openai }, { z }] = await Promise.all([
      import("ai"),
      import("@ai-sdk/openai"),
      import("zod"),
    ]);

    const copyArchitectSchema = z.object({
      analyzedUrl: z.string(),
      clarityScore: z.number().int().min(0).max(100),
      conversionScore: z.number().int().min(0).max(100),
      headline: z.string().min(1),
      subheadline: z.string().min(1),
      cta: z.string().min(1),
      shortWebsiteHeroCopy: z.string().min(1),
      quickImprovementNotes: z.array(z.string().min(1)).min(3).max(5),
      comparison: z.object({
        before: z.string().min(1),
        after: z.string().min(1),
      }),
      headlineOptions: z.array(z.string().min(1)).min(3).max(5),
      subheadlineOptions: z.array(z.string().min(1)).min(3).max(5),
      rewrittenHero: z.object({
        headline: z.string().min(1),
        subheadline: z.string().min(1),
        body: z.string().min(1),
        cta: z.string().min(1),
      }),
      trustBuildingSuggestions: z.array(z.string().min(1)).min(3).max(5),
      ctaSuggestions: z.array(z.string().min(1)).min(3).max(5),
      notes: z.array(z.string().min(1)).min(3).max(5),
    });

    const generateStructuredObject = generateObject as (options: {
      model: unknown;
      schema: unknown;
      prompt: string;
    }) => Promise<{ object: CopyArchitectResult }>;

    const { object } = await withTimeout(
      generateStructuredObject({
        model: openai("gpt-4o-mini"),
        schema: copyArchitectSchema,
        prompt,
      }),
      AI_GENERATION_TIMEOUT_MS
    );

    return sanitizeCopyArchitectResult({
      ...object,
      analyzedUrl: object.analyzedUrl || input.websiteUrl,
    });
  } catch (error) {
    console.error("Copy Architect AI generation failed; using fallback.", error);
    return null;
  }
}

function shapeCopyArchitectResult(result: CopyArchitectResult): CopyArchitectResult {
  return sanitizeCopyArchitectResult(result);
}

function sanitizeCopyArchitectResult(
  result: CopyArchitectResult
): CopyArchitectResult {
  return {
    analyzedUrl: cleanText(result.analyzedUrl),
    clarityScore: clampPercentage(result.clarityScore),
    conversionScore: clampPercentage(result.conversionScore),
    headline: cleanText(result.headline || result.rewrittenHero.headline),
    subheadline: cleanText(result.subheadline || result.rewrittenHero.subheadline),
    cta: cleanText(result.cta || result.rewrittenHero.cta),
    shortWebsiteHeroCopy: cleanMultilineText(
      result.shortWebsiteHeroCopy ||
        `${result.rewrittenHero.headline}\n\n${result.rewrittenHero.subheadline}\n\n${result.rewrittenHero.cta}`
    ),
    quickImprovementNotes: sanitizeList(
      result.quickImprovementNotes?.length ? result.quickImprovementNotes : result.notes
    ),
    comparison: {
      before: cleanText(result.comparison.before),
      after: cleanText(result.comparison.after),
    },
    headlineOptions: sanitizeList(result.headlineOptions),
    subheadlineOptions: sanitizeList(result.subheadlineOptions),
    rewrittenHero: {
      headline: cleanText(result.rewrittenHero.headline),
      subheadline: cleanText(result.rewrittenHero.subheadline),
      body: cleanText(result.rewrittenHero.body),
      cta: cleanText(result.rewrittenHero.cta),
    },
    trustBuildingSuggestions: sanitizeList(result.trustBuildingSuggestions),
    ctaSuggestions: sanitizeList(result.ctaSuggestions),
    notes: sanitizeList(result.notes),
  };
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error("Copy Architect AI generation timed out.")),
      timeoutMs
    );
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function boundExistingCopy(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= MAX_EXISTING_COPY_LENGTH) {
    return normalized;
  }

  return normalized.slice(0, MAX_EXISTING_COPY_LENGTH).trimEnd();
}

function cleanText(value: string) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function cleanMultilineText(value: string) {
  return String(value ?? "")
    .split(/\r?\n/)
    .map(cleanText)
    .filter(Boolean)
    .join("\n\n");
}

function sanitizeList(items: string[]) {
  return items.map(cleanText).filter(Boolean).slice(0, 5);
}

function clampPercentage(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function clampScore(value: number) {
  return Math.max(28, Math.min(94, value));
}

function getPromisePhrase(offer: string) {
  if (!offer) {
    return "Clearer website copy";
  }

  const normalized = offer.replace(/\s+/g, " ").trim();
  return normalized.length > 72 ? normalized.slice(0, 69).trimEnd() + "..." : normalized;
}

function getActionPhrase(offer: string) {
  const normalized = offer.toLowerCase();

  if (normalized.includes("strategy") || normalized.includes("coach")) {
    return "Make your strategy easier to trust";
  }

  if (normalized.includes("software") || normalized.includes("platform")) {
    return "Explain the product value faster";
  }

  if (normalized.includes("service") || normalized.includes("consult")) {
    return "Make the service easier to buy";
  }

  return "Make the offer easier to understand";
}

function getRecommendedCta(tone: CopyArchitectTone) {
  switch (tone) {
    case "Warm and supportive":
      return "Find my next best step";
    case "Premium and strategic":
      return "Build my clarity plan";
    case "Direct and conversion-focused":
      return "Improve my page copy";
    case "Calm and expert":
      return "Review the strategy";
    case "Clear and confident":
      return "Get clearer copy";
  }
}

function summarizeBeforeCopy(copy: string) {
  if (!copy) {
    return "No existing copy was provided.";
  }

  const normalized = copy.replace(/\s+/g, " ").trim();
  return normalized.length > 260
    ? normalized.slice(0, 257).trimEnd() + "..."
    : normalized;
}
