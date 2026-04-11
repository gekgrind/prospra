import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { ONBOARDING_SECTIONS } from "@/lib/onboarding-framework";
import { trackServerEvent } from "@/lib/analytics/server";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

type JsonRecord = Record<string, unknown>;

const PROGRESS_FIELDS = [
  "onboarding_responses",
  "onboarding_sections",
  "founder_profile",
  "onboarding_step",
  "onboarding_complete",
  "website_url",
] as const;

function createSupabaseServerClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set() {
          // no-op in route handler
        },
        remove() {
          // no-op in route handler
        },
      },
    }
  );
}

function hasTextValue(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === "string" && value.trim().length > 0;
}

function buildSectionProgress(responses: JsonRecord) {
  return ONBOARDING_SECTIONS.map((section, index) => {
    const requiredQuestions = section.questions.filter((q) => q.required);
    const completed = requiredQuestions.every((question) =>
      hasTextValue(responses[question.id])
    );

    return {
      id: section.id,
      title: section.title,
      index,
      completed,
    };
  });
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient(request);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("profiles")
      .select(PROGRESS_FIELDS.join(","))
      .eq("id", user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const profile =
      data && typeof data === "object" ? (data as Record<string, unknown>) : {};
    const responses = (profile.onboarding_responses ?? {}) as JsonRecord;

    return NextResponse.json(
      {
        onboarding_responses: responses,
        onboarding_sections:
          profile.onboarding_sections ?? buildSectionProgress(responses),
        founder_profile: profile.founder_profile ?? null,
        onboarding_step: profile.onboarding_step ?? 1,
        onboarding_complete: profile.onboarding_complete ?? false,
        website_url: profile.website_url ?? null,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unexpected server error";
    console.error("Onboarding progress GET error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const supabase = createSupabaseServerClient(request);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const responses =
      body.responses && typeof body.responses === "object"
        ? (body.responses as JsonRecord)
        : {};

    const onboardingStep = Number(body.onboarding_step);
    const normalizedStep =
      Number.isFinite(onboardingStep) && onboardingStep >= 1
        ? Math.min(onboardingStep, ONBOARDING_SECTIONS.length)
        : 1;

    const analyticsStep = normalizedStep;

    const updateData: Record<string, unknown> = {
      onboarding_responses: responses,
      onboarding_sections: buildSectionProgress(responses),
      onboarding_step: normalizedStep,
    };

    if (
      responses.has_website === "yes" &&
      typeof responses.website_url === "string"
    ) {
      updateData.website_url = responses.website_url.trim();
    } else {
      updateData.website_url = null;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id);

    if (updateError) {
      await trackServerEvent(ANALYTICS_EVENTS.ONBOARDING_STEP_SAVE_FAILED, {
        user_id: user.id,
        step: analyticsStep,
      });

      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    await trackServerEvent(ANALYTICS_EVENTS.ONBOARDING_STEP_SAVED, {
      user_id: user.id,
      step: analyticsStep,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: unknown) {
    await trackServerEvent(ANALYTICS_EVENTS.ONBOARDING_STEP_SAVE_FAILED, {
      reason: "unexpected_error",
    });

    const message =
      err instanceof Error ? err.message : "Unexpected server error";
    console.error("Onboarding progress PATCH error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}