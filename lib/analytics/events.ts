"use client";

export type AnalyticsPropertyValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export type AnalyticsProperties = Record<
  string,
  AnalyticsPropertyValue
>;

export const ANALYTICS_EVENTS = {
  // Onboarding
  ONBOARDING_STARTED: "onboarding_started",
  ONBOARDING_STEP_VIEWED: "onboarding_step_viewed",
  ONBOARDING_STEP_COMPLETED: "onboarding_step_completed",
  ONBOARDING_STEP_SAVED: "onboarding_step_saved",
  ONBOARDING_STEP_SAVE_FAILED: "onboarding_step_save_failed",
  ONBOARDING_COMPLETED: "onboarding_completed",
  ONBOARDING_COMPLETION_FAILED: "onboarding_completion_failed",

  // Auth
  AUTH_LOGIN_STARTED: "auth_login_started",
  AUTH_LOGIN_FAILED: "auth_login_failed",
  AUTH_LOGIN_COMPLETED: "auth_login_completed",
  AUTH_SIGNUP_STARTED: "auth_signup_started",
  AUTH_SIGNUP_FAILED: "auth_signup_failed",
  AUTH_SIGNUP_COMPLETED: "auth_signup_completed",

  // Chat / Mentor
  USAGE_LIMIT_REACHED: "usage_limit_reached",
  MENTOR_RESPONSE_FAILED: "mentor_response_failed",

  // Dashboard
  DASHBOARD_VIEWED: "dashboard_viewed",
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];