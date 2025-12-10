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

export async function GET(request: Request) {
  const supabase = createClient(request);

  // 🔐 Get the logged-in user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 🔎 Fetch the user's profile
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Profile not found", details: error.message },
      { status: 404 }
    );
  }

  // 🎉 Success — return the profile
  return NextResponse.json({
    status: "success",
    profile,
  });
}
