import type { MentorContext } from "@/lib/mentor/build-mentor-context";

function formatArray(items: string[] | null | undefined): string {
  if (!items || items.length === 0) {
    return "- none";
  }

  return items.map((item) => `- ${item}`).join("\n");
}

function formatValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "unknown";
  }

  return String(value);
}

export function buildMentorSystemPrompt({
  mode,
  context,
  legacyContextBlocks,
}: {
  mode: string;
  context: MentorContext;
  legacyContextBlocks: {
    founderContext: string;
    profileContext: string;
    websiteContext: string;
    memoryContext: string;
    actionPlanContext: string;
  };
}) {
  const businessProfile = context.businessProfile;
  const websiteIntelligence = context.websiteIntelligence;
  const strategicState = context.strategicState;

  const recentSummaries =
    context.recentConversationSummaries.length > 0
      ? context.recentConversationSummaries
          .map(
            (entry, index) =>
              `${index + 1}. ${entry.summary}\n   Priority: ${formatValue(
                entry.recommendedPriority
              )}\n   Risk/Blocker: ${formatValue(entry.riskOrBlocker)}\n   Updated: ${formatValue(
                entry.updatedAt
              )}`
          )
          .join("\n")
      : "none";

  return `You are Prospra AI Mentor, an expert business advisor for founders.

You are assisting based on:
1. Business Profile
2. Website Intelligence
3. Strategic State
4. Current conversation history

Your job:
- give tailored business guidance
- be specific and actionable
- reflect the user's actual business context
- avoid generic advice when context is available
- when context is missing, say what assumptions you are making

Current mode: ${mode}

Business Profile:
- Name: ${formatValue(businessProfile?.fullName)}
- Profile Name: ${formatValue(businessProfile?.profileName)}
- Business Idea: ${formatValue(businessProfile?.businessIdea)}
- Industry: ${formatValue(businessProfile?.industry)}
- Experience Level: ${formatValue(businessProfile?.experienceLevel)}
- Goals:
${formatArray(businessProfile?.goals)}
- Business Name: ${formatValue(businessProfile?.businessName)}
- Business Description: ${formatValue(businessProfile?.businessDescription)}
- Target Audience: ${formatValue(businessProfile?.targetAudience)}
- Primary Offer: ${formatValue(businessProfile?.primaryOffer)}
- Pricing Model: ${formatValue(businessProfile?.pricingModel)}
- Business Stage: ${formatValue(businessProfile?.businessStage)}
- Constraints:
${formatArray(businessProfile?.constraints)}
- Website URL: ${formatValue(businessProfile?.websiteUrl)}

Website Intelligence:
- Website URL: ${formatValue(websiteIntelligence?.websiteUrl)}
- Homepage Summary: ${formatValue(websiteIntelligence?.homepageSummary)}
- Offer Clarity Score: ${formatValue(websiteIntelligence?.offerClarityScore)}
- SEO Score: ${formatValue(websiteIntelligence?.seoScore)}
- UX Score: ${formatValue(websiteIntelligence?.uxScore)}
- CTA Score: ${formatValue(websiteIntelligence?.ctaScore)}
- Funnel Summary: ${formatValue(websiteIntelligence?.funnelSummary)}
- Key Issues:
${formatArray(websiteIntelligence?.keyIssues)}
- Recommended Fixes:
${formatArray(websiteIntelligence?.recommendedFixes)}

Strategic State:
- Current Focus: ${formatValue(strategicState?.currentFocus)}
- Top Priorities:
${formatArray(strategicState?.topPriorities)}
- Known Problems:
${formatArray(strategicState?.knownProblems)}
- Opportunities:
${formatArray(strategicState?.opportunities)}
- Current Offer Summary: ${formatValue(strategicState?.currentOfferSummary)}
- Current Growth Stage: ${formatValue(strategicState?.currentGrowthStage)}
- Last Updated: ${formatValue(strategicState?.lastUpdated)}

Recent Conversation Summaries:
${recentSummaries}

Additional platform context:
Founder Context:
${legacyContextBlocks.founderContext}

Founder Profile Context:
${legacyContextBlocks.profileContext}

Memory Context:
${legacyContextBlocks.memoryContext}

Action Plan Context:
${legacyContextBlocks.actionPlanContext}

Website Context:
${legacyContextBlocks.websiteContext}`;
}
