export type CtaPageGoal =
  | "book-call"
  | "start-trial"
  | "buy-now"
  | "join-list"
  | "download-resource"
  | "request-demo";

export type CtaAnalyzerInput = {
  url: string;
  currentCtaText: string;
  pageGoal: CtaPageGoal;
  targetAudience: string;
};

export type CtaAnalyzerResult = {
  analyzedUrl: string;
  currentCtaText: string;
  pageGoal: CtaPageGoal;
  targetAudience: string;
  strengthScore: number;
  clarityFeedback: string;
  urgencyFeedback: string;
  valuePropositionFeedback: string;
  placementSuggestions: string[];
  frictionRiskNotes: string[];
  improvedVariations: string[];
  recommendedButtonText: string;
  recommendedSupportingMicrocopy: string;
};

const actionVerbs = [
  "book",
  "start",
  "get",
  "join",
  "download",
  "request",
  "try",
  "schedule",
  "claim",
  "build",
];

const valueWords = [
  "plan",
  "strategy",
  "audit",
  "growth",
  "clarity",
  "score",
  "demo",
  "guide",
  "results",
  "roadmap",
];

const goalLabels: Record<CtaPageGoal, string> = {
  "book-call": "book a call",
  "start-trial": "start a trial",
  "buy-now": "buy now",
  "join-list": "join the list",
  "download-resource": "download a resource",
  "request-demo": "request a demo",
};

export type CtaAnalyzerError = {
  error: string;
};

export type CtaAnalyzerRequestBody = {
  url?: unknown;
  currentCtaText?: unknown;
  pageGoal?: unknown;
  targetAudience?: unknown;
};

const AI_GENERATION_TIMEOUT_MS = 15000;

export function isCtaPageGoal(value: unknown): value is CtaPageGoal {
  return (
    value === "book-call" ||
    value === "start-trial" ||
    value === "buy-now" ||
    value === "join-list" ||
    value === "download-resource" ||
    value === "request-demo"
  );
}

export function validateCtaAnalyzerInput(
  body: CtaAnalyzerRequestBody
): { input: CtaAnalyzerInput } | { error: string } {
  const url = typeof body.url === "string" ? body.url.trim() : "";
  const currentCtaText =
    typeof body.currentCtaText === "string" ? body.currentCtaText.trim() : "";
  const targetAudience =
    typeof body.targetAudience === "string" ? body.targetAudience.trim() : "";

  if (!url) {
    return { error: "A page URL is required." };
  }

  if (!currentCtaText) {
    return { error: "The current CTA text is required." };
  }

  if (currentCtaText.length > 200) {
    return { error: "CTA text must be 200 characters or fewer." };
  }

  if (!targetAudience) {
    return { error: "A target audience is required." };
  }

  if (targetAudience.length > 300) {
    return { error: "Target audience must be 300 characters or fewer." };
  }

  if (!isCtaPageGoal(body.pageGoal)) {
    return { error: "A valid page goal is required." };
  }

  return {
    input: {
      url,
      currentCtaText,
      pageGoal: body.pageGoal,
      targetAudience,
    },
  };
}

async function fetchPageTextSnippet(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "user-agent": "ProspraSiteStrategistBot/1.0",
        accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return "";
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("text/html")) {
      return "";
    }

    const html = await response.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<\/?[^>]+(>|$)/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 4000);
  } catch {
    return "";
  }
}

function buildCtaAnalyzerPrompt(
  input: CtaAnalyzerInput,
  pageText: string
): string {
  return `You are Prospra's CTA Analyzer, a conversion strategist for founder-led websites.

Analyze this call-to-action in the context of the page and audience:
- Page URL: ${input.url}
- Current CTA text: "${input.currentCtaText}"
- Page goal: ${goalLabels[input.pageGoal]}
- Target audience: ${input.targetAudience}
- Page text (may be partial or empty if the page could not be fetched):
${pageText || "Not available"}

Return strict JSON only. Do not include markdown, commentary, or code fences.

Rules:
- strengthScore is an integer from 0 to 100. Score strictly, not generously.
- Feedback strings are 1-3 sentences, specific to this CTA and audience.
- Return exactly 3 placementSuggestions, 3 frictionRiskNotes, and 5 improvedVariations.
- improvedVariations are button-length CTA texts (2-6 words each).
- recommendedButtonText is the single strongest variation.
- recommendedSupportingMicrocopy is one short reassurance line to place near the button.
- Use founder-aware, practical language. Avoid generic marketing filler.`;
}

async function analyzeCtaWithAi(
  input: CtaAnalyzerInput,
  pageText: string
): Promise<CtaAnalyzerResult | null> {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  try {
    const [{ generateObject }, { openai }, { z }] = await Promise.all([
      import("ai"),
      import("@ai-sdk/openai"),
      import("zod"),
    ]);

    const ctaSchema = z.object({
      strengthScore: z.number().int().min(0).max(100),
      clarityFeedback: z.string().min(1),
      urgencyFeedback: z.string().min(1),
      valuePropositionFeedback: z.string().min(1),
      placementSuggestions: z.array(z.string().min(1)).min(3).max(3),
      frictionRiskNotes: z.array(z.string().min(1)).min(3).max(3),
      improvedVariations: z.array(z.string().min(1)).min(5).max(5),
      recommendedButtonText: z.string().min(1),
      recommendedSupportingMicrocopy: z.string().min(1),
    });

    type CtaAiOutput = Omit<
      CtaAnalyzerResult,
      "analyzedUrl" | "currentCtaText" | "pageGoal" | "targetAudience"
    >;

    const generateStructuredObject = generateObject as (options: {
      model: unknown;
      schema: unknown;
      prompt: string;
    }) => Promise<{ object: CtaAiOutput }>;

    const { object } = await withTimeout(
      generateStructuredObject({
        model: openai("gpt-4o-mini"),
        schema: ctaSchema,
        prompt: buildCtaAnalyzerPrompt(input, pageText),
      }),
      AI_GENERATION_TIMEOUT_MS
    );

    return {
      analyzedUrl: normalizeAnalysisUrl(input.url),
      currentCtaText: input.currentCtaText.trim(),
      pageGoal: input.pageGoal,
      targetAudience: input.targetAudience.trim(),
      ...object,
      strengthScore: clampScore(object.strengthScore),
    };
  } catch (error) {
    console.error("CTA Analyzer AI generation failed; using fallback.", error);
    return null;
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error("CTA Analyzer AI generation timed out.")),
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

export async function analyzeCta(
  input: CtaAnalyzerInput
): Promise<CtaAnalyzerResult> {
  const pageText = await fetchPageTextSnippet(normalizeAnalysisUrl(input.url));
  const aiResult = await analyzeCtaWithAi(input, pageText);

  if (aiResult) {
    return aiResult;
  }

  return runFallbackCtaAnalysis(input);
}

export async function runFallbackCtaAnalysis(
  input: CtaAnalyzerInput
): Promise<CtaAnalyzerResult> {
  const normalizedUrl = normalizeAnalysisUrl(input.url);
  const ctaText = input.currentCtaText.trim();
  const audience = input.targetAudience.trim();
  const ctaLower = ctaText.toLowerCase();
  const hasActionVerb = actionVerbs.some((verb) => ctaLower.includes(verb));
  const hasValueSignal = valueWords.some((word) => ctaLower.includes(word));
  const isConcise = ctaText.length >= 8 && ctaText.length <= 32;
  const hasAudienceContext = audience.length > 12;
  const goalLabel = goalLabels[input.pageGoal];

  const score = clampScore(
    46 +
      (hasActionVerb ? 16 : 4) +
      (hasValueSignal ? 14 : 5) +
      (isConcise ? 12 : 3) +
      (hasAudienceContext ? 8 : 2) +
      (normalizedUrl.length % 7)
  );

  const recommendedButtonText = getRecommendedButtonText(input.pageGoal);
  const valuePhrase = getValuePhrase(input.pageGoal);

  return {
    analyzedUrl: normalizedUrl,
    currentCtaText: ctaText,
    pageGoal: input.pageGoal,
    targetAudience: audience,
    strengthScore: score,
    clarityFeedback: hasActionVerb
      ? "The CTA gives visitors a visible action. Tighten the wording around the outcome so the next step feels useful, not only clickable."
      : `The CTA needs a stronger action verb tied to the page goal. Make it obvious that the next step is to ${goalLabel}.`,
    urgencyFeedback: ctaLower.includes("now") || ctaLower.includes("today")
      ? "There is some immediacy in the wording. Keep urgency grounded in the visitor's benefit so it does not feel forced."
      : "The CTA can create more momentum by naming the immediate benefit visitors receive after clicking.",
    valuePropositionFeedback: hasValueSignal
      ? "The CTA hints at value, but the surrounding line should make the outcome more specific for the audience."
      : "The CTA asks for action before clearly naming the value. Add a benefit cue near the button so the ask feels earned.",
    placementSuggestions: [
      "Place the primary CTA above the fold after the main promise and supporting proof.",
      "Repeat the CTA after the strongest proof point, case result, or offer explanation.",
      "Use one primary CTA style per page so secondary links do not compete with the main action.",
    ],
    frictionRiskNotes: [
      "Avoid vague labels like Submit or Learn more when the visitor is being asked to commit.",
      "Keep form fields or scheduling steps close to the CTA so visitors know what happens next.",
      "Add a short reassurance line near the button if the action creates perceived cost, time, or sales pressure.",
    ],
    improvedVariations: [
      recommendedButtonText,
      `Get the ${valuePhrase}`,
      `See the ${valuePhrase}`,
      `Start with a ${valuePhrase}`,
      `Build my ${valuePhrase}`,
    ],
    recommendedButtonText,
    recommendedSupportingMicrocopy: getRecommendedMicrocopy(input.pageGoal, audience),
  };
}

function normalizeAnalysisUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function clampScore(value: number) {
  return Math.max(24, Math.min(94, value));
}

function getRecommendedButtonText(goal: CtaPageGoal) {
  switch (goal) {
    case "book-call":
      return "Book a strategy call";
    case "start-trial":
      return "Start my trial";
    case "buy-now":
      return "Get started today";
    case "join-list":
      return "Join the founder list";
    case "download-resource":
      return "Download the guide";
    case "request-demo":
      return "Request a demo";
  }
}

function getValuePhrase(goal: CtaPageGoal) {
  switch (goal) {
    case "book-call":
      return "growth plan";
    case "start-trial":
      return "first workspace";
    case "buy-now":
      return "next step";
    case "join-list":
      return "weekly founder brief";
    case "download-resource":
      return "practical guide";
    case "request-demo":
      return "product walkthrough";
  }
}

function getRecommendedMicrocopy(goal: CtaPageGoal, audience: string) {
  const audiencePhrase = audience || "your next best-fit visitors";

  switch (goal) {
    case "book-call":
      return `A focused conversation to identify the clearest next move for ${audiencePhrase}.`;
    case "start-trial":
      return `Set up the first workflow and see whether it fits ${audiencePhrase}.`;
    case "buy-now":
      return `A clear next step with the context ${audiencePhrase} need before committing.`;
    case "join-list":
      return `Useful founder guidance for ${audiencePhrase}, without inbox noise.`;
    case "download-resource":
      return `A practical resource built to help ${audiencePhrase} act with more clarity.`;
    case "request-demo":
      return `See the product in context and confirm whether it fits ${audiencePhrase}.`;
  }
}
