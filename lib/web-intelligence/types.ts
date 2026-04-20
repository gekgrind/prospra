export type WebsiteIntelligenceSnapshot = {
  id?: string;
  websiteUrl: string | null;
  homepageSummary: string | null;
  offerClarityScore: number | null;
  seoScore: number | null;
  uxScore: number | null;
  ctaScore: number | null;
  funnelSummary: string | null;
  keyIssues: string[];
  recommendedFixes: string[];
  rawSignals?: Record<string, unknown> | null;
  createdAt?: string | null;
  updatedAt: string | null;
};

export type ExtractedWebsiteSignals = {
  normalizedUrl: string;
  title: string | null;
  metaDescription: string | null;
  h1Count: number;
  headingCount: number;
  headingHierarchyLikelyValid: boolean;
  buttonCount: number;
  linkCount: number;
  ctaCount: number;
  ctaMatches: string[];
  hasStrongCtaLanguage: boolean;
  wordCountApprox: number;
  hasOgTitle: boolean;
  hasOgDescription: boolean;
  hasCanonical: boolean;
  imageCount: number;
  imagesWithAltCount: number;
  imageAltCoverage: number;
  hasNav: boolean;
  hasFooter: boolean;
  hasPricingSignal: boolean;
  hasOfferSignal: boolean;
  hasTrustSignal: boolean;
  hasLeadCapture: boolean;
};

export type WebsiteScores = {
  offerClarityScore: number;
  seoScore: number;
  uxScore: number;
  ctaScore: number;
};

export type WebIntelligenceFeatureKey =
  | "website-coach"
  | "seo-ux"
  | "funnel-mapping"
  | "cta-analyzer"
  | "copy-architect";

export type WebIntelligenceFeature = {
  key: WebIntelligenceFeatureKey;
  title: string;
  description: string;
  status: string;
};