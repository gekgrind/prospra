export type UsageType = "mentor_message" | "board_review";
export type PlanTier = "free" | "premium";

type LimitConfig = {
  monthly: number | null;
};

type PlanConfig = Record<UsageType, LimitConfig>;

const PLAN_LIMITS: Record<PlanTier, PlanConfig> = {
  free: {
    mentor_message: { monthly: 120 },
    board_review: { monthly: 1 },
  },
  premium: {
    mentor_message: { monthly: null },
    board_review: { monthly: 20 },
  },
};

function getMonthWindow(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function getUserPlan(supabase: any, userId: string): Promise<PlanTier> {
  const { data, error } = await supabase
    .from("profiles")
    .select("is_premium, plan_tier, subscription_status")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("PLAN_LOOKUP_ERROR", error);
    return "free";
  }

  const rawTier = (data?.plan_tier ?? "free").toLowerCase();
  const hasActiveSub = data?.subscription_status === "active";
  const isPremium = Boolean(data?.is_premium) || hasActiveSub || rawTier === "premium" || rawTier === "pro";

  return isPremium ? "premium" : "free";
}

export async function getMonthlyUsage(supabase: any, userId: string, usageType: UsageType) {
  const { start, end } = getMonthWindow();

  const { data, error } = await supabase
    .from("usage_events")
    .select("amount")
    .eq("user_id", userId)
    .eq("usage_type", usageType)
    .gte("created_at", start)
    .lt("created_at", end);

  if (error) {
    console.error("USAGE_QUERY_ERROR", { usageType, error });
    return { used: 0, errored: true };
  }

  const used = (data ?? []).reduce((sum: number, row: { amount?: number | null }) => {
    return sum + (row.amount ?? 1);
  }, 0);

  return { used, errored: false };
}

export async function getUsageSnapshot(supabase: any, userId: string) {
  const plan = await getUserPlan(supabase, userId);

  const [mentorUsage, boardUsage] = await Promise.all([
    getMonthlyUsage(supabase, userId, "mentor_message"),
    getMonthlyUsage(supabase, userId, "board_review"),
  ]);

  const mentorLimit = PLAN_LIMITS[plan].mentor_message.monthly;
  const boardLimit = PLAN_LIMITS[plan].board_review.monthly;

  return {
    plan,
    limits: {
      mentor_message: mentorLimit,
      board_review: boardLimit,
    },
    usage: {
      mentor_message: mentorUsage.used,
      board_review: boardUsage.used,
    },
    sourceErrors: {
      mentor_message: mentorUsage.errored,
      board_review: boardUsage.errored,
    },
  };
}

export async function enforceUsageLimit(supabase: any, userId: string, usageType: UsageType) {
  const plan = await getUserPlan(supabase, userId);
  const limit = PLAN_LIMITS[plan][usageType].monthly;

  if (limit === null) {
    return { allowed: true, plan, used: 0, limit: null as number | null, remaining: null as number | null };
  }

  const { used, errored } = await getMonthlyUsage(supabase, userId, usageType);

  if (errored) {
    return { allowed: false, plan, used, limit, remaining: 0, reason: "usage_unavailable" as const };
  }

  const remaining = Math.max(0, limit - used);

  if (remaining <= 0) {
    return { allowed: false, plan, used, limit, remaining, reason: "limit_reached" as const };
  }

  return { allowed: true, plan, used, limit, remaining };
}

export async function recordUsageEvent(
  supabase: any,
  userId: string,
  usageType: UsageType,
  amount = 1,
  metadata: Record<string, unknown> = {}
) {
  const { error } = await supabase.from("usage_events").insert({
    user_id: userId,
    usage_type: usageType,
    amount,
    metadata,
  });

  if (error) {
    console.error("USAGE_RECORD_ERROR", { usageType, error });
    return { success: false };
  }

  return { success: true };
}
