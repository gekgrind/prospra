import {
  getAllEcosystemAppUrls,
  getEcosystemSiteUrl,
} from "@/lib/config/ecosystem";

export const APP_HOME_PATH = "/dashboard";
export const LOGIN_PATH = "/login";
export const SIGNUP_PATH = "/sign-up";
export const LOGOUT_PATH = "/logout";
export const FORGOT_PASSWORD_PATH = "/reset-password";
export const UPDATE_PASSWORD_PATH = "/update-password";
export const VERIFY_EMAIL_PATH = "/verify-email";
export const ONBOARDING_PATH = "/onboarding";

type SearchParamValue = string | string[] | undefined;

function getTrustedAuthOrigins() {
  return new Set(
    [getEcosystemSiteUrl(), ...Object.values(getAllEcosystemAppUrls())]
      .filter(Boolean)
      .map((url) => new URL(url as string).origin)
  );
}

function sanitizeNextTarget(next?: string | null) {
  if (!next) {
    return APP_HOME_PATH;
  }

  if (next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }

  try {
    const url = new URL(next);

    if (getTrustedAuthOrigins().has(url.origin)) {
      return url.toString();
    }
  } catch {
    // Fall through to the default app home target.
  }

  return APP_HOME_PATH;
}

function buildPathWithQuery(
  path: string,
  params?: Record<string, SearchParamValue>
) {
  const searchParams = new URLSearchParams();

  if (params) {
    for (const [key, rawValue] of Object.entries(params)) {
      const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;

      if (!value) {
        continue;
      }

      searchParams.set(
        key,
        key === "next" ? sanitizeNextTarget(value) : value
      );
    }
  }

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

export function buildSharedAuthHref(
  path: string,
  params?: Record<string, SearchParamValue>
) {
  const relativePath = buildPathWithQuery(path, params);
  const baseUrl = getEcosystemSiteUrl();

  if (!baseUrl) {
    return relativePath;
  }

  return new URL(relativePath, baseUrl).toString();
}

export function buildLoginRedirectPath(nextPath: string) {
  return buildPathWithQuery(LOGIN_PATH, {
    next: sanitizeNextTarget(nextPath),
  });
}

export function buildSharedLoginHref(next?: string | null) {
  return buildSharedAuthHref(LOGIN_PATH, {
    next: sanitizeNextTarget(next),
  });
}

export function buildSharedSignupHref(next?: string | null) {
  return buildSharedAuthHref(SIGNUP_PATH, {
    next: sanitizeNextTarget(next),
  });
}

export function buildSharedLogoutHref(next?: string | null) {
  return buildSharedAuthHref(LOGOUT_PATH, next ? { next } : undefined);
}

export function buildSharedForgotPasswordHref() {
  return buildSharedAuthHref(FORGOT_PASSWORD_PATH);
}

export function buildSharedVerifyEmailHref() {
  return buildSharedAuthHref(VERIFY_EMAIL_PATH);
}

export function getPostAuthRedirectPath(
  onboardingComplete: boolean,
  nextPath?: string | null
) {
  if (!onboardingComplete) {
    return ONBOARDING_PATH;
  }

  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return APP_HOME_PATH;
  }

  if (nextPath.startsWith("/auth") || nextPath === ONBOARDING_PATH) {
    return APP_HOME_PATH;
  }

  return nextPath;
}
