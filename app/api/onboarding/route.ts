import { NextResponse, NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { ONBOARDING_SECTIONS } from "@/lib/onboarding-framework";
import { trackServerEvent } from "@/lib/analytics/server";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

type JsonRecord = Record<string, unknown>;

function hasTextValue(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === "string" && value.trim().length > 0;
}

function buildSectionProgress(responses: JsonRecord) {
  return ONBOARDING_SECTIONS.map((section, index) => {
    const requiredQuestions = section.questions.filter((q) => q.required);
    const completed = requiredQuestions.every((question) => hasTextValue(responses[question.id]));

    return {
      id: section.id,
      title: section.title,
      index,
      completed,
    };
  });
}

function mapFounderProfile(responses: JsonRecord) {
  return {
    founder_name: responses.founder_name ?? null,
    founder_role: responses.founder_role ?? null,
    industry: responses.industry === "__other__" ? responses.industry__other ?? null : responses.industry ?? null,
    stage: responses.stage ?? null,
    target_audience: responses.target_audience ?? null,
    offer_summary: responses.offer_summary ?? null,
    goal_90_day: responses.goal_90_day ?? null,
    biggest_challenge: responses.biggest_challenge ?? null,
    has_website: responses.has_website ?? null,
    website_url: responses.website_url ?? null,
    website_priority:
      responses.website_priority === "__other__"
        ? responses.website_priority__other ?? null
        : responses.website_priority ?? null,
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    const payload = (await request.json()) as Record<string, unknown>;
    const responses =
      payload.responses && typeof payload.responses === "object"
        ? (payload.responses as JsonRecord)
        : null;

    if (!responses) {
      return NextResponse.json(
        { error: "Expected payload shape: { responses: Record<string, ...> }" },
        { status: 400 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const websiteUrl =
      responses.has_website === "yes" && typeof responses.website_url === "string"
      ? responses.website_url.trim() || null
      : null;

    const updateData: Record<string, unknown> = {
      onboarding_responses: responses,
      onboarding_sections: buildSectionProgress(responses),
      founder_profile: mapFounderProfile(responses),

      onboarding_completed_at: new Date().toISOString(),
      onboarding_complete: true,
      onboarding_step: ONBOARDING_SECTIONS.length,

      website: websiteUrl,
      stage: responses.stage ?? null,
      audience: responses.target_audience ?? null,
      offer: responses.offer_summary ?? null,
      goal90: responses.goal_90_day ?? null,
      challenge: responses.biggest_challenge ?? null,
      name: responses.founder_name ?? null,
      business_idea: responses.offer_summary ?? null,
};

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id);

    if (updateError) {
      await trackServerEvent(ANALYTICS_EVENTS.ONBOARDING_COMPLETION_FAILED, {
        user_id: user.id,
        reason: "profile_update_failed",
      });

      console.error("Profile update error:", updateError);

      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const accessToken = session?.access_token;

    if (accessToken && websiteUrl) {
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/website-analyzer`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              website: websiteUrl,
              user_id: user.id,
            }),
          }
        );
      } catch {
        // best effort only
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected server error";
    console.error("Onboarding API Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}