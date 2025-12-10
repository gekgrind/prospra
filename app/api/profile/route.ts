import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function createClient(request: Request) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.headers.get("cookie") ?? "";
        },
      },
    }
  );
}

export async function PATCH(request: Request) {
  const supabase = createClient(request);

  // 🔐 Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 📨 Parse incoming body
  const updates = await request.json();

  // 🎯 Only allow fields that CAN be updated
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

  const cleanData: Record<string, any> = {};

  for (const key of allowedFields) {
    if (key in updates) {
      cleanData[key] = updates[key];
    }
  }

  // ⏱ Auto-update timestamp
  cleanData.updated_at = new Date().toISOString();

  // 🚀 Update the profile
  const { data, error } = await supabase
    .from("profiles")
    .update(cleanData)
    .eq("id", user.id)
    .select("*")
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

  // 🎉 Success
  return NextResponse.json({
    status: "success",
    profile: data,
  });
}
