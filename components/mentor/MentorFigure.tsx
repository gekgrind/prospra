"use client";

import { useEffect, useState } from "react";
import Image, { getImageProps } from "next/image";
import { preload } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";
import {
  MENTOR_STATE_ASSETS,
  isMentorBusy,
  type MentorState,
} from "@/lib/mentor/presence";

type MentorFigureVariant = "full" | "portrait";

export type MentorFigureProps = {
  state: MentorState;
  variant?: MentorFigureVariant;
  /** Rendered CSS width in px. Drives `sizes` so the optimiser serves the right file. */
  size: number;
  /** Only the first visible state should be priority. */
  priority?: boolean;
  /** Gentle breathing float while resting. Disabled automatically for reduced motion. */
  float?: boolean;
  /** States to warm up in the background so later transitions don't flash. */
  preloadStates?: MentorState[];
  /** Let the caller size the box with classes (responsive); `size` stays the max. */
  fluid?: boolean;
  className?: string;
};

function assetFor(state: MentorState, variant: MentorFigureVariant) {
  const asset = MENTOR_STATE_ASSETS[state];
  return variant === "portrait" ? asset.portrait : asset.full;
}

/** Avatars all request one optimised size so each state is a single cached file. */
const AVATAR_IMAGE_SIZE = 48;

/**
 * Warm up Mentor state images during idle time so later state changes render
 * instantly instead of flashing an empty frame.
 */
export function usePreloadMentorStates(
  states: MentorState[] | undefined,
  variant: MentorFigureVariant,
  size: number = AVATAR_IMAGE_SIZE
) {
  const key = states?.join(",") ?? "";

  useEffect(() => {
    if (!key) return;

    // Wait until the page is idle so preloads never compete with first paint.
    const run = () => {
      for (const state of key.split(",") as MentorState[]) {
        // Mirror the rendered <Image fill sizes> exactly so the browser picks
        // the same srcset candidate it will later request.
        const { props } = getImageProps({
          src: assetFor(state, variant),
          alt: "",
          fill: true,
          sizes: `${size}px`,
        });

        preload(props.src, {
          as: "image",
          imageSrcSet: props.srcSet,
          imageSizes: props.sizes,
          fetchPriority: "low",
        });
      }
    };

    const w = window as Window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(run);
      return () => w.cancelIdleCallback?.(id);
    }

    const id = window.setTimeout(run, 600);
    return () => window.clearTimeout(id);
  }, [key, size, variant]);
}

/**
 * The Mentor character, rendered from the production state assets.
 *
 * The figure always occupies a fixed square box so state changes never cause
 * layout shift. It is decorative: status is announced separately by the
 * workspace's live region, so screen readers don't hear the robot on every change.
 */
export function MentorFigure({
  state,
  variant = "full",
  size,
  priority = false,
  float = false,
  preloadStates,
  fluid = false,
  className,
}: MentorFigureProps) {
  const reduceMotion = usePrefersReducedMotion();
  const busy = isMentorBusy(state);

  usePreloadMentorStates(preloadStates, variant, size);

  return (
    <div
      aria-hidden="true"
      data-mentor-state={state}
      data-reduced-motion={reduceMotion ? "true" : "false"}
      className={cn("relative aspect-square shrink-0 select-none", className)}
      style={fluid ? undefined : { width: size }}
    >
      {/* Cyan presence glow: faint at rest, a little brighter while working. */}
      <div
        className={cn(
          "pointer-events-none absolute inset-[12%] rounded-full bg-[radial-gradient(circle,rgba(0,212,255,0.28)_0%,rgba(0,212,255,0)_68%)] blur-2xl transition-opacity duration-700",
          busy ? "opacity-100 motion-safe:animate-[mentor-glow_2.8s_ease-in-out_infinite]" : "opacity-40"
        )}
      />

      <div
        className={cn(
          "absolute inset-0",
          float && !busy && "motion-safe:animate-[mentor-float_7s_ease-in-out_infinite]"
        )}
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={state}
            className="absolute inset-0"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.975, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.12 : 0.42, ease: [0.22, 1, 0.36, 1] }}
          >
            <FadeInImage src={assetFor(state, variant)} size={size} priority={priority} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Fades the figure in once decoded, so a slow first load never pops in. */
function FadeInImage({ src, size, priority }: { src: string; size: number; priority: boolean }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <Image
      src={src}
      alt=""
      fill
      sizes={`${size}px`}
      priority={priority}
      draggable={false}
      onLoad={() => setLoaded(true)}
      className={cn(
        "object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,0.45)] transition-opacity duration-500",
        loaded ? "opacity-100" : "opacity-0"
      )}
    />
  );
}

/** Circular portrait used beside Mentor messages and in compact presence. */
export function MentorAvatar({
  state,
  size = 32,
  className,
}: {
  state: MentorState;
  size?: number;
  className?: string;
}) {
  const busy = isMentorBusy(state);

  return (
    <div
      aria-hidden="true"
      data-mentor-state={state}
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full border bg-[radial-gradient(circle_at_50%_30%,rgba(0,212,255,0.22),rgba(6,16,30,0.95)_70%)] transition-[border-color,box-shadow] duration-500",
        busy
          ? "border-[#00d4ff]/55 shadow-[0_0_0_3px_rgba(0,212,255,0.10),0_0_18px_rgba(0,212,255,0.28)]"
          : "border-white/12",
        className
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={MENTOR_STATE_ASSETS[state].portrait}
        alt=""
        fill
        sizes={`${Math.max(size, AVATAR_IMAGE_SIZE)}px`}
        draggable={false}
        className="object-cover object-top"
      />
    </div>
  );
}
