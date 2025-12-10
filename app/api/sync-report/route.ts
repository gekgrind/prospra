import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { userMessage, aiResponse, userId, conversationId, messageId } =
      await req.json();

    // ------------------------
    // VALIDATION
    // ------------------------
    if (!userId || !conversationId || !aiResponse) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const safeUserMessage = userMessage || "";

    // ------------------------
    // AI SUMMARY + INSIGHTS (AI SDK FORMAT)
    // ------------------------
    let summary = "";
    let insights = "";

    try {
      const { text } = await generateText({
        model: openai("gpt-4.1-mini"),
        messages: [
          {
            role: "system",
            content:
              "You are an analytics engine. Produce TWO things:\n" +
              "1. A 1–3 sentence summary of the exchange.\n" +
              "2. Bullet-point insights, each starting with a dash (-).",
          },
          {
            role: "user",
            content: `User Message:\n${safeUserMessage}\n\nAI Response:\n${aiResponse}`,
          },
        ],
        maxOutputTokens: 200,
        temperature: 0.3,
      });

      const result = (text || "").trim();

      if (result) {
        const lines = result
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l !== "");

        // First non-bullet line = summary
        summary = lines.find((l) => !l.startsWith("-")) || "No summary";

        // Bullet lines = insights
        insights = lines.filter((l) => l.startsWith("-")).join("\n");
      }
    } catch (error) {
      console.error("AI summarization failed:", error);
      summary = "Summary unavailable.";
      insights = "";
    }

    // ------------------------
    // DATABASE INSERT
    // ------------------------
    await supabase.from("mentor_sync_logs").insert({
      user_id: userId,
      conversation_id: conversationId,
      message_id: messageId,
      user_message: safeUserMessage,
      ai_response: aiResponse,
      summary,
      insights,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("SYNC REPORT ERROR:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
