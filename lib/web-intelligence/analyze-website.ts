import { extractWebsiteSignals } from "@/lib/web-intelligence/extract-website-signals";
import { scoreWebsite } from "@/lib/web-intelligence/score-website";
import { summarizeWebsite } from "@/lib/web-intelligence/summarize-website";
import type { WebsiteIntelligenceSnapshot } from "@/lib/web-intelligence/types";

function normalizeWebsiteUrl(input: string): string {
  const trimmed = input.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  const parsed = new URL(withProtocol);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http and https URLs are supported.");
  }

  parsed.hash = "";
  return parsed.toString();
}

async function fetchHomepageHtml(normalizedUrl: string): Promise<string> {
  const response = await fetch(normalizedUrl, {
    method: "GET",
    redirect: "follow",
    headers: {
      "User-Agent": "ProspraWebIntelligenceBot/1.0 (+https://prospra.ai)",
      Accept: "text/html,application/xhtml+xml",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch URL (${response.status}).`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("text/html")) {
    throw new Error("URL did not return HTML content.");
  }

  const html = await response.text();
  if (!html || html.trim().length < 40) {
    throw new Error("Received empty or unreadable HTML.");
  }

  return html;
}

export async function analyzeWebsite(websiteUrl: string): Promise<WebsiteIntelligenceSnapshot> {
  const normalizedUrl = normalizeWebsiteUrl(websiteUrl);
  const html = await fetchHomepageHtml(normalizedUrl);

  const signals = extractWebsiteSignals(html, normalizedUrl);
  const scores = scoreWebsite(signals);
  const summary = summarizeWebsite(signals, scores);

  return {
    websiteUrl: normalizedUrl,
    homepageSummary: summary.homepageSummary,
    offerClarityScore: scores.offerClarityScore,
    seoScore: scores.seoScore,
    uxScore: scores.uxScore,
    ctaScore: scores.ctaScore,
    funnelSummary: summary.funnelSummary,
    keyIssues: summary.keyIssues,
    recommendedFixes: summary.recommendedFixes,
    rawSignals: signals as Record<string, unknown>,
    updatedAt: new Date().toISOString(),
  };
}
