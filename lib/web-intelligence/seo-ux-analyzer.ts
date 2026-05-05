export type SeoUxPriority = "Critical" | "Important" | "Nice-to-have";

export type SeoUxFix = {
  priority: SeoUxPriority;
  title: string;
  detail: string;
};

export type SeoUxAnalysisInput = {
  url: string;
  primaryKeyword: string;
  audienceOffer?: string;
};

export type SeoUxAnalysisResult = {
  analyzedUrl: string;
  primaryKeyword: string;
  audienceOffer: string | null;
  seoScore: number;
  uxScore: number;
  titleMetaFeedback: string;
  headingStructureFeedback: string;
  keywordAlignment: string;
  mobileReadabilityNotes: string;
  pageSpeedPlaceholder: string;
  accessibilityNotes: string;
  prioritizedFixes: SeoUxFix[];
};

export type SeoUxAnalysisError = {
  error: string;
};

export async function runFallbackSeoUxAnalysis(
  input: SeoUxAnalysisInput
): Promise<SeoUxAnalysisResult> {
  const normalizedUrl = normalizeAnalysisUrl(input.url);
  const keyword = input.primaryKeyword.trim();
  const audienceOffer = input.audienceOffer?.trim() || null;

  const urlSpecificScore = normalizedUrl.length % 9;
  const keywordSpecificScore = Math.min(keyword.length, 28) % 8;

  return {
    analyzedUrl: normalizedUrl,
    primaryKeyword: keyword,
    audienceOffer,
    seoScore: Math.min(92, 72 + keywordSpecificScore + urlSpecificScore),
    uxScore: Math.min(90, 70 + urlSpecificScore + (audienceOffer ? 7 : 2)),
    titleMetaFeedback:
      "Fallback analysis: use the primary keyword in a clear title promise, then make the meta description describe the outcome a visitor can expect from this page.",
    headingStructureFeedback:
      "Keep one specific H1, organize the next sections under H2s, and make each heading explain the decision or benefit in that section.",
    keywordAlignment:
      "The page should reinforce the keyword in the title, first section, one supporting heading, and naturally in body copy without repeating it mechanically.",
    mobileReadabilityNotes:
      "Lead with the most decisive message, keep sections scannable, and make form or CTA areas easy to reach on a narrow screen.",
    pageSpeedPlaceholder:
      "Page speed is not scanned yet. When connected, this section should report Core Web Vitals, blocking scripts, image weight, and first-load friction.",
    accessibilityNotes:
      "Confirm descriptive link text, visible focus states, image alt text, strong contrast, and a logical reading order for screen readers.",
    prioritizedFixes: [
      {
        priority: "Critical",
        title: "Clarify the page promise above the fold",
        detail:
          "Make the headline, supporting line, and primary CTA align around the visitor's problem and the next step.",
      },
      {
        priority: "Important",
        title: "Tighten keyword placement",
        detail:
          "Use the primary keyword where it improves comprehension: title, meta description, H1, and one supporting section.",
      },
      {
        priority: "Important",
        title: "Make scanning easier on mobile",
        detail:
          "Shorten dense paragraphs, keep section starts direct, and ensure the primary action stays easy to find.",
      },
      {
        priority: "Nice-to-have",
        title: "Add proof near conversion points",
        detail:
          "Place testimonials, outcomes, or trust markers close to the CTA so visitors have evidence before acting.",
      },
    ],
  };
}

export const runMockSeoUxAnalysis = runFallbackSeoUxAnalysis;

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
