import net from "node:net";

export type TrafficSource =
  | "Organic search"
  | "Paid ads"
  | "Social media"
  | "Email"
  | "Referral"
  | "Direct traffic"
  | "Partnerships";

export type FunnelStage = {
  name: string;
  strength: number;
  status: "strong" | "watch" | "weak";
  insight: string;
};

export type FunnelMappingInput = {
  websiteUrl: string;
  offer: string;
  audience: string;
  conversionGoal: string;
  trafficSources: TrafficSource[];
};

export type FunnelMappingResult = {
  healthScore: number;
  weakestStage: string;
  missingAssets: string[];
  frictionPoints: string[];
  improvements: string[];
  nextActions: string[];
  stages: FunnelStage[];
};

export type FunnelMappingError = {
  error: string;
};

export const funnelMappingTrafficSources: TrafficSource[] = [
  "Organic search",
  "Paid ads",
  "Social media",
  "Email",
  "Referral",
  "Direct traffic",
  "Partnerships",
];

export type FunnelMappingRequestBody = {
  websiteUrl?: unknown;
  offer?: unknown;
  audience?: unknown;
  conversionGoal?: unknown;
  trafficSources?: unknown;
};

function getStringField(
  body: FunnelMappingRequestBody,
  key: keyof Omit<FunnelMappingInput, "trafficSources">
) {
  const value = body[key];
  return typeof value === "string" ? value.trim() : "";
}

function isTrafficSource(value: unknown): value is TrafficSource {
  return (
    typeof value === "string" &&
    funnelMappingTrafficSources.includes(value as TrafficSource)
  );
}

export function normalizeFunnelMappingUrl(input: string): string {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new Error("A website URL is required.");
  }

  if (/^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    throw new Error("Only public http and https URLs are supported.");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(withProtocol);

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only public http and https URLs are supported.");
  }

  if (parsed.username || parsed.password) {
    throw new Error("URLs with embedded credentials are not supported.");
  }

  if (!isPublicHostname(parsed.hostname)) {
    throw new Error("Local or private network URLs are not supported.");
  }

  parsed.hash = "";
  return parsed.toString();
}

export function validateFunnelMappingInput(
  body: FunnelMappingRequestBody
): { input: FunnelMappingInput } | { error: string } {
  const websiteUrl = getStringField(body, "websiteUrl");
  const offer = getStringField(body, "offer");
  const audience = getStringField(body, "audience");
  const conversionGoal = getStringField(body, "conversionGoal");

  if (!websiteUrl) {
    return { error: "A website URL is required." };
  }

  try {
    normalizeFunnelMappingUrl(websiteUrl);
  } catch {
    return { error: "Please enter a valid public http or https URL." };
  }

  if (!offer) {
    return { error: "A business offer is required." };
  }

  if (!audience) {
    return { error: "A target audience is required." };
  }

  if (!conversionGoal) {
    return { error: "A primary conversion goal is required." };
  }

  const trafficSources = Array.isArray(body.trafficSources)
    ? body.trafficSources.filter(isTrafficSource)
    : [];

  if (trafficSources.length === 0) {
    return { error: "Choose at least one current traffic source." };
  }

  return {
    input: {
      websiteUrl: normalizeFunnelMappingUrl(websiteUrl),
      offer,
      audience,
      conversionGoal,
      trafficSources,
    },
  };
}

export async function analyzeFunnelMapping(
  input: FunnelMappingInput
): Promise<FunnelMappingResult> {
  // TODO: Add website crawling once Site Strategist shares a reusable page signal contract.
  // TODO: Replace fallback scoring with AI-assisted funnel diagnosis when model prompts are finalized.
  return analyzeFunnelMappingFallback(input);
}

export function analyzeFunnelMappingFallback(
  input: FunnelMappingInput
): FunnelMappingResult {
  const hasPaidTraffic = input.trafficSources.includes("Paid ads");
  const hasEmail = input.trafficSources.includes("Email");
  const hasPartnerships = input.trafficSources.includes("Partnerships");
  const offerSpecificity = Math.min(18, Math.floor(input.offer.length / 12));
  const audienceSpecificity = Math.min(14, Math.floor(input.audience.length / 10));
  const goalSpecificity = Math.min(
    12,
    Math.floor(input.conversionGoal.length / 8)
  );
  const channelCoverage = Math.min(16, input.trafficSources.length * 4);
  const healthScore = Math.min(
    88,
    44 + offerSpecificity + audienceSpecificity + goalSpecificity + channelCoverage
  );

  const stages: FunnelStage[] = [
    {
      name: "Awareness",
      strength: hasPaidTraffic || hasPartnerships ? 76 : 64,
      status: hasPaidTraffic || hasPartnerships ? "strong" : "watch",
      insight:
        input.trafficSources.length > 1
          ? "Multiple entry channels are present, but each needs a matching promise before the landing page."
          : "Awareness is concentrated in one channel, so the entry message needs to work hard quickly.",
    },
    {
      name: "Landing page",
      strength: input.websiteUrl ? 70 : 46,
      status: input.websiteUrl ? "watch" : "weak",
      insight:
        "The landing page should immediately confirm who the offer is for, what outcome it creates, and what to do next.",
    },
    {
      name: "Offer/message",
      strength: input.offer.length > 80 ? 78 : 58,
      status: input.offer.length > 80 ? "strong" : "weak",
      insight:
        "The offer needs a clearer result, stronger proof, and sharper fit for the stated audience.",
    },
    {
      name: "CTA",
      strength: input.conversionGoal.length > 16 ? 74 : 55,
      status: input.conversionGoal.length > 16 ? "watch" : "weak",
      insight:
        "The CTA should match buyer readiness and reduce uncertainty around the immediate next step.",
    },
    {
      name: "Lead capture",
      strength: hasEmail ? 72 : 52,
      status: hasEmail ? "watch" : "weak",
      insight:
        "Lead capture needs a visible low-friction path for visitors who are interested but not ready to buy.",
    },
    {
      name: "Follow-up",
      strength: hasEmail ? 70 : 48,
      status: hasEmail ? "watch" : "weak",
      insight:
        "Follow-up should continue the same promise with proof, objection handling, and a timely conversion ask.",
    },
    {
      name: "Conversion",
      strength: healthScore > 72 ? 74 : 60,
      status: healthScore > 72 ? "watch" : "weak",
      insight:
        "Conversion improves when the offer, CTA, proof, and follow-up all point to one measurable action.",
    },
  ];

  const weakestStage = stages.reduce((weakest, stage) =>
    stage.strength < weakest.strength ? stage : weakest
  );

  return {
    healthScore,
    weakestStage: `${weakestStage.name} is the main constraint at ${weakestStage.strength}/100.`,
    missingAssets: [
      "A dedicated proof block connected to the primary promise.",
      "A lead magnet or soft conversion path for visitors who are not ready yet.",
      hasEmail
        ? "A segmented nurture path based on source intent."
        : "A follow-up email sequence tied to the conversion goal.",
    ],
    frictionPoints: [
      "The visitor may not see a direct bridge from their problem to the offer fast enough.",
      "The CTA likely asks for commitment before enough trust has been built.",
      "Traffic sources need source-specific hooks instead of one generic landing message.",
    ],
    improvements: [
      `Rewrite the hero promise around ${input.audience || "the target audience"} and the outcome behind ${input.offer || "the offer"}.`,
      "Place one primary CTA above the fold and repeat it after proof, objections, and offer details.",
      "Add a soft lead-capture option that preserves momentum for visitors who are not ready for the main conversion.",
      "Create source-specific entry copy for the highest-intent traffic channel.",
      "Build a short follow-up sequence that answers the top objection before making the conversion ask again.",
    ],
    nextActions: [
      "Define the single promise visitors should understand within the first five seconds.",
      "Add or revise the lead-capture asset that supports the primary conversion goal.",
      "Write a three-message follow-up sequence for new leads from the strongest traffic source.",
    ],
    stages,
  };
}

function isPublicHostname(hostname: string) {
  const normalized = hostname.toLowerCase();

  if (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized === "0.0.0.0"
  ) {
    return false;
  }

  if (net.isIP(normalized)) {
    return !isPrivateAddress(normalized);
  }

  return normalized.includes(".");
}

function isPrivateAddress(address: string) {
  if (net.isIPv4(address)) {
    const parts = address.split(".").map(Number);
    const [a, b] = parts;

    return (
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && typeof b === "number" && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a === 0
    );
  }

  if (net.isIPv6(address)) {
    const normalized = address.toLowerCase();
    return (
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80:")
    );
  }

  return false;
}
