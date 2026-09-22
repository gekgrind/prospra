"use client";

import { ChevronDown, Crown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  MENTOR_MODES,
  MODE_DESCRIPTIONS,
  MODE_LABELS,
  isMentorMode,
  type MentorMode,
} from "./modes";

export function MentorModePicker({
  mode,
  onModeChange,
  isPremiumUser,
}: {
  mode: MentorMode;
  onModeChange: (mode: MentorMode) => void;
  isPremiumUser: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Mentor mode: ${MODE_LABELS[mode]}. Change mode`}
        className="flex h-8 min-w-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 text-[12.5px] font-medium text-[#cfe2f3] transition hover:border-[#00d4ff]/30 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4ff]/50 data-[state=open]:border-[#00d4ff]/40"
      >
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#00d4ff] shadow-[0_0_8px_rgba(0,212,255,0.8)]" />
        <span className="truncate">{MODE_LABELS[mode]}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="w-72 rounded-2xl border border-white/10 bg-[#081426]/98 p-1.5 text-[#dbe9f6] shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl"
      >
        <DropdownMenuLabel className="px-2.5 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8fb3cf]/80">
          Mentor mode
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={mode}
          onValueChange={(value) => {
            if (isMentorMode(value)) onModeChange(value);
          }}
        >
          {MENTOR_MODES.map((option) => {
            const locked = option === "board-review" && !isPremiumUser;
            return (
              <DropdownMenuRadioItem
                key={option}
                value={option}
                disabled={locked}
                className="flex-col items-start gap-0.5 rounded-xl py-2 pl-8 pr-2.5 text-[#e4f0fb] focus:bg-white/[0.06] focus:text-white data-[disabled]:opacity-50 [&>span:first-child]:top-3"
              >
                <span className="flex items-center gap-1.5 text-[13px] font-medium">
                  {MODE_LABELS[option]}
                  {locked && <Crown className="h-3 w-3 text-brandYellow" aria-label="Premium" />}
                </span>
                <span className="text-[11.5px] leading-snug text-[#9fb6ca]">
                  {MODE_DESCRIPTIONS[option]}
                </span>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
