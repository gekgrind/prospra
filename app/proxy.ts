import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  // Start with a "pass-through" response
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set(name, value, options);
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set(name, "", {
            ...options,
            maxAge: 0,
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isApiRoute = pathname.startsWith("/api");

  const isLoggedIn = Boolean(user?.id);
  const isAuthPage = pathname.startsWith("/auth");
  const isLanding = pathname === "/";
  const isOnboarding = pathname === "/onboarding";
  const isProtectedPage = !isAuthPage && !isLanding && !isApiRoute && !isOnboarding;

  // 🔒 For API routes, don't do redirects – let the route handlers respond with 401/403/etc.
  if (isApiRoute) {
    return response;
  }

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect logged-out users away from protected pages
  if (!isLoggedIn && isProtectedPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Otherwise, just continue with updated cookies
  return response;
}
