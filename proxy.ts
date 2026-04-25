import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { buildSharedLoginHref } from "@/lib/auth/redirects";
import { getSupabaseProjectConfig } from "@/lib/config/ecosystem";
import {
  applySharedAuthCookieOptions,
  getSharedAuthCookieOptions,
} from "@/lib/supabase/shared-auth-cookie";

const LOGIN_PATH = "/login";
const SIGN_UP_PATH = "/sign-up";
const ONBOARDING_PATH = "/onboarding";
const APP_HOME_PATH = "/dashboard";

const PUBLIC_PATHS = new Set([
  "/",
  LOGIN_PATH,
  SIGN_UP_PATH,
]);

const PUBLIC_PATH_PREFIXES = [
  "/api",
  "/_next",
];

const PROTECTED_PATH_PREFIXES = [
  "/dashboard",
  "/account",
  "/chat",
  "/documents",
  "/feedback",
  "/journal",
  "/mentor",
  "/onboarding",
  "/profile",
  "/settings",
  "/upgrade",
];

function buildLoginRedirectUrl(request: NextRequest) {
  return buildSharedLoginHref(request.nextUrl.href);
}

function isStaticAsset(pathname: string) {
  return /\.[a-zA-Z0-9]+$/.test(pathname) && !pathname.endsWith(".html");
}

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) {
    return true;
  }

  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isAuthPage(pathname: string) {
  return pathname === LOGIN_PATH || pathname === SIGN_UP_PATH;
}

function isProtectedPath(pathname: string) {
  return PROTECTED_PATH_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isMissingSessionError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const maybeError = error as { name?: string; message?: string };

  return (
    maybeError.name === "AuthSessionMissingError" ||
    maybeError.message?.toLowerCase().includes("auth session missing") === true
  );
}

async function getOnboardingComplete(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("onboarding_complete")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[PROXY_ONBOARDING_FETCH_ERROR]", error);
    return false;
  }

  const profile = data as { onboarding_complete?: boolean | null } | null;
  return Boolean(profile?.onboarding_complete);
}

export async function proxy(request: NextRequest) {
  const { url, anonKey } = getSupabaseProjectConfig();

  let response = NextResponse.next({ request });

  const { pathname } = request.nextUrl;

  if (isStaticAsset(pathname) || isPublicPath(pathname)) {
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookieOptions: getSharedAuthCookieOptions(),
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(
            name,
            value,
            applySharedAuthCookieOptions(options)
          );
        });
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError && !isMissingSessionError(userError)) {
    console.error("[PROXY_AUTH_GET_USER_ERROR]", userError);
  }

  if (user && isAuthPage(pathname)) {
    return NextResponse.redirect(new URL(APP_HOME_PATH, request.url));
  }

  if (!user && isProtectedPath(pathname)) {
    return NextResponse.redirect(
      new URL(buildLoginRedirectUrl(request), request.url)
    );
  }

  if (user && pathname === ONBOARDING_PATH) {
    const onboardingComplete = await getOnboardingComplete(supabase, user.id);

    if (onboardingComplete) {
      return NextResponse.redirect(new URL(APP_HOME_PATH, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};
