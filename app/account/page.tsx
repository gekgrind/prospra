"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  ShieldCheck,
  Settings2,
  User,
  Globe2,
  Sparkles,
  Trash2,
  RefreshCcw,
  LogOut,
  CreditCard,
} from "lucide-react";

type NotificationPrefs = {
  product_updates?: boolean;
  weekly_summary?: boolean;
  website_scan_alerts?: boolean;
};

type Profile = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  business_name?: string | null;
  website?: string | null;
  industry?: string | null;
  business_stage?: string | null;
  goals?: string | null;
  founder_bio?: string | null;
  founder_score?: number | null;
  onboarding_complete?: boolean | null;
  theme_preference?: "system" | "light" | "dark" | null;
  ai_tone?: "professional" | "friendly" | "genz" | "tough-love" | null;
  weekly_website_scan?: boolean | null;
  notification_preferences?: NotificationPrefs | null;
};

export default function AccountSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [dangerWorking, setDangerWorking] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);

  // Editable fields
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [businessStage, setBusinessStage] = useState("");
  const [goals, setGoals] = useState("");
  const [founderBio, setFounderBio] = useState("");

  // Preferences
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system");
  const [aiTone, setAiTone] = useState<
    "professional" | "friendly" | "genz" | "tough-love"
  >("friendly");
  const [weeklyScan, setWeeklyScan] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>({
    product_updates: true,
    weekly_summary: true,
    website_scan_alerts: true,
  });

  // Security fields
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // UI messaging
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const supabase = createClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setError("You must be logged in to manage your account.");
          setLoading(false);
          return;
        }

        setUserId(user.id);
        setEmail(user.email ?? "");

        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error(profileError);
          setError("Unable to load your profile right now.");
        } else if (data) {
          const p = data as Profile;
          setProfile(p);
          setFullName(p.full_name ?? "");
          setBusinessName(p.business_name ?? "");
          setWebsite(p.website ?? "");
          setIndustry(p.industry ?? "");
          setBusinessStage(p.business_stage ?? "");
          setGoals(p.goals ?? "");
          setFounderBio(p.founder_bio ?? "");
          setTheme(p.theme_preference ?? "system");
          setAiTone(p.ai_tone ?? "friendly");
          setWeeklyScan(!!p.weekly_website_scan);
          setNotificationPrefs({
            product_updates: p.notification_preferences?.product_updates ?? true,
            weekly_summary: p.notification_preferences?.weekly_summary ?? true,
            website_scan_alerts:
              p.notification_preferences?.website_scan_alerts ?? true,
          });
        }
      } catch (err) {
        console.error(err);
        setError("Something went wrong loading your account.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSaveProfile = async () => {
    if (!userId) return;
    setSavingProfile(true);
    setStatus(null);
    setError(null);

    try {
      const supabase = createClient();
      const updates: Partial<Profile> = {
        full_name: fullName.trim(),
        business_name: businessName.trim() || null,
        website: website.trim() || null,
        industry: industry.trim() || null,
        business_stage: businessStage.trim() || null,
        goals: goals.trim() || null,
        founder_bio: founderBio.trim() || null,
      };

      const { error: updateError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId);

      if (updateError) {
        console.error(updateError);
        setError("Could not save profile changes.");
      } else {
        setStatus("Profile updated successfully.");
        setProfile((prev) => (prev ? { ...prev, ...updates } : prev));
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong updating your profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!userId) return;
    setSavingPrefs(true);
    setStatus(null);
    setError(null);

    try {
      const supabase = createClient();
      const updates = {
        theme_preference: theme,
        ai_tone: aiTone,
        weekly_website_scan: weeklyScan,
        notification_preferences: notificationPrefs,
      };

      const { error: updateError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId);

      if (updateError) {
        console.error(updateError);
        setError("Could not save your preferences.");
      } else {
        setStatus("Preferences updated successfully.");
        setProfile((prev) => (prev ? { ...prev, ...updates } : prev));
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong updating preferences.");
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmNewPassword) {
      setError("Please fill out both password fields.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password should be at least 8 characters.");
      return;
    }

    setChangingPassword(true);
    setStatus(null);
    setError(null);

    try {
      const supabase = createClient();
      const { error: pwError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (pwError) {
        console.error(pwError);
        setError("Could not change your password.");
      } else {
        setStatus("Password updated successfully.");
        setNewPassword("");
        setConfirmNewPassword("");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong changing your password.");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSignOutAll = async () => {
    setDangerWorking(true);
    setStatus(null);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signoutError } = await supabase.auth.signOut();

      if (signoutError) {
        console.error(signoutError);
        setError("Could not sign out.");
      } else {
        setStatus("Signed out successfully.");
        router.push("/auth/login");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong signing out.");
    } finally {
      setDangerWorking(false);
    }
  };

  const handleResetOnboarding = async () => {
    if (!userId) return;

    if (
      !confirm(
        "Reset onboarding for this account? You’ll be taken back through the onboarding flow next time."
      )
    ) {
      return;
    }

    setDangerWorking(true);
    setStatus(null);
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ onboarding_complete: false })
        .eq("id", userId);

      if (updateError) {
        console.error(updateError);
        setError("Could not reset onboarding.");
      } else {
        setStatus("Onboarding has been reset.");
        setProfile((prev) =>
          prev ? { ...prev, onboarding_complete: false } : prev
        );
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong resetting onboarding.");
    } finally {
      setDangerWorking(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        "This will request deletion of your account. This action is permanent. Continue?"
      )
    ) {
      return;
    }

    setDangerWorking(true);
    setStatus(null);
    setError(null);

    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error("Delete error:", body);
        setError(
          body?.message ||
            "Account deletion request failed. Please try again or contact support."
        );
      } else {
        setStatus("Account deletion requested. You will be signed out.");
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong requesting account deletion.");
    } finally {
      setDangerWorking(false);
    }
  };

  const updateNotificationPref = (key: keyof NotificationPrefs, value: boolean) => {
    setNotificationPrefs((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full border border-orange-400/40 flex items-center justify-center animate-spin">
            <Sparkles className="h-6 w-6 text-orange-400" />
          </div>
          <p className="text-slate-300 text-sm">
            Spinning up your Prospra control panel…
          </p>
        </div>
      </div>
    );
  }

  if (error && !userId) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-950">
        <Card className="max-w-md w-full bg-slate-900/80 border-slate-700/70 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Account access required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-200">
            <p>{error}</p>
            <Button
              variant="default"
              className="w-full bg-orange-500 hover:bg-orange-500/90 text-slate-950"
              onClick={() => router.push("/auth/login")}
            >
              Go to login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[100vh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-10 md:py-14">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight flex items-center gap-2">
              <Settings2 className="h-7 w-7 text-orange-400" />
              Account Settings
            </h1>
            <p className="text-sm md:text-base text-slate-300 mt-1">
              Tune your Prospra experience, update your info, and manage security.
            </p>
          </div>
          {profile?.founder_score != null && (
            <div className="rounded-2xl border border-orange-500/40 bg-slate-900/60 px-4 py-3 shadow-lg shadow-orange-500/10">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-1">
                Founder Score
              </p>
              <p className="flex items-baseline gap-1">
                <span className="text-2xl font-semibold text-orange-400">
                  {Math.round(profile.founder_score)}
                </span>
                <span className="text-xs text-slate-400">/100</span>
              </p>
            </div>
          )}
        </div>

        {/* Status + Error */}
        {(status || error) && (
          <div className="mb-5 space-y-2">
            {status && (
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                {status}
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-slate-900/70 border border-slate-700/60">
            <TabsTrigger value="profile" className="data-[state=active]:bg-slate-800">
              <User className="h-4 w-4 mr-1.5" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="preferences" className="data-[state=active]:bg-slate-800">
              <Sparkles className="h-4 w-4 mr-1.5" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-slate-800">
              <ShieldCheck className="h-4 w-4 mr-1.5" />
              Security
            </TabsTrigger>
            <TabsTrigger value="danger" className="data-[state=active]:bg-slate-800">
              <AlertTriangle className="h-4 w-4 mr-1.5" />
              Danger Zone
            </TabsTrigger>
            <TabsTrigger value="subscription" className="data-[state=active]:bg-slate-800">
              <CreditCard className="h-4 w-4 mr-1.5" />
              Subscription
            </TabsTrigger>
          </TabsList>

          {/* PROFILE TAB */}
          <TabsContent value="profile" className="space-y-4">
            <Card className="bg-slate-900/70 border-slate-700/70 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-orange-400" />
                  Profile information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email (login)</Label>
                    <Input value={email} disabled className="opacity-80" />
                    <p className="text-xs text-slate-400">
                      Email changes will be handled in a future update.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business name</Label>
                    <Input
                      id="businessName"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Your company / brand"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website" className="flex items-center gap-1.5">
                      Website
                      <Globe2 className="h-3 w-3 text-slate-400" />
                    </Label>
                    <Input
                      id="website"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://your-site.com"
                    />
                    <p className="text-xs text-slate-400">
                      Prospra uses this for website analysis & personalization.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="e.g. SaaS, eCommerce, Coaching"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stage">Business stage</Label>
                    <Input
                      id="stage"
                      value={businessStage}
                      onChange={(e) => setBusinessStage(e.target.value)}
                      placeholder="Idea, Pre-launch, Early Revenue, Scaling…"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goals">Current goals</Label>
                  <Textarea
                    id="goals"
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                    placeholder="Tell Prospra what you're focused on the next 30–90 days."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Founder bio</Label>
                  <Textarea
                    id="bio"
                    value={founderBio}
                    onChange={(e) => setFounderBio(e.target.value)}
                    placeholder="A quick bio so Prospra can hype you properly."
                    rows={3}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="bg-orange-500 hover:bg-orange-500/90 text-slate-950 px-6"
                >
                  {savingProfile ? "Saving…" : "Save profile"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* PREFERENCES TAB */}
          <TabsContent value="preferences" className="space-y-4">
            <Card className="bg-slate-900/70 border-slate-700/70 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-orange-400" />
                  Experience & AI personality
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Theme */}
                  <div className="space-y-3">
                    <Label className="text-sm">Theme</Label>
                    <div className="flex gap-2">
                      {["system", "light", "dark"].map((mode) => (
                        <Button
                          key={mode}
                          type="button"
                          variant={theme === mode ? "default" : "outline"}
                          className={
                            theme === mode
                              ? "bg-orange-500 text-slate-950 border-orange-500"
                              : "border-slate-700 bg-slate-900/80"
                          }
                          onClick={() =>
                            setTheme(mode as "system" | "light" | "dark")
                          }
                        >
                          {mode === "system"
                            ? "Match system"
                            : mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400">
                      Theme preference will be stored so the app feels like home every
                      time you log in.
                    </p>
                  </div>

                  {/* AI tone */}
                  <div className="space-y-3">
                    <Label className="text-sm">AI tone</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: "professional", label: "Professional" },
                        { id: "friendly", label: "Friendly" },
                        { id: "genz", label: "Gen Z / Relatable" },
                        { id: "tough-love", label: "Tough Love Coach" },
                      ].map((tone) => (
                        <Button
                          key={tone.id}
                          type="button"
                          size="sm"
                          variant={aiTone === tone.id ? "default" : "outline"}
                          className={
                            aiTone === tone.id
                              ? "bg-orange-500 text-slate-950 border-orange-500"
                              : "border-slate-700 bg-slate-900/80"
                          }
                          onClick={() =>
                            setAiTone(
                              tone.id as
                                | "professional"
                                | "friendly"
                                | "genz"
                                | "tough-love"
                            )
                          }
                        >
                          {tone.label}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400">
                      Prospra will adapt its style while still keeping the strategy
                      sharp.
                    </p>
                  </div>
                </div>

                <Separator className="bg-slate-800" />

                {/* Notifications */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm">Notifications</Label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <p className="text-sm">Product updates</p>
                          <p className="text-xs text-slate-400">
                            Occasional updates when major new features drop.
                          </p>
                        </div>
                        <Switch
                          checked={!!notificationPrefs.product_updates}
                          onCheckedChange={(checked) =>
                            updateNotificationPref("product_updates", checked)
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <p className="text-sm">Weekly summary</p>
                          <p className="text-xs text-slate-400">
                            A quick recap of your progress and suggestions.
                          </p>
                        </div>
                        <Switch
                          checked={!!notificationPrefs.weekly_summary}
                          onCheckedChange={(checked) =>
                            updateNotificationPref("weekly_summary", checked)
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <p className="text-sm">Website analyzer alerts</p>
                          <p className="text-xs text-slate-400">
                            Get nudges when your site score changes.
                          </p>
                        </div>
                        <Switch
                          checked={!!notificationPrefs.website_scan_alerts}
                          onCheckedChange={(checked) =>
                            updateNotificationPref("website_scan_alerts", checked)
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Weekly analyzer toggle */}
                  <div className="space-y-3">
                    <Label className="text-sm">
                      Weekly website analyzer (auto scan)
                    </Label>
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <p className="text-sm">Auto-scan my website weekly</p>
                        <p className="text-xs text-slate-400">
                          Prospra will re-scan your homepage and update your scores /
                          insights on autopilot.
                        </p>
                      </div>
                      <Switch
                        checked={weeklyScan}
                        onCheckedChange={(checked) => setWeeklyScan(checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  onClick={handleSavePreferences}
                  disabled={savingPrefs}
                  className="bg-orange-500 hover:bg-orange-500/90 text-slate-950 px-6"
                >
                  {savingPrefs ? "Saving…" : "Save preferences"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* SECURITY TAB */}
          <TabsContent value="security" className="space-y-4">
            <Card className="bg-slate-900/70 border-slate-700/70 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-orange-400" />
                  Password & sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Change password */}
                  <div className="space-y-3">
                    <Label className="text-sm">Change password</Label>
                    <div className="space-y-2">
                      <Input
                        type="password"
                        placeholder="New password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <Input
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-slate-400">
                      We recommend a strong, unique password for your Prospra account.
                    </p>
                    <Button
                      size="sm"
                      onClick={handleChangePassword}
                      disabled={changingPassword}
                      className="mt-2 bg-orange-500 hover:bg-orange-500/90 text-slate-950"
                    >
                      {changingPassword ? "Updating…" : "Update password"}
                    </Button>
                  </div>

                  {/* Sign out all devices */}
                  <div className="space-y-3">
                    <Label className="text-sm">Active sessions</Label>
                    <p className="text-xs text-slate-400">
                      If you’ve logged in on shared or older devices, you can force
                      them all to sign out.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSignOutAll}
                      disabled={dangerWorking}
                      className="flex items-center gap-2 border-red-500/60 text-red-300 hover:bg-red-500/10"
                    >
                      <LogOut className="h-4 w-4" />
                      {dangerWorking ? "Signing out…" : "Sign out from all devices"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DANGER ZONE TAB */}
          <TabsContent value="danger" className="space-y-4">
            <Card className="bg-slate-900/80 border border-red-500/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-300">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {/* Reset onboarding */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6 rounded-xl border border-slate-700/80 bg-slate-950/60 px-4 py-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium flex items-center gap-1.5">
                        <RefreshCcw className="h-4 w-4 text-orange-400" />
                        Reset onboarding
                      </p>
                      <p className="text-xs text-slate-400">
                        Sends you back through the onboarding flow so we can recalibrate
                        around your current goals.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleResetOnboarding}
                      disabled={dangerWorking}
                      className="border-orange-500/70 text-orange-300 hover:bg-orange-500/10"
                    >
                      Reset onboarding
                    </Button>
                  </div>

                  {/* Delete account */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6 rounded-xl border border-red-600/80 bg-red-950/40 px-4 py-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium flex items-center gap-1.5 text-red-200">
                        <Trash2 className="h-4 w-4" />
                        Delete account
                      </p>
                      <p className="text-xs text-red-200/80">
                        Permanently deletes your account and associated data. This
                        cannot be undone.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={dangerWorking}
                      className="bg-red-600 hover:bg-red-600/90"
                    >
                      Delete my account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SUBSCRIPTION TAB */}
          <TabsContent value="subscription" className="space-y-4">
            <Card className="bg-slate-900/70 border-slate-700/70 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-orange-400" />
                  Subscription & billing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-300">
                  This panel is ready to hook into your billing provider (Stripe,
                  Lemon Squeezy, etc.). For now, it’s just a placeholder.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <Label className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Current plan
                    </Label>
                    <p className="text-lg font-semibold">
                      Prospra Starter
                    </p>
                    <p className="text-xs text-slate-400">
                      Upgrade paths and billing history will live here.
                    </p>
                  </div>
                  <div className="flex items-end justify-start md:justify-end">
                    <Button
                      type="button"
                      disabled
                      className="bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed"
                    >
                      Upgrade (coming soon)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
