"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  Crown,
} from "lucide-react";
import { useChat } from "@ai-sdk/react";
import Link from "next/link";

import { UsageBar } from "@/components/UsageBar";
import { UpgradeBanner } from "@/components/UpgradeBanner";
import { PremiumFeaturePanel } from "@/components/PremiumFeaturePanel";
import { TypingIndicator } from "@/components/TypingIndicator";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import mermaid from "mermaid";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

interface Profile {
  full_name: string;
  business_idea: string;
  industry: string;
  experience_level: string;
  goals: string[];
}

type ModeOption =
  | "mentor"
  | "website-coach"
  | "seo-ux"
  | "funnel-mapping"
  | "cta-analyzer";

const MODE_LABELS: Record<ModeOption, string> = {
  mentor: "Mentor Mode",
  "website-coach": "Website Coach",
  "seo-ux": "SEO/UX Scoring",
  "funnel-mapping": "Funnel Mapping",
  "cta-analyzer": "CTA Analyzer",
};

const MODE_DESCRIPTIONS: Record<ModeOption, string> = {
  mentor: "Tailored entrepreneurial guidance.",
  "website-coach": "Deep-dive feedback on your website’s clarity and conversion.",
  "seo-ux": "SEO/UX scoring and optimization suggestions for your pages.",
  "funnel-mapping": "Map your customer journey and plug funnel leaks.",
  "cta-analyzer": "Analyze and upgrade your CTAs and key copy moments.",
};

interface CtaScore {
  clarity: number;
  emotion: number;
  strength: number;
  urgency: number;
  conversion: number;
  summary?: string;
}

export default function MentorPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);

  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const [limitReached, setLimitReached] = useState(false);

  const [mode, setMode] = useState<ModeOption>("mentor");
  const [ctaScore, setCtaScore] = useState<CtaScore | null>(null);
  const [funnelMermaid, setFunnelMermaid] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  const conversationIdRef = useRef<string | null>(null);
  const profileRef = useRef<Profile | null>(null);

  // Auto-expand textarea
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "0px";
    textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
  }, [input]);

  // Keep refs synced
  useEffect(() => {
    conversationIdRef.current = currentConversationId;
  }, [currentConversationId]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  // Extract text from message parts
  const getMessageText = (message: any) => {
    if (!message) return "";
    if (typeof message.content === "string") return message.content;
    if (Array.isArray(message.parts)) {
      return message.parts
        .map((part: any) =>
          part?.text
            ? part.text
            : typeof part?.content === "string"
            ? part.content
            : ""
        )
        .join("");
    }
    return "";
  };

  // CHAT HOOK
  const chat: any = useChat({
    id: "mentor-chat",
    onError: (error: any) => {
      console.error("Mentor chat error:", error);
    },
    onFinish: async ({ message }: any) => {
      const assistantText = getMessageText(message);
      const savedConversationId = conversationIdRef.current;

      if (savedConversationId && assistantText) {
        await supabase.from("messages").insert({
          conversation_id: savedConversationId,
          role: "assistant",
          content: assistantText,
        });
      }
    },
  }) as any;

  const { messages, setMessages, sendMessage, status, error: chatError } = chat;
  const isLoading = status === "submitted" || status === "streaming";

  // Auto-scroll
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Parse CTA score from latest assistant message in CTA mode
  useEffect(() => {
    if (mode !== "cta-analyzer") return;

    const lastAssistant = [...messages].reverse().find((m: any) => m.role === "assistant");
    if (!lastAssistant) return;

    const content = getMessageText(lastAssistant);
    const match = content.match(/```cta-score([\s\S]*?)```/i);
    if (!match) return;

    try {
      const json = JSON.parse(match[1].trim());
      setCtaScore({
        clarity: json.clarity ?? 0,
        emotion: json.emotion ?? 0,
        strength: json.strength ?? 0,
        urgency: json.urgency ?? 0,
        conversion: json.conversion ?? 0,
        summary: json.summary ?? "",
      });
    } catch (err) {
      console.warn("Failed to parse CTA score JSON:", err);
    }
  }, [messages, mode]);

  // Parse Mermaid funnel diagram from latest assistant message in Funnel mode
  useEffect(() => {
    if (mode !== "funnel-mapping") return;

    const lastAssistant = [...messages].reverse().find((m: any) => m.role === "assistant");
    if (!lastAssistant) return;

    const content = getMessageText(lastAssistant);
    const mermaidMatch = content.match(/```mermaid([\s\S]*?)```/i);
    if (!mermaidMatch) return;

    const code = mermaidMatch[1].trim();
    if (code) {
      setFunnelMermaid(code);
    }
  }, [messages, mode]);

  // Clear CTA + funnel when leaving their modes
  useEffect(() => {
    if (mode !== "cta-analyzer") setCtaScore(null);
    if (mode !== "funnel-mapping") setFunnelMermaid(null);
  }, [mode]);

  // Fetch user profile + conversations
  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) setProfile(profileData);

      await loadConversations(user.id);
    };

    void init();
  }, [router, supabase]);

  const loadConversations = async (userId: string) => {
    setIsLoadingConversations(true);

    const { data } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data) {
      setConversations(data as Conversation[]);
    }

    setIsLoadingConversations(false);
  };

  const createNewConversation = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, title: "New Conversation" })
      .select()
      .single();

    if (data && !error) {
      setConversations((prev) => [data as Conversation, ...prev]);
      setCurrentConversationId((data as any).id);
      setMessages([]);
      setCtaScore(null);
      setFunnelMermaid(null);
    }
  };

  const loadConversation = async (conversationId: string) => {
    setCurrentConversationId(conversationId);
    setCtaScore(null);
    setFunnelMermaid(null);

    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(
        (data as any[]).map((msg: any, index: number) => ({
          id: msg.id || `msg-${conversationId}-${index}`,
          role: msg.role as "user" | "assistant",
          parts: [{ type: "text", text: msg.content }],
        }))
      );
    }
  };

  // Submit handler
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !file) || uploading || limitReached) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    let conversationId = currentConversationId;

    if (!conversationId) {
      const { data } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          title: input.slice(0, 50) || "New Conversation",
        })
        .select()
        .single();

      if (data) {
        conversationId = (data as any).id;
        setCurrentConversationId(conversationId);
        setConversations((prev) => [data as any, ...prev]);
      }
    }

    if (!conversationId) return;

    let contentToSend = input.trim();

    // File upload
    if (file) {
      try {
        setUploading(true);

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload-file", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          setLocalError("File upload failed");
          return;
        }

        const data = await res.json();
        const fileUrl = data.url;

        const fileLine = `**Attached File:** ${file.name}\n${fileUrl}`;
        contentToSend = contentToSend
          ? `${contentToSend}\n\n${fileLine}`
          : fileLine;
      } finally {
        setUploading(false);
        setFile(null);
      }
    }

    // Save message
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: contentToSend,
    });

    // Send to AI with dynamic body (includes mode)
    await sendMessage(
      {
        role: "user",
        parts: [{ type: "text", text: contentToSend }],
      },
      { body: { conversationId, profile, mode } }
    );

    setInput("");
    setLocalError(null);
  };

  const handleSuggestionClick = (text: string) => {
    setInput(text);
  };

  // -------------------------------------------
  // UI START
  // -------------------------------------------
  return (
    <div className="flex gap-6 h-[calc(100vh-120px)] max-w-7xl w-full mx-auto">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0">
        <Card className="bg-brandNavy border border-brandBlue h-full rounded-xl shadow-lg flex flex-col">
          <div className="p-4 border-b border-brandBlue/50">
            <Button
              onClick={createNewConversation}
              className="w-full bg-brandOrange hover:bg-brandOrangeLight text-white rounded-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Conversation
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {isLoadingConversations ? (
              <div className="flex items-center justify-center py-8">
                <Sparkles className="h-6 w-6 animate-spin text-brandBlueLight" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h11 w-11 text-brandBlueLight mx-auto mb-3" />
                <p className="text-sm text-brandBlueLight/70">No conversations yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => loadConversation(conv.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all border ${
                      currentConversationId === conv.id
                        ? "bg-brandBlue/20 border-brandBlue text-brandBlueLight"
                        : "bg-brandNavyDark border-transparent hover:bg-brandNavy text-brandBlueLight/80"
                    }`}
                  >
                    <p className="text-sm font-medium truncate">{conv.title}</p>
                    <p className="text-xs text-brandBlueLight/70 mt-1">
                      {new Date(conv.created_at).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Chat Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        <Card className="bg-brandNavy border border-brandBlue flex-1 flex flex-col rounded-xl shadow-xl">
          {/* Header */}
          <div className="border-b border-brandBlue/50 px-6 py-4 flex items-center justify-between bg-brandNavyDark gap-4">
            <div className="flex flex-col w-full gap-3">
              <UsageBar
                onUsageUpdate={(data) => setLimitReached(data.limitReached)}
              />

              {limitReached && (
                <div className="p-3 bg-brandOrange/20 border border-brandOrange/50 text-brandOrangeLight rounded-lg text-sm text-center shadow-sm">
                  You hit your free daily message limit — upgrade for unlimited access.
                </div>
              )}

              <UpgradeBanner />
              <PremiumFeaturePanel onFeatureSelect={(text) => setInput(text)} />
            </div>

            <div className="flex items-center gap-3 ml-4">
              <div className="h-10 w-10 rounded-xl bg-brandBlue/30 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-brandBlueLight" />
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold text-brandBlueLight">
                  Prospra Mentor
                </h2>
                <p className="text-xs text-brandBlueLight/70">
                  {MODE_DESCRIPTIONS[mode]}
                </p>
                <div className="mt-1">
                  <label className="text-[10px] uppercase tracking-wide text-brandBlueLight/60">
                    Mode
                  </label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as ModeOption)}
                    className="mt-1 text-xs bg-brandNavy border border-brandBlue/60 rounded-lg px-2 py-1 text-brandBlueLight focus:outline-none focus:ring-2 focus:ring-brandOrangeLight/60 focus:border-brandOrangeLight transition"
                  >
                    <option value="mentor">{MODE_LABELS["mentor"]}</option>
                    <option value="website-coach">{MODE_LABELS["website-coach"]}</option>
                    <option value="seo-ux">{MODE_LABELS["seo-ux"]}</option>
                    <option value="funnel-mapping">{MODE_LABELS["funnel-mapping"]}</option>
                    <option value="cta-analyzer">{MODE_LABELS["cta-analyzer"]}</option>
                  </select>
                </div>
              </div>
            </div>

            <Link href="/upgrade">
              <Button className="bg-brandOrange hover:bg-brandOrangeLight text-white rounded-xl flex items-center gap-2 px-4 py-2">
                <Crown className="h-4 w-4" />
                Go Premium
              </Button>
            </Link>
          </div>

          {/* Empty State */}
          {!currentConversationId && messages.length === 0 ? (
            <EmptyState onSuggest={handleSuggestionClick} />
          ) : (
            <>
              {/* Funnel Diagram (only in funnel mode & when code exists) */}
              {mode === "funnel-mapping" && funnelMermaid && (
                <div className="px-6 pt-4">
                  <FunnelDiagram code={funnelMermaid} />
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((message: any) => {
                  const content = getMessageText(message);

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-4 ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div className="h-8 w-8 rounded-lg bg-brandBlue/30 flex items-center justify-center border border-brandBlue/60">
                          <Sparkles className="h-5 w-5 text-brandBlueLight" />
                        </div>
                      )}

                      <div
                        className={`max-w-3xl rounded-2xl px-6 py-4 shadow-md whitespace-pre-wrap break-words ${
                          message.role === "user"
                            ? "bg-brandOrange text-white rounded-br-none"
                            : "bg-brandNavyDark border border-brandBlue text-brandBlueLight rounded-bl-none"
                        }`}
                      >
                        <div className="prose prose-invert max-w-none leading-relaxed text-sm">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isLoading && <TypingIndicator />}
                <div ref={messageEndRef} />
              </div>

              {/* Input */}
              <MessageInput
                input={input}
                setInput={setInput}
                textareaRef={textareaRef}
                file={file}
                setFile={setFile}
                uploading={uploading}
                isLoading={isLoading}
                limitReached={limitReached}
                localError={localError}
                chatError={chatError}
                onSubmit={onSubmit}
                mode={mode}
                ctaScore={ctaScore}
              />
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ onSuggest }: { onSuggest: (text: string) => void }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <div className="h-20 w-20 rounded-2xl bg-brandBlue/30 flex items-center justify-center mx-auto mb-6 border border-brandBlue/60">
          <Sparkles className="h-10 w-10 text-brandBlueLight" />
        </div>
        <h2 className="text-3xl font-bold text-brandBlueLight mb-4">
          Your AI Entrepreneurial Mentor
        </h2>
        <p className="text-lg text-brandBlueLight/80 mb-8 leading-relaxed">
          Get personalized guidance, strategic advice, and support tailored to your journey.
        </p>

        <div className="grid gap-3 text-left">
          <SuggestionCard
            text="Help me validate my business idea"
            onClick={() => onSuggest("Help me validate my business idea")}
          />
          <SuggestionCard
            text="What are the first steps I should take?"
            onClick={() => onSuggest("What are the first steps I should take?")}
          />
          <SuggestionCard
            text="How do I create a business plan?"
            onClick={() => onSuggest("How do I create a business plan?")}
          />
        </div>
      </div>
    </div>
  );
}

// Message Input Component
function MessageInput({
  input,
  setInput,
  textareaRef,
  file,
  setFile,
  uploading,
  isLoading,
  limitReached,
  localError,
  chatError,
  onSubmit,
  mode,
  ctaScore,
}: any) {
  const getPlaceholder = () => {
    if (limitReached) {
      return "Daily message limit reached — upgrade to continue";
    }

    switch (mode as ModeOption) {
      case "website-coach":
        return "Ask Website Coach to review your site, sections, or flows (e.g. 'Audit my homepage hero' or 'Help me clarify my offer').";
      case "seo-ux":
        return "Ask for SEO/UX insights (e.g. 'Score my homepage for SEO/UX' or 'Help me improve my meta description and headings').";
      case "funnel-mapping":
        return "Describe your funnel (e.g. 'TikTok ad → Landing page → Email opt-in → Webinar → Sales call').";
      case "cta-analyzer":
        return "Paste your CTA or key section and ask for analysis (e.g. 'Analyze this CTA' or 'Give me 3 stronger versions').";
      case "mentor":
      default:
        return "Ask your AI mentor anything about your business, strategy, or next steps...";
    }
  };

  const handleStyleClick = (style: string) => {
    const basePrompt =
      "Rewrite this CTA using the following style: " + style + ". Keep it high-converting and aligned with my offer.";
    if (!input.trim()) {
      setInput(basePrompt + "\n\n[Paste your CTA here]");
    } else {
      setInput((prev: string) => prev + "\n\n" + basePrompt);
    }
  };

  const badgeClass = (value: number) => {
    if (value >= 80) return "bg-emerald-600/30 text-emerald-200 border-emerald-500/60";
    if (value >= 60) return "bg-amber-600/20 text-amber-200 border-amber-500/60";
    return "bg-rose-700/20 text-rose-200 border-rose-500/60";
  };

  return (
    <div className="border-t border-brandBlue/50 p-4 bg-brandNavyDark">
      {/* CTA Scorecard (only in CTA mode and when score exists) */}
      {mode === "cta-analyzer" && ctaScore && (
        <div className="mb-3 p-3 rounded-xl bg-brandNavy border border-brandBlue/60 shadow-inner">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-brandBlueLight">
              CTA Scorecard
            </h3>
            <span className="text-[10px] uppercase tracking-wide text-brandBlueLight/60">
              Conversion Snapshot
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2 text-xs">
            <div className={`px-2 py-1 rounded-lg border ${badgeClass(ctaScore.clarity)}`}>
              <div className="font-medium">Clarity</div>
              <div className="text-[11px] opacity-80">{ctaScore.clarity}/100</div>
            </div>
            <div className={`px-2 py-1 rounded-lg border ${badgeClass(ctaScore.emotion)}`}>
              <div className="font-medium">Emotion</div>
              <div className="text-[11px] opacity-80">{ctaScore.emotion}/100</div>
            </div>
            <div className={`px-2 py-1 rounded-lg border ${badgeClass(ctaScore.strength)}`}>
              <div className="font-medium">Action Strength</div>
              <div className="text-[11px] opacity-80">{ctaScore.strength}/100</div>
            </div>
            <div className={`px-2 py-1 rounded-lg border ${badgeClass(ctaScore.urgency)}`}>
              <div className="font-medium">Urgency</div>
              <div className="text-[11px] opacity-80">{ctaScore.urgency}/100</div>
            </div>
            <div className={`px-2 py-1 rounded-lg border ${badgeClass(ctaScore.conversion)}`}>
              <div className="font-medium">Conversion Likelihood</div>
              <div className="text-[11px] opacity-80">{ctaScore.conversion}/100</div>
            </div>
          </div>
          {ctaScore.summary && (
            <p className="text-[11px] text-brandBlueLight/80 leading-snug">
              {ctaScore.summary}
            </p>
          )}
        </div>
      )}

      {mode === "cta-analyzer" && (
        <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
          <span className="text-brandBlueLight/60 mr-1 self-center">
            Quick styles:
          </span>
          <button
            type="button"
            onClick={() => handleStyleClick("bold, direct, high-energy")}
            className="px-2 py-1 rounded-full bg-brandNavy border border-brandBlue/60 text-brandBlueLight hover:border-brandOrangeLight hover:text-brandOrangeLight transition"
          >
            Bold Power CTA
          </button>
          <button
            type="button"
            onClick={() => handleStyleClick("warm, friendly, reassuring")}
            className="px-2 py-1 rounded-full bg-brandNavy border border-brandBlue/60 text-brandBlueLight hover:border-brandOrangeLight hover:text-brandOrangeLight transition"
          >
            Warm & Friendly
          </button>
          <button
            type="button"
            onClick={() => handleStyleClick("luxury, premium, high-end")}
            className="px-2 py-1 rounded-full bg-brandNavy border border-brandBlue/60 text-brandBlueLight hover:border-brandOrangeLight hover:text-brandOrangeLight transition"
          >
            Luxury Tone
          </button>
          <button
            type="button"
            onClick={() => handleStyleClick("urgent, scarcity-driven, time-limited")}
            className="px-2 py-1 rounded-full bg-brandNavy border border-brandBlue/60 text-brandBlueLight hover:border-brandOrangeLight hover:text-brandOrangeLight transition"
          >
            Urgency Boost
          </button>
          <button
            type="button"
            onClick={() => handleStyleClick("short, punchy, minimal words")}
            className="px-2 py-1 rounded-full bg-brandNavy border border-brandBlue/60 text-brandBlueLight hover:border-brandOrangeLight hover:text-brandOrangeLight transition"
          >
            Short & Punchy
          </button>
          <button
            type="button"
            onClick={() => handleStyleClick("long-form, narrative, benefit-rich")}
            className="px-2 py-1 rounded-full bg-brandNavy border border-brandBlue/60 text-brandBlueLight hover:border-brandOrangeLight hover:text-brandOrangeLight transition"
          >
            Long-Form CTA
          </button>
        </div>
      )}

      {limitReached && (
        <div className="mb-3 p-3 bg-brandOrange/20 border border-brandOrange/40 rounded-lg text-brandOrangeLight text-sm text-center shadow-sm">
          You've reached your free daily message limit — upgrade for unlimited access.
        </div>
      )}

      {chatError && (
        <div className="mb-2 p-2 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-xs">
          Error: {chatError.message}
        </div>
      )}

      {localError && (
        <div className="mb-2 p-2 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-xs">
          {localError}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        {/* File Attach */}
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-brandNavy border border-brandBlue text-sm cursor-pointer hover:border-brandBlueLight transition">
            <input
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={uploading || isLoading || limitReached}
            />
            <Plus className="h-4 w-4 text-brandBlueLight" />
            <span className="text-brandBlueLight">Attach</span>
          </label>

          {file && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-brandNavy/80 border border-brandBlue text-xs text-brandBlueLight">
              <span className="truncate max-w-[200px]">{file.name}</span>
              <button
                type="button"
                className="text-brandOrangeLight hover:underline"
                onClick={() => setFile(null)}
              >
                Remove
              </button>
            </div>
          )}

          {uploading && (
            <span className="text-xs text-brandBlueLight/80">Uploading...</span>
          )}
        </div>

        {/* Textarea + Send */}
        <div className="flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={getPlaceholder()}
            rows={1}
            className="flex-1 bg-brandNavy border border-brandBlue text-white rounded-xl px-4 py-3 
            resize-none overflow-hidden focus:outline-none focus:border-brandOrangeLight 
            focus:ring-2 focus:ring-brandOrangeLight/40 shadow-inner shadow-brandNavy/40 
            placeholder:text-brandBlueLight/50 transition-all duration-200"
            disabled={isLoading || uploading || limitReached}
          />

          <Button
            type="submit"
            disabled={
              isLoading ||
              uploading ||
              limitReached ||
              (!input.trim() && !file)
            }
            className={`rounded-xl px-5 py-3 flex items-center gap-2 ${
              limitReached
                ? "bg-brandBlue/40 text-brandBlueLight cursor-not-allowed"
                : "bg-brandOrange hover:bg-brandOrangeLight text-white"
            }`}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

// Mermaid Funnel Diagram component
function FunnelDiagram({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const renderDiagram = async () => {
      try {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: "dark",
        });

        const id = "funnel-diagram-" + Date.now().toString();

        // Modern Mermaid: returns a Promise<{ svg, bindFunctions }>
        const { svg } = await mermaid.render(id, code);

        if (ref.current) {
          ref.current.innerHTML = svg;
        }
      } catch (err) {
        console.error("Mermaid render error:", err);
      }
    };

    renderDiagram();
  }, [code]);

  return (
    <div className="rounded-xl border border-brandBlue/60 bg-brandNavyDark/80 p-3 shadow-inner overflow-x-auto">
      <div className="text-xs text-brandBlueLight/60 mb-2">
        Funnel Diagram
      </div>
      <div ref={ref} className="min-w-[320px]" />
    </div>
  );
}

function SuggestionCard({
  text,
  onClick,
}: {
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-4 bg-brandNavyDark hover:bg-brandNavy border border-brandBlue/60 hover:border-brandOrange rounded-lg text-left transition-all"
    >
      <p className="text-brandBlueLight/90">{text}</p>
    </button>
  );
}


