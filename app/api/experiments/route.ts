import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAllFlagEvaluations } from "@/lib/experiments/evaluate";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const evaluations = getAllFlagEvaluations({ userId: user?.id });

  return NextResponse.json({
    flags: evaluations,
    context: { userId: user?.id ?? null },
  });
}
