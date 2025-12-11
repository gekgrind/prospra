"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  companyName: string;
  role: string;
  timezone: string;

  // VC / funding vibes
  fundingStage: string;
  targetRaise: string;
  runwayMonths: string;

  // AI coach preferences
  coachStyle: "direct" | "supportive" | "hype";
  coachFocus: "strategy" | "systems" | "marketing" | "mindset";

  // Notification prefs
  weeklyDigest: boolean;
  productUpdates: boolean;
  investorUpdates: boolean;
};

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);

  const [state, setState] = useState<SettingsState>({
    fullName: "",
    industry: "",
    experienceLevel: "",
    companyName: "",
    role: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",

    fundingStage: "",
    targetRaise: "",
    runwayMonths: "",

    coachStyle: "supportive",
    coachFocus: "strategy",

    weeklyDigest: true,
    productUpdates: true,
    investorUpdates: false,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error(userError);
        }

        if (!user) {
          router.push("/auth/login");
          return;
        }

        setUserId(user.id);
        setEmail(user.email ?? "");

        // Load profile row
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error(profileError);
        }

        // Pull any previous settings from user_metadata
        const meta = (user.user_metadata as any) || {};
        const savedSettings = (meta.settings as Partial<SettingsState>) || {};

        setState((prev) => ({
          ...prev,
          fullName: profile?.full_name ?? prev.fullName,
          industry: profile?.industry ?? prev.industry,
          experienceLevel: profile?.experience_level ?? prev.experienceLevel,
          companyName: profile?.company_name ?? prev.companyName,
          role: profile?.role ?? prev.role,
          timezone: profile?.timezone ?? prev.timezone,

          fundingStage: savedSettings.fundingStage ?? prev.fundingStage,
          targetRaise: savedSettings.targetRaise ?? prev.targetRaise,
          runwayMonths: savedSettings.runwayMonths ?? prev.runwayMonths,

          coachStyle: savedSettings.coachStyle ?? prev.coachStyle,
          coachFocus: savedSettings.coachFocus ?? prev.coachFocus,

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
      } catch (err) {
        console.error(err);
        setError("Something went wrong loading your settings.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  const handleChange =
    (field: keyof SettingsState) =>
    (value: string | boolean | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      if (
        typeof value !== "string" &&
        typeof value !== "boolean" &&
        "target" in value
      ) {
        const target = value.target as HTMLInputElement | HTMLSelectElement;
        const parsedValue =
          target.type === "checkbox"
            ? (target as HTMLInputElement).checked
            : target.value;
        setState((prev) => ({ ...prev, [field]: parsedValue }));
      } else {
        setState((prev) => ({ ...prev, [field]: value as any }));
      }
      setStatus(null);
      setError(null);
    };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    setStatus(null);
    setError(null);

    try {
      const supabase = createClient();

      // Update core profile info
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: state.fullName || null,
          industry: state.industry || null,
          experience_level: state.experienceLevel || null,
          company_name: state.companyName || null,
          role: state.role || null,
          timezone: state.timezone || null,
        })
        .eq("id", userId);

      if (profileError) {
        console.error(profileError);
        throw new Error("Could not update your profile details.");
      }

      // Store the richer settings in auth user metadata
      const { error: metaError } = await supabase.auth.updateUser({
        data: {
          settings: {
            fundingStage: state.fundingStage,
            targetRaise: state.targetRaise,
            runwayMonths: state.runwayMonths,
            coachStyle: state.coachStyle,
            coachFocus: state.coachFocus,
            weeklyDigest: state.weeklyDigest,
            productUpdates: state.productUpdates,
            investorUpdates: state.investorUpdates,
          },
        },
      });

      if (metaError) {
        console.error(metaError);
        throw new Error("Could not update your preferences.");
      }

      setStatus("Settings saved — your founder cockpit is updated. 🚀");
    } catch (err: any) {
      setError(err.message || "Something went wrong saving your settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <div className="animate-pulse space-y-3">
          <div className="h-8 w-40 bg-slate-700/60 rounded-lg" />
          <div className="h-4 w-72 bg-slate-700/40 rounded-lg" />
        </div>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <div className="h-5 w-32 bg-slate-800/60 rounded mb-2 animate-pulse" />
            <div className="h-3 w-48 bg-slate-800/40 rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-9 w-full bg-slate-800/60 rounded animate-pulse" />
            <div className="h-9 w-full bg-slate-800/60 rounded animate-pulse" />
            <div className="h-9 w-full bg-slate-800/60 rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300 mb-3">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          VC-Ready Founder Settings
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">
          Settings &amp; Preferences
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl">
          Tune Prospra to match your founder style, funding stage, and how often
          you want your AI coach in your ear.
        </p>
      </div>

      {/* Profile & account */}
      <Card className="bg-slate-900/60 border-slate-800 shadow-xl shadow-slate-950/40">
        <CardHeader>
          <CardTitle className="text-white flex flex-wrap items-center justify-between gap-2">
            <span>Account &amp; Profile</span>
            {email && (
              <span className="text-xs rounded-full bg-slate-800 px-3 py-1 text-slate-300">
                {email}
              </span>
            )}
          </CardTitle>
          <CardDescription className="text-slate-400">
            Core details Prospra uses to personalize your dashboard and advice.
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
              placeholder="Alex Founder"
              className="bg-slate-900/80 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-slate-200">
              Company / project name
            </Label>
            <Input
              id="companyName"
              value={state.companyName}
              onChange={handleChange("companyName")}
              placeholder="Prospra Labs"
              className="bg-slate-900/80 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-slate-200">
              Your role
            </Label>
            <Input
              id="role"
              value={state.role}
              onChange={handleChange("role")}
              placeholder="Founder & CEO"
              className="bg-slate-900/80 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry" className="text-slate-200">
              Industry
            </Label>
            <Input
              id="industry"
              value={state.industry}
              onChange={handleChange("industry")}
              placeholder="AI SaaS, e-commerce, creator tools..."
              className="bg-slate-900/80 border-slate-700 text-white"
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
              <option value="idea-stage">Idea stage - first venture</option>
              <option value="early-founder">Early founder (0–2 years)</option>
              <option value="serial-founder">Serial founder</option>
              <option value="operator">Operator shifting into founder</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone" className="text-slate-200">
              Time zone
            </Label>
            <Input
              id="timezone"
              value={state.timezone}
              onChange={handleChange("timezone")}
              placeholder="America/New_York"
              className="bg-slate-900/80 border-slate-700 text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Funding & runway */}
      <Card className="bg-slate-900/60 border-slate-800 shadow-lg shadow-slate-950/30">
        <CardHeader>
          <CardTitle className="text-white">Funding &amp; Runway</CardTitle>
          <CardDescription className="text-slate-400">
            Help Prospra reason like a VC partner who actually replies to your
            emails.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="fundingStage" className="text-slate-200">
              Current stage
            </Label>
            <select
              id="fundingStage"
              value={state.fundingStage}
              onChange={handleChange("fundingStage")}
              className="h-10 rounded-md border border-slate-700 bg-slate-900/80 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
            >
              <option value="">Select stage</option>
              <option value="bootstrapped">Bootstrapped</option>
              <option value="pre-seed">Pre-seed</option>
              <option value="seed">Seed</option>
              <option value="series-a">Series A</option>
              <option value="post-series-a">Post Series A+</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetRaise" className="text-slate-200">
              Target raise (next round)
            </Label>
            <Input
              id="targetRaise"
              value={state.targetRaise}
              onChange={handleChange("targetRaise")}
              placeholder="e.g., 750000"
              className="bg-slate-900/80 border-slate-700 text-white"
            />
            <p className="text-xs text-slate-500">
              Numbers only, in your primary currency.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="runwayMonths" className="text-slate-200">
              Runway (months)
            </Label>
            <Input
              id="runwayMonths"
              value={state.runwayMonths}
              onChange={handleChange("runwayMonths")}
              placeholder="e.g., 9"
              className="bg-slate-900/80 border-slate-700 text-white"
            />
            <p className="text-xs text-slate-500">
              How long you can operate at current burn.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI coach behavior */}
      <Card className="bg-slate-900/60 border-slate-800 shadow-lg shadow-slate-950/30">
        <CardHeader>
          <CardTitle className="text-white">AI Coach Personality</CardTitle>
          <CardDescription className="text-slate-400">
            Decide how blunt, hype, or gentle you want Prospra to be when
            pushing you toward your goals.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="coachStyle" className="text-slate-200">
              Coaching style
            </Label>
            <select
              id="coachStyle"
              value={state.coachStyle}
              onChange={handleChange("coachStyle")}
              className="h-10 rounded-md border border-slate-700 bg-slate-900/80 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
            >
              <option value="supportive">Supportive but honest</option>
              <option value="direct">Direct, no fluff</option>
              <option value="hype">High-energy hype squad</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="coachFocus" className="text-slate-200">
              Primary focus area
            </Label>
            <select
              id="coachFocus"
              value={state.coachFocus}
              onChange={handleChange("coachFocus")}
              className="h-10 rounded-md border border-slate-700 bg-slate-900/80 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
            >
              <option value="strategy">Strategy & positioning</option>
              <option value="systems">Systems & operations</option>
              <option value="marketing">Growth & marketing</option>
              <option value="mindset">Mindset & resilience</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-slate-900/60 border-slate-800 shadow-lg shadow-slate-950/30">
        <CardHeader>
          <CardTitle className="text-white">Notifications</CardTitle>
          <CardDescription className="text-slate-400">
            Choose how loudly Prospra should tap you on the shoulder.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-100">
                Weekly founder digest
              </p>
              <p className="text-xs text-slate-400">
                Summary of your progress, bottlenecks, and suggested next moves.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={state.weeklyDigest}
                onChange={handleChange("weeklyDigest")}
                className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-400 focus:ring-emerald-400/70"
              />
              <span className="text-xs text-slate-300">Enabled</span>
            </label>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-100">
                Product & feature updates
              </p>
              <p className="text-xs text-slate-400">
                Hear when new Prospra tools, dashboards, or AI modes go live.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={state.productUpdates}
                onChange={handleChange("productUpdates")}
                className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-400 focus:ring-emerald-400/70"
              />
              <span className="text-xs text-slate-300">Enabled</span>
            </label>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-100">
                Investor-style accountability
              </p>
              <p className="text-xs text-slate-400">
                Sharper reminders & targets, like having a friendly board in
                your inbox.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={state.investorUpdates}
                onChange={handleChange("investorUpdates")}
                className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-400 focus:ring-emerald-400/70"
              />
              <span className="text-xs text-slate-300">Enabled</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Save bar */}
      <div className="flex flex-col gap-3 border-t border-slate-800 pt-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1 text-sm">
          {status && <p className="text-emerald-400">{status}</p>}
          {error && <p className="text-rose-400">{error}</p>}
          {!status && !error && (
            <p className="text-slate-500">
              Changes are saved to your Prospra profile & preferences.
            </p>
          )}
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-6"
        >
          {saving ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </div>
  );
}
