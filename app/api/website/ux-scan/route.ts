// /app/api/website/ux-scan/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeWebsite } from "@/lib/web-intelligence/analyze-website";
import { saveWebsiteIntelligenceSnapshot } from "@/lib/web-intelligence/persistence";
import type { ExtractedWebsiteSignals } from "@/lib/web-intelligence/types";

type SectionInsight = {
  id: string;
  label: string;
  score: number;
  issues: string[];
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildSections(
  signals: ExtractedWebsiteSignals,
  scores: { seo: number; ux: number; clarity: number; cta: number }
): SectionInsight[] {
  const seoIssues: string[] = [];
  if (!signals.title) seoIssues.push("Missing page title");
  if (!signals.metaDescription) seoIssues.push("Missing meta description");
  if (!signals.hasCanonical) seoIssues.push("Missing canonical tag");
  if (!signals.hasOgTitle || !signals.hasOgDescription) {
    seoIssues.push("Incomplete social sharing (Open Graph) tags");
  }
  if (signals.h1Count !== 1) {
    seoIssues.push(
      signals.h1Count === 0 ? "No H1 heading found" : "Multiple H1 headings"
    );
  }

  const clarityIssues: string[] = [];
  if (!signals.hasOfferSignal) clarityIssues.push("Core offer is hard to identify");
  if (!signals.headingHierarchyLikelyValid) {
    clarityIssues.push("Heading structure is hard to scan");
  }
  if (signals.wordCountApprox < 150) {
    clarityIssues.push("Very little copy for visitors and search engines");
  }

  const ctaIssues: string[] = [];
  if (signals.ctaCount === 0) ctaIssues.push("No clear call-to-action found");
  if (!signals.hasStrongCtaLanguage) {
    ctaIssues.push("CTA language is passive - lead with an action verb");
  }
  if (!signals.hasLeadCapture) {
    ctaIssues.push("No lead capture (form or email signup) detected");
  }

  const trustIssues: string[] = [];
  if (!signals.hasNav) trustIssues.push("No navigation detected");
  if (!signals.hasFooter) trustIssues.push("No footer detected");
  if (!signals.hasTrustSignal) {
    trustIssues.push("No trust signals (testimonials, reviews, guarantees)");
  }
  if (signals.imageAltCoverage < 0.5 && signals.imageCount > 0) {
    trustIssues.push("Most images are missing alt text");
  }

  return [
    { id: "seo-basics", label: "SEO Basics", score: scores.seo, issues: seoIssues },
    {
      id: "content-clarity",
      label: "Content & Clarity",
      score: scores.clarity,
      issues: clarityIssues,
    },
    {
      id: "calls-to-action",
      label: "Calls to Action",
      score: scores.cta,
      issues: ctaIssues,
    },
    {
      id: "trust-navigation",
      label: "Trust & Navigation",
      score: scores.ux,
      issues: trustIssues,
    },
  ];
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const url = typeof body?.url === "string" ? body.url.trim() : "";

    if (!url) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    const snapshot = await analyzeWebsite(url);

    // Persist alongside other website analyses so the rest of the app can use it.
    saveWebsiteIntelligenceSnapshot(user.id, snapshot).catch((err) => {
      console.error("[UX_SCAN_PERSIST_ERROR]", err);
    });

    const signals = (snapshot.rawSignals ?? {}) as ExtractedWebsiteSignals;
    const seoScore = snapshot.seoScore ?? 0;
    const uxScore = snapshot.uxScore ?? 0;
    const clarityScore = snapshot.offerClarityScore ?? 0;
    const ctaScore = snapshot.ctaScore ?? 0;

    // No dedicated mobile crawl yet: approximate from structure and scannability
    // signals that correlate with mobile usability.
    const mobileScore = clampScore(
      uxScore * 0.6 +
        (signals.headingHierarchyLikelyValid ? 15 : 5) +
        (signals.hasNav ? 10 : 0) +
        Math.min(15, (signals.imageAltCoverage ?? 0) * 15)
    );

    const result = {
      url: snapshot.websiteUrl ?? url,
      seoScore,
      uxScore,
      clarityScore,
      ctaScore,
      mobileScore,
      notes: [...snapshot.keyIssues, ...snapshot.recommendedFixes].slice(0, 6),
      sections: buildSections(signals, {
        seo: seoScore,
        ux: uxScore,
        clarity: clarityScore,
        cta: ctaScore,
      }),
    };

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";

    if (/invalid url|only http and https/i.test(message)) {
      return NextResponse.json(
        { error: "Please enter a valid website URL." },
        { status: 400 }
      );
    }

    if (/unable to fetch|did not return html|empty or unreadable/i.test(message)) {
      return NextResponse.json(
        { error: "We could not fetch this website. Verify the URL and try again." },
        { status: 422 }
      );
    }

    console.error("[UX_SCAN_ERROR]", err);
    return NextResponse.json(
      { error: "Failed to run UX scan" },
      { status: 500 }
    );
  }
}
