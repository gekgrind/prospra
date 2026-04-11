"use client";

import * as React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import type { StageProgress } from "@/lib/roadmap";
import type { ToolResource } from "@/lib/tools-library";

type PageHeaderProps = {
  label?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export function PageHeader({
  label,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-3">
        {label ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-[#00D4FF]/20 bg-[#00D4FF]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#00D4FF]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00D4FF] shadow-[0_0_10px_rgba(0,212,255,0.8)]" />
            {label}
          </div>
        ) : null}

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white md:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#c7d8ea]/78 md:text-base">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      {actions ? <div className="flex-shrink-0">{actions}</div> : null}
    </div>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  sublabel?: string;
};

export function MetricCard({ label, value, sublabel }: MetricCardProps) {
  return (
    <Card className="relative overflow-hidden rounded-[24px] border border-[#4f7ca7]/20 bg-[rgba(10,20,38,0.72)] shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00D4FF]/55 to-transparent" />
      <CardHeader className="pb-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8fb8d8]">
            {label}
          </CardDescription>
          <span className="h-2.5 w-2.5 rounded-full bg-[#00D4FF] shadow-[0_0_18px_rgba(0,212,255,0.8)]" />
        </div>
        <CardTitle className="text-3xl font-semibold tracking-tight text-white">
          {value}
        </CardTitle>
        {sublabel ? (
          <p className="mt-2 text-sm leading-6 text-[#c7d8ea]/70">{sublabel}</p>
        ) : null}
      </CardHeader>
    </Card>
  );
}

type SectionCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
};

export function SectionCard({
  title,
  description,
  children,
  badge,
  className,
}: SectionCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-[28px] border border-[#4f7ca7]/20 bg-[rgba(10,20,38,0.72)] shadow-[0_20px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00D4FF]/55 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,212,255,0.10),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(79,124,167,0.10),transparent_32%)]" />

      <CardHeader className="relative z-10 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold tracking-tight text-white md:text-xl">
              {title}
            </CardTitle>
            {description ? (
              <CardDescription className="mt-2 text-sm leading-6 text-[#c7d8ea]/72">
                {description}
              </CardDescription>
            ) : null}
          </div>

          {badge ? <div className="flex-shrink-0">{badge}</div> : null}
        </div>
      </CardHeader>

      <CardContent className="relative z-10 pt-0">{children}</CardContent>
    </Card>
  );
}

type StageBadgeProps = {
  theme: StageProgress["stage"]["theme"];
};

export function StageThemeBadge({ theme }: StageBadgeProps) {
  const map: Record<
    StageProgress["stage"]["theme"],
    { label: string }
  > = {
    foundation: { label: "Foundation" },
    validation: { label: "Validation" },
    launch: { label: "Launch" },
    growth: { label: "Growth" },
    scale: { label: "Scale" },
  };

  const cfg = map[theme];

  return (
    <Badge
      variant="outline"
      className="rounded-full border border-[#00D4FF]/20 bg-[#00D4FF]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c9f6ff]"
    >
      {cfg.label}
    </Badge>
  );
}

type StageProgressBarProps = {
  progress: StageProgress;
};

export function StageProgressBar({ progress }: StageProgressBarProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-medium text-white">
            {progress.stage.title}
          </span>
          <StageThemeBadge theme={progress.stage.theme} />
        </div>
        <span className="whitespace-nowrap text-[#c7d8ea]/68">
          {progress.completedSteps}/{progress.totalSteps} · {progress.percent}%
        </span>
      </div>

      <Progress
        value={progress.percent}
        className="h-2 overflow-hidden rounded-full border border-white/5 bg-[#07111f] [&>div]:bg-[linear-gradient(90deg,#00D4FF_0%,#4f7ca7_100%)]"
      />
    </div>
  );
}

type ToolPillProps = {
  tool: ToolResource;
};

export function ToolPill({ tool }: ToolPillProps) {
  const statusStyles =
    tool.status === "available"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : "border-amber-400/20 bg-amber-400/10 text-amber-300";

  const statusLabel =
    tool.status === "available" ? "Available" : "Coming soon";

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="flex flex-col gap-3 rounded-2xl border border-[#4f7ca7]/15 bg-[rgba(255,255,255,0.03)] p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-white">{tool.name}</span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]",
            statusStyles
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {statusLabel}
        </span>
      </div>

      <p className="text-[11px] leading-snug text-[#c7d8ea]/72">
        {tool.description}
      </p>

      <div className="mt-1 flex flex-wrap gap-1.5">
        {tool.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-[#4f7ca7]/15 bg-[#07111f]/80 px-2 py-0.5 text-[10px] text-[#c7d8ea]/76"
          >
            #{tag}
          </span>
        ))}
      </div>

      {tool.internalRoute ? (
        <div className="mt-1">
          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-8 rounded-full border-[#00D4FF]/25 bg-[#0f223d] px-3 text-[11px] font-semibold text-white hover:bg-[#143055] hover:text-white"
          >
            <Link href={tool.internalRoute}>Open tool</Link>
          </Button>
        </div>
      ) : null}
    </motion.div>
  );
}

type CoachBubbleProps = {
  role: "coach" | "founder";
  text: string;
};

export function CoachBubble({ role, text }: CoachBubbleProps) {
  const isCoach = role === "coach";

  return (
    <div className={cn("flex w-full", isCoach ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl border px-3 py-2.5 text-xs leading-relaxed md:text-sm",
          isCoach
            ? "border-[#00D4FF]/20 bg-[#00D4FF]/8 text-[#e8fbff]"
            : "border-[#4f7ca7]/18 bg-[rgba(255,255,255,0.04)] text-[#eef6ff]"
        )}
      >
        {text}
      </div>
    </div>
  );
}