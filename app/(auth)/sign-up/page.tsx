"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Lock, UserPlus, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import {
  getAnalyticsAnonymousId,
  trackClientEvent,
} from "@/lib/analytics/client";

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activateGate, setActivateGate] = useState(false);

  const nextPath = useMemo(() => searchParams.get("next"), [searchParams]);

  const redirectPath = useMemo(() => {
    if (!nextPath) return "/dashboard";
    return nextPath.startsWith("/") ? nextPath : "/dashboard";
  }, [nextPath]);

  const onboardingRedirectPath = useMemo(() => {
    if (
      redirectPath === "/onboarding" ||
      redirectPath.startsWith("/onboarding/")
    ) {
      return redirectPath;
    }

    return "/onboarding";
  }, [redirectPath]);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setActivateGate(true);

    const anonymous_id = getAnalyticsAnonymousId();
    const trimmedEmail = email.trim();

    trackClientEvent(ANALYTICS_EVENTS.AUTH_SIGNUP_STARTED, {
      anonymous_id,
    });

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      setLoading(false);
      setActivateGate(false);
      return;
    }

    const emailRedirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}${LOGIN_PATH_WITH_MESSAGE}`
        : undefined;

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: emailRedirectTo
        ? {
            emailRedirectTo,
          }
        : undefined,
    });

    if (signUpError) {
      trackClientEvent(ANALYTICS_EVENTS.AUTH_SIGNUP_FAILED, {
        anonymous_id,
        reason: signUpError.message.slice(0, 120),
      });

      setErrorMessage(signUpError.message);
      setLoading(false);
      setActivateGate(false);
      return;
    }

    const sessionUserId = data.session?.user?.id ?? data.user?.id ?? null;

    trackClientEvent(ANALYTICS_EVENTS.AUTH_SIGNUP_COMPLETED, {
      anonymous_id,
      user_id: sessionUserId,
    });

    if (data.session) {
      fetch("/api/lifecycle/welcome", {
        method: "POST",
        credentials: "include",
      }).catch(() => {});

      router.replace(onboardingRedirectPath);
      router.refresh();
      return;
    }

    setSuccessMessage(
      "Your account was created. Check your email to verify your address, then log in to continue."
    );
    setLoading(false);
    setActivateGate(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-brandNavyDark">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#06152b_0%,#041224_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(79,124,167,0.18),transparent_26%),radial-gradient(circle_at_85%_80%,rgba(210,122,44,0.10),transparent_24%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-15 [background-image:linear-gradient(rgba(79,124,167,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(79,124,167,0.08)_1px,transparent_1px)] [background-size:52px_52px]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
        <div className="relative w-full max-w-[760px]">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 sm:h-[820px] sm:w-[820px]">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="gate-spin-cw h-[420px] w-[420px] rounded-full border-[5px] border-transparent border-t-brandBlueLight border-r-brandBlueLight/70 shadow-[0_0_80px_rgba(0,212,255,0.12)] sm:h-[520px] sm:w-[520px] lg:h-[620px] lg:w-[620px]" />
            </div>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="gate-spin-ccw h-[340px] w-[340px] rounded-full border-[4px] border-transparent border-b-brandYellow border-l-brandYellow/70 shadow-[0_0_60px_rgba(255,229,33,0.14)] sm:h-[440px] sm:w-[440px] lg:h-[540px] lg:w-[540px]" />
            </div>

            {activateGate && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="gate-pulse h-[460px] w-[460px] rounded-full bg-brandYellow/12 blur-2xl sm:h-[560px] sm:w-[560px] lg:h-[660px] lg:w-[660px]" />
              </div>
            )}
          </div>

          <div className="relative z-10 mx-auto w-full max-w-md">
            <Card className="overflow-hidden rounded-[32px] border border-brandBlue/30 bg-[linear-gradient(180deg,rgba(5,19,38,0.88)_0%,rgba(4,16,32,0.94)_100%)] shadow-[0_20px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
              <CardHeader className="space-y-4 px-6 pb-2 pt-8 text-center sm:px-8">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brandYellow shadow-[0_10px_35px_rgba(255,229,33,0.35)]">
                  <UserPlus className="h-8 w-8 text-brandNavyDark" />
                </div>

                <div className="space-y-2">
                  <CardTitle className="text-3xl font-bold text-brandBlueLight sm:text-4xl">
                    Join Prospra
                  </CardTitle>

                  <CardDescription className="text-brandBlueLight/70">
                    Step through the portal and begin your journey.
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="px-6 pb-8 pt-4 sm:px-8">
                <form onSubmit={handleSignup} className="space-y-5">
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brandBlueLight/60" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      required
                      minLength={3}
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-14 pl-11"
                    />
                  </div>

                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brandBlueLight/60" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-14 pl-11 pr-12"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-brandBlueLight/70 transition hover:text-brandBlueLight"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {errorMessage && (
                    <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                      {errorMessage}
                    </div>
                  )}

                  {successMessage && (
                    <div className="rounded-xl border border-brandYellow/20 bg-brandYellow/10 px-4 py-3 text-sm text-brandYellowLight">
                      {successMessage}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-14 w-full bg-brandYellow font-semibold text-brandNavyDark hover:bg-brandYellowLight disabled:opacity-70"
                  >
                    {loading ? "Initializing Portal..." : "Create Account"}
                  </Button>

                  <div className="pt-2 text-center text-sm">
                    <p className="text-brandBlueLight/72">
                      Already have an account?{" "}
                      <Link
                        href="/login"
                        className="font-semibold text-brandYellow transition hover:text-brandYellowLight"
                      >
                        Log in
                      </Link>
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

const LOGIN_PATH_WITH_MESSAGE = "/login?message=check-email";