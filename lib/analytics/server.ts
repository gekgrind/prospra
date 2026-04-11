import { track } from "@vercel/analytics/server";
import type { AnalyticsEventName, AnalyticsProperties } from "./events";

function safeProperties(properties?: AnalyticsProperties) {
  if (!properties) return undefined;

  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined)
  ) as Record<string, string | number | boolean | null>;
}

export async function trackServerEvent(
  eventName: AnalyticsEventName,
  properties?: AnalyticsProperties
) {
  try {
    await track(eventName, safeProperties(properties));
  } catch {
    // Analytics is non-blocking and must never break product behavior.
  }
}