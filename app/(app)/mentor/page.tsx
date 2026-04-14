"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import {
  AlertCircle,
  Crown,
  Menu,
  Plus,
  RefreshCcw,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react";

type Conversation = {
  id: string;
  title: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type Profile = {
  full_name?: string | null;
  business_idea?: string | null;
  industry?: string | null;
  experience_level?: string | null;
  goals?: string[] | null;
  profileName?: string | null;
};

type ModeOption =
  | "mentor"
  | "website-coach"
  | "seo-ux"
  | "funnel-mapping"
  | "cta-analyzer"
  | "board-review";

const MODE_LABELS: Record<ModeOption, string> = {
  mentor: "Mentor Mode",
  "website-coach": "Website Coach",
  "seo-ux": "SEO/UX Scoring",
  "funnel-mapping": "Funnel Mapping",
  "cta-analyzer": "CTA Analyzer",
  "board-review": "Board Review",
};

const MODE_DESCRIPTIONS: Record<ModeOption, string> = {
  mentor: "Tailored entrepreneurial guidance.",
  "website-coach": "Deep-dive feedback on your website’s clarity and conversion.",
  "seo-ux": "SEO/UX scoring and optimization suggestions for your pages.",
  "funnel-mapping": "Map your customer journey and plug funnel leaks.",
  "cta-analyzer": "Analyze and upgrade your CTAs and key copy moments.",
  "board-review": "Escalate your challenge for board-level strategic review.",
};

type MentorMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content?: string;
  parts?: Array<{ type?: string; text?: string; content?: string }>;
};

type ConversationOutputs = {
  summary: string;
  insights: string[];
  action_plan: string[];
  recommended_priority: string;
  risk_or_blocker: string;
  updated_at: string;
};

type ActionPlanTaskStatus = "pending" | "in_progress" | "completed";

type ActionPlanTask = {
  id: string;
  title: string;
  status: ActionPlanTaskStatus;
  updated_at?: string | null;
};

type ActionPlan = {
  id: string;
  tasks: ActionPlanTask[];
};

const STARTER_PROMPTS = [
  "Help me pressure-test my business idea before I invest more time.",
  "Rewrite my offer positioning so it's clearer and more compelling.",
  "Give me a pragmatic pricing strategy for my first 10 customers.",
  "Create a 30-day launch plan with clear weekly priorities.",
  "Who is the sharpest target customer for what I'm building?",
  "What should I focus on this week to create real momentum?",
];

function extractMessageText(
  message: Partial<MentorMessage> | null | undefined
): string {
  if (!message) return "";

  if (typeof message.content === "string" && message.content.trim()) {
    return message.content;
  }

  if (Array.isArray(message.parts)) {
    return message.parts
      .map((part) => part?.text ?? part?.content ?? "")
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  return "";
}

function sanitizeActionPlanTasks(value: unknown): ActionPlanTask[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((task, index): ActionPlanTask | null => {
      if (!task || typeof task !== "object") {
        return null;
      }

      const candidate = task as Partial<ActionPlanTask>;

      const rawStatus: ActionPlanTaskStatus =
        candidate.status === "completed" ||
        candidate.status === "in_progress" ||
        candidate.status === "pending"
          ? candidate.status
          : "pending";

      return {
        id:
          typeof candidate.id === "string" && candidate.id.trim()
            ? candidate.id
            : `task-${index}`,
        title:
          typeof candidate.title === "string" && candidate.title.trim()
            ? candidate.title
            : "Untitled task",
        status: rawStatus,
        updated_at:
          typeof candidate.updated_at === "string"
            ? candidate.updated_at
            : null,
      };
    })
    .filter((task): task is ActionPlanTask => task !== null);
}

function computeActionPlanProgress(tasks: ActionPlanTask[]) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === "completed").length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    percentage,
  };
}

function ConversationRail({
  conversations,
  isLoading,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
}: {
  conversations: Conversation[];
  isLoading: boolean;
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void | Promise<void>;
  onNewConversation: () => void | Promise<void>;
}) {
  return (
    <aside className="hidden w-80 shrink-0 md:block">
      <ConversationRailContent
        conversations={conversations}
        isLoading={isLoading}
        activeConversationId={activeConversationId}
        onSelectConversation={onSelectConversation}
        onNewConversation={onNewConversation}
      />
    </aside>
  );
}

function ConversationRailContent({
  conversations,
  isLoading,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
}: {
  conversations: Conversation[];
  isLoading: boolean;
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void | Promise<void>;
  onNewConversation: () => void | Promise<void>;
}) {
  return (
    <div className="flex h-full flex-col border-r border-brandBlue/30 bg-brandNavy">
      <div className="border-b border-brandBlue/30 p-4">
        <Button
          type="button"
          onClick={() => void onNewConversation()}
          className="w-full rounded-xl bg-brandBlue text-white hover:bg-brandBlueLight"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Conversation
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex items-center gap-2 px-2 py-4 text-sm text-brandBlueLight/70">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <p className="px-2 py-4 text-sm text-brandBlueLight/70">
            No conversations yet.
          </p>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => void onSelectConversation(conversation.id)}
                className={cn(
                  "w-full rounded-xl border px-3 py-3 text-left transition",
                  conversation.id === activeConversationId
                    ? "border-brandOrangeLight bg-brandBlue/20 text-brandBlueLight"
                    : "border-brandBlue/25 bg-brandNavyDark text-brandBlueLight/85 hover:border-brandBlue/50 hover:bg-brandBlue/10"
                )}
              >
                <p className="line-clamp-2 text-sm font-medium">
                  {conversation.title?.trim() || "Untitled conversation"}
                </p>
                {conversation.updated_at && (
                  <p className="mt-1 text-xs text-brandBlueLight/55">
                    {new Date(conversation.updated_at).toLocaleString()}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  onSuggest,
  intent,
}: {
  onSuggest: (text: string) => void;
  intent: string | null;
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-brandBlue/40 bg-brandBlue/15">
          <Sparkles className="h-6 w-6 text-brandBlueLight" />
        </div>

        <h2 className="mt-5 text-2xl font-semibold text-brandBlueLight md:text-3xl">
          Your founder strategy room
        </h2>
        <p className="mt-3 text-sm text-brandBlueLight/75 md:text-base">
          {intent
            ? `Let's tackle this with a ${intent.replace(/-/g, " ")} lens.`
            : "Ask your mentor a real founder question and turn uncertainty into next moves."}
        </p>

        <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => onSuggest(prompt)}
              className="rounded-2xl border border-brandBlue/30 bg-brandNavyDark px-4 py-4 text-sm text-brandBlueLight transition hover:border-brandOrangeLight/60 hover:bg-brandBlue/10"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MentorPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isBooting, setIsBooting] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null
  );
  const [input, setInput] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [pendingRetryText, setPendingRetryText] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [mode, setMode] = useState<ModeOption>("mentor");

  const [conversationOutputs, setConversationOutputs] =
    useState<ConversationOutputs | null>(null);
  const [loadingOutputs, setLoadingOutputs] = useState(false);
  const [outputsError, setOutputsError] = useState<string | null>(null);
  const [generatingOutputs, setGeneratingOutputs] = useState(false);

  const [actionPlan, setActionPlan] = useState<ActionPlan | null>(null);
  const [actionPlanError, setActionPlanError] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [isBoardLoading, setIsBoardLoading] = useState(false);
  const [boardError, setBoardError] = useState<string | null>(null);

  const conversationIdRef = useRef<string | null>(null);
  const lastConversationRef = useRef<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const {
    messages,
    status,
    setMessages,
    sendMessage,
    error: chatError,
  } = useChat({
    id: "mentor-chat",
    onError: (error: unknown) => {
      console.error("Mentor chat error:", error);
      setSendError("Message failed to send.");
    },
    onFinish: async ({ message }: { message: MentorMessage }) => {
      const assistantText = extractMessageText(message);
      const conversationId = conversationIdRef.current;

      if (!conversationId || !assistantText) return;

      try {
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          role: "assistant",
          content: assistantText,
        });

        await touchConversation(conversationId);
        await refreshConversations();
        await syncActionPlanFromAssistant(conversationId, assistantText);
        await loadActionPlan(conversationId);
      } catch (error) {
        console.error("[MENTOR_ON_FINISH_ERROR]", error);
        setLocalError("Assistant reply could not be saved.");
      }
    },
  });

  const isSending = status === "submitted" || status === "streaming";
  const actionPlanProgress = computeActionPlanProgress(actionPlan?.tasks ?? []);
  const intent = searchParams.get("intent");
  const currentConversationId = activeConversationId;
  const profileDisplayName =
    profile?.profileName || profile?.full_name || "Founder";

  const touchConversation = useCallback(
    async (conversationId: string, titleFromFirstUserMessage?: string) => {
      const updatePayload: { updated_at: string; title?: string } = {
        updated_at: new Date().toISOString(),
      };

      if (titleFromFirstUserMessage) {
        updatePayload.title = titleFromFirstUserMessage;
      }

      await supabase
        .from("conversations")
        .update(updatePayload)
        .eq("id", conversationId);
    },
    [supabase]
  );

  const refreshConversations = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("conversations")
      .select("id, title, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      setLocalError("Failed to load conversation history.");
      return;
    }

    setConversations((data as Conversation[]) ?? []);
    setIsLoadingConversations(false);
  }, [supabase]);

  const loadConversationOutputs = useCallback(async (conversationId: string) => {
    setLoadingOutputs(true);
    setOutputsError(null);

    try {
      const res = await fetch(
        `/api/mentor/conversation-outputs?conversationId=${conversationId}`
      );
      const payload = await res.json();

      if (!res.ok) {
        setConversationOutputs(null);
        setOutputsError(
          payload?.error || "Couldn't load conversation outputs right now."
        );
        return;
      }

      setConversationOutputs(payload?.outputs ?? null);
    } catch (error) {
      console.error("[CONVERSATION_OUTPUTS_LOAD_ERROR]", error);
      setConversationOutputs(null);
      setOutputsError("Couldn't load conversation outputs right now.");
    } finally {
      setLoadingOutputs(false);
    }
  }, []);

  const loadActionPlan = useCallback(async (conversationId: string) => {
    try {
      setActionPlanError(null);

      const res = await fetch(`/api/action-plans?conversationId=${conversationId}`);
      if (!res.ok) {
        throw new Error("Failed to load action plan");
      }

      const payload = await res.json();
      const rawActionPlan = payload?.actionPlan;

      if (!rawActionPlan) {
        setActionPlan(null);
        return;
      }

      setActionPlan({
        id: rawActionPlan.id,
        tasks: sanitizeActionPlanTasks(rawActionPlan.tasks),
      });
    } catch (error) {
      console.error("[ACTION_PLAN_LOAD_ERROR]", error);
      setActionPlan(null);
      setActionPlanError(
        "We couldn't load the action plan for this conversation."
      );
    }
  }, []);

  const generateConversationOutputs = useCallback(async () => {
    const conversationId = conversationIdRef.current;
    if (!conversationId || generatingOutputs) return;

    setGeneratingOutputs(true);
    setOutputsError(null);

    try {
      const res = await fetch("/api/mentor/conversation-outputs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(payload?.error || "Couldn't generate outputs right now.");
      }

      setConversationOutputs(payload?.outputs ?? null);
      await loadActionPlan(conversationId);
    } catch (error) {
      console.error("[CONVERSATION_OUTPUTS_GENERATE_ERROR]", error);
      setOutputsError("Couldn't generate outputs right now.");
    } finally {
      setGeneratingOutputs(false);
    }
  }, [generatingOutputs, loadActionPlan]);

  const syncActionPlanFromAssistant = useCallback(
    async (conversationId: string, assistantText: string) => {
      try {
        const res = await fetch("/api/action-plans/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, assistantText }),
        });

        if (!res.ok) {
          throw new Error("Failed to sync action plan");
        }

        const payload = await res.json();

        if (payload?.actionPlan) {
          setActionPlan({
            id: payload.actionPlan.id,
            tasks: sanitizeActionPlanTasks(payload.actionPlan.tasks),
          });
        }
      } catch (error) {
        console.error("[ACTION_PLAN_SYNC_ERROR]", error);
        setActionPlanError(
          "Action plan saved partially. Retry from this conversation if needed."
        );
      }
    },
    []
  );

  const loadConversation = useCallback(
    async (conversationId: string) => {
      setActiveConversationId(conversationId);
      conversationIdRef.current = conversationId;
      lastConversationRef.current = conversationId;

      setConversationOutputs(null);
      setOutputsError(null);
      setSendError(null);
      setPendingRetryText(null);
      setLocalError(null);
      setBoardError(null);
      setIsSidebarOpen(false);

      const { data, error } = await supabase
        .from("messages")
        .select("id, role, content")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        setLocalError("Failed to load conversation messages.");
        return;
      }

      const hydratedMessages: MentorMessage[] = (data || []).map(
        (
          message: { id: string; role: string; content: string | null },
          index: number
        ) => ({
          id: message.id || `${conversationId}-${index}`,
          role: (message.role as MentorMessage["role"]) ?? "assistant",
          parts: [{ type: "text", text: message.content ?? "" }],
        })
      );

      setMessages(hydratedMessages as never);

      await Promise.all([
        loadConversationOutputs(conversationId),
        loadActionPlan(conversationId),
      ]);
    },
    [loadActionPlan, loadConversationOutputs, setMessages, supabase]
  );

  const selectConversation = useCallback(
    async (conversationId: string) => {
      if (lastConversationRef.current === conversationId) return;
      await loadConversation(conversationId);
    },
    [loadConversation]
  );

  const createNewConversation = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return null;
    }

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        user_id: user.id,
        title: "New Conversation",
      })
      .select("id, title, created_at, updated_at")
      .single();

    if (error || !data) {
      setLocalError("Could not create a new conversation.");
      return null;
    }

    const newConversation = data as Conversation;

    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
    conversationIdRef.current = newConversation.id;
    lastConversationRef.current = newConversation.id;

    setMessages([] as never);
    setConversationOutputs(null);
    setActionPlan(null);
    setOutputsError(null);
    setActionPlanError(null);
    setSendError(null);
    setPendingRetryText(null);
    setBoardError(null);

    return newConversation.id;
  }, [router, setMessages, supabase]);

  const startNewConversation = useCallback(async () => {
    await createNewConversation();
  }, [createNewConversation]);

  const ensureConversation = useCallback(
    async (messageText: string) => {
      if (conversationIdRef.current) {
        return conversationIdRef.current;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return null;
      }

      const { data, error } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          title: messageText.slice(0, 50) || "New Conversation",
        })
        .select("id, title, created_at, updated_at")
        .single();

      if (error || !data) {
        setLocalError("Could not create a conversation.");
        return null;
      }

      const newConversation = data as Conversation;

      conversationIdRef.current = newConversation.id;
      lastConversationRef.current = newConversation.id;
      setActiveConversationId(newConversation.id);
      setConversations((prev) => [newConversation, ...prev]);

      return newConversation.id;
    },
    [router, supabase]
  );

  const updateTaskStatus = useCallback(
    async (task: ActionPlanTask, nextStatus: ActionPlanTaskStatus) => {
      if (!actionPlan || updatingTaskId) return;

      setUpdatingTaskId(task.id);
      setActionPlanError(null);

      const previousPlan = actionPlan;

      const optimisticPlan: ActionPlan = {
        ...actionPlan,
        tasks: actionPlan.tasks.map((existingTask) =>
          existingTask.id === task.id
            ? {
                ...existingTask,
                status: nextStatus,
                updated_at: new Date().toISOString(),
              }
            : existingTask
        ),
      };

      setActionPlan(optimisticPlan);

      try {
        const res = await fetch(
          `/api/action-plans/${actionPlan.id}/tasks/${task.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: nextStatus }),
          }
        );

        if (!res.ok) {
          throw new Error("Failed to update task status");
        }

        const payload = await res.json();

        if (payload?.actionPlan) {
          setActionPlan({
            id: payload.actionPlan.id,
            tasks: sanitizeActionPlanTasks(payload.actionPlan.tasks),
          });
        } else {
          setActionPlan(optimisticPlan);
        }
      } catch (error) {
        console.error("[ACTION_PLAN_TASK_UPDATE_ERROR]", error);
        setActionPlan(previousPlan);
        setActionPlanError("Task update failed. Please try again.");
      } finally {
        setUpdatingTaskId(null);
      }
    },
    [actionPlan, updatingTaskId]
  );

  const submitMessage = useCallback(
    async (overrideText?: string) => {
      const messageText = (overrideText ?? input).trim();
      if (!messageText || isSending) return;

      setSendError(null);
      setPendingRetryText(null);
      setLocalError(null);
      setBoardError(null);

      const conversationId = await ensureConversation(messageText);
      if (!conversationId) return;

      const isFirstMessageInConversation = messages.length === 0;

      const { error: saveUserMessageError } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        role: "user",
        content: messageText,
      });

      if (saveUserMessageError) {
        setLocalError("Could not save your message. Please try again.");
        return;
      }

      await touchConversation(
        conversationId,
        isFirstMessageInConversation ? messageText.slice(0, 50) : undefined
      );

      try {
        sendMessage(
          { text: messageText },
          {
            body: {
              conversationId,
              mode,
            },
          }
        );
        setInput("");
        await refreshConversations();
      } catch (error) {
        console.error("[SEND_MESSAGE_ERROR]", error);
        setPendingRetryText(messageText);
        setSendError("Message failed to send.");
      }
    },
    [
      ensureConversation,
      input,
      isSending,
      messages.length,
      mode,
      refreshConversations,
      sendMessage,
      supabase,
      touchConversation,
    ]
  );

  const generateBoardReview = useCallback(async () => {
    const conversationId = conversationIdRef.current;
    if (!conversationId || isBoardLoading) return;

    if (!isPremiumUser) {
      router.push("/upgrade");
      return;
    }

    setBoardError(null);
    setIsBoardLoading(true);

    try {
      const res = await fetch("/api/directorium/board-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (payload?.error === "PREMIUM_REQUIRED") {
          router.push("/upgrade");
          return;
        }

        throw new Error(payload?.message || "Board review generation failed.");
      }

      await loadConversation(conversationId);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to generate board review.";
      setBoardError(message);
    } finally {
      setIsBoardLoading(false);
    }
  }, [isBoardLoading, isPremiumUser, loadConversation, router]);

  const handleSuggestionClick = useCallback((text: string) => {
    setInput(text);
  }, []);

  useEffect(() => {
    const modeParam = searchParams.get("mode");
    const promptParam = searchParams.get("prompt");

    if (
      modeParam &&
      [
        "mentor",
        "website-coach",
        "seo-ux",
        "funnel-mapping",
        "cta-analyzer",
        "board-review",
      ].includes(modeParam)
    ) {
      setMode(modeParam as ModeOption);
    }

    if (promptParam && !input) {
      setInput(promptParam);
    }
  }, [searchParams, input]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "0px";
    textareaRef.current.style.height = `${Math.min(
      textareaRef.current.scrollHeight,
      180
    )}px`;
  }, [input]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  useEffect(() => {
    const boot = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select(
          "full_name, business_idea, industry, experience_level, goals, profileName"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as Profile);
      }

      const { data: conversationData, error } = await supabase
        .from("conversations")
        .select("id, title, created_at, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) {
        setLocalError("Failed to load conversation history.");
        setIsLoadingConversations(false);
        setIsBooting(false);
        return;
      }

      const safeConversations = (conversationData as Conversation[]) ?? [];
      setConversations(safeConversations);
      setIsLoadingConversations(false);

      try {
        const creditRes = await fetch("/api/credits");
        const creditData = await creditRes.json();
        setIsPremiumUser(Boolean(creditData?.isPremium));
      } catch {
        setIsPremiumUser(false);
      }

      const requestedConversation = searchParams.get("conversation");
      const nextConversationId =
        requestedConversation &&
        safeConversations.some((c) => c.id === requestedConversation)
          ? requestedConversation
          : safeConversations[0]?.id || null;

      if (nextConversationId) {
        await loadConversation(nextConversationId);
      }

      setIsBooting(false);
    };

    void boot();
  }, [loadConversation, router, searchParams, supabase]);

  if (isBooting) {
    return (
      <Card className="h-[calc(100vh-160px)] w-full border-brandBlue/40 bg-brandNavy p-6 text-brandBlueLight">
        <div className="flex h-full items-center justify-center gap-2 text-sm text-brandBlueLight/80">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading mentor workspace...
        </div>
      </Card>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-160px)] w-full max-w-7xl gap-4 md:gap-6">
      <ConversationRail
        conversations={conversations}
        isLoading={isLoadingConversations}
        activeConversationId={activeConversationId}
        onSelectConversation={selectConversation}
        onNewConversation={startNewConversation}
      />

      <Card className="flex min-w-0 flex-1 flex-col overflow-hidden border-brandBlue/40 bg-brandNavy shadow-xl">
        <div className="border-b border-brandBlue/30 px-4 py-3 md:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-brandBlue/40 bg-brandNavyDark text-brandBlueLight md:hidden"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="border-brandBlue/50 bg-brandNavy p-0 text-brandBlueLight"
                >
                  <ConversationRailContent
                    conversations={conversations}
                    isLoading={isLoadingConversations}
                    activeConversationId={activeConversationId}
                    onSelectConversation={selectConversation}
                    onNewConversation={startNewConversation}
                  />
                </SheetContent>
              </Sheet>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-brandBlue/40 bg-brandBlue/20">
                <Sparkles className="h-5 w-5 text-brandBlueLight" />
              </div>

              <div>
                <h1 className="text-base font-semibold text-brandBlueLight md:text-lg">
                  Mentor
                </h1>
                <p className="text-xs text-brandBlueLight/70">
                  Focused strategy support for founder decisions, {profileDisplayName}.
                </p>

                <div className="mt-1">
                  <label className="text-[10px] uppercase tracking-wide text-brandBlueLight/60">
                    Mode
                  </label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as ModeOption)}
                    className="mt-1 rounded-lg border border-brandBlue/60 bg-brandNavy px-2 py-1 text-xs text-brandBlueLight transition focus:border-brandOrangeLight focus:outline-none focus:ring-2 focus:ring-brandOrangeLight/60"
                  >
                    <option value="mentor">{MODE_LABELS.mentor}</option>
                    <option value="website-coach">
                      {MODE_LABELS["website-coach"]}
                    </option>
                    <option value="seo-ux">{MODE_LABELS["seo-ux"]}</option>
                    <option value="funnel-mapping">
                      {MODE_LABELS["funnel-mapping"]}
                    </option>
                    <option value="cta-analyzer">
                      {MODE_LABELS["cta-analyzer"]}
                    </option>
                    <option value="board-review" disabled={!isPremiumUser}>
                      {MODE_LABELS["board-review"]}
                      {!isPremiumUser ? " (Premium)" : ""}
                    </option>
                  </select>
                  <p className="mt-1 text-[11px] text-brandBlueLight/60">
                    {MODE_DESCRIPTIONS[mode]}
                  </p>
                </div>
              </div>
            </div>

            {!isPremiumUser && (
              <Link href="/upgrade">
                <Button className="flex items-center gap-2 rounded-xl bg-brandOrange px-4 py-2 text-white hover:bg-brandOrangeLight">
                  <Crown className="h-4 w-4" />
                  Go Premium
                </Button>
              </Link>
            )}
          </div>
        </div>

        {!currentConversationId && messages.length === 0 ? (
          <EmptyState onSuggest={handleSuggestionClick} intent={intent} />
        ) : (
          <>
            {activeConversationId && (
              <div className="px-4 pt-4 md:px-6">
                <Card className="rounded-xl border border-brandBlue/60 bg-brandNavyDark">
                  <div className="flex items-center justify-between gap-3 border-b border-brandBlue/50 p-4">
                    <div>
                      <h3 className="text-sm font-semibold text-brandBlueLight">
                        Insights & Action Plan
                      </h3>
                      <p className="mt-1 text-xs text-brandBlueLight/70">
                        Turn this conversation into focused momentum.
                      </p>
                    </div>

                    <Button
                      type="button"
                      onClick={generateConversationOutputs}
                      disabled={generatingOutputs || loadingOutputs || isSending}
                      className="rounded-lg bg-brandOrange text-white hover:bg-brandOrangeLight"
                    >
                      <RefreshCcw
                        className={cn(
                          "mr-2 h-4 w-4",
                          generatingOutputs && "animate-spin"
                        )}
                      />
                      {conversationOutputs ? "Regenerate" : "Generate"}
                    </Button>
                  </div>

                  <div className="space-y-4 p-4">
                    {loadingOutputs ? (
                      <p className="text-sm text-brandBlueLight/70">
                        Loading saved outputs...
                      </p>
                    ) : outputsError ? (
                      <p className="text-sm text-red-300">{outputsError}</p>
                    ) : !conversationOutputs ? (
                      <p className="text-sm text-brandBlueLight/70">
                        No outputs generated yet. Use Generate to create insights
                        and a concrete action plan.
                      </p>
                    ) : (
                      <>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-brandBlueLight/60">
                            Summary
                          </p>
                          <p className="mt-1 text-sm text-brandBlueLight">
                            {conversationOutputs.summary}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-brandBlueLight/60">
                            Key insights
                          </p>
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-brandBlueLight">
                            {conversationOutputs.insights.map((item, index) => (
                              <li key={`insight-${index}`}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-brandBlueLight/60">
                            Action plan
                          </p>
                          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-brandBlueLight">
                            {conversationOutputs.action_plan.map((step, index) => (
                              <li key={`action-${index}`}>{step}</li>
                            ))}
                          </ol>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="rounded-lg border border-brandBlue/50 bg-brandNavy px-3 py-2">
                            <p className="text-[10px] uppercase tracking-wide text-brandBlueLight/60">
                              This week priority
                            </p>
                            <p className="mt-1 text-sm text-brandBlueLight">
                              {conversationOutputs.recommended_priority}
                            </p>
                          </div>
                          <div className="rounded-lg border border-brandBlue/50 bg-brandNavy px-3 py-2">
                            <p className="text-[10px] uppercase tracking-wide text-brandBlueLight/60">
                              Risk to watch
                            </p>
                            <p className="mt-1 text-sm text-brandBlueLight">
                              {conversationOutputs.risk_or_blocker}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {boardError && (
                  <div className="rounded-lg border border-red-500/50 bg-red-500/20 p-3 text-sm text-red-200">
                    {boardError}
                  </div>
                )}

                {messages.map((message) => {
                  const content = extractMessageText(
                    message as Partial<MentorMessage>
                  );
                  const isUser = message.role === "user";
                  const canEscalateFromMessage =
                    message.role === "assistant" &&
                    mode !== "board-review" &&
                    content.includes("Action Steps");

                  return (
                    <div
                      key={message.id}
                      className={cn("flex", isUser ? "justify-end" : "justify-start")}
                    >
                      <div className="max-w-3xl space-y-2">
                        <div
                          className={cn(
                            "whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed md:px-5 md:py-4",
                            isUser
                              ? "rounded-br-none bg-brandOrange text-white"
                              : "rounded-bl-none border border-brandBlue/50 bg-brandNavyDark text-brandBlueLight"
                          )}
                        >
                          {content}
                        </div>

                        {canEscalateFromMessage && (
                          <Button
                            type="button"
                            onClick={generateBoardReview}
                            disabled={isBoardLoading}
                            className="self-end rounded-lg bg-brandBlue px-3 py-1 text-xs text-white hover:bg-brandBlueLight"
                          >
                            {isBoardLoading ? "Loading Board Input..." : "Get Board Input"}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isSending && (
                  <div className="text-xs text-brandBlueLight/70">
                    Mentor is thinking...
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          </>
        )}

        <div className="border-t border-brandBlue/30 bg-brandNavyDark/70 px-4 py-3 md:px-6">
          {(sendError || localError || chatError) && (
            <div className="mb-3 flex items-start justify-between gap-3 rounded-lg border border-red-400/50 bg-red-500/10 p-3 text-xs text-red-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                <span>{sendError || localError || chatError?.message}</span>
              </div>

              {pendingRetryText && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-300/40 bg-transparent text-red-100"
                  onClick={() => void submitMessage(pendingRetryText)}
                >
                  Retry
                </Button>
              )}
            </div>
          )}

          {actionPlan && actionPlan.tasks.length > 0 && (
            <div className="mb-4">
              <div className="rounded-xl border border-brandBlue/50 bg-brandNavyDark p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-brandBlueLight">
                    Action Plan Progress
                  </h3>
                  <p className="text-xs text-brandBlueLight/80">
                    {actionPlanProgress.completed}/{actionPlanProgress.total} complete (
                    {actionPlanProgress.percentage}%)
                  </p>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full border border-brandBlue/30 bg-brandNavy">
                  <div
                    className="h-full bg-brandOrange transition-all"
                    style={{ width: `${actionPlanProgress.percentage}%` }}
                  />
                </div>

                <div className="mt-3 space-y-2">
                  {actionPlan.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-brandBlue/30 bg-brandNavy px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-brandBlueLight">{task.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-wide text-brandBlueLight/60">
                          {task.status.replace("_", " ")}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={updatingTaskId === task.id || task.status === "pending"}
                          className="border-brandBlue/40 bg-transparent text-brandBlueLight"
                          onClick={() => void updateTaskStatus(task, "pending")}
                        >
                          Pending
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={
                            updatingTaskId === task.id || task.status === "in_progress"
                          }
                          className="border-brandBlue/40 bg-transparent text-brandBlueLight"
                          onClick={() => void updateTaskStatus(task, "in_progress")}
                        >
                          In Progress
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={
                            updatingTaskId === task.id || task.status === "completed"
                          }
                          className="bg-brandOrange text-white hover:bg-brandOrangeLight"
                          onClick={() => void updateTaskStatus(task, "completed")}
                        >
                          Complete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {actionPlanError && (
                  <p className="mt-2 text-xs text-red-300">{actionPlanError}</p>
                )}
              </div>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submitMessage();
            }}
            className="flex items-end gap-3"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void submitMessage();
                }
              }}
              placeholder="Ask your mentor what to do next..."
              rows={1}
              className="min-h-[48px] flex-1 resize-none rounded-xl border border-brandBlue/40 bg-brandNavy px-4 py-3 text-sm text-brandBlueLight placeholder:text-brandBlueLight/45 focus:outline-none"
            />

            <Button
              type="submit"
              disabled={isSending || !input.trim()}
              className="h-12 bg-brandOrange text-white hover:bg-brandOrangeLight"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}

function MentorPageFallback() {
  return (
    <Card className="h-[calc(100vh-160px)] w-full border-brandBlue/40 bg-brandNavy p-6 text-brandBlueLight">
      <div className="flex h-full items-center justify-center gap-2 text-sm text-brandBlueLight/80">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Loading mentor workspace...
      </div>
    </Card>
  );
}

export default function MentorPage() {
  return (
    <Suspense fallback={<MentorPageFallback />}>
      <MentorPageContent />
    </Suspense>
  );
}