import type { SupabaseClient } from "@supabase/supabase-js";

type CoachStyle = "direct" | "supportive" | "hype";
type CoachFocus = "strategy" | "systems" | "marketing" | "mindset";

export type FounderContext = {
  founder: {
    name?: string;
    experienceLevel?: string;
    industry?: string;
  };
  business: {
    stage?: string;
    businessIdea?: string;
    audience?: string;
    offer?: string;
    website?: string;
  };
  priorities: {
    goals?: string[];
    goal90?: string;
    challenge?: string;
  };
  preferences: {
    coachStyle?: CoachStyle;
    coachFocus?: CoachFocus;
  };
};

type ProfilesRow = {
  full_name: string | null;
  name: string | null;
  experience_level: string | null;
  industry: string | null;
  stage: string | null;
  business_idea: string | null;
  audience: string | null;
  offer: string | null;
  website: string | null;
  goals: string[] | string | null;
  goal90: string | null;
  challenge: string | null;
};

function cleanText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeGoals(value: ProfilesRow["goals"] | undefined): string[] | undefined {
  if (!value) return undefined;

  if (Array.isArray(value)) {
    const goals = value.map(cleanText).filter((goal): goal is string => Boolean(goal));
    return goals.length > 0 ? goals.slice(0, 4) : undefined;
  }

  const singleGoal = cleanText(value);
  return singleGoal ? [singleGoal] : undefined;
}

function normalizeCoachStyle(value: unknown): CoachStyle | undefined {
  return value === "direct" || value === "supportive" || value === "hype"
    ? value
    : undefined;
}

function normalizeCoachFocus(value: unknown): CoachFocus | undefined {
  return value === "strategy" || value === "systems" || value === "marketing" || value === "mindset"
    ? value
    : undefined;
}

export async function buildFounderContext(
  supabase: SupabaseClient,
  userId: string,
  userMetadata?: Record<string, unknown> | null
): Promise<FounderContext> {
  const { data } = await supabase
    .from("profiles")
    .select(
      "full_name,name,experience_level,industry,stage,business_idea,audience,offer,website,goals,goal90,challenge"
    )
    .eq("id", userId)
    .maybeSingle<ProfilesRow>();

  const settings = (userMetadata?.settings as Record<string, unknown> | undefined) ?? {};

  return {
    founder: {
      name: cleanText(data?.full_name) ?? cleanText(data?.name),
      experienceLevel: cleanText(data?.experience_level),
      industry: cleanText(data?.industry),
    },
    business: {
      stage: cleanText(data?.stage),
      businessIdea: cleanText(data?.business_idea),
      audience: cleanText(data?.audience),
      offer: cleanText(data?.offer),
      website: cleanText(data?.website),
    },
    priorities: {
      goals: normalizeGoals(data?.goals),
      goal90: cleanText(data?.goal90),
      challenge: cleanText(data?.challenge),
    },
    preferences: {
      coachStyle: normalizeCoachStyle(settings.coachStyle),
      coachFocus: normalizeCoachFocus(settings.coachFocus),
    },
  };
}

export function founderContextToPromptBlock(context: FounderContext): string {
  const profileLines = [
    context.founder.name ? `- Founder: ${context.founder.name}` : null,
    context.founder.experienceLevel ? `- Experience: ${context.founder.experienceLevel}` : null,
    context.founder.industry ? `- Industry: ${context.founder.industry}` : null,
    context.business.stage ? `- Business stage: ${context.business.stage}` : null,
    context.business.businessIdea ? `- Business focus: ${context.business.businessIdea}` : null,
    context.business.audience ? `- Target audience: ${context.business.audience}` : null,
    context.business.offer ? `- Primary offer: ${context.business.offer}` : null,
  ].filter((line): line is string => Boolean(line));

  const prioritiesLines = [
    context.priorities.goals?.length
      ? `- Goals: ${context.priorities.goals.join("; ")}`
      : null,
    context.priorities.goal90 ? `- Current 90-day goal: ${context.priorities.goal90}` : null,
    context.priorities.challenge ? `- Current challenge: ${context.priorities.challenge}` : null,
  ].filter((line): line is string => Boolean(line));

  const preferencesLines = [
    context.preferences.coachStyle ? `- Preferred coaching style: ${context.preferences.coachStyle}` : null,
    context.preferences.coachFocus ? `- Preferred coaching focus: ${context.preferences.coachFocus}` : null,
  ].filter((line): line is string => Boolean(line));

  const sections: string[] = [];

  if (profileLines.length) {
    sections.push(`Founder & Business Snapshot:\n${profileLines.join("\n")}`);
  }

  if (prioritiesLines.length) {
    sections.push(`Current Priorities:\n${prioritiesLines.join("\n")}`);
  }

  if (preferencesLines.length) {
    sections.push(`Coaching Preferences:\n${preferencesLines.join("\n")}`);
  }

  if (sections.length === 0) {
    return "Founder Context: No durable profile context available yet.";
  }

  return sections.join("\n\n");
}
