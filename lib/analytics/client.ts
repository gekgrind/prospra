"use client";

import { track } from "@vercel/analytics";
import type { AnalyticsEventName, AnalyticsProperties } from "./events";

const ANON_KEY = "prospra_analytics_anon_id";

function safeProperties(properties?: AnalyticsProperties) {
  if (!properties) return undefined;

  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined)
  ) as Record<string, string | number | boolean | null>;
}

export function getAnalyticsAnonymousId() {
  if (typeof window === "undefined") return null;

  try {
    const existing = window.localStorage.getItem(ANON_KEY);
    if (existing) return existing;

    const generated = crypto.randomUUID();
    window.localStorage.setItem(ANON_KEY, generated);
    return generated;
  } catch {
    return null;
  }
}

export function trackClientEvent(
  eventName: AnalyticsEventName,
  properties?: AnalyticsProperties
) {
  try {
    track(eventName, safeProperties(properties));
  } catch {
    // Analytics is non-blocking and must never break product behavior.
  }
}