import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { handleWebsiteCoachApiRequest } from "@/lib/web-intelligence/website-coach-api";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const supabase = await createClient();
  const response = await handleWebsiteCoachApiRequest(body, {
    async getUser() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      return { user, error };
    },
  });

  return NextResponse.json(response.body, { status: response.status });
}
