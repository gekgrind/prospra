import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import {
  buildConversationOutputsPrompt,
  buildProfileSummary,
  mentorOutputSchema,
  normalizeMessages,
} from "@/lib/mentor/conversationOutputs";

function createClient(request: Request) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          try {
            const raw = request.headers.get("cookie");
            if (!raw) return undefined;
            const entry = raw
              .split(";")
              .map((value) => value.trim())
              .find((value) => value.startsWith(`${name}=`));

            const parsed = entry?.slice(name.length + 1);
            return parsed && parsed.length > 0 ? parsed : undefined;
          } catch {
            return undefined;
          }
        },
      },
    }
  );
}

async function assertConversationOwnership(supabase: ReturnType<typeof createServerClient>, conversationId: string, userId: string) {
  const { data: conversation, error } = await supabase
    .from("conversations")
    .select("id, user_id")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return conversation;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
    }

    const supabase = createClient(req);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversation = await assertConversationOwnership(supabase, conversationId, user.id);
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("conversation_outputs")
      .select("conversation_id, summary, insights, action_plan, recommended_priority, risk_or_blocker, updated_at")
      .eq("conversation_id", conversationId)
      .maybeSingle();

    if (error) {
      console.error("CONVERSATION_OUTPUTS_FETCH_ERROR", error);
      return NextResponse.json({ error: "Failed to load outputs" }, { status: 500 });
    }

    return NextResponse.json({ outputs: data ?? null });
  } catch (error) {
    console.error("CONVERSATION_OUTPUTS_GET_ERROR", error);
    return NextResponse.json({ error: "Unexpected error loading outputs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { conversationId } = await req.json();

    if (!conversationId || typeof conversationId !== "string") {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
    }

    const supabase = createClient(req);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversation = await assertConversationOwnership(supabase, conversationId, user.id);
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const [{ data: profile }, { data: messages, error: messagesError }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("messages")
        .select("role, content")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true }),
    ]);

    if (messagesError) {
      console.error("CONVERSATION_OUTPUTS_MESSAGES_ERROR", messagesError);
      return NextResponse.json({ error: "Failed to load conversation messages" }, { status: 500 });
    }

    const safeMessages = (messages ?? []).filter(
      (message) =>
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0
    ) as { role: "user" | "assistant"; content: string }[];

    if (safeMessages.length < 2) {
      return NextResponse.json(
        { error: "Add more conversation context before generating outputs." },
        { status: 422 }
      );
    }

    const prompt = buildConversationOutputsPrompt({
      profileSummary: buildProfileSummary(profile as Record<string, unknown> | null),
      conversationText: normalizeMessages(safeMessages),
    });

    const { object: output } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: mentorOutputSchema,
      prompt,
    });

    const payload = {
      conversation_id: conversationId,
      user_id: user.id,
      summary: output.summary,
      insights: output.insights,
      action_plan: output.actionPlan,
      recommended_priority: output.recommendedPriority,
      risk_or_blocker: output.riskOrBlocker,
      source_message_count: safeMessages.length,
      updated_at: new Date().toISOString(),
    };

    const { data: saved, error: upsertError } = await supabase
      .from("conversation_outputs")
      .upsert(payload, { onConflict: "conversation_id" })
      .select("conversation_id, summary, insights, action_plan, recommended_priority, risk_or_blocker, updated_at")
      .single();

    if (upsertError) {
      console.error("CONVERSATION_OUTPUTS_UPSERT_ERROR", upsertError);
      return NextResponse.json({ error: "Failed to save generated outputs" }, { status: 500 });
    }

    return NextResponse.json({ outputs: saved });
  } catch (error) {
    console.error("CONVERSATION_OUTPUTS_GENERATE_ERROR", error);
    return NextResponse.json(
      { error: "Unable to generate outputs right now. Please try again." },
      { status: 500 }
    );
  }
}
