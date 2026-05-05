import {
  analyzeWebsiteCoach,
  isWebsiteCoachGoal,
  normalizeWebsiteCoachUrl,
  type WebsiteCoachError,
  type WebsiteCoachInput,
  type WebsiteCoachResult,
} from "@/lib/web-intelligence/website-coach";

export type WebsiteCoachRequestBody = {
  websiteUrl?: unknown;
  businessType?: unknown;
  targetAudience?: unknown;
  mainGoal?: unknown;
};

export type WebsiteCoachApiResponse = {
  status: number;
  body: WebsiteCoachResult | WebsiteCoachError;
};

type WebsiteCoachAuthResult = {
  user: unknown | null;
  error?: unknown;
};

type WebsiteCoachApiDependencies = {
  getUser: () => Promise<WebsiteCoachAuthResult>;
  analyze?: (input: WebsiteCoachInput) => Promise<WebsiteCoachResult>;
};

function getStringField(body: WebsiteCoachRequestBody, key: keyof WebsiteCoachInput) {
  const value = body[key];
  return typeof value === "string" ? value.trim() : "";
}

export function parseWebsiteCoachInput(body: WebsiteCoachRequestBody):
  | { input: WebsiteCoachInput }
  | { error: string } {
  const websiteUrl = getStringField(body, "websiteUrl");
  const businessType = getStringField(body, "businessType");
  const targetAudience = getStringField(body, "targetAudience");
  const mainGoal = body.mainGoal;

  if (!websiteUrl) {
    return { error: "A website URL is required." };
  }

  try {
    normalizeWebsiteCoachUrl(websiteUrl);
  } catch {
    return { error: "Please enter a valid website URL." };
  }

  if (!businessType) {
    return { error: "Business type is required." };
  }

  if (!targetAudience) {
    return { error: "Target audience is required." };
  }

  if (!isWebsiteCoachGoal(mainGoal)) {
    return { error: "Please choose a valid website goal." };
  }

  return {
    input: {
      websiteUrl,
      businessType,
      targetAudience,
      mainGoal,
    },
  };
}

export async function handleWebsiteCoachApiRequest(
  body: unknown,
  dependencies: WebsiteCoachApiDependencies
): Promise<WebsiteCoachApiResponse> {
  try {
    if (!body || typeof body !== "object") {
      return { status: 400, body: { error: "Invalid request body." } };
    }

    const parsed = parseWebsiteCoachInput(body as WebsiteCoachRequestBody);

    if ("error" in parsed) {
      return { status: 400, body: { error: parsed.error } };
    }

    const { user, error: userError } = await dependencies.getUser();

    if (userError || !user) {
      return { status: 401, body: { error: "Not authenticated." } };
    }

    const analyze = dependencies.analyze ?? analyzeWebsiteCoach;
    const result = await analyze(parsed.input);

    return { status: 200, body: result };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Website Coach could not analyze this site right now.";

    const invalidUrl = /invalid url|only http and https/i.test(message);

    if (invalidUrl) {
      return { status: 400, body: { error: "Please enter a valid website URL." } };
    }

    console.error("Site Strategist Website Coach error:", error);
    return {
      status: 500,
      body: { error: "Website Coach could not analyze this site right now." },
    };
  }
}
