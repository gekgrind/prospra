// /app/api/goals/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id"); // you can swap this to your auth logic
    if (!userId) {
      return NextResponse.json({ error: "Missing user id" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ goals: data ?? [] });
  } catch (err) {
    console.error("[GOALS_GET_ERROR]", err);
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Missing user id" }, { status: 401 });
    }

    const body = await req.json();

    const payload = {
      user_id: userId,
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
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
  }
}
