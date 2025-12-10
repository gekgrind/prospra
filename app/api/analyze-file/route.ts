// app/api/analyze-file/route.ts

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();

export async function POST(req: Request) {
  try {
    const { userId, fileUrl } = await req.json();

    if (!fileUrl) {
      return NextResponse.json({ error: "Missing fileUrl" }, { status: 400 });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

    // Analyze the file using GPT-4o with vision
    const analysis = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are Prospra, the AI mentor. Analyze the uploaded file and extract insights that would be helpful for an entrepreneur."
        },
        {
          role: "user",
          content: `Here is the file to analyze: ${fileUrl}`
        }
      ]
    });

    const summary = analysis.choices?.[0]?.message?.content || "No analysis returned.";

    // Save analysis reference in database
    await supabase.from("uploads").insert({
      user_id: userId,
      file_url: fileUrl,
      file_type: "uploaded_file",
      summary: summary
    });

    return NextResponse.json({ summary });
  } catch (err) {
    console.error("Analyze File API Error:", err);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
