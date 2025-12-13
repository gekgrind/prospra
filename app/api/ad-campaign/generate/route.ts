import { NextRequest, NextResponse } from "next/server";
const supabase = createClient();
import OpenAI from "openai";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
    // ... rest of your code
}

function createClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

