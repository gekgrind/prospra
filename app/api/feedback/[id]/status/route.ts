import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isFeedbackStatus } from "@/lib/feedback";

async function getAdminSupabase() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
  return { supabase, user: null, isAdmin: false };
}

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  return { supabase, user, isAdmin: Boolean(profile?.is_admin) };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user, isAdmin } = await getAdminSupabase();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const status = body?.status;

    if (typeof status !== "string" || !isFeedbackStatus(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const { error } = await supabase
      .from("feedback_items")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("feedback status update error", error);
      return NextResponse.json({ error: "Could not update feedback status." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("feedback status route error", error);
    return NextResponse.json({ error: "Unexpected error updating status." }, { status: 500 });
  }
}