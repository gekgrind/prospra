import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SHARED_PROFILE_SELECT = `
  id,
  full_name,
  business_idea,
  industry,
  experience_level,
  goals,
  plan_tier,
  is_premium,
  subscription_status,
  daily_credit_limit,
  daily_credits_used,
  last_credit_reset,
  business_type
`;

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(SHARED_PROFILE_SELECT)
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Profile not found", details: error.message },
      { status: 404 }
    );
  }

  return NextResponse.json({
    status: "success",
    profile,
  });
}