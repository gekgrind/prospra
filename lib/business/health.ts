// /lib/business/health.ts

export type BusinessHealthInput = {
  trafficScore?: number; // 0–100
  leadFlowScore?: number; // 0–100
  offerClarityScore?: number; // 0–100
  funnelStrengthScore?: number; // 0–100
  momentumScore?: number; // 0–100
};

export type BusinessHealthIndicator = {
  key: keyof BusinessHealthInput;
  label: string;
  score: number;
  status: "low" | "medium" | "high";
  description: string;
  suggestion: string;
};

export function computeBusinessHealthIndicators(
  input: BusinessHealthInput
): BusinessHealthIndicator[] {
  const entries: [keyof BusinessHealthInput, string][] = [
    ["trafficScore", "Traffic"],
    ["leadFlowScore", "Lead Flow"],
    ["offerClarityScore", "Offer Clarity"],
    ["funnelStrengthScore", "Funnel Strength"],
    ["momentumScore", "Momentum"],
  ];

  return entries.map(([key, label]) => {
    const raw = input[key] ?? 50;
    const score = Math.max(0, Math.min(100, raw));

    let status: BusinessHealthIndicator["status"];
    if (score < 40) status = "low";
    else if (score < 70) status = "medium";
    else status = "high";

    let description = "";
    let suggestion = "";

    switch (key) {
      case "trafficScore":
        description =
          status === "high"
            ? "You’re driving solid traffic to your brand."
            : status === "medium"
            ? "Traffic is okay but could be more consistent."
            : "You need more eyeballs on your brand and offers.";
        suggestion =
          "Pick 1–2 core traffic channels (SEO, short-form video, partnerships, ads) and commit to a simple weekly publishing rhythm.";
        break;
      case "leadFlowScore":
        description =
          status === "high"
            ? "You’re converting traffic into leads nicely."
            : status === "medium"
            ? "Leads are trickling in but not in a compounding way yet."
            : "You’re likely leaving a lot of potential leads uncaptured.";
        suggestion =
          "Add or refine lead magnets, opt-in forms, and CTAs on your high-traffic pages.";
        break;
      case "offerClarityScore":
        description =
          status === "high"
            ? "Your offer is clear and compelling."
            : status === "medium"
            ? "Your offer makes sense but could be sharper."
            : "Your positioning and promise likely feel fuzzy to visitors.";
        suggestion =
          "Tighten your one-liner and make your main product/service and outcome painfully obvious above the fold.";
        break;
      case "funnelStrengthScore":
        description =
          status === "high"
            ? "You have a strong path from discovery to purchase."
            : status === "medium"
            ? "Your funnel exists but has friction or gaps."
            : "Your funnel is either missing or too leaky to scale.";
        suggestion =
          "Map your funnel stages and fix the biggest drop-off with a single improvement at a time.";
        break;
      case "momentumScore":
        description =
          status === "high"
            ? "You’re moving with strong, compounding momentum."
            : status === "medium"
            ? "You’re making progress, but it may feel inconsistent."
            : "Momentum is low – likely due to context switching or overwhelm.";
        suggestion =
          "Adopt a simple weekly plan: 3 big rocks + daily needle-mover tasks, and track completion.";
        break;
    }

    return {
      key,
      label,
      score,
      status,
      description,
      suggestion,
    };
  });
}
