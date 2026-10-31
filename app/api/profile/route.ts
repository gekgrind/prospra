import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SHARED_PROFILE_SELECT } from "@/lib/identity/profile";

export async function PATCH(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updates = await request.json();

  const allowedFields = [
    "full_name",
    "business_idea",
    "industry",
    "experience_level",
    "goals",
    "memory_enabled",
    "memory_use_private",
    "memory_retention_days",
  ];

  const cleanData: Record<string, unknown> = {};

  for (const key of allowedFields) {
    if (key in updates) {
      cleanData[key] = updates[key];
    }
  }

  cleanData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("profiles")
    .update(cleanData)
    .eq("id", user.id)
    .select(SHARED_PROFILE_SELECT)
    .single();

  if (error) {
    return NextResponse.json(
      {
        error: "Profile update failed",
        details: error.message,
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    status: "success",
    profile: data,
  });
}
