import {
  Bot,
  Compass,
  Copy,
  MousePointerClick,
  SearchCheck,
  type LucideIcon,
} from "lucide-react";

import type {
  WebIntelligenceFeature,
  WebIntelligenceFeatureKey,
  WebsiteIntelligenceSnapshot,
} from "@/lib/web-intelligence/types";

export const WEB_INTELLIGENCE_FEATURES: WebIntelligenceFeature[] = [
  {
    key: "website-coach",
    title: "Website Coach",
    description:
      "Get sharp feedback on clarity, structure, and messaging across your pages.",
    status: "Foundation ready",
    href: "/site-strategist/website-coach",
    ctaLabel: "Open tool",
  },
  {
    key: "seo-ux",
    title: "SEO/UX Analyzer",
    description:
      "Measure discoverability and user experience with focused scoring signals.",
    status: "Signals calibrating",
    href: "/site-strategist/seo-ux",
    ctaLabel: "Run analysis",
  },
  {
    key: "funnel-mapping",
    title: "Funnel Mapping",
    description:
      "Visualize how visitors move through your site and where momentum breaks.",
    status: "Pathing blueprint live",
    href: "/site-strategist/funnel-mapping",
    ctaLabel: "Map funnel",
  },
  {
    key: "cta-analyzer",
    title: "CTA Analyzer",
    description:
      "Inspect your calls to action and identify where conversion intent weakens.",
    status: "Conversion layer staged",
    href: "/site-strategist/cta-analyzer",
    ctaLabel: "Improve this",
  },
  {
    key: "copy-architect",
    title: "Copy Architect",
    description:
      "Strengthen the copy on key pages with positioning and conversion-focused improvements.",
    status: "Editorial engine queued",
    href: "/site-strategist/copy-architect",
    ctaLabel: "Open tool",
  },
];

export const WEB_INTELLIGENCE_FEATURE_ICONS: Record<
  WebIntelligenceFeatureKey,
  LucideIcon
> = {
  "website-coach": Bot,
  "seo-ux": SearchCheck,
  "funnel-mapping": Compass,
  "cta-analyzer": MousePointerClick,
  "copy-architect": Copy,
};

export const EMPTY_WEBSITE_INTELLIGENCE_SNAPSHOT: WebsiteIntelligenceSnapshot = {
  websiteUrl: null,
  homepageSummary: null,
  offerClarityScore: null,
  seoScore: null,
  uxScore: null,
  ctaScore: null,
  funnelSummary: null,
  keyIssues: [],
  recommendedFixes: [],
  updatedAt: null,
};
