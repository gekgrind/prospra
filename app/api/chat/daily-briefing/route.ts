import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export async function POST(req: Request) {
  try {
    const { profile } = await req.json();

    const prompt = `
Generate a premium, concise "founder daily briefing" insight for the dashboard.
Use this user's onboarding data:

Industry: ${profile.industry}
Stage: ${profile.stage}
Audience: ${profile.audience}
Main Offer: ${profile.offer}
90-Day Goal: ${profile.goal90}
Biggest Challenge: ${profile.challenge}

Tone: High-end, minimalist, strategic. ONE sentence only.
    `;

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return Response.json({ content: text.trim() });
  } catch (err) {
    console.error("DAILY BRIEFING ERROR:", err);
    return Response.json(
      { error: "Failed to generate briefing" },
      { status: 500 }
    );
  }
}
