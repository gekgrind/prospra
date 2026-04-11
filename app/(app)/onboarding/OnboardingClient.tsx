"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ONBOARDING_SECTIONS } from "@/lib/onboarding-framework";

type OnboardingResponseValue = string | string[];
type OnboardingResponses = Record<string, OnboardingResponseValue | undefined>;

type QuestionType = "single" | "multi" | "text" | "long_text";

type QuestionOption =
  | string
  | {
      value?: string;
      label?: string;
      id?: string;
      text?: string;
      title?: string;
      name?: string;
    };

type QuestionConditional = {
  questionId: string;
  equals: string;
};

type LocalOnboardingQuestion = {
  id: string;
  prompt: string;
  helperText?: string;
  type: QuestionType;
  required?: boolean;
  options?: QuestionOption[];
  allowOther?: boolean;
  conditional?: QuestionConditional;
};

type LocalOnboardingSection = {
  id: string;
  title: string;
  description: string;
  questions: LocalOnboardingQuestion[];
};

type NormalizedOption = {
  value: string;
  label: string;
};

const SECTIONS = ONBOARDING_SECTIONS as unknown as LocalOnboardingSection[];
const TOTAL_SECTIONS = SECTIONS.length;

function isValidUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function hasTextValue(value: OnboardingResponseValue | undefined) {
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeOption(
  option: QuestionOption,
  index: number
): NormalizedOption {
  if (typeof option === "string") {
    return {
      value: option,
      label: option,
    };
  }

  const value =
    option.value ??
    option.id ??
    option.label ??
    option.text ??
    option.title ??
    option.name ??
    `option-${index}`;

  const label =
    option.label ??
    option.text ??
    option.title ??
    option.name ??
    option.value ??
    option.id ??
    `Option ${index + 1}`;

  return {
    value: String(value),
    label: String(label),
  };
}

export default function OnboardingClient() {
  const router = useRouter();

  const [sectionIndex, setSectionIndex] = useState(0);
  const [responses, setResponses] = useState<OnboardingResponses>({});
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const currentSection = SECTIONS[sectionIndex];
  const progress = ((sectionIndex + 1) / TOTAL_SECTIONS) * 100;

  const visibleQuestions = useMemo(() => {
    return currentSection.questions.filter((question) => {
      if (!question.conditional) return true;

      const dependent = responses[question.conditional.questionId];

      if (Array.isArray(dependent)) {
        return dependent.includes(question.conditional.equals);
      }

      return dependent === question.conditional.equals;
    });
  }, [currentSection, responses]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/onboarding-progress", {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          if (res.status === 401) {
            router.replace("/login?next=/onboarding");
            return;
          }

          setInitializing(false);
          return;
        }

        const data = await res.json();

        if (data?.onboarding_complete) {
          router.replace("/dashboard");
          return;
        }

        if (
          data?.onboarding_responses &&
          typeof data.onboarding_responses === "object"
        ) {
          setResponses(data.onboarding_responses as OnboardingResponses);
        }

        const savedStep = Number(data?.onboarding_step);
        if (
          Number.isFinite(savedStep) &&
          savedStep >= 1 &&
          savedStep <= TOTAL_SECTIONS
        ) {
          setSectionIndex(savedStep - 1);
        }
      } catch (loadError) {
        console.error("Failed loading onboarding progress", loadError);
      } finally {
        setInitializing(false);
      }
    })();
  }, [router]);

  useEffect(() => {
    if (initializing) return;

    const timeout = setTimeout(async () => {
      try {
        await fetch("/api/onboarding-progress", {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            responses,
            onboarding_step: sectionIndex + 1,
          }),
        });
      } catch (saveError) {
        console.error("Autosave failed", saveError);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [responses, sectionIndex, initializing]);

  function setSingleValue(questionId: string, value: string) {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  }

  function toggleMultiValue(questionId: string, value: string) {
    const current = responses[questionId];
    const currentList = Array.isArray(current) ? current : [];

    const next = currentList.includes(value)
      ? currentList.filter((item) => item !== value)
      : [...currentList, value];

    setResponses((prev) => ({ ...prev, [questionId]: next }));
  }

  function validateQuestion(question: LocalOnboardingQuestion): string | null {
    const value = responses[question.id];

    if (question.required && !hasTextValue(value)) {
      return "Please complete all required questions before continuing.";
    }

    if (question.allowOther) {
      const otherKey = `${question.id}__other`;
      const otherValue = responses[otherKey];
      const hasOther =
        value === "other" || (Array.isArray(value) && value.includes("other"));

      if (hasOther && !hasTextValue(otherValue)) {
        return "Please add details for the Other option.";
      }
    }

    if (question.id === "website_url" && responses.has_website === "yes") {
      const website = typeof value === "string" ? value.trim() : "";
      if (!website || !isValidUrl(website)) {
        return "Please enter a valid website URL including http:// or https://.";
      }
    }

    return null;
  }

  function validateCurrentSection(): string | null {
    for (const question of visibleQuestions) {
      const issue = validateQuestion(question);
      if (issue) return issue;
    }
    return null;
  }

  function goNext() {
    const issue = validateCurrentSection();
    if (issue) {
      setError(issue);
      return;
    }

    setError(null);

    if (sectionIndex < TOTAL_SECTIONS - 1) {
      setSectionIndex((prev) => prev + 1);
    }
  }

  function goBack() {
    setError(null);
    setSectionIndex((prev) => Math.max(0, prev - 1));
  }

  async function finishOnboarding() {
    const issue = validateCurrentSection();
    if (issue) {
      setError(issue);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ responses }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setError(payload?.error ?? "Unable to save onboarding. Please try again.");
        setLoading(false);
        return;
      }

      setCompleted(true);
      setLoading(false);
    } catch (submitError) {
      console.error("Onboarding submit error", submitError);
      setError("Unexpected error while saving onboarding.");
      setLoading(false);
    }
  }

  function renderQuestion(question: LocalOnboardingQuestion) {
    const value = responses[question.id];
    const otherKey = `${question.id}__other`;
    const otherValue =
      typeof responses[otherKey] === "string"
        ? (responses[otherKey] as string)
        : "";

    const showOtherInput =
      question.allowOther &&
      (value === "other" || (Array.isArray(value) && value.includes("other")));

    const options = (question.options ?? []).map((option, index) =>
      normalizeOption(option, index)
    );

    if (question.type === "text") {
      return (
        <input
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(event) => setSingleValue(question.id, event.target.value)}
          placeholder="Type your answer..."
          className="mt-2 w-full rounded-xl border border-white/25 bg-white/10 p-3 text-white placeholder:text-white/40"
        />
      );
    }

    if (question.type === "long_text") {
      return (
        <textarea
          value={typeof value === "string" ? value : ""}
          onChange={(event) => setSingleValue(question.id, event.target.value)}
          placeholder="Type your answer..."
          className="mt-2 min-h-[120px] w-full rounded-xl border border-white/25 bg-white/10 p-3 text-white placeholder:text-white/40"
        />
      );
    }

    if (question.type === "single") {
      return (
        <div className="mt-3 space-y-2">
          {options.map((option, index) => (
            <button
              key={`${question.id}-${option.value}-${index}`}
              type="button"
              onClick={() => setSingleValue(question.id, option.value)}
              className={`w-full rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
                value === option.value
                  ? "border-brandOrange bg-brandOrange/20"
                  : "border-white/20 bg-white/5 hover:bg-white/10"
              }`}
            >
              {option.label}
            </button>
          ))}

          {showOtherInput ? (
            <input
              type="text"
              value={otherValue}
              onChange={(event) => setSingleValue(otherKey, event.target.value)}
              placeholder="Please specify"
              className="w-full rounded-xl border border-white/25 bg-white/10 p-3 text-white placeholder:text-white/40"
            />
          ) : null}
        </div>
      );
    }

    const selected = Array.isArray(value) ? value : [];

    return (
      <div className="mt-3 space-y-2">
        {options.map((option, index) => {
          const checked = selected.includes(option.value);

          return (
            <label
              key={`${question.id}-${option.value}-${index}`}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-200 ${
                checked
                  ? "border-brandOrange bg-brandOrange/20"
                  : "border-white/20 bg-white/5 hover:bg-white/10"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleMultiValue(question.id, option.value)}
              />
              <span>{option.label}</span>
            </label>
          );
        })}

        {showOtherInput ? (
          <input
            type="text"
            value={otherValue}
            onChange={(event) => setSingleValue(otherKey, event.target.value)}
            placeholder="Please specify"
            className="w-full rounded-xl border border-white/25 bg-white/10 p-3 text-white placeholder:text-white/40"
          />
        ) : null}
      </div>
    );
  }

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brandNavyDark text-white">
        Loading your onboarding...
      </div>
    );
  }

  if (completed) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brandNavyDark px-4 py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,124,167,0.25),_transparent_60%),_radial-gradient(circle_at_bottom,_rgba(210,122,44,0.20),_transparent_60%)]" />
        <div className="relative z-10 w-full max-w-2xl space-y-6 rounded-2xl border border-white/10 bg-brandNavy/80 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.65)] backdrop-blur-xl md:p-8">
          <h1 className="text-3xl font-bold">Your founder profile is ready 🎉</h1>
          <p className="text-white/80">
            Thanks for taking the time. Prospra will now tailor mentorship to
            your context, goals, and constraints.
          </p>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="rounded-xl bg-gradient-to-r from-[#4f7ca7] to-[#d27a2c] px-6 py-3 text-white"
            >
              Go to my dashboard →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brandNavyDark px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,124,167,0.25),_transparent_60%),_radial-gradient(circle_at_bottom,_rgba(210,122,44,0.20),_transparent_60%)]" />

      <div className="pointer-events-none fixed right-6 top-6 flex max-w-[260px] flex-col items-end gap-2">
        <div className="onboard-orb shadow-[0_0_25px_rgba(79,124,167,0.7)]" />
        <div className="animate-onboard-orbText rounded-xl border border-brandBlue/40 bg-brandNavy/90 px-3 py-2 text-xs text-white/80 backdrop-blur-md">
          This deeper onboarding gives Prospra the context it needs for sharper
          mentorship, better prioritization, and more useful guidance.
        </div>
      </div>

      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-white/10 bg-brandNavy/80 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.65)] backdrop-blur-xl md:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brandBlueLight/70">
              Prospra Onboarding
            </p>
            <p className="text-sm text-white/80">
              Section {sectionIndex + 1} of {TOTAL_SECTIONS}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-2 w-40 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#4f7ca7] to-[#d27a2c] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-white/70">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        <div className="space-y-6 animate-onboard-slide">
          <div>
            <h1 className="text-3xl font-bold">{currentSection.title}</h1>
            <p className="mt-2 text-white/70">{currentSection.description}</p>
          </div>

          <div className="space-y-5">
            {visibleQuestions.map((question) => (
              <div key={question.id}>
                <p className="text-white/90">
                  {question.prompt}
                  {question.required ? (
                    <span className="text-brandOrange"> *</span>
                  ) : null}
                </p>

                {question.helperText ? (
                  <p className="mt-1 text-xs text-white/60">
                    {question.helperText}
                  </p>
                ) : null}

                {renderQuestion(question)}
              </div>
            ))}
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              disabled={sectionIndex === 0}
              className="rounded-xl border border-white/25 bg-white/10 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Back
            </button>

            {sectionIndex < TOTAL_SECTIONS - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="rounded-xl bg-gradient-to-r from-[#4f7ca7] to-[#d27a2c] px-6 py-3 text-white"
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                onClick={finishOnboarding}
                disabled={loading}
                className="rounded-xl bg-gradient-to-r from-[#4f7ca7] to-[#d27a2c] px-6 py-3 text-white disabled:cursor-wait disabled:opacity-40"
              >
                {loading ? "Saving..." : "Finish 🎉"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}