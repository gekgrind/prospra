import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [{ data: saved, error: savedError }, { data: recent, error: recentError }] =
      await Promise.all([
        supabase
          .from("founderfuel_prompts")
          .select("id, template_id, title, prompt_text, is_saved, created_at")
          .eq("user_id", user.id)
          .eq("is_saved", true)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("founderfuel_prompts")
          .select("id, template_id, title, prompt_text, is_saved, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

    if (savedError || recentError) {
      throw savedError ?? recentError;
    }

    return NextResponse.json({ saved: saved ?? [], recent: recent ?? [] });
  } catch (error) {
    console.error("[FOUNDERFUEL_PROMPTS_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to load prompts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const promptText =
      typeof body?.promptText === "string" ? body.promptText.trim() : "";
    const templateId =
      typeof body?.templateId === "string" ? body.templateId.trim() : null;
    const isSaved = body?.isSaved === true;

    if (!title || !promptText) {
      return NextResponse.json(
        { error: "A title and prompt text are required" },
        { status: 400 }
      );
    }

    if (title.length > 120 || promptText.length > 8000) {
      return NextResponse.json(
        { error: "Prompt is too long to store" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("founderfuel_prompts")
      .insert({
        user_id: user.id,
        template_id: templateId,
        title,
        prompt_text: promptText,
        is_saved: isSaved,
      })
      .select("id, template_id, title, prompt_text, is_saved, created_at")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ prompt: data });
  } catch (error) {
    console.error("[FOUNDERFUEL_PROMPTS_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to record prompt" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const id = typeof body?.id === "string" ? body.id : "";
    const isSaved = body?.isSaved;

    if (!id || typeof isSaved !== "boolean") {
      return NextResponse.json(
        { error: "A prompt id and isSaved flag are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("founderfuel_prompts")
      .update({ is_saved: isSaved })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id, template_id, title, prompt_text, is_saved, created_at")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    return NextResponse.json({ prompt: data });
  } catch (error) {
    console.error("[FOUNDERFUEL_PROMPTS_PATCH_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to update prompt" },
      { status: 500 }
    );
  }
}
