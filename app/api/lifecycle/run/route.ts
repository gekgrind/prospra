import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendLifecycleEmail } from "@/lib/email/lifecycle";

type LifecycleProfile = {
  id: string;
  email: string;
  name?: string | null;
  full_name?: string | null;
  onboarding_complete?: boolean | null;
  created_at?: string | null;
  plan_tier?: string | null;
  notification_preferences?: {
    product_updates?: boolean;
    weekly_summary?: boolean;
  } | null;
};

type JournalEntryLite = {
  user_id: string;
  entry_date: string | null;
};

function hasCronAuth(request: NextRequest) {
  const expected = process.env.LIFECYCLE_CRON_SECRET;
  if (!expected) return false;

  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.replace(/^Bearer\s+/i, "").trim();
  return bearer === expected;
}

function pickFirstName(profile: LifecycleProfile) {
  return profile.name ?? profile.full_name ?? profile.email.split("@")[0];
}

export async function POST(request: NextRequest) {
  if (!hasCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const onboardingCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const momentumCutoff = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const weeklyCutoff = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [profilesRes, journalRes] = await Promise.all([
    admin
      .from("profiles")
      .select("id, email, name, full_name, onboarding_complete, created_at, plan_tier, notification_preferences")
      .not("email", "is", null)
      .limit(300),
    admin
      .from("journal_entries")
      .select("user_id, entry_date")
      .order("entry_date", { ascending: false })
      .limit(4000),
  ]);

  if (profilesRes.error) {
    console.error("Lifecycle run profile fetch failed", profilesRes.error);
    return NextResponse.json({ error: "Profile fetch failed" }, { status: 500 });
  }

  if (journalRes.error) {
    console.error("Lifecycle run journal fetch failed", journalRes.error);
    return NextResponse.json({ error: "Journal fetch failed" }, { status: 500 });
  }

  const profiles = (profilesRes.data ?? []) as LifecycleProfile[];
  const entries = (journalRes.data ?? []) as JournalEntryLite[];

  const entriesByUser = new Map<string, string[]>();
  for (const entry of entries) {
    if (!entry.entry_date) continue;
    const existing = entriesByUser.get(entry.user_id) ?? [];
    existing.push(entry.entry_date);
    entriesByUser.set(entry.user_id, existing);
  }

  const summary = {
    onboardingReminderEvaluated: 0,
    onboardingReminderSent: 0,
    weeklyEvaluated: 0,
    weeklySent: 0,
    momentumEvaluated: 0,
    momentumSent: 0,
    failed: 0,
  };

  for (const profile of profiles) {
    const userEntries = entriesByUser.get(profile.id) ?? [];
    const firstName = pickFirstName(profile);

    if (!profile.onboarding_complete && (profile.created_at ?? "") <= onboardingCutoff) {
      summary.onboardingReminderEvaluated += 1;
      const result = await sendLifecycleEmail({
        type: "onboarding_reminder",
        recipient: { userId: profile.id, email: profile.email, firstName, planTier: profile.plan_tier },
        payload: {
          firstName,
          ctaLabel: "Continue onboarding",
          ctaUrl: "/onboarding",
        },
        dedupeWindowHours: 24 * 21,
        triggerContext: {
          source: "lifecycle_cron",
          trigger: "onboarding_incomplete_24h",
        },
        respectProductUpdatesPreference: true,
      });

      if (result.ok) summary.onboardingReminderSent += 1;
      if (!result.ok && !result.skipped) summary.failed += 1;
      continue;
    }

    if (!profile.onboarding_complete) {
      continue;
    }

    const latestEntry = userEntries[0];
    const hasRecentWeekEntries = userEntries.some((entryDate) => entryDate >= weeklyCutoff);

    if (hasRecentWeekEntries) {
      summary.weeklyEvaluated += 1;
      const result = await sendLifecycleEmail({
        type: "weekly_review_ready",
        recipient: { userId: profile.id, email: profile.email, firstName, planTier: profile.plan_tier },
        payload: {
          firstName,
          ctaLabel: "Open weekly recap",
          ctaUrl: "/journal",
          summary: "You have enough reflections this week to spot patterns and lock your next 3 priorities.",
        },
        dedupeWindowHours: 24 * 6,
        triggerContext: {
          source: "lifecycle_cron",
          trigger: "weekly_review_available",
          last_entry_date: latestEntry,
        },
        respectWeeklySummaryPreference: true,
      });

      if (result.ok) summary.weeklySent += 1;
      if (!result.ok && !result.skipped) summary.failed += 1;
      continue;
    }

    if (latestEntry && latestEntry <= momentumCutoff) {
      summary.momentumEvaluated += 1;
      const result = await sendLifecycleEmail({
        type: "momentum_nudge",
        recipient: { userId: profile.id, email: profile.email, firstName, planTier: profile.plan_tier },
        payload: {
          firstName,
          ctaLabel: "Pick your next move",
          ctaUrl: "/dashboard",
          triggerDetail: "No recent journal activity in the last few days.",
        },
        dedupeWindowHours: 24 * 7,
        triggerContext: {
          source: "lifecycle_cron",
          trigger: "activity_stalled",
          last_entry_date: latestEntry,
        },
        respectProductUpdatesPreference: true,
      });

      if (result.ok) summary.momentumSent += 1;
      if (!result.ok && !result.skipped) summary.failed += 1;
    }
  }

  return NextResponse.json({ ok: true, summary }, { status: 200 });
}
