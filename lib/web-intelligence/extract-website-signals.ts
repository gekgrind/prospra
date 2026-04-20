import type { ExtractedWebsiteSignals } from "@/lib/web-intelligence/types";

const CTA_PATTERN = /\b(get started|book|schedule|start|try|demo|join|subscribe|buy|contact|talk to sales|request|learn more|sign up|free trial)\b/gi;
const PRICING_PATTERN = /\b(pricing|plans|packages|cost|rate|investment)\b/i;
const OFFER_PATTERN = /\b(help|solution|service|product|for\s+[a-z]+|we\s+(build|help|provide)|results|outcome|benefit)\b/i;
const TRUST_PATTERN = /\b(testimonial|trusted by|case study|reviews|clients|guarantee|certified|as seen in|social proof)\b/i;

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function stripHtml(html: string): string {
  const withoutScripts = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ");

  return decodeHtmlEntities(withoutScripts.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function extractMetaContent(html: string, key: string, keyType: "name" | "property"): string | null {
  const pattern = new RegExp(
    `<meta[^>]*${keyType}=["']${key}["'][^>]*content=["']([^"']+)["'][^>]*>`,
    "i"
  );

  const reversePattern = new RegExp(
    `<meta[^>]*content=["']([^"']+)["'][^>]*${keyType}=["']${key}["'][^>]*>`,
    "i"
  );

  const match = html.match(pattern) ?? html.match(reversePattern);
  return match?.[1]?.trim() || null;
}

function clampCoverage(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.max(0, Math.min(1, numerator / denominator));
}

export function extractWebsiteSignals(html: string, normalizedUrl: string): ExtractedWebsiteSignals {
  const cleanedHtml = html || "";
  const pageText = stripHtml(cleanedHtml);

  const titleMatch = cleanedHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch?.[1]?.replace(/\s+/g, " ").trim() || null;
  const metaDescription = extractMetaContent(cleanedHtml, "description", "name");

  const h1Count = (cleanedHtml.match(/<h1\b[^>]*>/gi) ?? []).length;
  const h2Count = (cleanedHtml.match(/<h2\b[^>]*>/gi) ?? []).length;
  const h3Count = (cleanedHtml.match(/<h3\b[^>]*>/gi) ?? []).length;
  const headingCount = h1Count + h2Count + h3Count;
  const headingHierarchyLikelyValid = h1Count === 1 || (h1Count === 0 && h2Count <= 1);

  const buttonCount = (cleanedHtml.match(/<button\b[^>]*>/gi) ?? []).length;
  const linkCount = (cleanedHtml.match(/<a\b[^>]*href=/gi) ?? []).length;
  const formCount = (cleanedHtml.match(/<form\b[^>]*>/gi) ?? []).length;

  const ctaMatches = Array.from(new Set((pageText.toLowerCase().match(CTA_PATTERN) ?? []).map((m) => m.trim())));
  const ctaCount = ctaMatches.length + Math.min(buttonCount, 8);

  const imageTags = cleanedHtml.match(/<img\b[^>]*>/gi) ?? [];
  const imagesWithAltCount = imageTags.filter((tag) => /\balt\s*=\s*["'][^"']+["']/i.test(tag)).length;

  return {
    normalizedUrl,
    title,
    metaDescription,
    h1Count,
    headingCount,
    headingHierarchyLikelyValid,
    buttonCount,
    linkCount,
    ctaCount,
    ctaMatches,
    hasStrongCtaLanguage: ctaMatches.length >= 2,
    wordCountApprox: pageText ? pageText.split(/\s+/).filter(Boolean).length : 0,
    hasOgTitle: Boolean(extractMetaContent(cleanedHtml, "og:title", "property")),
    hasOgDescription: Boolean(extractMetaContent(cleanedHtml, "og:description", "property")),
    hasCanonical: /<link\b[^>]*rel=["']canonical["'][^>]*>/i.test(cleanedHtml),
    imageCount: imageTags.length,
    imagesWithAltCount,
    imageAltCoverage: clampCoverage(imagesWithAltCount, imageTags.length),
    hasNav: /<nav\b[^>]*>/i.test(cleanedHtml),
    hasFooter: /<footer\b[^>]*>/i.test(cleanedHtml),
    hasPricingSignal: PRICING_PATTERN.test(pageText),
    hasOfferSignal: OFFER_PATTERN.test(pageText),
    hasTrustSignal: TRUST_PATTERN.test(pageText),
    hasLeadCapture: formCount > 0 || /subscribe|newsletter|email/i.test(pageText),
  };
}
