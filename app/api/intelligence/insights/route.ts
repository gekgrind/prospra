import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchSharedInsights } from "@/lib/intelligence/shared-layer";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const insights = await fetchSharedInsights(supabase as never, user.id, "prospra");
    return NextResponse.json({ insights });
  } catch (error) {
    console.error("INTELLIGENCE_INSIGHTS_GET_ERROR", error);
    return NextResponse.json({ error: "Failed to load shared insights" }, { status: 500 });
  }
}
