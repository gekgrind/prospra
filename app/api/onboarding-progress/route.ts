// @ts-nocheck
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const FIELDS = [
  "name",
  "industry",
  "stage",
  "website",
  "audience",
  "offer",
  "goal90",
  "challenge",
  "onboarding_step",
];

function createSupabaseServerClient(cookieHeader: string) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          const cookie = cookieHeader
            .split(";")
            .find((c) => c.trim().startsWith(name + "="));
          return cookie ? cookie.split("=")[1] : null;
        },
        set() {},
        remove() {},
      },
    }
  );
}

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const supabase = createSupabaseServerClient(cookieHeader);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("profiles")
      .select(FIELDS.join(","))
      .eq("id", user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data ?? {}, { status: 200 });
  } catch (err: any) {
    console.error("Onboarding progress GET error:", err);
    return NextResponse.json(
      { error: err.message ?? "Unexpected server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const body = await request.json();
    const supabase = createSupabaseServerClient(cookieHeader);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const updateData: any = {};
    FIELDS.forEach((key) => {
      if (body[key] !== undefined && body[key] !== null) {
        updateData[key] = body[key];
      }
    });

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    console.error("Onboarding progress PATCH error:", err);
    return NextResponse.json(
      { error: err.message ?? "Unexpected server error" },
      { status: 500 }
    );
  }
}
