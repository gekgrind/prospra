import type { BillingProfile, SharedProfile } from "@/lib/identity/profile";

const PREMIUM_PLAN_TIERS = new Set(["premium", "pro", "founder", "team", "enterprise"]);
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

export function isPremiumProfile(profile: BillingProfile | null | undefined): boolean {
  if (!profile) return false;
  if (profile.is_premium) return true;

  const tier = (profile.plan_tier ?? "free").toLowerCase();
  const status = (profile.subscription_status ?? "").toLowerCase();

  return PREMIUM_PLAN_TIERS.has(tier) && ACTIVE_SUBSCRIPTION_STATUSES.has(status);
}

export function hasAppAccess(profile: SharedProfile | null | undefined, app: "prospra" | "synceri"): boolean {
  if (!profile) return false;
  if (isPremiumProfile(profile)) return true;

  return app === "prospra" ? profile.has_prospra_access : profile.has_synceri_access;
}
