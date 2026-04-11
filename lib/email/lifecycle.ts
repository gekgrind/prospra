import { createAdminClient } from "@/lib/supabase/admin";
import { buildLifecycleEmailTemplate } from "@/lib/email/templates";
import type { SendLifecycleEmailInput } from "@/lib/email/types";

const RESEND_API_URL = "https://api.resend.com/emails";

type ProfilePrefs = {
  plan_tier?: string | null;
  notification_preferences?: {
    product_updates?: boolean;
    weekly_summary?: boolean;
  } | null;
};

function getAppBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

async function insertEmailEvent(event: {
  user_id: string;
  email_type: string;
  status: "sent" | "failed" | "skipped";
  related_entity_id?: string | null;
  provider_message_id?: string | null;
  trigger_context?: Record<string, unknown>;
  error_message?: string | null;
}) {
  try {
    const admin = createAdminClient();
    await admin.from("email_events").insert(event);
  } catch (error) {
    console.error("email_events insert failed", error);
  }
}

async function wasRecentlySent(input: {
  userId: string;
  type: string;
  dedupeWindowHours: number;
  relatedEntityId?: string | null;
}) {
  const admin = createAdminClient();
  const since = new Date(Date.now() - input.dedupeWindowHours * 60 * 60 * 1000).toISOString();

  let query = admin
    .from("email_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", input.userId)
    .eq("email_type", input.type)
    .eq("status", "sent")
    .gte("sent_at", since);

  if (input.relatedEntityId) {
    query = query.eq("related_entity_id", input.relatedEntityId);
  }

  const { count, error } = await query;
  if (error) {
    console.error("email dedupe query failed", error);
    return false;
  }

  return (count ?? 0) > 0;
}

async function canSendForPreferences(input: {
  userId: string;
  respectProductUpdatesPreference?: boolean;
  respectWeeklySummaryPreference?: boolean;
}) {
  if (!input.respectProductUpdatesPreference && !input.respectWeeklySummaryPreference) {
    return true;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("notification_preferences")
    .eq("id", input.userId)
    .single();

  const typedData = data as ProfilePrefs | null;
  if (error || !typedData) {
    return true;
  }

  if (input.respectWeeklySummaryPreference) {
    return typedData.notification_preferences?.weekly_summary ?? true;
  }

  if (input.respectProductUpdatesPreference) {
    return typedData.notification_preferences?.product_updates ?? true;
  }

  return true;
}

async function sendViaResend(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    throw new Error("Missing RESEND_API_KEY or RESEND_FROM_EMAIL.");
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body?.message ?? "Resend send failed.");
  }

  return body?.id as string | undefined;
}

export async function sendLifecycleEmail(input: SendLifecycleEmailInput) {
  const shouldSend = await canSendForPreferences({
    userId: input.recipient.userId,
    respectProductUpdatesPreference: input.respectProductUpdatesPreference,
    respectWeeklySummaryPreference: input.respectWeeklySummaryPreference,
  });

  if (!shouldSend) {
    await insertEmailEvent({
      user_id: input.recipient.userId,
      email_type: input.type,
      status: "skipped",
      related_entity_id: input.relatedEntityId,
      trigger_context: {
        ...input.triggerContext,
        reason: "preference_opt_out",
      },
    });
    return { ok: false, skipped: true };
  }

  const duplicate = await wasRecentlySent({
    userId: input.recipient.userId,
    type: input.type,
    dedupeWindowHours: input.dedupeWindowHours,
    relatedEntityId: input.relatedEntityId,
  });

  if (duplicate) {
    await insertEmailEvent({
      user_id: input.recipient.userId,
      email_type: input.type,
      status: "skipped",
      related_entity_id: input.relatedEntityId,
      trigger_context: {
        ...input.triggerContext,
        reason: "dedupe_window",
      },
    });
    return { ok: false, skipped: true };
  }

  const template = buildLifecycleEmailTemplate(input.type, {
    ...input.payload,
    ctaUrl: input.payload.ctaUrl.startsWith("http")
      ? input.payload.ctaUrl
      : `${getAppBaseUrl()}${input.payload.ctaUrl}`,
  });

  try {
    const providerMessageId = await sendViaResend({
      to: input.recipient.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    await insertEmailEvent({
      user_id: input.recipient.userId,
      email_type: input.type,
      status: "sent",
      related_entity_id: input.relatedEntityId,
      provider_message_id: providerMessageId,
      trigger_context: input.triggerContext,
    });

    return { ok: true, providerMessageId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown send failure.";
    await insertEmailEvent({
      user_id: input.recipient.userId,
      email_type: input.type,
      status: "failed",
      related_entity_id: input.relatedEntityId,
      error_message: message,
      trigger_context: input.triggerContext,
    });

    return { ok: false, error: message };
  }
}
