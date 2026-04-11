import { NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { createClient } from "@/lib/supabase/server";
import {
  buildBoardReviewPrompt,
  safeParseBoardReview,
  serializeBoardReviewMessage,
} from "@/lib/directorium/board-review";
import { DIRECTORIUM_ROLES } from "@/lib/directorium/roles";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await req.json();

    if (!conversationId || typeof conversationId !== "string") {
      return NextResponse.json(
        { error: "Invalid conversation id" },
        { status: 400 }
      );
    }

    const { data: conversation } = await supabase
      .from("conversations")
      .select("id, user_id")
      .eq("id", conversationId)
      .single();

    if (!conversation || conversation.user_id !== user.id) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "full_name, business_idea, industry, experience_level, goals, is_premium, plan_tier, subscription_status"
      )
      .eq("id", user.id)
      .single();

    const isPremium =
      Boolean(profile?.is_premium) ||
      (profile?.plan_tier && profile?.plan_tier !== "free" && profile?.subscription_status === "active");

    if (!isPremium) {
      return NextResponse.json(
        {
          error: "PREMIUM_REQUIRED",
          message: "Board Review is part of Prospra Premium.",
        },
        { status: 402 }
      );
    }

    const { data: messages } = await supabase
      .from("messages")
      .select("role, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(24);

    const { data: memories } = await supabase
      .from("ai_memory")
      .select("memory_type, memory, importance")
      .eq("user_id", user.id)
      .order("importance", { ascending: false })
      .limit(12);

    const { data: actionPlanCandidate } = await supabase
      .from("messages")
      .select("content")
      .eq("conversation_id", conversationId)
      .eq("role", "assistant")
      .ilike("content", "%Action Steps%")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const founderContext = [
      `Name: ${profile?.full_name || "Unknown"}`,
      `Business idea: ${profile?.business_idea || "Unknown"}`,
      `Industry: ${profile?.industry || "Unknown"}`,
      `Experience: ${profile?.experience_level || "Unknown"}`,
      `Goals: ${(profile?.goals || []).join(", ") || "Unknown"}`,
    ].join("\n");

    const memoryContext =
      memories && memories.length > 0
        ? memories
            .map((m) => `- (${m.memory_type}, importance ${m.importance}) ${m.memory}`)
            .join("\n")
        : "No memory context available.";

    const conversationContext =
      messages && messages.length > 0
        ? messages
            .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
            .join("\n\n")
        : "No conversation context available.";

    const actionPlanContext =
      actionPlanCandidate?.content || "No explicit action plan found in this conversation.";

    const prompt = buildBoardReviewPrompt({
      founderContext,
      memoryContext,
      actionPlanContext,
      conversationContext,
    });

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.4,
    });

    const parsed = safeParseBoardReview(text);

    if (!parsed) {
      return NextResponse.json(
        { error: "BOARD_REVIEW_PARSE_FAILED" },
        { status: 502 }
      );
    }

    const orderedRoles = DIRECTORIUM_ROLES.map((role) => {
      const matched = parsed.roles.find((item) => item.roleId === role.id);
      return {
        roleId: role.id,
        roleName: role.displayName,
        analysis:
          matched?.analysis ||
          `No analysis generated for ${role.displayName}. Retry the board review for a complete response.`,
        recommendations: matched?.recommendations?.slice(0, 4) || [],
      };
    });

    const normalized = {
      synthesis: parsed.synthesis,
      roles: orderedRoles,
    };

    const formattedMessage = serializeBoardReviewMessage(normalized);

    const { error: insertError } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      role: "assistant",
      content: formattedMessage,
    });

    if (insertError) {
      return NextResponse.json({ error: "Failed to save board review" }, { status: 500 });
    }

    return NextResponse.json({ boardReview: normalized });
  } catch (error) {
    console.error("BOARD_REVIEW_ERROR", error);
    return NextResponse.json(
      { error: "BOARD_REVIEW_FAILED", message: "Unable to generate board review." },
      { status: 500 }
    );
  }
}
