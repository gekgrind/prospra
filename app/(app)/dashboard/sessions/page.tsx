import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

type SessionRow = {
  id: string;
  title: string;
  created_at: string | null;
  updated_at: string | null;
};

type SessionOutputRow = {
  conversation_id: string;
  summary: string | null;
  recommended_priority: string | null;
};

type SessionListItem = SessionRow & {
  summary: string | null;
  recommendedPriority: string | null;
  messageCount: number;
};

async function loadSessions(): Promise<
  | { sessions: SessionListItem[]; error: null }
  | { sessions: null; error: string }
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { sessions: null, error: "Sign in again to view your sessions." };
    }

    const { data: conversations, error: conversationsError } = await supabase
      .from("conversations")
      .select("id, title, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (conversationsError) {
      throw conversationsError;
    }

    const rows = (conversations ?? []) as SessionRow[];

    if (rows.length === 0) {
      return { sessions: [], error: null };
    }

    const conversationIds = rows.map((row) => row.id);

    const [{ data: outputs }, { data: messageRows }] = await Promise.all([
      supabase
        .from("conversation_outputs")
        .select("conversation_id, summary, recommended_priority")
        .in("conversation_id", conversationIds),
      supabase
        .from("messages")
        .select("conversation_id")
        .in("conversation_id", conversationIds),
    ]);

    const outputByConversation = new Map(
      ((outputs ?? []) as SessionOutputRow[]).map((output) => [
        output.conversation_id,
        output,
      ])
    );

    const messageCounts = new Map<string, number>();
    for (const message of (messageRows ?? []) as { conversation_id: string }[]) {
      messageCounts.set(
        message.conversation_id,
        (messageCounts.get(message.conversation_id) ?? 0) + 1
      );
    }

    const sessions = rows.map((row) => {
      const output = outputByConversation.get(row.id);
      return {
        ...row,
        summary: output?.summary ?? null,
        recommendedPriority: output?.recommended_priority ?? null,
        messageCount: messageCounts.get(row.id) ?? 0,
      };
    });

    return { sessions, error: null };
  } catch (error) {
    console.error("[SESSIONS_PAGE_LOAD_ERROR]", error);
    return {
      sessions: null,
      error: "Prospra could not load your sessions. Retry the page shortly.",
    };
  }
}

function formatSessionDate(value: string | null): string {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default async function DashboardSessionsPage() {
  const { sessions, error } = await loadSessions();

  return (
    <div className="space-y-6">
      <Card className="bg-brandNavy border-brandBlue/40">
        <CardHeader>
          <CardTitle className="text-brandBlueLight">Sessions</CardTitle>
          <CardDescription className="text-brandBlueLight/70">
            Your conversation timeline with the AI Mentor, with summaries where
            a session recap has been generated.
          </CardDescription>
        </CardHeader>
        {error ? (
          <CardContent className="text-sm text-red-400">{error}</CardContent>
        ) : sessions && sessions.length === 0 ? (
          <CardContent className="text-sm text-brandBlueLight/70">
            No sessions yet. Start a conversation with the AI Mentor and it
            will show up here.
          </CardContent>
        ) : null}
      </Card>

      {sessions && sessions.length > 0 ? (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Link
              key={session.id}
              href={`/mentor?conversation=${session.id}`}
              className="block"
            >
              <Card className="bg-brandNavy border-brandBlue/40 transition-colors hover:border-brandBlue/70">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base text-brandBlueLight">
                      {session.title || "Untitled session"}
                    </CardTitle>
                    <span className="text-xs text-brandBlueLight/60">
                      {formatSessionDate(session.updated_at ?? session.created_at)}
                    </span>
                  </div>
                  <CardDescription className="text-brandBlueLight/70">
                    {session.messageCount}{" "}
                    {session.messageCount === 1 ? "message" : "messages"}
                    {session.recommendedPriority
                      ? ` · Priority: ${session.recommendedPriority}`
                      : ""}
                  </CardDescription>
                </CardHeader>
                {session.summary ? (
                  <CardContent className="pt-0 text-sm text-brandBlueLight/80">
                    {session.summary}
                  </CardContent>
                ) : null}
              </Card>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
