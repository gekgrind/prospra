"use client";

import type { MouseEvent, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

function applyInteractiveMotion(event: MouseEvent<HTMLDivElement>) {
  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();

  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const px = x / rect.width;
  const py = y / rect.height;

  const centerX = px - 0.5;
  const centerY = py - 0.5;

  const rotateY = centerX * 10;
  const rotateX = centerY * -10;

  const moveX = centerX * 18;
  const moveY = centerY * 18;

  card.style.setProperty("--mouse-x", `${px * 100}%`);
  card.style.setProperty("--mouse-y", `${py * 100}%`);
  card.style.setProperty("--rotate-x", `${rotateX}deg`);
  card.style.setProperty("--rotate-y", `${rotateY}deg`);
  card.style.setProperty("--move-x", `${moveX}px`);
  card.style.setProperty("--move-y", `${moveY}px`);
  card.style.setProperty("--glow-opacity", "1");
  card.style.setProperty("--ripple-x", `${px * 100}%`);
  card.style.setProperty("--ripple-y", `${py * 100}%`);
}

function handleInteractiveEnter(event: MouseEvent<HTMLDivElement>) {
  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();

  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const px = (x / rect.width) * 100;
  const py = (y / rect.height) * 100;

  card.style.setProperty("--mouse-x", `${px}%`);
  card.style.setProperty("--mouse-y", `${py}%`);
  card.style.setProperty("--ripple-x", `${px}%`);
  card.style.setProperty("--ripple-y", `${py}%`);
  card.style.setProperty("--glow-opacity", "1");
  card.style.setProperty("--ripple-opacity", "0.9");
  card.style.setProperty("--ripple-size", "0");

  requestAnimationFrame(() => {
    card.style.setProperty("--ripple-size", "220");
  });
}

function handleInteractiveLeave(event: MouseEvent<HTMLDivElement>) {
  const card = event.currentTarget;

  card.style.setProperty("--rotate-x", "0deg");
  card.style.setProperty("--rotate-y", "0deg");
  card.style.setProperty("--move-x", "0px");
  card.style.setProperty("--move-y", "0px");
  card.style.setProperty("--glow-opacity", "0");
  card.style.setProperty("--ripple-opacity", "0");
  card.style.setProperty("--ripple-size", "0");
}

function handleInteractiveClick(event: MouseEvent<HTMLDivElement>) {
  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();

  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;

  card.style.setProperty("--ripple-x", `${x}%`);
  card.style.setProperty("--ripple-y", `${y}%`);
  card.style.setProperty("--ripple-opacity", "1");
  card.style.setProperty("--ripple-size", "0");

  requestAnimationFrame(() => {
    card.style.setProperty("--ripple-size", "320");
  });

  window.setTimeout(() => {
    card.style.setProperty("--ripple-opacity", "0");
  }, 260);
}

const interactiveCardHandlers = {
  onMouseMove: applyInteractiveMotion,
  onMouseEnter: handleInteractiveEnter,
  onMouseLeave: handleInteractiveLeave,
  onClick: handleInteractiveClick,
};

export function InteractiveGlowSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div {...interactiveCardHandlers} className={cn("interactive-card", className)}>
      {children}
    </div>
  );
}

export function InteractiveGlowCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card {...interactiveCardHandlers} className={cn("interactive-card", className)}>
      {children}
    </Card>
  );
}
