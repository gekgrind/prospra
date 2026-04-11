import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@supabase/ssr";

// Brain modules
import { FIXED_RULES } from "@/lib/brain/fixed-rules";
import { getRelevantResources } from "@/lib/brain/resources-brain";
import { enforceUsageLimit, recordUsageEvent } from "@/lib/monetization";

type StoredMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type MemoryRow = {
  content?: unknown;
  summary?: unknown;
};

const payloadSchema = z.object({
  conversationId: z.string().min(1),
  mode: z.string().optional().default("mentor"),
  profile: z
    .object({
      fullName: z.string().optional().nullable(),
      businessIdea: z.string().optional().nullable(),
      industry: z.string().optional().nullable(),
      experienceLevel: z.string().optional().nullable(),
      goals: z.array(z.string()).optional().nullable(),
    })
    .optional()
    .default({}),
});

function parseCookieHeader(
  raw: string | null
): Array<{ name: string; value: string }> {
  if (!raw) return [];

  return raw
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((cookie) => {
      const index = cookie.indexOf("=");

      if (index === -1) {
        return { name: cookie, value: "" };
      }

      return {
        name: cookie.slice(0, index),
        value: cookie.slice(index + 1),
      };
    });
}

function createClient(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get("cookie"));
      },
      setAll() {
        // No-op in this route handler
      },
    },
  });
}

function formatConversationForModel(messages: StoredMessage[]) {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

function buildMemoryBlock(memoryRows: MemoryRow[]) {
  if (!memoryRows.length) return "No memory yet.";

  return memoryRows
    .map((row) => {
      if (typeof row.content === "string" && row.content.trim()) {
        return `- ${row.content.trim()}`;
      }

      if (typeof row.summary === "string" && row.summary.trim()) {
        return `- ${row.summary.trim()}`;
      }

      return "";
    })
    .filter(Boolean)
    .join("\n");
}

function buildRulesBlock(rules: unknown): string {
  if (Array.isArray(rules)) {
    return rules
      .map((rule) => (typeof rule === "string" ? `- ${rule}` : ""))
      .filter(Boolean)
      .join("\n");
  }

  if (typeof rules === "string") {
    return rules;
  }

  return "Follow the platform's fixed mentoring rules.";
}

function buildSystemPrompt({
  mode,
  profile,
  memoryBlock,
  resourcesBlock,
}: {
  mode: string;
  profile: {
    fullName?: string | null;
    businessIdea?: string | null;
    industry?: string | null;
    experienceLevel?: string | null;
    goals?: string[] | null;
  };
  memoryBlock: string;
  resourcesBlock: string;
}) {
  const rulesBlock = buildRulesBlock(FIXED_RULES);

  return `
You are Prospra, an elite startup mentor.

Mode: ${mode}

Founder Profile:
Name: ${profile.fullName ?? "Unknown"}
Idea: ${profile.businessIdea ?? "Unknown"}
Industry: ${profile.industry ?? "Unknown"}
Experience: ${profile.experienceLevel ?? "Unknown"}
Goals: ${
    Array.isArray(profile.goals) && profile.goals.length > 0
      ? profile.goals.join(", ")
      : "None"
  }

Memory:
${memoryBlock}

Resources:
${resourcesBlock}

Rules:
${rulesBlock}

Respond with:
- Clear insight
- Actionable next steps
- Practical advice
- No fluff
`;
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured." },
        { status: 503 }
      );
    }

    const json = await request.json().catch(() => null);
    const parsed = payloadSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload." },
        { status: 400 }
      );
    }

    const { conversationId, mode, profile } = parsed.data;

    const supabase = createClient(request);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("AUTH_ERROR", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const usageCheck = await enforceUsageLimit(
      supabase,
      user.id,
      "mentor_message"
    );

    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          role: "assistant",
          content: "You've hit your limit. Upgrade to keep going.",
        },
        { status: 429 }
      );
    }

    const { data: memory, error: memoryError } = await supabase
      .from("ai_memory")
      .select("*")
      .eq("user_id", user.id);

    if (memoryError) {
      console.error("MEMORY_LOAD_ERROR", memoryError);
    }

    const memoryRows: MemoryRow[] = (memory as MemoryRow[]) ?? [];

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (conversationError) {
      console.error("CONVERSATION_LOAD_ERROR", conversationError);
      return NextResponse.json(
        { error: "Failed to load conversation." },
        { status: 500 }
      );
    }

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 }
      );
    }

    const { data: recentMessages, error: messageError } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(24);

    if (messageError) {
      console.error("MESSAGE_LOAD_ERROR", messageError);
      return NextResponse.json(
        { error: "Failed to load messages." },
        { status: 500 }
      );
    }

    const orderedMessages = ((recentMessages ?? []) as StoredMessage[]).reverse();
    const modelMessages = formatConversationForModel(orderedMessages);

    if (!modelMessages.length) {
      return NextResponse.json(
        { error: "No messages found." },
        { status: 400 }
      );
    }

    let resourcesBlock = "No relevant resources.";

    try {
      const latestUserMessage =
        [...modelMessages]
          .reverse()
          .find((message) => message.role === "user")?.content ?? "";

      const resources = await getRelevantResources(latestUserMessage);

      if (Array.isArray(resources) && resources.length > 0) {
        resourcesBlock = resources
          .map((r) => {
            if (typeof r === "string" && r.trim()) {
              return `- ${r.trim()}`;
            }

            if (r && typeof r === "object") {
              const resource = r as {
                title?: unknown;
                summary?: unknown;
                content?: unknown;
              };

              const title =
                typeof resource.title === "string" && resource.title.trim()
                  ? resource.title.trim()
                  : "Resource";

              const detail =
                typeof resource.summary === "string" && resource.summary.trim()
                  ? resource.summary.trim()
                  : typeof resource.content === "string" && resource.content.trim()
                  ? resource.content.trim()
                  : "";

              return detail ? `- ${title}: ${detail}` : `- ${title}`;
            }

            return "";
          })
          .filter(Boolean)
          .join("\n");
      }
    } catch (error) {
      console.error("RESOURCE_ERROR", error);
    }

    const systemPrompt = buildSystemPrompt({
      mode,
      profile,
      memoryBlock: buildMemoryBlock(memoryRows),
      resourcesBlock,
    });

    await recordUsageEvent(supabase, user.id, "mentor_message", 1, {
      conversationId,
      mode,
      route: "api/mentor",
    });

    const response = streamText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      messages: modelMessages,
      temperature: 0.7,
    });

    return response.toUIMessageStreamResponse();
  } catch (error) {
    console.error("MENTOR_ROUTE_ERROR", error);

    return NextResponse.json(
      { error: "Failed to generate response." },
      { status: 500 }
    );
  }
}