import type { ExtractedWebsiteSignals, WebsiteScores } from "@/lib/web-intelligence/types";

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function scoreWebsite(signals: ExtractedWebsiteSignals): WebsiteScores {
  const seoScore = clampScore(
    (signals.title ? 20 : 0) +
      (signals.metaDescription ? 20 : 0) +
      (signals.h1Count === 1 ? 20 : signals.h1Count > 1 ? 10 : 0) +
      (signals.hasCanonical ? 15 : 0) +
      (signals.hasOgTitle ? 12 : 0) +
      (signals.hasOgDescription ? 13 : 0)
  );

  const uxScore = clampScore(
    (signals.hasNav ? 20 : 0) +
      (signals.hasFooter ? 15 : 0) +
      (signals.headingCount >= 3 ? 20 : signals.headingCount > 0 ? 10 : 0) +
      (signals.headingHierarchyLikelyValid ? 15 : 5) +
      (signals.hasLeadCapture ? 10 : 0) +
      (signals.imageAltCoverage >= 0.6 ? 10 : signals.imageAltCoverage >= 0.3 ? 5 : 0) +
      (signals.wordCountApprox >= 150 ? 10 : 5)
  );

  const ctaScore = clampScore(
    (signals.ctaCount >= 3 ? 35 : signals.ctaCount > 0 ? 20 : 0) +
      (signals.hasStrongCtaLanguage ? 25 : signals.ctaMatches.length > 0 ? 10 : 0) +
      (signals.hasLeadCapture ? 20 : 0) +
      (signals.buttonCount >= 1 ? 10 : 0) +
      (signals.linkCount >= 5 ? 10 : 5)
  );

  const offerClarityScore = clampScore(
    (signals.title ? 15 : 0) +
      (signals.h1Count >= 1 ? 20 : 0) +
      (signals.metaDescription ? 10 : 0) +
      (signals.wordCountApprox >= 180 ? 15 : signals.wordCountApprox >= 100 ? 8 : 0) +
      (signals.hasOfferSignal ? 25 : 0) +
      (signals.hasPricingSignal ? 5 : 0) +
      (signals.hasTrustSignal ? 10 : 0)
  );

  return {
    offerClarityScore,
    seoScore,
    uxScore,
    ctaScore,
  };
}
