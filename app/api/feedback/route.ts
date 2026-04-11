import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isFeedbackType,
  sanitizeContext,
  sanitizeFeedbackMessage,
  type FeedbackType,
} from "@/lib/feedback";

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null as const };
  }

  return { supabase, user };
}

async function isAdminUser(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (error) return false;
  return Boolean(profile?.is_admin);
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const feedbackType = body?.feedback_type;
    const message = sanitizeFeedbackMessage(body?.message);

    if (typeof feedbackType !== "string" || !isFeedbackType(feedbackType)) {
      return NextResponse.json({ error: "Invalid feedback type." }, { status: 400 });
    }

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    if (message.length > 4000) {
      return NextResponse.json({ error: "Message must be 4000 characters or less." }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan_type")
      .eq("id", user.id)
      .maybeSingle();

    const sanitizedContext = sanitizeContext(body?.context);
    const context = {
      ...sanitizedContext,
      user_plan: sanitizedContext.user_plan ?? profile?.plan_type ?? "free",
    };

    const { data, error } = await supabase
      .from("feedback_items")
      .insert({
        user_id: user.id,
        feedback_type: feedbackType as FeedbackType,
        message,
        context,
      })
      .select("id")
      .single();

    if (error) {
      console.error("feedback insert error", error);
      return NextResponse.json({ error: "Could not submit feedback." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
  } catch (error) {
    console.error("feedback post error", error);
    return NextResponse.json({ error: "Unexpected error submitting feedback." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await isAdminUser(supabase, user.id);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const type = req.nextUrl.searchParams.get("type");

    let query = supabase
      .from("feedback_items")
      .select("id, user_id, feedback_type, message, context, status, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (type && isFeedbackType(type)) {
      query = query.eq("feedback_type", type);
    }

    const { data, error } = await query;

    if (error) {
      console.error("feedback admin list error", error);
      return NextResponse.json({ error: "Could not load feedback." }, { status: 500 });
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (error) {
    console.error("feedback list error", error);
    return NextResponse.json({ error: "Unexpected error loading feedback." }, { status: 500 });
  }
}
