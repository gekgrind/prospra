export type AdGeneratorOptions = {
  platforms: string[]; // ["tiktok","meta","google-search",...]
  tone: string; // "direct", "supportive-hype", "luxury", ...
  growthFocus: string; // "awareness", "leads-and-sales", "retention", ...
};

export type VCContext = {
  fundingStage?: string;
  targetRaise?: string;
  runwayMonths?: string;
  founderScore?: number | null;
  businessHealthScore?: number | null;
};

export type WebsiteScoreContext = {
  url?: string | null;
  overallScore?: number | null;
  clarityScore?: number | null;
  offerScore?: number | null;
  seoScore?: number | null;
  uxScore?: number | null;
};

export type AdCreative = {
  platform: string; // "TikTok", "Meta", "Google Search", "YouTube Shorts"
  type: string; // "short-form video", "story ad", "static image", ...
  hook: string;
  primaryText: string;
  description?: string;
  cta: string;
};

export type FunnelStep = {
  stage: "TOFU" | "MOFU" | "BOFU";
  asset: string; // "TikTok video", "Landing page", "Lead magnet", ...
  action: string; // "Click to learn more", "Book a call", ...
};

export type AdCampaign = {
  id: string;
  name: string;
  objective: string; // "Generate booked calls", "Drive trials", ...
  summary: string;
  stageFit: string; // why this fits the current stage
  platforms: string[];
  primaryAudience: string;
  angle: string; // core creative angle
  kpis: string[];
  estBudget: {
    monthly: string;
    notes: string;
  };
  creatives: AdCreative[];
  funnel: FunnelStep[];
};

type BuildPromptArgs = {
  founderName: string;
  companyName: string;
  industry?: string;
  growthGoal: string;
  websiteContent: string;
  options: AdGeneratorOptions;
  vcContext: VCContext;
  websiteScoreContext: WebsiteScoreContext;
};

export function buildAdGeneratorPrompt(args: BuildPromptArgs) {
  const {
    founderName,
    companyName,
    industry,
    growthGoal,
    websiteContent,
    options,
    vcContext,
    websiteScoreContext,
  } = args;

  const platformsList = options.platforms.join(", ");
  const fundingStage = vcContext.fundingStage || "unknown";
  const runwayText = vcContext.runwayMonths
    ? `${vcContext.runwayMonths} months`
    : "unknown";
  const targetRaiseText = vcContext.targetRaise
    ? `$${vcContext.targetRaise} (approx)`
    : "not specified";

  const overallScore =
    websiteScoreContext.overallScore != null
      ? `${websiteScoreContext.overallScore}/100`
      : "unknown";

  const systemPrompt = `
You are a senior growth strategist + performance marketing lead at a top-tier VC fund.
You design scrappy, high-ROI ad campaigns for early-stage startups based on their website, runway, and funding stage.

Constraints and style:
- You think like an investor AND a performance marketer.
- You prioritize clarity of offer, tight audience-target fit, and realistic budgets for early-stage founders.
- You propose campaigns that are actually launchable by a solo founder or tiny team.
- Output must be STRICT VALID JSON that matches the schema described below.
- Do not include commentary outside the JSON object.
`;

  const userPrompt = `
Founder: ${founderName}
Company: ${companyName}
Industry: ${industry || "Not specified"}
Primary growth goal: ${growthGoal}

Funding context:
- Stage: ${fundingStage}
- Runway: ${runwayText}
- Target raise: ${targetRaiseText}
- Founder score (if provided): ${vcContext.founderScore ?? "n/a"}
- Business health score (if provided): ${
    vcContext.businessHealthScore ?? "n/a"
  }

Website context:
- URL: ${websiteScoreContext.url || "Unknown"}
- Overall score: ${overallScore}
- Clarity score: ${
    websiteScoreContext.clarityScore != null
      ? websiteScoreContext.clarityScore
      : "unknown"
  }
- Offer score: ${
    websiteScoreContext.offerScore != null
      ? websiteScoreContext.offerScore
      : "unknown"
  }
- SEO score: ${
    websiteScoreContext.seoScore != null
      ? websiteScoreContext.seoScore
      : "unknown"
  }
- UX score: ${
    websiteScoreContext.uxScore != null
      ? websiteScoreContext.uxScore
      : "unknown"
  }

Raw website content (truncated if long – use as much as needed):
"""
${websiteContent.slice(0, 8000)}
"""

Ad generator options:
- Platforms to focus on: ${platformsList}
- Tone preference: ${options.tone}
- Growth focus: ${options.growthFocus}

TASK:
Generate EXACTLY 3 distinct ad campaigns tailored to this startup's stage, runway, and goals.

Each campaign must:
- Be realistic for a lean, early-stage founder to execute.
- Align with their funding stage and runway (e.g., more scrappy for short runway).
- Use channels listed in the platforms list (you can mix/match).
- Include a clear primary angle and who it's for.
- Include specific creatives (hooks + ad copy) per platform.
- Include a simple funnel structure (TOFU → MOFU → BOFU).
- Include KPIs that a founder can track (e.g., CPC, CTR, cost/lead, demo calls booked).

Respond with JSON in the following shape:

{
  "campaigns": [
    {
      "id": "string-id",
      "name": "short internal campaign name",
      "objective": "primary objective",
      "summary": "2-3 sentence summary of the campaign strategy",
      "stageFit": "why this campaign is a fit for their current funding stage & runway",
      "platforms": ["TikTok", "Meta", "Google Search"],
      "primaryAudience": "who the campaign is for",
      "angle": "core angle/hook for this campaign",
      "kpis": ["primary KPI 1", "primary KPI 2"],
      "estBudget": {
        "monthly": "rough range, e.g. '$500-1k/mo'",
        "notes": "how to think about scaling/adjusting this budget"
      },
      "creatives": [
        {
          "platform": "TikTok",
          "type": "short-form video UGC",
          "hook": "scroll-stopping first line",
          "primaryText": "main script / ad copy",
          "description": "notes for visuals, pacing, or creator instructions",
          "cta": "clear call to action"
        }
      ],
      "funnel": [
        {
          "stage": "TOFU",
          "asset": "what asset/channel is used",
          "action": "desired user action"
        }
      ]
    }
  ]
}
`;

  return { systemPrompt, userPrompt };
}

export function normalizeCampaignResponse(raw: any): AdCampaign[] {
  if (!raw) return [];

  const campaigns = raw.campaigns ?? raw.data ?? raw;

  if (!Array.isArray(campaigns)) return [];

  return campaigns.map((c, index): AdCampaign => {
    return {
      id: c.id || `campaign-${index + 1}`,
      name: c.name || `Campaign ${index + 1}`,
      objective: c.objective || "Drive leads and revenue",
      summary: c.summary || "",
      stageFit: c.stageFit || "",
      platforms: Array.isArray(c.platforms) ? c.platforms : [],
      primaryAudience: c.primaryAudience || "",
      angle: c.angle || "",
      kpis: Array.isArray(c.kpis) ? c.kpis : [],
      estBudget: {
        monthly: c.estBudget?.monthly || "TBD",
        notes: c.estBudget?.notes || "",
      },
      creatives: Array.isArray(c.creatives)
        ? c.creatives.map((cr: any): AdCreative => ({
            platform: cr.platform || "Unknown",
            type: cr.type || "ad",
            hook: cr.hook || "",
            primaryText: cr.primaryText || "",
            description: cr.description || "",
            cta: cr.cta || "",
          }))
        : [],
      funnel: Array.isArray(c.funnel)
        ? c.funnel.map((step: any): FunnelStep => ({
            stage:
              step.stage === "MOFU" || step.stage === "BOFU"
                ? step.stage
                : "TOFU",
            asset: step.asset || "",
            action: step.action || "",
          }))
        : [],
    };
  });
}
