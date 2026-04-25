"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildSharedForgotPasswordHref,
  buildSharedLoginHref,
} from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type SettingsState = {
  fullName: string;
  industry: string;
  experienceLevel: string;
  businessIdea: string;
  stage: string;
  audience: string;
  offer: string;
  goal90: string;
  challenge: string;
  coachStyle: "direct" | "supportive" | "hype";
  coachFocus: "strategy" | "systems" | "marketing" | "mindset";
  weeklyDigest: boolean;
  productUpdates: boolean;
  investorUpdates: boolean;
};

type ProfileRow = {
  full_name?: string | null;
  industry?: string | null;
  experience_level?: string | null;
  business_idea?: string | null;
  stage?: string | null;
  audience?: string | null;
  offer?: string | null;
  goal90?: string | null;
  challenge?: string | null;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  if (error && typeof error === "object") {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string") return maybeMessage;
    try {
      return JSON.stringify(error);
    } catch {
      return "Unknown error";
    }
  }

  return "Unknown error";
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const [state, setState] = useState<SettingsState>({
    fullName: "",
    industry: "",
    experienceLevel: "",
    businessIdea: "",
    stage: "",
    audience: "",
    offer: "",
    goal90: "",
    challenge: "",
    coachStyle: "supportive",
    coachFocus: "strategy",
    weeklyDigest: true,
    productUpdates: true,
    investorUpdates: false,
  });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const supabase = createClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          window.location.assign(buildSharedLoginHref("/dashboard/settings"));
          return;
        }

        if (!mounted) return;

        setUserId(user.id);
        setEmail(user.email ?? "");

        // Safer query. If your DB columns for goal90/challenge do not exist,
        // remove them here until the schema is aligned.
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select(
            "full_name, industry, experience_level, business_idea, stage, audience, offer"
          )
          .eq("id", user.id)
          .maybeSingle<ProfileRow>();

        if (profileError) {
          console.error("[SETTINGS_PROFILE_LOAD_ERROR_FULL]", JSON.stringify(profileError, null, 2));
        }

        const meta =
          user.user_metadata && typeof user.user_metadata === "object"
            ? (user.user_metadata as Record<string, unknown>)
            : {};

        const savedSettings =
          meta.settings && typeof meta.settings === "object"
            ? (meta.settings as Partial<SettingsState>)
            : {};

        if (!mounted) return;

        setState((prev) => ({
          ...prev,
          fullName: profile?.full_name ?? prev.fullName,
          industry: profile?.industry ?? prev.industry,
          experienceLevel: profile?.experience_level ?? prev.experienceLevel,
          businessIdea: profile?.business_idea ?? prev.businessIdea,
          stage: profile?.stage ?? prev.stage,
          audience: profile?.audience ?? prev.audience,
          offer: profile?.offer ?? prev.offer,
          goal90:
            typeof savedSettings.goal90 === "string"
              ? savedSettings.goal90
              : prev.goal90,
          challenge:
            typeof savedSettings.challenge === "string"
              ? savedSettings.challenge
              : prev.challenge,
          coachStyle:
            savedSettings.coachStyle === "direct" ||
            savedSettings.coachStyle === "supportive" ||
            savedSettings.coachStyle === "hype"
              ? savedSettings.coachStyle
              : prev.coachStyle,
          coachFocus:
            savedSettings.coachFocus === "strategy" ||
            savedSettings.coachFocus === "systems" ||
            savedSettings.coachFocus === "marketing" ||
            savedSettings.coachFocus === "mindset"
              ? savedSettings.coachFocus
              : prev.coachFocus,
          weeklyDigest:
            typeof savedSettings.weeklyDigest === "boolean"
              ? savedSettings.weeklyDigest
              : prev.weeklyDigest,
          productUpdates:
            typeof savedSettings.productUpdates === "boolean"
              ? savedSettings.productUpdates
              : prev.productUpdates,
          investorUpdates:
            typeof savedSettings.investorUpdates === "boolean"
              ? savedSettings.investorUpdates
              : prev.investorUpdates,
        }));
      } catch (err: unknown) {
        console.error("[SETTINGS_LOAD_ERROR]", getErrorMessage(err), err);
        if (mounted) {
          setError("Something went wrong loading your settings.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const nameError = useMemo(() => {
    if (!state.fullName.trim()) return "Full name is required.";
    if (state.fullName.trim().length < 2) {
      return "Full name must be at least 2 characters.";
    }
    return null;
  }, [state.fullName]);

  const handleChange =
    (field: keyof SettingsState) =>
    (
      value:
        | string
        | boolean
        | React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
          >
    ) => {
      if (
        typeof value !== "string" &&
        typeof value !== "boolean" &&
        "target" in value
      ) {
        const target = value.target as
          | HTMLInputElement
          | HTMLTextAreaElement
          | HTMLSelectElement;

        const parsedValue =
          target instanceof HTMLInputElement && target.type === "checkbox"
            ? target.checked
            : target.value;

        setState((prev) => ({ ...prev, [field]: parsedValue as never }));
      } else {
        setState((prev) => ({ ...prev, [field]: value as never }));
      }

      setStatus(null);
      setError(null);
    };

  const handleSave = async () => {
    if (!userId || nameError) return;

    setSaving(true);
    setStatus(null);
    setError(null);

    try {
      const supabase = createClient();

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: state.fullName.trim(),
          industry: state.industry.trim() || null,
          experience_level: state.experienceLevel || null,
          business_idea: state.businessIdea.trim() || null,
          stage: state.stage || null,
          audience: state.audience.trim() || null,
          offer: state.offer.trim() || null,
          onboarding_complete: true,
        })
        .eq("id", userId);

      if (profileError) {
        throw profileError;
      }

      const { error: metaError } = await supabase.auth.updateUser({
        data: {
          settings: {
            goal90: state.goal90.trim(),
            challenge: state.challenge.trim(),
            coachStyle: state.coachStyle,
            coachFocus: state.coachFocus,
            weeklyDigest: state.weeklyDigest,
            productUpdates: state.productUpdates,
            investorUpdates: state.investorUpdates,
          },
        },
      });

      if (metaError) {
        throw metaError;
      }

      setStatus("Settings saved.");
    } catch (err: unknown) {
      console.error("[SETTINGS_SAVE_ERROR]", getErrorMessage(err), err);
      setError(getErrorMessage(err) || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign(buildSharedLoginHref());
  };

  if (loading) {
    return (
      <div className="max-w-4xl space-y-4">
        <div className="animate-pulse space-y-3">
          <div className="h-8 w-40 rounded-lg bg-slate-700/60" />
          <div className="h-4 w-72 rounded-lg bg-slate-700/40" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="mb-2 text-4xl font-bold text-white">
          Settings &amp; Preferences
        </h1>
        <p className="max-w-2xl text-xl text-slate-400">
          Manage your founder profile, onboarding preferences, account access,
          and communication settings.
        </p>
      </div>

      <Card className="border-slate-800 bg-slate-900/60 shadow-xl shadow-slate-950/40">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-white">
            <span>Profile</span>
            {email && (
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                {email}
              </span>
            )}
          </CardTitle>
          <CardDescription className="text-slate-400">
            Core details Prospra uses to personalize your dashboard and
            mentoring.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-slate-200">
              Full name
            </Label>
            <Input
              id="fullName"
              value={state.fullName}
              onChange={handleChange("fullName")}
              className="border-slate-700 bg-slate-900/80 text-white"
            />
            {nameError && <p className="text-xs text-rose-400">{nameError}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry" className="text-slate-200">
              Industry
            </Label>
            <Input
              id="industry"
              value={state.industry}
              onChange={handleChange("industry")}
              className="border-slate-700 bg-slate-900/80 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="experienceLevel" className="text-slate-200">
              Experience level
            </Label>
            <select
              id="experienceLevel"
              value={state.experienceLevel}
              onChange={handleChange("experienceLevel")}
              className="h-10 rounded-md border border-slate-700 bg-slate-900/80 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
            >
              <option value="">Select one</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="experienced">Experienced</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessIdea" className="text-slate-200">
              Business focus
            </Label>
            <Input
              id="businessIdea"
              value={state.businessIdea}
              onChange={handleChange("businessIdea")}
              className="border-slate-700 bg-slate-900/80 text-white"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900/60 shadow-lg shadow-slate-950/30">
        <CardHeader>
          <CardTitle className="text-white">Preferences</CardTitle>
          <CardDescription className="text-slate-400">
            Onboarding-derived preferences that shape Prospra guidance.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="stage" className="text-slate-200">
              Business stage
            </Label>
            <select
              id="stage"
              value={state.stage}
              onChange={handleChange("stage")}
              className="h-10 rounded-md border border-slate-700 bg-slate-900/80 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
            >
              <option value="">Select stage</option>
              <option value="idea">Idea</option>
              <option value="prelaunch">Pre-launch</option>
              <option value="early">Early traction</option>
              <option value="scaling">Scaling</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal90" className="text-slate-200">
              90-day goal
            </Label>
            <Input
              id="goal90"
              value={state.goal90}
              onChange={handleChange("goal90")}
              className="border-slate-700 bg-slate-900/80 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="audience" className="text-slate-200">
              Target audience
            </Label>
            <Input
              id="audience"
              value={state.audience}
              onChange={handleChange("audience")}
              className="border-slate-700 bg-slate-900/80 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="offer" className="text-slate-200">
              Primary offer
            </Label>
            <Input
              id="offer"
              value={state.offer}
              onChange={handleChange("offer")}
              className="border-slate-700 bg-slate-900/80 text-white"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="challenge" className="text-slate-200">
              Biggest challenge
            </Label>
            <Input
              id="challenge"
              value={state.challenge}
              onChange={handleChange("challenge")}
              className="border-slate-700 bg-slate-900/80 text-white"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900/60 shadow-lg shadow-slate-950/30">
        <CardHeader>
          <CardTitle className="text-white">Security &amp; account</CardTitle>
          <CardDescription className="text-slate-400">
            Manage password and active session controls.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row">
          <Button
            asChild
            className="bg-slate-800 text-slate-100 hover:bg-slate-700"
          >
            <a href={buildSharedForgotPasswordHref()}>Reset password</a>
          </Button>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="border-slate-600 text-slate-200"
          >
            Sign out
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 border-t border-slate-800 pt-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1 text-sm">
          {status && <p className="text-emerald-400">{status}</p>}
          {error && <p className="text-rose-400">{error}</p>}
          {!status && !error && (
            <p className="text-slate-500">
              Changes are saved to your profile and preferences.
            </p>
          )}
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !!nameError}
          className="bg-emerald-500 px-6 font-semibold text-slate-950 hover:bg-emerald-400"
        >
          {saving ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </div>
  );
}
