import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { buildPromptLabUserPayload, buildSystemPrompt, createFallbackPrompt, heuristicScore } from "@/lib/prompt-lab/prompt-engine";
import { PromptLabFormState } from "@/lib/prompt-lab/types";

type RequestBody = {
  action?: "generate" | "improve" | "score";
  form: PromptLabFormState;
  existingPrompt?: string;
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function generateWithClaude(messages: { role: "user" | "assistant"; content: string }[]) {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-7-sonnet-latest",
      max_tokens: 1300,
      temperature: 0.5,
      messages,
    }),
  });

  if (!response.ok) return null;
  const data = (await response.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = data.content?.find((block) => block.type === "text")?.text;
  return text || null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody;
    const action = body.action ?? "generate";

    if (!body?.form?.taskType || !body?.form?.objective || !body?.form?.deliverable || !body?.form?.audienceType || !body?.form?.audienceDetails) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let memory: Record<string, string | null> = {};
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("industry,target_audience,growth_goal,primary_offer,business_stage,tone_preference")
        .eq("id", user.id)
        .maybeSingle();

      memory = {
        businessType: profile?.industry ?? null,
        audience: profile?.target_audience ?? null,
        goals: profile?.growth_goal ?? null,
        offers: profile?.primary_offer ?? null,
        stage: profile?.business_stage ?? null,
        tonePreference: profile?.tone_preference ?? null,
      };
    }

    if (action === "score") {
      const score = heuristicScore(body.existingPrompt || "", body.form.platform);
      return NextResponse.json({ score });
    }

    const systemPrompt = buildSystemPrompt(body.form.platform);
    const payload = buildPromptLabUserPayload(body.form, memory);

    const objective =
      action === "improve"
        ? `Improve this prompt while preserving original intent. Existing prompt:\n${body.existingPrompt || ""}`
        : "Generate a premium, platform-optimized prompt.";

    const userContent = `${objective}\n\nInput JSON:\n${JSON.stringify(payload, null, 2)}`;

    const claudeText = await generateWithClaude([{ role: "user", content: `${systemPrompt}\n\n${userContent}` }]);

    let content = claudeText;
    if (!content) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        temperature: 0.5,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      });
      content = completion.choices[0]?.message?.content ?? "";
    }

    const fallback = {
      prompt: createFallbackPrompt(body.form),
      platform: body.form.platform,
      techniques: ["Role framing", "Constraint stacking", "Output schema"],
      whyItWorks: [
        "The prompt separates objective, audience, constraints, and quality bar.",
        "It preserves founder intent while improving specificity and execution guidance.",
      ],
    };

    const parsed = parseJson(content || "", fallback);

    return NextResponse.json({
      prompt: parsed.prompt ?? fallback.prompt,
      platform: parsed.platform ?? body.form.platform,
      techniques: parsed.techniques ?? fallback.techniques,
      whyItWorks: parsed.whyItWorks ?? fallback.whyItWorks,
    });
  } catch (error) {
    console.error("[PROMPT_LAB_API_ERROR]", error);
    return NextResponse.json({ error: "Failed to process prompt." }, { status: 500 });
  }
}
