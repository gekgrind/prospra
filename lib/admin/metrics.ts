import "server-only";

import { subDays } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminTimeWindow = "7d" | "30d" | "all";

type ProfileRow = {
  id: string;
  created_at: string | null;
  onboarding_complete?: boolean | null;
  is_premium?: boolean | null;
  subscription_status?: string | null;
  trial_active?: boolean | null;
  daily_credit_limit?: number | null;
  daily_credits_used?: number | null;
};

type ConversationRow = {
  id: string;
  user_id: string;
  created_at: string | null;
  updated_at: string | null;
};

type MessageRow = {
  conversation_id: string;
  role: string;
  content: string | null;
  created_at: string | null;
};

export type TrendPoint = {
  label: string;
  signups: number;
  mentorConversations: number;
  mentorMessages: number;
  paidUsers: number;
};

export type AdminDashboardMetrics = {
  window: AdminTimeWindow;
  rangeStart: string | null;
  totals: {
    totalSignups: number;
    onboardingCompletionRate: number;
    activatedUsers: number;
    actionPlanSignals: number;
    taskCompletionSignals: number;
    boardReviewSignals: number;
    activePaidSubscriptions: number;
    upgradeConversionRate: number;
  };
  funnels: {
    onboardingToMentor: Array<{ label: string; value: number }>;
    mentorToExecution: Array<{ label: string; value: number }>;
    limitToUpgrade: Array<{ label: string; value: number }>;
  };
  engagement: {
    mentorConversationsStarted: number;
    mentorMessagesSent: number;
    returningUsers: number;
    resumedConversations: number;
    weeklyReviewSignals: number;
    boardReviewSignals: number;
  };
  execution: {
    actionPlanSignals: number;
    plansWithTaskStartedSignals: number;
    plansWithTaskCompletedSignals: number;
    blockedTaskSignals: number;
  };
  monetization: {
    freeUsers: number;
    paidUsers: number;
    trialingUsers: number;
    limitHitUsers: number;
    upgrades: number;
  };
  friction: {
    limitHitRate: number;
    emptyConversations: number;
    stalledConversations: number;
  };
  trends: TrendPoint[];
};

function windowStart(window: AdminTimeWindow): Date | null {
  if (window === "all") return null;
  return subDays(new Date(), window === "7d" ? 7 : 30);
}

function keywordRegex(words: string[]) {
  return new RegExp(
    `\\b(${words
      .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|")})\\b`,
    "i"
  );
}

function pct(num: number, den: number) {
  if (!den) return 0;
  return Number(((num / den) * 100).toFixed(1));
}

function dateLabelFor(point: Date) {
  return `${point.getUTCMonth() + 1}/${point.getUTCDate()}`;
}

function isPaidUser(profile: ProfileRow) {
  return profile.subscription_status === "active" || Boolean(profile.is_premium);
}

export async function getAdminDashboardMetrics(
  window: AdminTimeWindow
): Promise<AdminDashboardMetrics> {
  const admin = createAdminClient();
  const start = windowStart(window);
  const startIso = start?.toISOString();

  let profilesQuery = admin
    .from("profiles")
    .select(
      "id, created_at, onboarding_complete, is_premium, subscription_status, trial_active, daily_credit_limit, daily_credits_used"
    );

  let conversationsQuery = admin
    .from("conversations")
    .select("id, user_id, created_at, updated_at");

  let messagesQuery = admin
    .from("messages")
    .select("conversation_id, role, content, created_at");

  if (startIso) {
    profilesQuery = profilesQuery.gte("created_at", startIso);
    conversationsQuery = conversationsQuery.gte("created_at", startIso);
    messagesQuery = messagesQuery.gte("created_at", startIso);
  }

  const [{ data: profiles = [] }, { data: conversations = [] }, { data: messages = [] }] =
    await Promise.all([profilesQuery, conversationsQuery, messagesQuery]);

  const profileRows = profiles as ProfileRow[];
  const conversationRows = conversations as ConversationRow[];
  const messageRows = messages as MessageRow[];

  const totalSignups = profileRows.length;
  const onboardingComplete = profileRows.filter((p) => Boolean(p.onboarding_complete)).length;

  const convoUserSet = new Set(conversationRows.map((c) => c.user_id));
  const activatedUsers = convoUserSet.size;

  const userMessages = messageRows.filter((m) => m.role === "user");
  const actionPlanRegex = keywordRegex(["action plan", "execution plan", "next steps", "roadmap"]);
  const taskStartRegex = keywordRegex(["start task", "task started", "begin task", "working on"]);
  const taskCompleteRegex = keywordRegex(["task completed", "done", "shipped", "finished"]);
  const blockedRegex = keywordRegex(["blocked", "stuck", "obstacle", "issue"]);
  const weeklyReviewRegex = keywordRegex(["weekly review", "week in review"]);
  const boardReviewRegex = keywordRegex(["board review", "advisor review", "investor review"]);

  const actionPlanSignals = userMessages.filter((m) => actionPlanRegex.test(m.content ?? "")).length;
  const plansWithTaskStartedSignals = userMessages.filter((m) => taskStartRegex.test(m.content ?? "")).length;
  const taskCompletionSignals = userMessages.filter((m) => taskCompleteRegex.test(m.content ?? "")).length;
  const blockedTaskSignals = userMessages.filter((m) => blockedRegex.test(m.content ?? "")).length;
  const weeklyReviewSignals = userMessages.filter((m) => weeklyReviewRegex.test(m.content ?? "")).length;
  const boardReviewSignals = userMessages.filter((m) => boardReviewRegex.test(m.content ?? "")).length;

  const activePaidSubscriptions = profileRows.filter(isPaidUser).length;
  const trialingUsers = profileRows.filter((p) => Boolean(p.trial_active)).length;
  const limitHitUsers = profileRows.filter(
    (p) => !p.is_premium && Number(p.daily_credits_used ?? 0) >= Number(p.daily_credit_limit ?? 0)
  ).length;

  const freeUsers = profileRows.filter((p) => !isPaidUser(p)).length;
  const upgrades = activePaidSubscriptions;

  const returningUsers = Array.from(
    conversationRows
      .reduce((acc: Map<string, number>, c) => {
        acc.set(c.user_id, (acc.get(c.user_id) ?? 0) + 1);
        return acc;
      }, new Map<string, number>())
      .values()
  ).filter((count) => count > 1).length;

  const resumedConversations = conversationRows.filter((c) => {
    if (!c.created_at || !c.updated_at) return false;
    const created = new Date(c.created_at).getTime();
    const updated = new Date(c.updated_at).getTime();
    return updated - created > 60 * 60 * 1000;
  }).length;

  const emptyConversations = conversationRows.filter(
    (c) => !messageRows.some((m) => m.conversation_id === c.id)
  ).length;
  const stalledConversations = conversationRows.filter((c) => {
    const convoMessages = messageRows.filter((m) => m.conversation_id === c.id);
    return convoMessages.length === 1 && convoMessages[0]?.role === "user";
  }).length;

  const trendDays = window === "7d" ? 7 : 30;
  const trendStart = window === "all" ? subDays(new Date(), 30) : (start as Date);
  const trendBuckets = Array.from({ length: trendDays }).map((_, index) => {
    const day = subDays(new Date(), trendDays - index - 1);
    return {
      date: day,
      label: dateLabelFor(day),
      signups: 0,
      mentorConversations: 0,
      mentorMessages: 0,
      paidUsers: 0,
    };
  });

  const findBucket = (isoDate?: string | null) => {
    if (!isoDate) return null;
    const d = new Date(isoDate);
    if (d < trendStart) return null;
    const label = dateLabelFor(d);
    return trendBuckets.find((b) => b.label === label) ?? null;
  };

  for (const p of profileRows) {
    const bucket = findBucket(p.created_at);
    if (!bucket) continue;
    bucket.signups += 1;
    if (isPaidUser(p)) bucket.paidUsers += 1;
  }

  for (const c of conversationRows) {
    const bucket = findBucket(c.created_at);
    if (bucket) bucket.mentorConversations += 1;
  }

  for (const m of messageRows) {
    if (m.role !== "user") continue;
    const bucket = findBucket(m.created_at);
    if (bucket) bucket.mentorMessages += 1;
  }

  return {
    window,
    rangeStart: startIso ?? null,
    totals: {
      totalSignups,
      onboardingCompletionRate: pct(onboardingComplete, totalSignups),
      activatedUsers,
      actionPlanSignals,
      taskCompletionSignals,
      boardReviewSignals,
      activePaidSubscriptions,
      upgradeConversionRate: pct(activePaidSubscriptions, totalSignups),
    },
    funnels: {
      onboardingToMentor: [
        { label: "Signups", value: totalSignups },
        { label: "Onboarding complete", value: onboardingComplete },
        { label: "Reached mentor", value: activatedUsers },
      ],
      mentorToExecution: [
        { label: "Mentor messages", value: userMessages.length },
        { label: "Action plan signals", value: actionPlanSignals },
        { label: "Task completion signals", value: taskCompletionSignals },
      ],
      limitToUpgrade: [
        { label: "Users at limit", value: limitHitUsers },
        { label: "Upgraded users", value: upgrades },
      ],
    },
    engagement: {
      mentorConversationsStarted: conversationRows.length,
      mentorMessagesSent: userMessages.length,
      returningUsers,
      resumedConversations,
      weeklyReviewSignals,
      boardReviewSignals,
    },
    execution: {
      actionPlanSignals,
      plansWithTaskStartedSignals,
      plansWithTaskCompletedSignals: taskCompletionSignals,
      blockedTaskSignals,
    },
    monetization: {
      freeUsers,
      paidUsers: activePaidSubscriptions,
      trialingUsers,
      limitHitUsers,
      upgrades,
    },
    friction: {
      limitHitRate: pct(limitHitUsers, totalSignups),
      emptyConversations,
      stalledConversations,
    },
    trends: trendBuckets.map(({ label, signups, mentorConversations, mentorMessages, paidUsers }) => ({
      label,
      signups,
      mentorConversations,
      mentorMessages,
      paidUsers,
    })),
  };
}
