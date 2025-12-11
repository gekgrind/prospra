// app/api/goals/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Tell Next.js this route should always be dynamic
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // ✅ Proper server-side Supabase client
    const supabase = await createClient();

    // ✅ Use Supabase auth instead of manual headers
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ goals: data ?? [] });
  } catch (err) {
    console.error("[GOALS_GET_ERROR]", err);
    return NextResponse.json(
      { error: "Failed to fetch goals" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const payload = {
      user_id: user.id,
      type: body.type ?? "revenue",
      label: body.label ?? "New Goal",
      target_value: body.target_value ?? 0,
      current_value: body.current_value ?? 0,
      period: body.period ?? "monthly",
      period_label: body.period_label ?? null,
      deadline: body.deadline ?? null,
    };

    const { data, error } = await supabase
      .from("goals")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ goal: data });
  } catch (err) {
    console.error("[GOALS_POST_ERROR]", err);
    return NextResponse.json(
      { error: "Failed to create goal" },
      { status: 500 }
    );
  }
}
