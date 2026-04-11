export const APP_HOME_PATH = "/dashboard";
export const LOGIN_PATH = "/login";
export const SIGNUP_PATH = "/sign-up";
export const FORGOT_PASSWORD_PATH = "/reset-password";
export const UPDATE_PASSWORD_PATH = "/update-password";
export const VERIFY_EMAIL_PATH = "/verify-email";
export const ONBOARDING_PATH = "/onboarding";

export function buildLoginRedirectPath(nextPath: string) {
  const encoded = encodeURIComponent(nextPath || APP_HOME_PATH);
  return `${LOGIN_PATH}?next=${encoded}`;
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
