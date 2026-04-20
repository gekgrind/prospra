// /app/api/chat/route.ts

import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { generateConversationTitle } from "./get-title";
import { getWebsiteBrainContext } from "@/lib/website-brain/retrieve";
import { getBillingProfile } from "@/lib/identity/profile";
import { getSupabaseProjectConfig } from "@/lib/config/ecosystem";
import { trackServerEvent } from "@/lib/analytics/server";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { buildMentorContext } from "@/lib/mentor/build-mentor-context";
import { buildMentorSystemPrompt } from "@/lib/mentor/build-mentor-system-prompt";

type Database = any;

/* -------------------------------------------------------------
   TYPES
------------------------------------------------------------- */

type UIMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type FounderContext = {
  fullName?: string | null;
  businessIdea?: string | null;
  industry?: string | null;
  experienceLevel?: string | null;
  goals?: string[];
  planTier?: string | null;
  isPremium?: boolean;
};

type ActionPlanTask = {
  title: string;
  status: string;
};

type ProfileRow = {
  full_name?: string | null;
  business_idea?: string | null;
  industry?: string | null;
  experience_level?: string | null;
  goals?: string[] | string | null;
  is_premium?: boolean | null;
  plan_tier?: string | null;
  subscription_status?: string | null;
  daily_credit_limit?: number | null;
  daily_credits_used?: number | null;
  last_credit_reset?: string | null;
  business_type?: string | null;
};

type MemoryExtractionResult = {
  memories: string[];
};

type UsageType = "mentor_message" | "board_review";

type UsageCheckResult = {
  allowed: boolean;
  plan: "free" | "premium";
  profile: ProfileRow | null;
  used: number;
  limit: number;
};

/* -------------------------------------------------------------
   UTILS
------------------------------------------------------------- */

function normalizeRole(role: unknown): UIMessage["role"] {
  if (role === "user" || role === "assistant" || role === "system") {
    return role;
  }

  return "user";
}

function extractTextFromMessage(message: unknown): string {
  if (!message || typeof message !== "object") return "";

  const msg = message as {
    content?: unknown;
    parts?: Array<{ text?: unknown; content?: unknown }>;
  };

  if (typeof msg.content === "string") return msg.content;

  if (Array.isArray(msg.parts)) {
    return msg.parts
      .map((part) => {
        if (typeof part?.text === "string") return part.text;
        if (typeof part?.content === "string") return part.content;
        return "";
      })
      .join("");
  }

  return "";
}

function parseCookieHeader(
  raw: string | null
): Array<{ name: string; value: string }> {
  if (!raw) return [];

  return raw
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((cookie) => {
      const index = cookie.indexOf("=");

      if (index === -1) {
        return { name: cookie, value: "" };
      }

      return {
        name: cookie.slice(0, index),
        value: cookie.slice(index + 1),
      };
    });
}

function sanitizeTasks(input: unknown): ActionPlanTask[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const task = item as { title?: unknown; status?: unknown };

      return {
        title:
          typeof task.title === "string" && task.title.trim().length > 0
            ? task.title.trim()
            : "Untitled task",
        status:
          typeof task.status === "string" && task.status.trim().length > 0
            ? task.status.trim().toLowerCase()
            : "pending",
      };
    })
    .filter((task): task is ActionPlanTask => task !== null);
}

function normalizeGoals(goals: ProfileRow["goals"]): string[] {
  if (Array.isArray(goals)) {
    return goals.filter(
      (goal): goal is string =>
        typeof goal === "string" && goal.trim().length > 0
    );
  }

  if (typeof goals === "string" && goals.trim().length > 0) {
    return [goals.trim()];
  }

  return [];
}

function hasPremiumAccess(profile: ProfileRow | null | undefined): boolean {
  if (!profile) return false;

  if (profile.is_premium) return true;

  const tier = profile.plan_tier?.toLowerCase() ?? "";
  const status = profile.subscription_status?.toLowerCase() ?? "";

  return (
    tier === "premium" ||
    tier === "pro" ||
    status === "active" ||
    status === "trialing"
  );
}

/* -------------------------------------------------------------
   SUPABASE CLIENT
------------------------------------------------------------- */

function createClient(request: Request) {
  const { url, anonKey } = getSupabaseProjectConfig();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get("cookie"));
      },
      setAll(
        _cookies: Array<{
          name: string;
          value: string;
          options?: Record<string, unknown>;
        }>
      ) {
        // No-op in this route handler.
      },
    },
  });
}

/* -------------------------------------------------------------
   CONTEXT BUILDERS
------------------------------------------------------------- */

async function buildFounderContext(
  supabase: SupabaseClient<Database>,
  userId: string,
  userMetadata?: Record<string, unknown>
): Promise<FounderContext> {
  const { data } = await supabase
    .from("profiles")
    .select(
      "full_name, business_idea, industry, experience_level, goals, plan_tier, is_premium, subscription_status"
    )
    .eq("id", userId)
    .maybeSingle();

  const profile = (data as ProfileRow | null) ?? null;

  return {
    fullName:
      profile?.full_name ??
      (typeof userMetadata?.full_name === "string"
        ? userMetadata.full_name
        : null),
    businessIdea:
      profile?.business_idea ??
      (typeof userMetadata?.business_idea === "string"
        ? userMetadata.business_idea
        : null),
    industry:
      profile?.industry ??
      (typeof userMetadata?.industry === "string"
        ? userMetadata.industry
        : null),
    experienceLevel:
      profile?.experience_level ??
      (typeof userMetadata?.experience_level === "string"
        ? userMetadata.experience_level
        : null),
    goals: normalizeGoals(profile?.goals),
    planTier: profile?.plan_tier ?? null,
    isPremium: hasPremiumAccess(profile),
  };
}

function founderContextToPromptBlock(context: FounderContext): string {
  const goals =
    context.goals && context.goals.length > 0
      ? context.goals.join(", ")
      : "none provided";

  return [
    `Full name: ${context.fullName ?? "unknown"}`,
    `Business idea: ${context.businessIdea ?? "unknown"}`,
    `Industry: ${context.industry ?? "unknown"}`,
    `Experience level: ${context.experienceLevel ?? "unknown"}`,
    `Goals: ${goals}`,
    `Plan tier: ${context.planTier ?? "unknown"}`,
    `Premium: ${context.isPremium ? "yes" : "no"}`,
  ].join("\n");
}

async function getMentorMemoryContext({
  supabase,
  userId,
  currentMessage,
  limit = 6,
}: {
  supabase: SupabaseClient<Database>;
  userId: string;
  currentMessage: string;
  limit?: number;
}): Promise<string> {
  void currentMessage;

  try {
    const { data } = await supabase
      .from("mentor_memories")
      .select("content")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!data || data.length === 0) {
      return "No relevant memory yet.";
    }

    const memories = data
      .map((item) => {
        const row = item as { content?: unknown };
        return typeof row.content === "string" ? row.content.trim() : "";
      })
      .filter(Boolean);

    return memories.length > 0
      ? memories.map((memory) => `- ${memory}`).join("\n")
      : "No relevant memory yet.";
  } catch {
    return "No relevant memory yet.";
  }
}

async function extractMemories(
  modelName: "gpt-4o" | "gpt-4o-mini",
  userMessage: string,
  assistantMessage: string
): Promise<MemoryExtractionResult> {
  void modelName;
  void userMessage;
  void assistantMessage;

  return { memories: [] };
}

async function saveMemories(
  supabase: SupabaseClient<Database>,
  userId: string,
  memories: string[]
): Promise<void> {
  if (!memories.length) return;

  try {
    const rows = memories.map((content) => ({
      user_id: userId,
      content,
    }));

    await supabase.from("mentor_memories").insert(rows);
  } catch {
    // Swallow memory persistence failures so chat still works.
  }
}

async function enforceUsageLimit(
  supabase: SupabaseClient<Database>,
  userId: string,
  usageType: UsageType
): Promise<UsageCheckResult> {
  const { data } = await supabase
    .from("profiles")
    .select(
      "is_premium, plan_tier, subscription_status, daily_credit_limit, daily_credits_used, last_credit_reset"
    )
    .eq("id", userId)
    .maybeSingle();

  const profile = (data as ProfileRow | null) ?? null;
  const premium = hasPremiumAccess(profile);

  if (premium) {
    return {
      allowed: true,
      plan: "premium",
      profile,
      used: profile?.daily_credits_used ?? 0,
      limit: profile?.daily_credit_limit ?? 999999,
    };
  }

  let used = profile?.daily_credits_used ?? 0;
  const limit = profile?.daily_credit_limit ?? 5;
  const lastReset = profile?.last_credit_reset ?? null;
  const today = new Date().toISOString().slice(0, 10);

  if (!lastReset || lastReset !== today) {
    await supabase
      .from("profiles")
      .update({
        daily_credits_used: 0,
        last_credit_reset: today,
      })
      .eq("id", userId);

    used = 0;
  }

  if (usageType === "board_review") {
    return {
      allowed: false,
      plan: "free",
      profile,
      used,
      limit,
    };
  }

  return {
    allowed: used < limit,
    plan: "free",
    profile,
    used,
    limit,
  };
}

async function incrementUsageCounter(
  supabase: SupabaseClient<Database>,
  userId: string,
  profile: ProfileRow | null
): Promise<void> {
  if (hasPremiumAccess(profile)) return;

  const currentUsed = profile?.daily_credits_used ?? 0;

  try {
    await supabase
      .from("profiles")
      .update({ daily_credits_used: currentUsed + 1 })
      .eq("id", userId);
  } catch {
    // Non-fatal
  }
}

async function recordUsageEvent(
  supabase: SupabaseClient<Database>,
  userId: string,
  usageType: UsageType,
  quantity: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from("usage_events").insert({
      user_id: userId,
      usage_type: usageType,
      quantity,
      metadata: metadata ?? {},
    });
  } catch {
    // Non-fatal if the table doesn't exist yet or insert fails.
  }
}

/* -------------------------------------------------------------
   SYSTEM PROMPTS FOR MODES
------------------------------------------------------------- */

function buildSystemPrompt(
  mode: string,
  context: {
    mentorContextPrompt: string;
    founderContext: string;
    profileContext: string;
    websiteContext: string;
    memoryContext: string;
    actionPlanContext: string;
  }
) {
  const {
    mentorContextPrompt,
    founderContext,
    profileContext,
    websiteContext,
    memoryContext,
    actionPlanContext,
  } = context;

  switch (mode) {
    case "website-coach":
      return `
${mentorContextPrompt}

You are **Prospra Website Coach**, an expert at improving clarity, UX, and conversion.

Respond with:
**Insight** (2–3 sentences)
**What's Working**
- bullet
- bullet
**Fix This Next**
1. item
2. item
3. item

Rules:
- Reference website context deeply.
- Be clear, punchy, supportive, Gen-Z friendly.

Founder Context:
${founderContext}

Founder Profile Context:
${profileContext}

Memory Context:
${memoryContext}

Action Plan Context:
${actionPlanContext}

Website Context:
${websiteContext}
`;

    case "seo-ux":
      return `
${mentorContextPrompt}

You are **Prospra SEO/UX Analyzer**.

Your job:
- Score SEO fundamentals
- Identify UX issues
- Suggest high-impact fixes
- Improve scannability and SEO structure

Founder Context:
${founderContext}

Founder Profile Context:
${profileContext}

Memory Context:
${memoryContext}

Action Plan Context:
${actionPlanContext}

Website Context:
${websiteContext}
`;

    case "funnel-mapping":
      return `
${mentorContextPrompt}

You are **Prospra Funnel Architect**.

Your job:
- Map the user’s funnel
- Identify leaks
- Suggest fixes
- Output a funnel diagram
- Provide conversion recommendations

Sections:
**Funnel Overview**
**Drop-Off Risks**
**Fix This Next**
**ASCII Funnel Diagram**

Founder Context:
${founderContext}

Founder Profile Context:
${profileContext}

Memory Context:
${memoryContext}

Action Plan Context:
${actionPlanContext}

Website Context:
${websiteContext}
`;

    case "cta-analyzer":
      return `
${mentorContextPrompt}

You are **Prospra CTA Analyzer**, a senior conversion copywriter.

Workflow:
1. Analyze the CTA for clarity, emotion, action, urgency.
2. Suggest 2–3 improved versions.
3. Provide coaching.
4. ALWAYS output a CTA score JSON block at the end EXACTLY like this:

\`\`\`cta-score
{
  "clarity": 0-100,
  "emotion": 0-100,
  "strength": 0-100,
  "urgency": 0-100,
  "conversion": 0-100,
  "summary": "short 1-sentence summary"
}
\`\`\`

Respond with:
**CTA Analysis**
**Better Versions**
**Why These Work**

Founder Context:
${founderContext}

Founder Profile Context:
${profileContext}

Memory Context:
${memoryContext}

Action Plan Context:
${actionPlanContext}

Website Context:
${websiteContext}
`;

    case "board-review":
      return `
${mentorContextPrompt}

You are **Directorium Board Review** — Prospra's strategic escalation mode.

Respond with:
**Board Verdict** (1 concise paragraph)
**Top Risks**
- bullet
- bullet
**Board-Level Moves (Next 30 Days)**
1. item
2. item
3. item

Rules:
- Be direct and strategic, like an experienced board advisor.
- Prioritize leverage, constraints, and decisions over motivation.

Website Context:
${websiteContext}

Memory Context:
${memoryContext}
`;

    default:
      return `
${mentorContextPrompt}

You are **Prospra**, an elite entrepreneurial mentor.

Respond with:

**Mentor Insight (1–2 sentences)**
**Key Points**
- bullet
- bullet
- bullet
**Action Steps**
1. step
2. step
3. step
**Bonus Tip**

Tone: warm, human, Gen-Z friendly, practical.
Use founder context to tailor stage-appropriate, audience-aware, goal-focused advice.
Reference memories + website when helpful.
Do not recite profile details unless directly helpful to the answer.

Founder Context:
${founderContext}

Founder Profile Context:
${profileContext}

Memory Context:
${memoryContext}

Action Plan Context:
${actionPlanContext}

Website Context:
${websiteContext}
`;
  }
}

/* -------------------------------------------------------------
   MAIN HANDLER
------------------------------------------------------------- */

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const parsedBody = body as {
      messages?: unknown;
      conversationId?: string | null;
      mode?: string;
      mentorContextHint?: unknown;
    };

    const raw = parsedBody.messages;
    const incoming = parsedBody.conversationId ?? null;
    const mode = typeof parsedBody.mode === "string" ? parsedBody.mode : "mentor";

    if (!Array.isArray(raw)) {
      return new Response(
        JSON.stringify({ error: "Messages must be an array" }),
        { status: 400 }
      );
    }

    if (raw.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one message is required" }),
        { status: 400 }
      );
    }

    const normalized: UIMessage[] = raw.map((message) => {
      const msg = message as { role?: unknown };

      return {
        role: normalizeRole(msg.role),
        content: extractTextFromMessage(message),
      };
    });

    const supabase = createClient(req);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let founderContext = "No founder context yet.";
    let memoryContext = "No relevant memory yet.";
    let profileContext = "No onboarding/profile context yet.";
    let websiteContext = "No website data yet.";
    let actionPlanContext = "No active action plan.";
    let mentorContextPrompt =
      "Business memory context is currently unavailable. Use only verified conversation details and state assumptions.";
    let isPremium = false;
    let conversationId = incoming ?? null;

    const usageType: UsageType =
      mode === "board-review" ? "board_review" : "mentor_message";

    const lastUserMessage =
      [...normalized].reverse().find((message) => message.role === "user")
        ?.content ?? "";

    /* -------------------- USER LOGIC -------------------- */
    if (user) {
      const founderProfile = await buildFounderContext(
        supabase,
        user.id,
        (user.user_metadata as Record<string, unknown> | undefined) ?? undefined
      );

      founderContext = founderContextToPromptBlock(founderProfile);
      profileContext = founderContext;

      memoryContext = await getMentorMemoryContext({
        supabase,
        userId: user.id,
        currentMessage: lastUserMessage,
        limit: 6,
      });

      try {
        websiteContext =
          (await getWebsiteBrainContext(user.id, lastUserMessage)) ??
          "No website data yet.";
      } catch {
        websiteContext = "No website data yet.";
      }

      const billingProfile = await getBillingProfile(supabase, user.id);
      const { data: usageProfile } = await supabase
        .from("profiles")
        .select("daily_credit_limit,daily_credits_used,last_credit_reset")
        .eq("id", user.id)
        .single();

      isPremium =
        hasPremiumAccess(billingProfile as ProfileRow | null) ||
        hasPremiumAccess(usageProfile as ProfileRow | null);

      const today = new Date().toISOString().slice(0, 10);
      const last = (usageProfile as ProfileRow | null)?.last_credit_reset ?? null;

      if (last !== today) {
        await supabase
          .from("profiles")
          .update({ daily_credits_used: 0, last_credit_reset: today })
          .eq("id", user.id);
      }

      const usageCheck = await enforceUsageLimit(supabase, user.id, usageType);
      isPremium = usageCheck.plan === "premium";

      if (!usageCheck.allowed) {
        await trackServerEvent(ANALYTICS_EVENTS.USAGE_LIMIT_REACHED, {
          user_id: user.id,
          limit_type:
            usageType === "board_review" ? "board_review" : "daily_credits",
          used: usageCheck.used,
          limit: usageCheck.limit,
          surface: "mentor_chat_api",
        });

        const message =
          usageType === "board_review"
            ? "Board Reviews are limited on the free plan. Upgrade to unlock more strategic escalations."
            : "You've used today's free Prospra prompts. Upgrade to keep the inspiration flowing!";

        return new Response(message, { status: 429 });
      }

      await incrementUsageCounter(supabase, user.id, usageCheck.profile);

      if (!conversationId) {
        const title = await generateConversationTitle(lastUserMessage);
        const { data: conv } = await supabase
          .from("conversations")
          .insert({ user_id: user.id, title })
          .select("id")
          .single();

        conversationId = (conv as { id?: string } | null)?.id ?? null;
      }

      if (conversationId) {
        const { data: actionPlan } = await supabase
          .from("action_plans")
          .select("tasks")
          .eq("user_id", user.id)
          .eq("conversation_id", conversationId)
          .maybeSingle();

        const actionPlanRow = actionPlan as { tasks?: unknown } | null;

        if (actionPlanRow) {
          const tasks = sanitizeTasks(actionPlanRow.tasks);
          const completedCount = tasks.filter(
            (task) => task.status === "completed"
          ).length;

          actionPlanContext =
            tasks.length > 0
              ? [
                  `Completion: ${completedCount}/${tasks.length}.`,
                  ...tasks.map((task) => `- [${task.status}] ${task.title}`),
                ].join("\n")
              : "Action plan exists but has no tasks.";
        }
      }

      const mentorContext = await buildMentorContext({
        supabase,
        userId: user.id,
        conversationId: conversationId ?? undefined,
      });

      mentorContextPrompt = buildMentorSystemPrompt({
        mode,
        context: mentorContext,
        legacyContextBlocks: {
          founderContext,
          profileContext,
          websiteContext,
          memoryContext,
          actionPlanContext,
        },
      });
    }

    /* -------------------- SYSTEM PROMPT -------------------- */

    const systemPrompt = buildSystemPrompt(mode, {
      mentorContextPrompt,
      founderContext,
      profileContext,
      websiteContext,
      memoryContext,
      actionPlanContext,
    });

    /* -------------------- STREAM RESPONSE -------------------- */

    const priorMessages = normalized.slice(0, -1);
    const latestUserMessage = normalized[normalized.length - 1];

    const result = streamText({
      model: openai(isPremium ? "gpt-4o" : "gpt-4o-mini"),
      messages: [
        { role: "system", content: systemPrompt },
        ...priorMessages,
        ...(latestUserMessage ? [latestUserMessage] : []),
      ],
      temperature: isPremium ? 0.9 : 0.6,
      onFinish: async ({ text }: { text?: string }) => {
        try {
          if (user && text) {
            const extracted = await extractMemories(
              isPremium ? "gpt-4o" : "gpt-4o-mini",
              lastUserMessage,
              text
            );

            await saveMemories(supabase, user.id, extracted.memories || []);
            await recordUsageEvent(supabase, user.id, usageType, 1, {
              mode,
              conversation_id: conversationId,
            });
          }
        } catch (err) {
          console.error("MEMORY / USAGE EVENT ERROR:", err);
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (err: unknown) {
    try {
      await trackServerEvent(ANALYTICS_EVENTS.MENTOR_RESPONSE_FAILED, {
        reason: "chat_route_error",
      });
    } catch {
      // Non-fatal
    }

    console.error("CHAT ROUTE ERROR:", err);

    return new Response(
      JSON.stringify({
        error: "CHAT_ERROR",
        message: err instanceof Error ? err.message : String(err),
      }),
      { status: 500 }
    );
  }
}
