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

export async function runMockCtaAnalysis(
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
