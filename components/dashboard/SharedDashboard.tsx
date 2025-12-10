// components/dashboard/SharedDashboard.tsx
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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

export function PageHeader({ label, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
      <div className="space-y-2">
        {label && (
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/40 bg-sky-950/40 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-sky-200">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            {label}
          </div>
        )}
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-50 tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-2xl text-sm md:text-base text-slate-300/90">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex-shrink-0">{actions}</div>}
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
    <Card className="bg-slate-900/60 border-slate-700/60 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardDescription className="text-xs uppercase tracking-[0.16em] text-slate-400">
          {label}
        </CardDescription>
        <CardTitle className="text-2xl text-slate-50">{value}</CardTitle>
        {sublabel && (
          <p className="mt-1 text-xs text-slate-400">{sublabel}</p>
        )}
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
        "bg-slate-950/60 border-slate-700/60 shadow-[0_0_40px_rgba(15,23,42,0.7)]",
        "relative overflow-hidden",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(8,47,73,0.8),_transparent_60%)]" />
      <CardHeader className="relative z-10 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base md:text-lg text-slate-50">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="mt-1 text-xs md:text-sm text-slate-300/80">
                {description}
              </CardDescription>
            )}
          </div>
          {badge && <div className="flex-shrink-0">{badge}</div>}
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
    { label: string; variant: string }
  > = {
    foundation: { label: "Foundation", variant: "outline" },
    validation: { label: "Validation", variant: "outline" },
    launch: { label: "Launch", variant: "outline" },
    growth: { label: "Growth", variant: "outline" },
    scale: { label: "Scale", variant: "outline" },
  };

  const cfg = map[theme];

  return (
    <Badge
      variant="outline"
      className="border-sky-500/40 bg-sky-950/30 text-sky-100 text-[10px] uppercase tracking-[0.14em]"
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
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-100">
            {progress.stage.title}
          </span>
          <StageThemeBadge theme={progress.stage.theme} />
        </div>
        <span className="text-slate-400">
          {progress.completedSteps}/{progress.totalSteps} ·{" "}
          {progress.percent}%
        </span>
      </div>
      <Progress
        value={progress.percent}
        className="h-2 bg-slate-800"
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
      ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-100"
      : "border-amber-500/40 bg-amber-950/40 text-amber-100";

  const statusLabel =
    tool.status === "available" ? "Available" : "Coming soon";

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={cn(
        "flex flex-col gap-2 rounded-xl border px-3 py-2 text-xs",
        "bg-slate-900/60 border-slate-700/60"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-slate-50">{tool.name}</span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em]",
            statusStyles
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {statusLabel}
        </span>
      </div>
      <p className="text-[11px] text-slate-300/80 leading-snug">
        {tool.description}
      </p>
      <div className="flex flex-wrap gap-1 mt-1">
        {tool.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-300"
          >
            #{tag}
          </span>
        ))}
      </div>
      {tool.internalRoute && (
        <div className="mt-1">
          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-7 border-sky-500/40 bg-slate-950/80 text-[11px] text-sky-100 hover:bg-sky-900/50"
          >
            <a href={tool.internalRoute}>Open tool</a>
          </Button>
        </div>
      )}
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
    <div
      className={cn(
        "flex w-full",
        isCoach ? "justify-start" : "justify-end"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3 py-2 text-xs md:text-sm leading-relaxed",
          isCoach
            ? "bg-sky-900/60 border border-sky-500/40 text-sky-50"
            : "bg-slate-800/80 border border-slate-600/70 text-slate-50"
        )}
      >
        {text}
      </div>
    </div>
  );
}
