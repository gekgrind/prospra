// app/dashboard/tools-library/page.tsx
"use client";

import * as React from "react";
import { toolsLibrary, filterTools } from "@/lib/tools-library";
import { PageHeader, SectionCard, ToolPill } from "@/components/dashboard/SharedDashboard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ToolCategory, ToolStatus } from "@/lib/tools-library";
import type { RoadmapStageTheme } from "@/lib/roadmap";

export default function ToolsLibraryPage() {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<ToolCategory | "all">("all");
  const [theme, setTheme] = React.useState<RoadmapStageTheme | "all">("all");
  const [status, setStatus] = React.useState<ToolStatus | "all">("all");

  const filtered = filterTools(toolsLibrary, {
    query,
    category,
    theme,
    status,
  });

  return (
    <div className="space-y-8">
      <PageHeader
        label="Tools"
        title="Tools Library"
        description="Every tool in your ecosystem, mapped to your roadmap. Filter by stage, status, or category and launch what you need in two clicks."
      />

      {/* Filters */}
      <SectionCard title="Filters" description="Dial in what you want to focus on right now.">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Search
            </label>
            <Input
              placeholder="Search tools by name, purpose, or tag…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-slate-950/80 border-slate-700/70 text-slate-50 placeholder:text-slate-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Category
            </label>
            <Select
              value={category}
              onValueChange={(val) =>
                setCategory(val as ToolCategory | "all")
              }
            >
              <SelectTrigger className="bg-slate-950/80 border-slate-700/70 text-slate-50">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="all">All categories</SelectItem>
                <SelectItem value="strategy">Strategy</SelectItem>
                <SelectItem value="research">Research</SelectItem>
                <SelectItem value="content">Content</SelectItem>
                <SelectItem value="funnels">Funnels</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
                <SelectItem value="ops">Ops</SelectItem>
                <SelectItem value="ai">AI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-300">
                Roadmap Stage
              </label>
              <Select
                value={theme}
                onValueChange={(val) =>
                  setTheme(val as RoadmapStageTheme | "all")
                }
              >
                <SelectTrigger className="bg-slate-950/80 border-slate-700/70 text-slate-50">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="all">All stages</SelectItem>
                  <SelectItem value="foundation">Foundation</SelectItem>
                  <SelectItem value="validation">Validation</SelectItem>
                  <SelectItem value="launch">Launch</SelectItem>
                  <SelectItem value="growth">Growth</SelectItem>
                  <SelectItem value="scale">Scale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-300">
                Status
              </label>
              <Select
                value={status}
                onValueChange={(val) =>
                  setStatus(val as ToolStatus | "all")
                }
              >
                <SelectTrigger className="bg-slate-950/80 border-slate-700/70 text-slate-50">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="coming_soon">Coming soon</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Tools grid */}
      <SectionCard
        title="Tools"
        description="These are the building blocks of your stack. Start with what supports your current roadmap stage."
      >
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-400">
            No tools match those filters yet. Try widening your filters or
            clearing the search box.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((tool) => (
              <ToolPill key={tool.id} tool={tool} />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
