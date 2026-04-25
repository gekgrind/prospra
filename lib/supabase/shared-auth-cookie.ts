import type { CookieOptions, CookieOptionsWithName } from "@supabase/ssr";
import { getEcosystemCookieDomain } from "@/lib/config/ecosystem";

export const SHARED_AUTH_COOKIE_NAME = "entrepreneuria-auth-token";

export function getSharedAuthCookieOptions(): CookieOptionsWithName {
  return {
    name: SHARED_AUTH_COOKIE_NAME,
    domain: getEcosystemCookieDomain(),
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  };
}

export function applySharedAuthCookieOptions(
  options: CookieOptions = {}
): CookieOptions {
  const sharedOptions = getSharedAuthCookieOptions();

  return {
    ...options,
    domain: sharedOptions.domain,
    path: sharedOptions.path,
    sameSite: sharedOptions.sameSite,
    secure: sharedOptions.secure,
  };
}
