export type WebsiteCoachGoal =
  | "generate-leads"
  | "book-calls"
  | "sell-products"
  | "explain-offer"
  | "build-trust";

export type WebsiteCoachInput = {
  websiteUrl: string;
  businessType: string;
  targetAudience: string;
  mainGoal: WebsiteCoachGoal;
};

export type WebsiteCoachResult = {
  normalizedUrl: string;
  overallScore: number;
  topRecommendations: string[];
  messagingClarityFeedback: string;
  trustCredibilityFeedback: string;
  conversionOpportunities: string[];
  suggestedNextActions: string[];
};

export type WebsiteCoachError = {
  error: string;
};

const goalLabels: Record<WebsiteCoachGoal, string> = {
  "generate-leads": "lead generation",
  "book-calls": "booking calls",
  "sell-products": "product sales",
  "explain-offer": "offer clarity",
  "build-trust": "trust building",
};

export function isWebsiteCoachGoal(value: unknown): value is WebsiteCoachGoal {
  return (
    value === "generate-leads" ||
    value === "book-calls" ||
    value === "sell-products" ||
    value === "explain-offer" ||
    value === "build-trust"
  );
}

export function normalizeWebsiteCoachUrl(input: string): string {
  const trimmed = input.trim();
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    throw new Error("Only http and https URLs are supported.");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(withProtocol);

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http and https URLs are supported.");
  }

  parsed.hash = "";
  return parsed.toString();
}

function calculateMockScore(input: WebsiteCoachInput): number {
  const businessSignal = Math.min(input.businessType.trim().length, 44);
  const audienceSignal = Math.min(input.targetAudience.trim().length, 52);
  const goalSignal = input.mainGoal === "explain-offer" ? 8 : 12;

  return Math.min(94, 58 + Math.round((businessSignal + audienceSignal) / 6) + goalSignal);
}

export async function analyzeWebsiteCoachFallback(
  input: WebsiteCoachInput
): Promise<WebsiteCoachResult> {
  const normalizedUrl = normalizeWebsiteCoachUrl(input.websiteUrl);
  const businessType = input.businessType.trim();
  const targetAudience = input.targetAudience.trim();
  const goalLabel = goalLabels[input.mainGoal];

  if (!businessType || !targetAudience) {
    throw new Error("Business type and target audience are required.");
  }

  return {
    normalizedUrl,
    overallScore: calculateMockScore(input),
    topRecommendations: [
      `Make the first screen immediately explain who the ${businessType} helps and what outcome ${targetAudience} can expect.`,
      `Align the primary call to action with ${goalLabel} instead of asking visitors to choose from several competing next steps.`,
      "Add a short proof section near the offer that shows outcomes, client context, or founder credibility before the CTA.",
      "Tighten section headings so each one answers a visitor objection or advances the decision path.",
      "Move one strong CTA into the middle of the page so motivated visitors do not have to wait until the footer.",
    ],
    messagingClarityFeedback: `The page should make the promise, audience, and outcome unmistakable for ${targetAudience}. Keep the headline specific, then use the next section to explain why this ${businessType} is the credible path to that outcome.`,
    trustCredibilityFeedback:
      "Strengthen trust with visible proof: testimonials, founder credentials, client examples, process clarity, guarantees, or recognizable partner signals. Visitors should see evidence before they are asked to commit.",
    conversionOpportunities: [
      `Use one primary CTA focused on ${goalLabel}.`,
      "Add a low-friction secondary CTA for visitors who are interested but not ready.",
      "Place reassurance copy beside the form or button so the next step feels clear and low-risk.",
    ],
    suggestedNextActions: [
      "Rewrite the hero headline around audience, outcome, and urgency.",
      "Audit every CTA and remove or demote anything that distracts from the main goal.",
      "Add one trust block above the first major conversion point.",
      "Run the updated page back through Website Coach after the next copy pass.",
    ],
  };
}

const AI_GENERATION_TIMEOUT_MS = 15000;

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
      .slice(0, 6000);
  } catch {
    return "";
  }
}

function buildWebsiteCoachPrompt(
  input: WebsiteCoachInput,
  normalizedUrl: string,
  pageText: string
): string {
  return `You are Prospra's Website Coach, a conversion and messaging strategist for founder-led websites.

Analyze this website for the founder:
- Website URL: ${normalizedUrl}
- Business type: ${input.businessType}
- Target audience: ${input.targetAudience}
- Main goal: ${goalLabels[input.mainGoal]}
- Homepage text (may be partial or empty if the page could not be fetched):
${pageText || "Not available - base the analysis on the business type, audience, and goal."}

Return strict JSON only. Do not include markdown, commentary, or code fences.

Rules:
- overallScore is an integer from 0 to 100. Score strictly based on how well the page serves the stated goal for the stated audience.
- Return exactly 5 topRecommendations, each one concrete and specific to this site.
- messagingClarityFeedback and trustCredibilityFeedback are 2-3 sentences each.
- Return exactly 3 conversionOpportunities and exactly 4 suggestedNextActions.
- Use founder-aware, practical language. Avoid generic marketing filler.`;
}

async function analyzeWebsiteCoachWithAi(
  input: WebsiteCoachInput,
  normalizedUrl: string
): Promise<WebsiteCoachResult | null> {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  try {
    const pageText = await fetchPageTextSnippet(normalizedUrl);

    const [{ generateObject }, { openai }, { z }] = await Promise.all([
      import("ai"),
      import("@ai-sdk/openai"),
      import("zod"),
    ]);

    const websiteCoachSchema = z.object({
      overallScore: z.number().int().min(0).max(100),
      topRecommendations: z.array(z.string().min(1)).min(5).max(5),
      messagingClarityFeedback: z.string().min(1),
      trustCredibilityFeedback: z.string().min(1),
      conversionOpportunities: z.array(z.string().min(1)).min(3).max(3),
      suggestedNextActions: z.array(z.string().min(1)).min(4).max(4),
    });

    type WebsiteCoachAiOutput = Omit<WebsiteCoachResult, "normalizedUrl">;

    const generateStructuredObject = generateObject as (options: {
      model: unknown;
      schema: unknown;
      prompt: string;
    }) => Promise<{ object: WebsiteCoachAiOutput }>;

    const { object } = await withTimeout(
      generateStructuredObject({
        model: openai("gpt-4o-mini"),
        schema: websiteCoachSchema,
        prompt: buildWebsiteCoachPrompt(input, normalizedUrl, pageText),
      }),
      AI_GENERATION_TIMEOUT_MS
    );

    return {
      normalizedUrl,
      ...object,
      overallScore: Math.max(0, Math.min(100, Math.round(object.overallScore))),
    };
  } catch (error) {
    console.error("Website Coach AI generation failed; using fallback.", error);
    return null;
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error("Website Coach AI generation timed out.")),
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

export async function analyzeWebsiteCoach(
  input: WebsiteCoachInput
): Promise<WebsiteCoachResult> {
  const normalizedUrl = normalizeWebsiteCoachUrl(input.websiteUrl);

  if (!input.businessType.trim() || !input.targetAudience.trim()) {
    throw new Error("Business type and target audience are required.");
  }

  const aiResult = await analyzeWebsiteCoachWithAi(input, normalizedUrl);

  if (aiResult) {
    return aiResult;
  }

  return analyzeWebsiteCoachFallback(input);
}
