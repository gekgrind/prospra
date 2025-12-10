"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Lightbulb, Rocket, Trees, TrendingUp } from "lucide-react";

type OnboardingFormData = {
  name: string;
  industry: string;
  stage: string;
  website: string;
  audience: string;
  offer: string;
  goal90: string;
  challenge: string;
};

const TOTAL_STEPS = 6;

export default function OnboardingWizardPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const [formData, setFormData] = useState<OnboardingFormData>({
    name: "",
    industry: "",
    stage: "",
    website: "",
    audience: "",
    offer: "",
    goal90: "",
    challenge: "",
  });

  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const progress = (step / TOTAL_STEPS) * 100;

  // --------------------------
  // LOAD EXISTING PROGRESS
  // --------------------------
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/onboarding-progress", {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          // Profile might not exist yet - that's okay for new users
          console.log("No existing progress found - starting fresh");
          setInitializing(false);
          return;
        }

        const data = await res.json();

        const nextFormData: OnboardingFormData = {
          name: data.name ?? "",
          industry: data.industry ?? "",
          stage: data.stage ?? "",
          website: data.website ?? "",
          audience: data.audience ?? "",
          offer: data.offer ?? "",
          goal90: data.goal90 ?? "",
          challenge: data.challenge ?? "",
        };

        setFormData(nextFormData);

        if (data.onboarding_step && data.onboarding_step >= 1 && data.onboarding_step <= TOTAL_STEPS) {
          setStep(data.onboarding_step);
        }
      } catch (err) {
        console.error("Onboarding progress load error:", err);
        // Don't block the user - let them start fresh
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  // --------------------------
  // AUTO-SAVE PROGRESS
  // --------------------------
  async function saveProgress(
    partial: Partial<OnboardingFormData> & { onboarding_step?: number }
  ) {
    try {
      await fetch("/api/onboarding-progress", {
        method: "PATCH",
        credentials: "include", // ⭐ REQUIRED FIX
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(partial),
      });
    } catch (err) {
      console.error("Auto-save failed:", err);
    }
  }

  // --------------------------
  // STEP NAVIGATION
  // --------------------------
  const goNext = async () => {
    if (step >= TOTAL_STEPS) return;
    const nextStep = step + 1;
    setStep(nextStep);
    await saveProgress({ ...formData, onboarding_step: nextStep });
  };

  const goBack = async () => {
    if (step <= 1) return;
    const prevStep = step - 1;
    setStep(prevStep);
    await saveProgress({ onboarding_step: prevStep });
  };

  // --------------------------
  // FINISH ONBOARDING (MAIN FIX)
  // --------------------------
  async function finishOnboarding() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/onboarding", {
        method: "POST",
        credentials: "include", // ⭐⭐ MAIN FIX ⭐⭐
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Onboarding save failed:", {
          status: res.status,
          statusText: res.statusText,
          errorData,
        });
        setError(errorData.error || "Something went wrong saving your answers. Please try again.");
        setLoading(false);
        return;
      }

      setCompleted(true);
      setLoading(false);
    } catch (err) {
      console.error("Onboarding error", err);
      setError("Unexpected error. Please try again.");
      setLoading(false);
    }
  }

  // --------------------------
  // ORB MESSAGE LOGIC
  // --------------------------
  function getOrbMessage() {
    if (completed) {
      return "Your founder profile is live. Ready to meet your dashboard?";
    }

    if (step === 1) {
      if (formData.name.trim().length > 0) {
        return `Nice to meet you, ${formData.name}! This helps me talk to you like a real partner.`;
      }
      return "Welcome in! I’ll use your name to personalize your journey.";
    }

    if (step === 2) {
      if (formData.stage === "idea") {
        return "Idea stage is where the magic begins. We’ll turn this spark into something real.";
      }
      if (formData.stage === "prelaunch") {
        return "Pre-launch is all about foundations. We’ll tighten your offer & audience fit.";
      }
      if (formData.stage === "early") {
        return "Early-stage? Perfect. We’ll focus on traction and repeatable wins.";
      }
      if (formData.stage === "scaling") {
        return "Scaling mode! We’ll hunt bottlenecks and build leverage.";
      }
      return "The more specific you are here, the more targeted your mentoring will feel.";
    }

    if (step === 3) {
      if (formData.website.trim()) {
        return "Got it. I’ll quietly analyze that site in the background as we go.";
      }
      return "No website yet? Totally fine. We can still design a powerful plan.";
    }

    if (step === 4) {
      if (formData.audience.trim().length > 40) {
        return "You’ve clearly thought about who you serve. That’s a huge advantage already.";
      }
      if (formData.audience.trim()) {
        return "Nice. Knowing who you help is the core of your marketing.";
      }
      return "Think of the person you most want to help. Describe them like you’re talking to a friend.";
    }

    if (step === 5) {
      if (formData.goal90.trim().toLowerCase().includes("10k") || formData.goal90.toLowerCase().includes("$10k")) {
        return "Big revenue goals — I love it. We’ll break that into doable steps.";
      }
      if (formData.goal90.trim()) {
        return "90-day goals keep us focused. We’ll align your actions with this.";
      }
      return "Short-term goals reduce overwhelm. Pick one move-the-needle outcome.";
    }

    if (step === 6) {
      const challenge = formData.challenge.toLowerCase();
      if (challenge.includes("focus") || challenge.includes("consistency")) {
        return "Focus & consistency are skills. We’ll design tiny systems to support you.";
      }
      if (challenge.includes("marketing") || challenge.includes("leads") || challenge.includes("traffic")) {
        return "Marketing struggles are super common. I can help you go from guessing → intentional.";
      }
      if (challenge.includes("tech")) {
        return "Tech friction is real. I’ll help you cut complexity and move anyway.";
      }
      if (challenge.trim()) {
        return "Thank you for being honest here. This is where our best work together will start.";
      }
      return "This is where you can be real with me. What’s actually getting in the way?";
    }

    return "Let’s keep building this picture of you and your business.";
  }

  // --------------------------
  // SWIPE GESTURES (MOBILE)
  // --------------------------
  function handleTouchStart(e: React.TouchEvent) {
    setTouchStartX(e.touches[0].clientX);
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;

    const threshold = 60;
    if (deltaX < -threshold) {
      if (canGoNextForStep(step, formData)) {
        goNext();
      }
    } else if (deltaX > threshold) {
      goBack();
    }

    setTouchStartX(null);
  }

  function canGoNextForStep(step: number, data: OnboardingFormData) {
    switch (step) {
      case 1:
        return data.name.trim().length > 0;
      case 2:
        return data.industry.trim().length > 0 && !!data.stage;
      case 4:
        return data.audience.trim().length > 0;
      case 5:
        return data.offer.trim().length > 0 && data.goal90.trim().length > 0;
      default:
        return true;
    }
  }

  // --------------------------
  // STEP RENDERER (UNCHANGED)
  // --------------------------
  const renderStep = () => {
    if (completed) {
      return (
        <div className="space-y-6 animate-onboard-fade">
          <h1 className="text-3xl font-bold">You&apos;re in, {formData.name || "founder"} 🎉</h1>
          <p className="text-white/80">
            I&apos;ve saved your founder profile and I&apos;m using it to tune how Prospra mentors you.
          </p>

          <div className="rounded-2xl bg-white/5 border border-white/15 p-4 space-y-2 text-sm">
            <p className="text-white/60 text-xs uppercase tracking-[0.2em]">Snapshot</p>
            <p><span className="text-white/60">Industry:</span> {formData.industry || "Not set yet"}</p>
            <p><span className="text-white/60">Stage:</span> {formData.stage || "Not set yet"}</p>
            <p><span className="text-white/60">Audience:</span> {formData.audience || "Not set yet"}</p>
            <p><span className="text-white/60">Main offer:</span> {formData.offer || "Not set yet"}</p>
            <p><span className="text-white/60">90-day goal:</span> {formData.goal90 || "Not set yet"}</p>
            <p><span className="text-white/60">Top challenge:</span> {formData.challenge || "Not set yet"}</p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#4f7ca7] to-[#d27a2c] text-white"
            >
              Go to my dashboard →
            </button>
          </div>
        </div>
      );
    }

    // ----------------------
    // STEP 1
    // ----------------------
    if (step === 1) {
      return (
        <div className="space-y-6 animate-onboard-fade">
          <h1 className="text-3xl font-bold">
            Hey founder 👋 What&apos;s your name?
          </h1>
          <p className="text-white/70">
            Prospra will personalize your mentoring journey using this.
          </p>

          <div>
            <label className="text-white/70">Your name</label>
            <input
              type="text"
              placeholder="Tammy, Georgia, CEO, etc."
              className="w-full mt-1 p-3 rounded-xl bg-white/10 border border-white/25 placeholder-white/40 text-white"
              value={formData.name}
              onChange={(e) => {
                const value = e.target.value;
                setFormData((prev) => ({ ...prev, name: value }));
                saveProgress({ name: value });
              }}
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={goNext}
              disabled={!formData.name.trim()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#4f7ca7] to-[#d27a2c] text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      );
    }

    // ----------------------
    // STEP 2
    // ----------------------
    if (step === 2) {
      return (
        <div className="space-y-6 animate-onboard-slide">
          <h1 className="text-3xl font-bold">Your business basics 💼</h1>
          <p className="text-white/70">Help Prospra understand what you&apos;re building.</p>

          <div>
            <label className="text-white/70">Industry</label>
            <input
              type="text"
              placeholder="e.g. Coaching, E-commerce..."
              className="w-full mt-1 p-3 rounded-xl bg-white/10 border border-white/25 placeholder-white/40 text-white"
              value={formData.industry}
              onChange={(e) => {
                const value = e.target.value;
                setFormData((prev) => ({ ...prev, industry: value }));
                saveProgress({ industry: value });
              }}
            />
          </div>

          <div>
            <label className="text-white/70">Current stage</label>

            <Select
              value={formData.stage}
              onValueChange={(val) => {
                setFormData((prev) => ({ ...prev, stage: val }));
                saveProgress({ stage: val });
              }}
            >
              <SelectTrigger
                className="
                  w-full mt-1 px-4 py-3 rounded-xl
                  bg-brandNavy/70 border border-brandBlue/40
                  text-white shadow-[0_0_14px_rgba(79,124,167,0.35)]
                  hover:shadow-[0_0_22px_rgba(210,122,44,0.55)]
                  transition-all duration-300
                  focus:ring-2 focus:ring-brandOrange 
                  focus:ring-offset-0
                "
              >
                <SelectValue placeholder="Choose one" />
              </SelectTrigger>

              <SelectContent
                className="
                  bg-brandNavy/90 border border-brandBlue/40 
                  backdrop-blur-xl text-white rounded-xl shadow-xl 
                  animate-in fade-in slide-in-from-top-2 duration-300
                "
              >
                <SelectItem value="idea" className="flex items-center gap-2 py-2">
                  <Lightbulb className="h-4 w-4 text-brandOrange" />
                  Idea
                </SelectItem>

                <SelectItem value="prelaunch" className="flex items-center gap-2 py-2">
                  <Rocket className="h-4 w-4 text-brandOrange" />
                  Pre-Launch
                </SelectItem>

                <SelectItem value="early" className="flex items-center gap-2 py-2">
                  <Trees className="h-4 w-4 text-brandOrange" />
                  Early Stage
                </SelectItem>

                <SelectItem value="scaling" className="flex items-center gap-2 py-2">
                  <TrendingUp className="h-4 w-4 text-brandOrange" />
                  Scaling
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between">
            <button
              onClick={goBack}
              className="px-4 py-2 rounded-xl bg-white/10 border border-white/25"
            >
              ← Back
            </button>

            <button
              onClick={goNext}
              disabled={!formData.industry.trim() || !formData.stage}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#4f7ca7] to-[#d27a2c] text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      );
    }

    // ----------------------
    // STEP 3
    // ----------------------
    if (step === 3) {
      return (
        <div className="space-y-6 animate-onboard-slide">
          <h1 className="text-3xl font-bold">Do you have a website yet? 🌐</h1>
          <p className="text-white/70">
            If you share it, Prospra can analyze it and customize mentoring.
          </p>

          <div>
            <label className="text-white/70">Website URL (optional)</label>
            <input
              type="url"
              placeholder="https://yourbrand.com"
              className="w-full mt-1 p-3 rounded-xl bg-white/10 border border-white/25 placeholder-white/40 text-white"
              value={formData.website}
              onChange={(e) => {
                const value = e.target.value;
                setFormData((prev) => ({ ...prev, website: value }));
                saveProgress({ website: value });
              }}
            />
          </div>

          <div className="flex justify-between">
            <button
              onClick={goBack}
              className="px-4 py-2 rounded-xl bg-white/10 border border-white/25"
            >
              ← Back
            </button>

            <button
              onClick={goNext}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#4f7ca7] to-[#d27a2c] text-white"
            >
              Next →
            </button>
          </div>
        </div>
      );
    }

    // ----------------------
    // STEP 4
    // ----------------------
    if (step === 4) {
      return (
        <div className="space-y-6 animate-onboard-slide">
          <h1 className="text-3xl font-bold">Who are you helping? 🎯</h1>
          <p className="text-white/70">Describe your main audience in a sentence or two.</p>

          <textarea
            placeholder="Founders, creators, local business owners..."
            className="w-full mt-1 p-3 rounded-xl bg-white/10 border border-white/25 placeholder-white/40 text-white min-h-[120px]"
            value={formData.audience}
            onChange={(e) => {
              const value = e.target.value;
              setFormData((prev) => ({ ...prev, audience: value }));
              saveProgress({ audience: value });
            }}
          />

          <div className="flex justify-between">
            <button
              onClick={goBack}
              className="px-4 py-2 rounded-xl bg-white/10 border border-white/25"
            >
              ← Back
            </button>

            <button
              onClick={goNext}
              disabled={!formData.audience.trim()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#4f7ca7] to-[#d27a2c] text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      );
    }

    // ----------------------
    // STEP 5
    // ----------------------
    if (step === 5) {
      return (
        <div className="space-y-6 animate-onboard-slide">
          <h1 className="text-3xl font-bold">What are you offering them? 🎁</h1>
          <p className="text-white/70">Coaching, courses, services, products, memberships...</p>

          <textarea
            placeholder="1:1 coaching, done-for-you services, group program..."
            className="w-full mt-1 p-3 rounded-xl bg-white/10 border border-white/25 placeholder-white/40 text-white min-h-[120px]"
            value={formData.offer}
            onChange={(e) => {
              const value = e.target.value;
              setFormData((prev) => ({ ...prev, offer: value }));
              saveProgress({ offer: value });
            }}
          />

          <div>
            <label className="text-white/70">What&apos;s your #1 goal in the next 90 days?</label>
            <textarea
              placeholder="Launch MVP, get 10 paying customers, hit $5k MRR..."
              className="w-full mt-1 p-3 rounded-xl bg-white/10 border border-white/25 placeholder-white/40 text-white min-h-[120px]"
              value={formData.goal90}
              onChange={(e) => {
                const value = e.target.value;
                setFormData((prev) => ({ ...prev, goal90: value }));
                saveProgress({ goal90: value });
              }}
            />
          </div>

          <div className="flex justify-between">
            <button
              onClick={goBack}
              className="px-4 py-2 rounded-xl bg-white/10 border border-white/25"
            >
              ← Back
            </button>

            <button
              onClick={goNext}
              disabled={!formData.offer.trim() || !formData.goal90.trim()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#4f7ca7] to-[#d27a2c] text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      );
    }

    // ----------------------
    // STEP 6
    // ----------------------
    return (
      <div className="space-y-6 animate-onboard-slide">
        <h1 className="text-3xl font-bold">Your biggest challenge 🤔</h1>
        <p className="text-white/70">
          Be honest — this helps Prospra coach you where it matters most.
        </p>

        <textarea
          placeholder="Marketing, focus, tech, consistency..."
          className="w-full mt-1 p-3 rounded-xl bg-white/10 border border-white/25 placeholder-white/40 text-white min-h-[140px]"
          value={formData.challenge}
          onChange={(e) => {
            const value = e.target.value;
            setFormData((prev) => ({ ...prev, challenge: value }));
            saveProgress({ challenge: value });
          }}
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-between items-center">
          <button
            onClick={goBack}
            className="px-4 py-2 rounded-xl bg-white/10 border border-white/25"
          >
            ← Back
          </button>

          <button
            onClick={finishOnboarding}
            disabled={loading || !formData.challenge.trim()}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#4f7ca7] to-[#d27a2c] text-white disabled:opacity-40 disabled:cursor-wait"
          >
            {loading ? "Saving..." : "Finish 🎉"}
          </button>
        </div>
      </div>
    );
  };

  // --------------------------
  // INITIAL LOADING SCREEN
  // --------------------------
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brandNavyDark text-white">
        Loading your onboarding...
      </div>
    );
  }

  // --------------------------
  // MAIN RETURN
  // --------------------------
  return (
    <div
      className="min-h-screen relative flex items-center justify-center px-4 py-10 bg-brandNavyDark overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,124,167,0.25),_transparent_60%),_radial-gradient(circle_at_bottom,_rgba(210,122,44,0.20),_transparent_60%)]" />

      {/* Floating Orb */}
      <div className="pointer-events-none fixed top-6 right-6 flex flex-col items-end gap-2 max-w-[260px]">
        <div className="onboard-orb shadow-[0_0_25px_rgba(79,124,167,0.7)]" />
        <div className="bg-brandNavy/90 border border-brandBlue/40 text-xs text-white/80 rounded-xl px-3 py-2 backdrop-blur-md animate-onboard-orbText">
          {getOrbMessage()}
        </div>
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-white/10 bg-brandNavy/80 backdrop-blur-xl p-6 md:p-8 shadow-[0_18px_60px_rgba(0,0,0,0.65)]">
        {/* Progress Header */}
        {!completed && (
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-brandBlueLight/70">
                Prospra Onboarding
              </p>
              <p className="text-sm text-white/80">
                Step {step} of {TOTAL_STEPS}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-40 h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#4f7ca7] to-[#d27a2c] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-white/70">{Math.round(progress)}%</span>
            </div>
          </div>
        )}

        {renderStep()}
      </div>
    </div>
  );
}
