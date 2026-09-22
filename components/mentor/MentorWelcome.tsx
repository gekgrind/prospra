"use client";

import type { ReactNode } from "react";
import { Compass, Lightbulb, ShieldQuestion, Tags } from "lucide-react";

import type { MentorState } from "@/lib/mentor/presence";

import { MentorFigure } from "./MentorFigure";

export type ConversationStarter = {
  id: string;
  label: string;
  prompt: string;
  icon: typeof Compass;
};

/**
 * Grounded in what the Mentor actually receives: founder profile, memories,
 * website intelligence and action plans (see /api/chat + buildMentorContext).
 */
export const CONVERSATION_STARTERS: ConversationStarter[] = [
  {
    id: "focus",
    label: "What should I focus on this week?",
    prompt:
      "Based on where my business is right now, what should I focus on this week to create real momentum?",
    icon: Compass,
  },
  {
    id: "pressure-test",
    label: "Pressure-test my business idea",
    prompt:
      "Pressure-test my business idea. Where are the biggest risks, and what should I validate first?",
    icon: ShieldQuestion,
  },
  {
    id: "offer",
    label: "Sharpen my offer and pricing",
    prompt:
      "Help me sharpen my offer positioning and pricing so it lands with my first 10 customers.",
    icon: Tags,
  },
  {
    id: "stuck",
    label: "I'm stuck — help me think it through",
    prompt:
      "I'm stuck on a decision. Ask me a few sharp questions first, then help me think it through.",
    icon: Lightbulb,
  },
];

const INTENT_COPY: Record<string, string> = {
  "action-plan": "Let's turn where you are into a clear, prioritized action plan.",
  "weekly-review": "Let's look back at your week and set up the next one with intent.",
  unblock: "Tell me where you're stuck. We'll find the next move together.",
};

export function getIntentCopy(intent: string | null) {
  if (!intent) return null;
  return INTENT_COPY[intent] ?? `Let's tackle this with a ${intent.replace(/-/g, " ")} lens.`;
}

export function ConversationStarters({
  onSelect,
  disabled,
}: {
  onSelect: (starter: ConversationStarter) => void;
  disabled?: boolean;
}) {
  return (
    <ul
      aria-label="Conversation starters"
      className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden"
    >
      {CONVERSATION_STARTERS.map((starter, index) => {
        const Icon = starter.icon;
        return (
          <li
            key={starter.id}
            className="shrink-0 snap-start motion-safe:animate-[mentor-rise_0.5s_ease-out_both]"
            style={{ animationDelay: `${180 + index * 60}ms` }}
          >
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelect(starter)}
              className="group/starter flex items-center gap-2 whitespace-nowrap rounded-full border border-white/[0.08] bg-white/[0.025] px-3.5 py-2 text-[13px] text-[#c6d9ea] transition-all duration-200 hover:border-[#00d4ff]/35 hover:bg-[#00d4ff]/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4ff]/50 disabled:opacity-50 motion-safe:hover:-translate-y-px"
            >
              <Icon className="h-3.5 w-3.5 text-[#00d4ff]/70 transition-colors group-hover/starter:text-[#00d4ff]" />
              {starter.label}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function MentorWelcome({
  mentorState,
  firstName,
  intent,
  composer,
  onSelectStarter,
}: {
  mentorState: MentorState;
  firstName: string | null;
  intent: string | null;
  composer: ReactNode;
  onSelectStarter: (starter: ConversationStarter) => void;
}) {
  const intentCopy = getIntentCopy(intent);

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-5 sm:px-8 sm:py-8 md:py-10">
      <div className="flex w-full max-w-[680px] flex-col items-center text-center">
        <MentorFigure
          state={mentorState}
          size={256}
          fluid
          priority
          float
          preloadStates={["thinking", "explaining", "idle"]}
          className="-mb-1 w-[136px] sm:w-[184px] lg:w-[228px] 2xl:w-[256px]"
        />

        {firstName && (
          <p className="mt-2 text-[12px] font-medium uppercase tracking-[0.22em] text-[#00d4ff]/80 motion-safe:animate-[mentor-rise_0.5s_ease-out_both]">
            Good to see you, {firstName}
          </p>
        )}

        <h2 className="mt-2 text-balance text-[24px] font-semibold tracking-tight text-white sm:text-[32px] motion-safe:animate-[mentor-rise_0.5s_ease-out_both] [animation-delay:60ms]">
          What are we working on?
        </h2>
        <p className="mt-2.5 max-w-[520px] text-pretty text-[14.5px] leading-relaxed text-[#a9bfd3] sm:text-[15px] motion-safe:animate-[mentor-rise_0.5s_ease-out_both] [animation-delay:120ms]">
          {intentCopy ??
            "Bring me a decision, a plan or a problem. I'll use what I know about your business to help you find the next move."}
        </p>

        <div className="mt-6 w-full sm:mt-7 motion-safe:animate-[mentor-rise_0.5s_ease-out_both] [animation-delay:150ms]">
          {composer}
        </div>

        <div className="mt-4 w-full sm:mt-5">
          <ConversationStarters onSelect={onSelectStarter} />
        </div>
      </div>
    </div>
  );
}
