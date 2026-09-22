export const MENTOR_MODES = [
  "mentor",
  "website-coach",
  "seo-ux",
  "funnel-mapping",
  "cta-analyzer",
  "board-review",
] as const;

export type MentorMode = (typeof MENTOR_MODES)[number];

export const MODE_LABELS: Record<MentorMode, string> = {
  mentor: "Mentor Mode",
  "website-coach": "Website Coach",
  "seo-ux": "SEO/UX Scoring",
  "funnel-mapping": "Funnel Mapping",
  "cta-analyzer": "CTA Analyzer",
  "board-review": "Board Review",
};

export const MODE_DESCRIPTIONS: Record<MentorMode, string> = {
  mentor: "Tailored entrepreneurial guidance.",
  "website-coach": "Deep-dive feedback on your website’s clarity and conversion.",
  "seo-ux": "SEO/UX scoring and optimization suggestions for your pages.",
  "funnel-mapping": "Map your customer journey and plug funnel leaks.",
  "cta-analyzer": "Analyze and upgrade your CTAs and key copy moments.",
  "board-review": "Escalate your challenge for board-level strategic review.",
};

export function isMentorMode(value: unknown): value is MentorMode {
  return typeof value === "string" && (MENTOR_MODES as readonly string[]).includes(value);
}
