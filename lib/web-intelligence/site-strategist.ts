import { extractWebsiteSignals } from "@/lib/web-intelligence/extract-website-signals";

export type SiteStrategistInput = {
  url: string;
};

export type SiteStrategistResult = {
  url: string;
  fetchedAt: string;
  structure: {
    title: string | null;
    metaDescription: string | null;
    headingCount: number;
    h1Count: number;
    hasNavigation: boolean;
    hasFooter: boolean;
  };
  messaging: {
    hasOfferSignal: boolean;
    hasTrustSignal: boolean;
    hasPricingSignal: boolean;
    summary: string;
  };
  ctas: {
    count: number;
    hasStrongCtaLanguage: boolean;
    primary: string[];
  };
};

export type SiteStrategistError = { error: string };

export function normalizeSiteStrategistUrl(value: string) {
  const input = value.trim();
  if (!input) throw new Error("A website URL is required.");
  const parsed = new URL(input);
  if (!/^https?:$/.test(parsed.protocol)) throw new Error("Only http and https URLs are allowed.");
  if (/localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(parsed.hostname)) {
    throw new Error("Local URLs are not supported.");
  }
  parsed.hash = "";
  return parsed.toString();
}

function buildMessagingSummary({ hasOfferSignal, hasTrustSignal, hasPricingSignal }: { hasOfferSignal: boolean; hasTrustSignal: boolean; hasPricingSignal: boolean; }) {
  const notes = [
    hasOfferSignal ? "Offer positioning is present." : "Offer positioning is unclear.",
    hasTrustSignal ? "Trust signals are present." : "Trust signals are limited.",
    hasPricingSignal ? "Pricing language appears on page." : "Pricing language is not obvious.",
  ];
  return notes.join(" ");
}

export async function analyzeSiteStrategist(input: SiteStrategistInput): Promise<SiteStrategistResult> {
  const normalizedUrl = normalizeSiteStrategistUrl(input.url);
  const response = await fetch(normalizedUrl, { method: "GET", redirect: "follow" });

  if (!response.ok) {
    throw new Error(`Website fetch failed with status ${response.status}.`);
  }

  const html = await response.text();
  const signals = extractWebsiteSignals(html, normalizedUrl);

  return {
    url: normalizedUrl,
    fetchedAt: new Date().toISOString(),
    structure: {
      title: signals.title,
      metaDescription: signals.metaDescription,
      headingCount: signals.headingCount,
      h1Count: signals.h1Count,
      hasNavigation: signals.hasNav,
      hasFooter: signals.hasFooter,
    },
    messaging: {
      hasOfferSignal: signals.hasOfferSignal,
      hasTrustSignal: signals.hasTrustSignal,
      hasPricingSignal: signals.hasPricingSignal,
      summary: buildMessagingSummary(signals),
    },
    ctas: {
      count: signals.ctaCount,
      hasStrongCtaLanguage: signals.hasStrongCtaLanguage,
      primary: signals.ctaMatches.slice(0, 8),
    },
  };
}
