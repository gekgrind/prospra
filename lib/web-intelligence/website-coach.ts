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

export async function analyzeWebsiteCoach(
  input: WebsiteCoachInput
): Promise<WebsiteCoachResult> {
  // TODO: Replace this fallback with AI-backed website crawling once the Site
  // Strategist backend has a durable crawl, extraction, and scoring pipeline.
  return analyzeWebsiteCoachFallback(input);
}
