"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { AlertCircle, Crown, History, MessageSquarePlus, X } from "lucide-react";

import { buildSharedLoginHref } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  describeConversationOutputsError,
  describeMentorChatError,
  extractMessageText,
  firstNameFrom,
  type MentorUIMessageLike,
} from "@/lib/mentor/chat-client";
import {
  MENTOR_LONG_WAIT_MS,
  MENTOR_STATE_ASSETS,
  MENTOR_SUCCESS_HOLD_MS,
  isMentorBusy,
  resolveMentorState,
  type MentorState,
} from "@/lib/mentor/presence";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

import { ConversationHistory, type MentorConversation } from "./ConversationHistory";
import { MentorAvatar, usePreloadMentorStates } from "./MentorFigure";
import { MentorComposer } from "./MentorComposer";
import {
  MentorInsightsPanel,
  type ActionPlan,
  type ActionPlanTask,
  type ActionPlanTaskStatus,
  type ConversationOutputs,
} from "./MentorInsightsPanel";
import { MentorModePicker } from "./MentorModePicker";
import { MentorThread, type ThreadError, type ThreadMessage } from "./MentorThread";
import { ConversationStarters, MentorWelcome, type ConversationStarter } from "./MentorWelcome";
import { isMentorMode, type MentorMode } from "./modes";

type Profile = {
  full_name?: string | null;
  business_idea?: string | null;
  industry?: string | null;
  experience_level?: string | null;
  goals?: string[] | null;
  profileName?: string | null;
};

type Notice = { message: string; retryLabel?: string; onRetry?: () => void };

const HISTORY_COLLAPSED_KEY = "prospra.mentor.historyCollapsed";

function sanitizeActionPlanTasks(value: unknown): ActionPlanTask[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((task, index): ActionPlanTask | null => {
      if (!task || typeof task !== "object") return null;
      const candidate = task as Partial<ActionPlanTask>;
      const status: ActionPlanTaskStatus =
        candidate.status === "completed" ||
        candidate.status === "in_progress" ||
        candidate.status === "pending"
          ? candidate.status
          : "pending";

      return {
        id: typeof candidate.id === "string" && candidate.id.trim() ? candidate.id : `task-${index}`,
        title:
          typeof candidate.title === "string" && candidate.title.trim()
            ? candidate.title
            : "Untitled task",
        status,
        updated_at: typeof candidate.updated_at === "string" ? candidate.updated_at : null,
      };
    })
    .filter((task): task is ActionPlanTask => task !== null);
}

/** Keep the address bar in sync so a reload restores the open conversation. */
function syncConversationUrl(conversationId: string | null) {
  if (typeof window === "undefined") return;
  const next = conversationId ? `/mentor?conversation=${encodeURIComponent(conversationId)}` : "/mentor";
  if (`${window.location.pathname}${window.location.search}` !== next) {
    window.history.replaceState(window.history.state, "", next);
  }
}

function readHistoryCollapsed() {
  try {
    return window.localStorage.getItem(HISTORY_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeHistoryCollapsed(value: boolean) {
  try {
    window.localStorage.setItem(HISTORY_COLLAPSED_KEY, value ? "1" : "0");
  } catch {
    // Non-essential preference.
  }
}

export function MentorWorkspaceSkeleton() {
  return (
    <div className="flex h-[calc(100dvh-8.5rem)] gap-5 md:h-[calc(100dvh-3rem)]" aria-busy="true" aria-label="Loading mentor">
      <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-5 rounded-[22px] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(8,18,34,0.94)_0%,rgba(5,12,24,0.97)_100%)] px-6 md:rounded-[28px]">
        <Skeleton className="h-36 w-36 rounded-full bg-white/[0.05]" />
        <Skeleton className="h-7 w-72 max-w-full bg-white/[0.06]" />
        <Skeleton className="h-4 w-96 max-w-full bg-white/[0.04]" />
        <Skeleton className="mt-3 h-28 w-full max-w-[680px] rounded-[22px] bg-white/[0.04]" />
      </div>
      <div className="hidden w-[272px] shrink-0 space-y-2 rounded-[24px] border border-white/[0.05] bg-[rgba(6,14,27,0.55)] p-4 xl:block 2xl:w-[296px]">
        <Skeleton className="h-10 w-full rounded-xl bg-white/[0.05]" />
        {[0, 1, 2, 3].map((item) => (
          <Skeleton key={item} className="h-4 w-4/5 bg-white/[0.05]" />
        ))}
      </div>
    </div>
  );
}

export function MentorWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [conversations, setConversations] = useState<MentorConversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isBooting, setIsBooting] = useState(true);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [pendingUserText, setPendingUserText] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [replyError, setReplyError] = useState<ThreadError | null>(null);
  const [intent, setIntent] = useState<string | null>(null);
  const [mode, setMode] = useState<MentorMode>("mentor");

  const [conversationOutputs, setConversationOutputs] = useState<ConversationOutputs | null>(null);
  const [loadingOutputs, setLoadingOutputs] = useState(false);
  const [outputsError, setOutputsError] = useState<string | null>(null);
  const [generatingOutputs, setGeneratingOutputs] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);

  const [actionPlan, setActionPlan] = useState<ActionPlan | null>(null);
  const [actionPlanError, setActionPlanError] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [isBoardLoading, setIsBoardLoading] = useState(false);

  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const [historySheetOpen, setHistorySheetOpen] = useState(false);
  const [isLongWait, setIsLongWait] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);

  const bootedRef = useRef(false);
  const conversationIdRef = useRef<string | null>(null);
  /** The conversation the in-flight AI request belongs to. Null when none/abandoned. */
  const inFlightRef = useRef<{ conversationId: string } | null>(null);
  /** Synchronous guard against double submits (Enter + click in the same frame). */
  const submitLockRef = useRef(false);
  /** Incremented on every conversation switch so stale loads are discarded. */
  const loadTokenRef = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const celebrateTimerRef = useRef<number | null>(null);

  const chatHandlersRef = useRef<{
    onFinish: (event: {
      message: MentorUIMessageLike;
      isAbort: boolean;
      isDisconnect: boolean;
      isError: boolean;
    }) => void;
    onError: (error: Error) => void;
  }>({ onFinish: () => {}, onError: () => {} });

  const { messages, status, setMessages, sendMessage, regenerate, stop, clearError } = useChat({
    id: "mentor-chat",
    onError: (error: Error) => chatHandlersRef.current.onError(error),
    onFinish: (event) => chatHandlersRef.current.onFinish(event),
  });


  const isChatActive = status === "submitted" || status === "streaming";
  const isBusy = isChatActive || isSubmitting;

  const threadMessages = useMemo<ThreadMessage[]>(
    () =>
      messages
        .filter((message) => message.role === "user" || message.role === "assistant")
        .map((message) => ({
          id: message.id,
          role: message.role as ThreadMessage["role"],
          text: extractMessageText(message as MentorUIMessageLike),
        }))
        .filter((message) => message.text.trim().length > 0),
    [messages]
  );

  const lastThreadMessage = threadMessages[threadMessages.length - 1];
  const isStreamingText = status === "streaming" && lastThreadMessage?.role === "assistant";
  const isAwaitingReply = isSubmitting || (isChatActive && !isStreamingText);

  const isWelcome =
    !activeConversationId &&
    threadMessages.length === 0 &&
    !pendingUserText &&
    !isLoadingConversation;

  const mentorState: MentorState = resolveMentorState({
    isWelcome,
    chatStatus: status,
    isSubmitting,
    isLongWait,
    isAnalyzing: generatingOutputs || isBoardLoading,
    isCelebrating,
  });

  const mentorContextHint = useMemo(
    () => ({
      hasProfileContext: Boolean(profile),
      hasConversationOutputs: Boolean(conversationOutputs),
      activeMode: mode,
    }),
    [conversationOutputs, mode, profile]
  );

  const firstName = firstNameFrom(profile?.profileName) ?? firstNameFrom(profile?.full_name);

  usePreloadMentorStates(
    ["idle", "thinking", "analyzing", "explaining", "recommendation", "success"],
    "portrait"
  );

  /* ----------------------------- presence timers ---------------------------- */

  useEffect(() => {
    if (!isAwaitingReply) {
      setIsLongWait(false);
      return;
    }
    const id = window.setTimeout(() => setIsLongWait(true), MENTOR_LONG_WAIT_MS);
    return () => window.clearTimeout(id);
  }, [isAwaitingReply]);

  const celebrate = useCallback(() => {
    if (celebrateTimerRef.current) window.clearTimeout(celebrateTimerRef.current);
    setIsCelebrating(true);
    celebrateTimerRef.current = window.setTimeout(() => {
      setIsCelebrating(false);
      celebrateTimerRef.current = null;
    }, MENTOR_SUCCESS_HOLD_MS);
  }, []);

  useEffect(
    () => () => {
      if (celebrateTimerRef.current) window.clearTimeout(celebrateTimerRef.current);
    },
    []
  );

  useEffect(() => {
    setHistoryCollapsed(readHistoryCollapsed());
  }, []);

  /* ------------------------------ data helpers ------------------------------ */

  const refreshConversations = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsLoadingConversations(false);
      return;
    }

    const { data, error } = await supabase
      .from("conversations")
      .select("id, title, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (!error) setConversations((data as MentorConversation[]) ?? []);
    setIsLoadingConversations(false);
  }, [supabase]);

  const loadConversationOutputs = useCallback(async (conversationId: string, token: number) => {
    setLoadingOutputs(true);
    setOutputsError(null);

    try {
      const res = await fetch(
        `/api/mentor/conversation-outputs?conversationId=${encodeURIComponent(conversationId)}`
      );
      const payload = await res.json().catch(() => ({}));
      if (token !== loadTokenRef.current) return;

      if (!res.ok) {
        setConversationOutputs(null);
        setOutputsError(describeConversationOutputsError(res.status, payload?.error));
        return;
      }

      setConversationOutputs(payload?.outputs ?? null);
    } catch (error) {
      console.error("[CONVERSATION_OUTPUTS_LOAD_ERROR]", error);
      if (token !== loadTokenRef.current) return;
      setConversationOutputs(null);
      setOutputsError("Couldn't load conversation outputs right now.");
    } finally {
      if (token === loadTokenRef.current) setLoadingOutputs(false);
    }
  }, []);

  const loadActionPlan = useCallback(async (conversationId: string) => {
    try {
      setActionPlanError(null);
      const res = await fetch(`/api/action-plans?conversationId=${encodeURIComponent(conversationId)}`);
      if (!res.ok) throw new Error("Failed to load action plan");

      const payload = await res.json();
      if (conversationId !== conversationIdRef.current) return;

      const rawActionPlan = payload?.actionPlan;
      setActionPlan(
        rawActionPlan
          ? { id: rawActionPlan.id, tasks: sanitizeActionPlanTasks(rawActionPlan.tasks) }
          : null
      );
    } catch (error) {
      console.error("[ACTION_PLAN_LOAD_ERROR]", error);
      if (conversationId !== conversationIdRef.current) return;
      setActionPlan(null);
      setActionPlanError("We couldn't load the action plan for this conversation.");
    }
  }, []);

  const syncActionPlanFromAssistant = useCallback(
    async (conversationId: string, assistantText: string) => {
      try {
        const res = await fetch("/api/action-plans/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, assistantText }),
        });
        if (!res.ok) throw new Error("Failed to sync action plan");

        const payload = await res.json();
        if (payload?.actionPlan && conversationId === conversationIdRef.current) {
          setActionPlan({
            id: payload.actionPlan.id,
            tasks: sanitizeActionPlanTasks(payload.actionPlan.tasks),
          });
        }
      } catch (error) {
        console.error("[ACTION_PLAN_SYNC_ERROR]", error);
        if (conversationId === conversationIdRef.current) {
          setActionPlanError("Action plan saved partially. Retry from this conversation if needed.");
        }
      }
    },
    []
  );

  /* --------------------------- chat lifecycle hooks -------------------------- */

  const handleChatFinish: (typeof chatHandlersRef.current)["onFinish"] = ({
    message,
    isAbort,
    isDisconnect,
    isError,
  }) => {
    const request = inFlightRef.current;
    inFlightRef.current = null;

    // /api/chat persists both turns server-side. Abandoned requests (the
    // founder switched conversations) still finish and save on the server.
    if (!request) return;
    void refreshConversations();
    if (isError || isDisconnect) return;

    const assistantText = message?.role === "assistant" ? extractMessageText(message) : "";

    if (!assistantText.trim()) {
      if (!isAbort) {
        setReplyError({
          message: "The Mentor didn't return a reply that time. Try again.",
          canRetry: true,
        });
      }
      return;
    }

    if (isAbort) return;

    void (async () => {
      await syncActionPlanFromAssistant(request.conversationId, assistantText);
      await loadActionPlan(request.conversationId);
    })();
  };

  const handleChatError = (error: Error) => {
    console.error("Mentor chat error:", error);
    const info = describeMentorChatError(error);

    setReplyError(
      info.kind === "usage_limit"
        ? { message: info.message, canRetry: false, action: { label: "Upgrade", href: "/upgrade" } }
        : info.kind === "unauthorized"
          ? {
              message: info.message,
              canRetry: false,
              action: { label: "Sign in", href: buildSharedLoginHref("/mentor") },
            }
          : { message: info.message, canRetry: true }
    );
  };

  useEffect(() => {
    chatHandlersRef.current = { onFinish: handleChatFinish, onError: handleChatError };
  });

  /**
   * Stop streaming an in-flight reply into this view before leaving its
   * conversation. The server keeps generating and saves the complete reply to
   * the conversation the request was made for, so nothing is written here.
   */
  const abandonInFlight = useCallback(async () => {
    if (!inFlightRef.current) return;
    inFlightRef.current = null;
    await stop();
  }, [stop]);

  const resetConversationState = useCallback(() => {
    setConversationOutputs(null);
    setOutputsError(null);
    setLoadingOutputs(false);
    setActionPlan(null);
    setActionPlanError(null);
    setReplyError(null);
    setNotice(null);
    setLoadError(null);
    setPendingUserText(null);
    setInsightsOpen(false);
    clearError();
  }, [clearError]);

  const loadConversation = useCallback(
    async (conversationId: string) => {
      const token = ++loadTokenRef.current;
      await abandonInFlight();

      conversationIdRef.current = conversationId;
      setActiveConversationId(conversationId);
      resetConversationState();
      setMessages([]);
      setIsLoadingConversation(true);
      syncConversationUrl(conversationId);

      try {
        const { data, error } = await supabase
          .from("messages")
          .select("id, role, content")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (token !== loadTokenRef.current) return;

        if (error) {
          setLoadError("We couldn't load this conversation.");
          return;
        }

        setMessages(
          (data ?? []).map(
            (message: { id: string; role: string; content: string | null }, index: number) => ({
              id: message.id || `${conversationId}-${index}`,
              role: message.role === "user" ? "user" : "assistant",
              parts: [{ type: "text", text: message.content ?? "" }],
            })
          ) as never
        );

        void loadConversationOutputs(conversationId, token);
        void loadActionPlan(conversationId);
      } catch (error) {
        console.error("[CONVERSATION_LOAD_ERROR]", error);
        if (token === loadTokenRef.current) setLoadError("We couldn't load this conversation.");
      } finally {
        if (token === loadTokenRef.current) setIsLoadingConversation(false);
      }
    },
    [
      abandonInFlight,
      loadActionPlan,
      loadConversationOutputs,
      resetConversationState,
      setMessages,
      supabase,
    ]
  );

  const selectConversation = useCallback(
    (conversationId: string) => {
      setHistorySheetOpen(false);
      if (isSubmitting) return;
      if (conversationId === conversationIdRef.current && !loadError) return;
      void loadConversation(conversationId);
    },
    [isSubmitting, loadConversation, loadError]
  );

  const startNewConversation = useCallback(async () => {
    setHistorySheetOpen(false);
    if (isSubmitting) return;

    ++loadTokenRef.current;
    await abandonInFlight();

    conversationIdRef.current = null;
    setActiveConversationId(null);
    resetConversationState();
    setMessages([]);
    setIsLoadingConversation(false);
    syncConversationUrl(null);

    requestAnimationFrame(() => textareaRef.current?.focus());
  }, [abandonInFlight, isSubmitting, resetConversationState, setMessages]);

  /** Conversations are created lazily on first send, so "New" never leaves empty rows behind. */
  const ensureConversation = useCallback(
    async (messageText: string) => {
      if (conversationIdRef.current) return conversationIdRef.current;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.assign(buildSharedLoginHref("/mentor"));
        return null;
      }

      const { data, error } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, title: messageText.slice(0, 50) || "New Conversation" })
        .select("id, title, created_at, updated_at")
        .single();

      if (error || !data) return null;

      const newConversation = data as MentorConversation;
      ++loadTokenRef.current;
      conversationIdRef.current = newConversation.id;
      setActiveConversationId(newConversation.id);
      setConversations((prev) => [newConversation, ...prev.filter((c) => c.id !== newConversation.id)]);
      syncConversationUrl(newConversation.id);

      return newConversation.id;
    },
    [supabase]
  );

  const submitMessage = useCallback(
    async (overrideText?: string) => {
      const messageText = (overrideText ?? input).trim();
      if (!messageText || submitLockRef.current || isChatActive) return;

      submitLockRef.current = true;
      setIsSubmitting(true);
      setNotice(null);
      setReplyError(null);
      clearError();

      // Acknowledge immediately: the message appears in the thread right away.
      setPendingUserText(messageText);
      setInput("");

      const restoreDraft = (message: string) => {
        setPendingUserText(null);
        setInput((current) => (current.trim() ? current : messageText));
        setNotice({ message });
      };

      try {
        const conversationId = await ensureConversation(messageText);
        if (!conversationId) {
          restoreDraft("We couldn't start a conversation. Your message is still in the box — try sending again.");
          return;
        }

        // The server stores this turn (and the reply) once it has verified
        // the request; the client only moves the thread to the top of history.
        inFlightRef.current = { conversationId };
        setPendingUserText(null);
        void sendMessage(
          { text: messageText },
          { body: { conversationId, mode, mentorContextHint } }
        );
        setConversations((prev) => {
          const active = prev.find((c) => c.id === conversationId);
          if (!active) return prev;
          return [
            { ...active, updated_at: new Date().toISOString() },
            ...prev.filter((c) => c.id !== conversationId),
          ];
        });
      } catch (error) {
        console.error("[SEND_MESSAGE_ERROR]", error);
        inFlightRef.current = null;
        restoreDraft("We couldn't send that message. Check your connection and try again.");
      } finally {
        submitLockRef.current = false;
        setIsSubmitting(false);
      }
    },
    [
      clearError,
      ensureConversation,
      input,
      isChatActive,
      mentorContextHint,
      mode,
      sendMessage,
    ]
  );

  /** Retry the Mentor's reply. The founder's message is already saved, so it is not re-sent. */
  const retryReply = useCallback(() => {
    const conversationId = conversationIdRef.current;
    if (!conversationId || isBusy) return;

    setReplyError(null);
    clearError();
    inFlightRef.current = { conversationId };
    void regenerate({ body: { conversationId, mode, mentorContextHint } });
  }, [clearError, isBusy, mentorContextHint, mode, regenerate]);

  const stopReply = useCallback(() => {
    void stop();
  }, [stop]);

  const generateConversationOutputs = useCallback(async () => {
    const conversationId = conversationIdRef.current;
    if (!conversationId || generatingOutputs) return;

    setGeneratingOutputs(true);
    setOutputsError(null);
    setInsightsOpen(true);

    try {
      const res = await fetch("/api/mentor/conversation-outputs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(describeConversationOutputsError(res.status, payload?.error));
      }

      if (conversationId !== conversationIdRef.current) return;
      setConversationOutputs(payload?.outputs ?? null);
      await loadActionPlan(conversationId);
      celebrate();
    } catch (error) {
      console.error("[CONVERSATION_OUTPUTS_GENERATE_ERROR]", error);
      if (conversationId !== conversationIdRef.current) return;
      setOutputsError(
        error instanceof Error
          ? error.message
          : "Action plan generation is unavailable right now. Please try again."
      );
    } finally {
      setGeneratingOutputs(false);
    }
  }, [celebrate, generatingOutputs, loadActionPlan]);

  const updateTaskStatus = useCallback(
    async (task: ActionPlanTask, nextStatus: ActionPlanTaskStatus) => {
      if (!actionPlan || updatingTaskId) return;

      setUpdatingTaskId(task.id);
      setActionPlanError(null);

      const previousPlan = actionPlan;
      const optimisticPlan: ActionPlan = {
        ...actionPlan,
        tasks: actionPlan.tasks.map((existing) =>
          existing.id === task.id
            ? { ...existing, status: nextStatus, updated_at: new Date().toISOString() }
            : existing
        ),
      };
      setActionPlan(optimisticPlan);

      try {
        const res = await fetch(`/api/action-plans/${actionPlan.id}/tasks/${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        });
        if (!res.ok) throw new Error("Failed to update task status");

        const payload = await res.json();
        setActionPlan(
          payload?.actionPlan
            ? { id: payload.actionPlan.id, tasks: sanitizeActionPlanTasks(payload.actionPlan.tasks) }
            : optimisticPlan
        );
        if (nextStatus === "completed") celebrate();
      } catch (error) {
        console.error("[ACTION_PLAN_TASK_UPDATE_ERROR]", error);
        setActionPlan(previousPlan);
        setActionPlanError("Task update failed. Please try again.");
      } finally {
        setUpdatingTaskId(null);
      }
    },
    [actionPlan, celebrate, updatingTaskId]
  );

  const generateBoardReview = useCallback(async () => {
    const conversationId = conversationIdRef.current;
    if (!conversationId || isBoardLoading) return;

    if (!isPremiumUser) {
      router.push("/upgrade");
      return;
    }

    setNotice(null);
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

      if (conversationId === conversationIdRef.current) {
        await loadConversation(conversationId);
      }
    } catch (error) {
      setNotice({
        message: error instanceof Error ? error.message : "Unable to generate board review.",
        retryLabel: "Retry",
        onRetry: () => void generateBoardReview(),
      });
    } finally {
      setIsBoardLoading(false);
    }
  }, [isBoardLoading, isPremiumUser, loadConversation, router]);

  const handleStarter = useCallback((starter: ConversationStarter) => {
    setInput(starter.prompt);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    });
  }, []);

  const toggleHistoryCollapsed = useCallback((value: boolean) => {
    setHistoryCollapsed(value);
    writeHistoryCollapsed(value);
  }, []);

  /* ---------------------------------- boot --------------------------------- */

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    // URL params are consumed once; the URL is then owned by the workspace.
    const modeParam = searchParams.get("mode");
    const promptParam = searchParams.get("prompt");
    const intentParam = searchParams.get("intent");
    const requestedConversation = searchParams.get("conversation");

    if (isMentorMode(modeParam)) setMode(modeParam);
    if (promptParam) setInput(promptParam);
    if (intentParam && intentParam !== "resume") setIntent(intentParam);

    const boot = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          window.location.assign(buildSharedLoginHref("/mentor"));
          return;
        }

        const [{ data: profileData }, conversationResult, creditResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("full_name, business_idea, industry, experience_level, goals, profileName")
            .eq("id", user.id)
            .maybeSingle(),
          supabase
            .from("conversations")
            .select("id, title, created_at, updated_at")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false }),
          fetch("/api/credits")
            .then((res) => res.json())
            .catch(() => null),
        ]);

        if (profileData) setProfile(profileData as Profile);
        setIsPremiumUser(Boolean(creditResult?.isPremium));

        if (conversationResult.error) {
          setNotice({
            message: "We couldn't load your mentor history. You can still start a new conversation.",
          });
          setIsLoadingConversations(false);
          setIsBooting(false);
          return;
        }

        const safeConversations = (conversationResult.data as MentorConversation[]) ?? [];
        setConversations(safeConversations);
        setIsLoadingConversations(false);

        const target =
          requestedConversation && safeConversations.some((c) => c.id === requestedConversation)
            ? requestedConversation
            : intentParam === "resume"
              ? safeConversations[0]?.id ?? null
              : null;

        if (target) {
          void loadConversation(target);
        } else if (requestedConversation || intentParam === "resume") {
          syncConversationUrl(null);
        }

        setIsBooting(false);
      } catch (error) {
        console.error("[MENTOR_BOOT_ERROR]", error);
        setNotice({
          message: "We couldn't prepare the mentor workspace. Refresh, or start a new conversation.",
        });
        setIsLoadingConversations(false);
        setIsBooting(false);
      }
    };

    void boot();
  }, [loadConversation, searchParams, supabase]);

  /* --------------------------------- render -------------------------------- */

  if (isBooting) return <MentorWorkspaceSkeleton />;

  const statusText = MENTOR_STATE_ASSETS[mentorState].status;
  const busy = isMentorBusy(mentorState);

  const history = (
    <ConversationHistory
      conversations={conversations}
      isLoading={isLoadingConversations}
      activeConversationId={activeConversationId}
      onSelectConversation={selectConversation}
      onNewConversation={() => void startNewConversation()}
      isFreshConversation={isWelcome}
    />
  );

  const composer = (
    <MentorComposer
      value={input}
      onChange={setInput}
      onSubmit={() => void submitMessage()}
      onStop={isChatActive ? stopReply : undefined}
      isBusy={isBusy}
      disabled={isLoadingConversation}
      variant={isWelcome ? "hero" : "docked"}
      textareaRef={textareaRef}
      placeholder={isWelcome ? "Ask anything about your business…" : "Reply to your mentor…"}
      hint="Press Enter to send and Shift+Enter for a new line."
      leading={
        <MentorModePicker mode={mode} onModeChange={setMode} isPremiumUser={isPremiumUser} />
      }
    />
  );

  const noticeBanner = notice && (
    <div
      role="alert"
      className="mb-3 flex items-start justify-between gap-3 rounded-2xl border border-[#ff8a7a]/25 bg-[#ff6b5a]/[0.06] px-4 py-3 text-left text-[13.5px] text-[#ffd9d3]"
    >
      <div className="flex items-start gap-2.5">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#ff9d8f]" />
        <p className="leading-relaxed">{notice.message}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {notice.onRetry && (
          <button
            type="button"
            onClick={notice.onRetry}
            className="rounded-full border border-[#ffb4a8]/30 px-3 py-1 text-[12.5px] font-medium text-[#ffe4df] transition hover:bg-[#ff8a7a]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb4a8]/50"
          >
            {notice.retryLabel ?? "Retry"}
          </button>
        )}
        <button
          type="button"
          onClick={() => setNotice(null)}
          aria-label="Dismiss"
          className="rounded-full p-1 text-[#ffd9d3]/70 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb4a8]/50"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100dvh-8.5rem)] gap-4 md:h-[calc(100dvh-3rem)] xl:gap-5">
      {/* One polite live region for Mentor status; the character itself is decorative. */}
      <p className="sr-only" aria-live="polite" role="status">
        {busy ? `Mentor: ${statusText}` : ""}
      </p>

      <section
        aria-label="Mentor conversation"
        className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(8,18,34,0.94)_0%,rgba(5,12,24,0.97)_100%)] shadow-[0_30px_80px_rgba(0,0,0,0.45)] md:rounded-[28px]"
      >
        {/* Ambient light: the Mentor's cyan, strongest behind the welcome figure. */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] max-w-full -translate-x-1/2 bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,212,255,0.13),transparent_65%)] transition-opacity duration-700",
            isWelcome ? "opacity-100" : "opacity-40"
          )}
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#00d4ff]/45 to-transparent" />

        <header className="relative z-10 flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-5 md:px-6 md:py-4">
          <div className="flex min-w-0 items-center gap-3">
            {isWelcome ? (
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#00d4ff] shadow-[0_0_10px_rgba(0,212,255,0.9)]" />
            ) : (
              <MentorAvatar state={mentorState} size={38} />
            )}
            <div className="min-w-0">
              <h1 className="text-[15px] font-semibold tracking-tight text-white">Mentor</h1>
              {!isWelcome && (
                <p aria-hidden="true" className="flex items-center gap-1.5 truncate text-[12px] text-[#8fb3cf]">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      busy ? "bg-[#00d4ff] motion-safe:animate-pulse" : "bg-emerald-400/80"
                    )}
                  />
                  {statusText}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {!isPremiumUser && (
              <Link
                href="/upgrade"
                aria-label="Go Premium"
                className="flex items-center gap-1.5 rounded-full border border-brandYellow/30 bg-brandYellow/[0.08] px-3 py-1.5 text-[12.5px] font-medium text-brandYellow transition hover:bg-brandYellow/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brandYellow/50"
              >
                <Crown className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Go Premium</span>
              </Link>
            )}
            {!isWelcome && (
              <button
                type="button"
                onClick={() => void startNewConversation()}
                aria-label="New conversation"
                title="New conversation"
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#b9cfe2] transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4ff]/50"
              >
                <MessageSquarePlus className="h-[18px] w-[18px]" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setHistorySheetOpen(true)}
              aria-label="Open conversation history"
              title="History"
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#b9cfe2] transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4ff]/50 xl:hidden"
            >
              <History className="h-[18px] w-[18px]" />
            </button>
            {historyCollapsed && (
              <button
                type="button"
                onClick={() => toggleHistoryCollapsed(false)}
                aria-label="Show conversation history"
                title="History"
                className="hidden h-9 w-9 items-center justify-center rounded-full text-[#b9cfe2] transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4ff]/50 xl:flex"
              >
                <History className="h-[18px] w-[18px]" />
              </button>
            )}
          </div>
        </header>

        {isWelcome ? (
          <div className="relative z-10 min-h-0 flex-1 overflow-y-auto">
            <MentorWelcome
              mentorState={mentorState}
              firstName={firstName}
              intent={intent}
              onSelectStarter={handleStarter}
              composer={
                <>
                  {noticeBanner}
                  {composer}
                </>
              }
            />
          </div>
        ) : (
          <>
            <MentorThread
              conversationKey={activeConversationId}
              messages={threadMessages}
              pendingUserText={pendingUserText}
              isStreaming={isStreamingText}
              isAwaitingReply={isAwaitingReply}
              mentorState={mentorState}
              isLoading={isLoadingConversation}
              error={replyError}
              onRetry={retryReply}
              isRetrying={isBusy}
              header={
                activeConversationId && !isLoadingConversation && !loadError ? (
                  <MentorInsightsPanel
                    outputs={conversationOutputs}
                    isLoadingOutputs={loadingOutputs}
                    outputsError={outputsError}
                    isGenerating={generatingOutputs}
                    onGenerate={() => void generateConversationOutputs()}
                    generateDisabled={generatingOutputs || loadingOutputs || isBusy || threadMessages.length === 0}
                    actionPlan={actionPlan}
                    actionPlanError={actionPlanError}
                    updatingTaskId={updatingTaskId}
                    onUpdateTask={(task, next) => void updateTaskStatus(task, next)}
                    presenceState={
                      generatingOutputs ? "analyzing" : isCelebrating ? "success" : "recommendation"
                    }
                    open={insightsOpen}
                    onOpenChange={setInsightsOpen}
                  />
                ) : null
              }
              emptyState={
                loadError ? (
                  <div role="alert" className="flex flex-col items-center gap-3 py-16 text-center text-[14px] text-[#ffd9d3]">
                    <p>{loadError}</p>
                    <button
                      type="button"
                      onClick={() => activeConversationId && void loadConversation(activeConversationId)}
                      className="rounded-full border border-[#ffb4a8]/30 px-4 py-1.5 text-[13px] font-medium text-[#ffe4df] transition hover:bg-[#ff8a7a]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb4a8]/50"
                    >
                      Try again
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-5 py-16 text-center">
                    <p className="text-[14.5px] text-[#a9bfd3]">
                      This conversation is ready. Ask one focused question to get started.
                    </p>
                    <ConversationStarters onSelect={handleStarter} />
                  </div>
                )
              }
              renderMessageFooter={(message) =>
                message.role === "assistant" &&
                mode !== "board-review" &&
                message.text.includes("Action Steps") ? (
                  <button
                    type="button"
                    onClick={() => void generateBoardReview()}
                    disabled={isBoardLoading || isBusy}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] px-3 py-1 text-[12px] font-medium text-[#9fc3dc] transition hover:border-[#00d4ff]/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4ff]/50 disabled:opacity-50"
                  >
                    {!isPremiumUser && <Crown className="h-3 w-3 text-brandYellow" />}
                    {isBoardLoading ? "Requesting board input…" : "Get board input"}
                  </button>
                ) : null
              }
            />

            <div className="relative z-10 shrink-0 px-3 pb-3 pt-1 sm:px-5 md:pb-5">
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-[#060e1c] to-transparent" />
              <div className="mx-auto w-full max-w-[760px]">
                {noticeBanner}
                {composer}
                <p className="mt-2 hidden text-center text-[11.5px] text-[#6f8aa1] md:block">
                  Enter to send · Shift + Enter for a new line
                </p>
              </div>
            </div>
          </>
        )}
      </section>

      {!historyCollapsed && (
        <aside className="hidden w-[272px] shrink-0 overflow-hidden rounded-[24px] border border-white/[0.05] bg-[rgba(6,14,27,0.55)] xl:block 2xl:w-[296px]">
          <ConversationHistory
            conversations={conversations}
            isLoading={isLoadingConversations}
            activeConversationId={activeConversationId}
            onSelectConversation={selectConversation}
            onNewConversation={() => void startNewConversation()}
            onCollapse={() => toggleHistoryCollapsed(true)}
            isFreshConversation={isWelcome}
          />
        </aside>
      )}

      <Sheet open={historySheetOpen} onOpenChange={setHistorySheetOpen}>
        <SheetContent
          side="right"
          className="w-[86vw] max-w-[340px] border-l border-white/10 bg-[#060e1c]/98 p-0 text-[#d7e7f6]"
        >
          <SheetTitle className="sr-only">Conversation history</SheetTitle>
          {history}
        </SheetContent>
      </Sheet>
    </div>
  );
}
