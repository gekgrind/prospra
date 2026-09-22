"use client";

import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { ArrowUp, Square } from "lucide-react";

import { cn } from "@/lib/utils";

const MAX_TEXTAREA_HEIGHT = 200;

export type MentorComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  /** Stop the in-flight Mentor response. Shown in place of Send while busy. */
  onStop?: () => void;
  /** The Mentor is responding. Typing stays enabled; sending is blocked. */
  isBusy?: boolean;
  /** Hard-disable the whole composer (e.g. while a conversation loads). */
  disabled?: boolean;
  placeholder?: string;
  /** Left side of the toolbar — mode picker today. */
  leading?: ReactNode;
  /**
   * Extra actions rendered just before Send. Reserved for future controls such
   * as voice input, so they can be added without restructuring the composer.
   */
  actions?: ReactNode;
  hint?: ReactNode;
  variant?: "hero" | "docked";
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  autoFocus?: boolean;
};

export function MentorComposer({
  value,
  onChange,
  onSubmit,
  onStop,
  isBusy = false,
  disabled = false,
  placeholder = "Ask your mentor what to do next…",
  leading,
  actions,
  hint,
  variant = "docked",
  textareaRef,
  autoFocus,
}: MentorComposerProps) {
  const localRef = useRef<HTMLTextAreaElement | null>(null);
  const ref = textareaRef ?? localRef;
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const canSend = !disabled && !isBusy && value.trim().length > 0;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [ref, value]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }
    event.preventDefault();
    if (canSend) onSubmit();
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (canSend) onSubmit();
      }}
      className={cn(
        "group/composer relative rounded-[22px] border bg-[linear-gradient(180deg,rgba(12,26,46,0.92)_0%,rgba(7,17,32,0.96)_100%)] transition-[border-color,box-shadow] duration-300",
        "border-white/[0.09] shadow-[0_18px_50px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.04)]",
        "focus-within:border-[#00d4ff]/40 focus-within:shadow-[0_0_0_4px_rgba(0,212,255,0.07),0_18px_50px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.05)]",
        disabled && "opacity-60"
      )}
    >
      {/* Hairline highlight that lights up on focus. */}
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#00d4ff]/0 to-transparent transition-colors duration-300 group-focus-within/composer:via-[#00d4ff]/60" />

      <label htmlFor={inputId} className="sr-only">
        Message your mentor
      </label>
      <textarea
        id={inputId}
        ref={ref}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-describedby={hint ? hintId : undefined}
        className={cn(
          "block w-full resize-none bg-transparent px-5 text-[15px] leading-6 text-[#eef6ff] placeholder:text-[#7f97ae] focus:outline-none disabled:cursor-not-allowed",
          variant === "hero" ? "min-h-[76px] pt-5" : "min-h-[52px] pt-4"
        )}
      />

      <div className="flex items-center justify-between gap-3 px-3 pb-3 pt-1.5">
        <div className="flex min-w-0 items-center gap-2">{leading}</div>

        <div className="flex shrink-0 items-center gap-2">
          {actions}
          {isBusy && onStop ? (
            <button
              type="button"
              onClick={onStop}
              aria-label="Stop the mentor's response"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white transition hover:border-white/30 hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4ff]/60"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!canSend}
              aria-label="Send message"
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4ff]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07111f]",
                canSend
                  ? "bg-[#00d4ff] text-[#031329] shadow-[0_0_22px_rgba(0,212,255,0.4)] hover:bg-[#5ce4ff] motion-safe:hover:-translate-y-px"
                  : "cursor-not-allowed bg-white/[0.07] text-white/35"
              )}
            >
              <ArrowUp className="h-4 w-4" strokeWidth={2.4} />
            </button>
          )}
        </div>
      </div>

      {hint && (
        <p id={hintId} className="sr-only">
          {hint}
        </p>
      )}
    </form>
  );
}
