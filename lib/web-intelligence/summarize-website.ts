import type { ExtractedWebsiteSignals, WebsiteScores } from "@/lib/web-intelligence/types";

type WebsiteSummary = {
  homepageSummary: string;
  funnelSummary: string;
  keyIssues: string[];
  recommendedFixes: string[];
};

export function summarizeWebsite(signals: ExtractedWebsiteSignals, scores: WebsiteScores): WebsiteSummary {
  const homepageSummary = [
    `Homepage signals suggest ${scores.offerClarityScore >= 70 ? "clear" : "developing"} offer clarity for first-time visitors.`,
    signals.title
      ? `The page title is ${scores.seoScore >= 70 ? "in place" : "present but can be optimized"}.`
      : "The page is missing a discoverable title tag.",
    signals.hasStrongCtaLanguage
      ? "Calls to action are visible and action-oriented."
      : "Calls to action are currently soft or sparse.",
  ].join(" ");

  const funnelSummary = [
    signals.hasNav
      ? "Visitors can navigate core sections from the main nav"
      : "Navigation structure is hard to detect",
    signals.hasLeadCapture
      ? "and there is at least one lead capture or conversion entry point."
      : "but there is no obvious lead capture point yet.",
    signals.hasPricingSignal
      ? "Pricing or package intent appears on-page, which helps qualification."
      : "Pricing and package context is limited, which may slow buying decisions.",
  ].join(" ");

  const keyIssues: string[] = [];
  const recommendedFixes: string[] = [];

  if (!signals.title) {
    keyIssues.push("Missing title tag weakens SEO discoverability.");
    recommendedFixes.push("Add a keyword-aware homepage title (50-60 chars) that states your core offer.");
  }

  if (!signals.metaDescription) {
    keyIssues.push("No meta description is defined for search snippets.");
    recommendedFixes.push("Write a founder-focused meta description with outcome + CTA in 140-160 chars.");
  }

  if (signals.h1Count === 0) {
    keyIssues.push("Homepage is missing an H1, which can blur message hierarchy.");
    recommendedFixes.push("Add one clear H1 that states who you help and the result you deliver.");
  }

  if (!signals.hasStrongCtaLanguage) {
    keyIssues.push("CTA language is not strong enough to drive next-step momentum.");
    recommendedFixes.push("Use direct CTA copy like 'Book a Strategy Call' or 'Start Free Trial' near key sections.");
  }

  if (!signals.hasLeadCapture) {
    keyIssues.push("No clear lead capture path found on the homepage.");
    recommendedFixes.push("Add an above-the-fold capture action (calendar booking, form, or primary signup).");
  }

  if (!signals.hasTrustSignal) {
    keyIssues.push("Trust elements (testimonials, logos, proof) are hard to detect.");
    recommendedFixes.push("Add trust signals near your primary CTA: testimonials, case studies, or outcome stats.");
  }

  if (!signals.hasCanonical) {
    keyIssues.push("Canonical URL tag is missing, which can create indexing ambiguity.");
    recommendedFixes.push("Set a canonical URL for the homepage to consolidate ranking signals.");
  }

  return {
    homepageSummary,
    funnelSummary,
    keyIssues: keyIssues.slice(0, 6),
    recommendedFixes: recommendedFixes.slice(0, 6),
  };
}
