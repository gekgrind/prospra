// lib/tools-library.ts

import type { RoadmapStageTheme } from "./roadmap";

export type ToolCategory =
  | "strategy"
  | "research"
  | "content"
  | "funnels"
  | "analytics"
  | "ops"
  | "ai";

export type ToolStatus = "available" | "coming_soon";

export type ToolResource = {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  status: ToolStatus;
  url?: string;
  internalRoute?: string;
  roadmapThemes: RoadmapStageTheme[];
  tags: string[];
};

export const toolsLibrary: ToolResource[] = [
  {
    id: "prospra-mentor",
    name: "Prospra Mentor",
    description:
      "Your always-on AI founder coach for decisions, experiments, and emotional support.",
    category: "strategy",
    status: "available",
    internalRoute: "/app/mentor",
    roadmapThemes: ["foundation", "validation", "growth", "scale"],
    tags: ["ai", "coach", "strategy"],
  },
  {
    id: "website-coach",
    name: "Website Coach",
    description:
      "Analyzes your website for clarity, UX, and offer strength, then suggests improvements.",
    category: "funnels",
    status: "available",
    internalRoute: "/dashboard/website-coach",
    roadmapThemes: ["launch", "growth"],
    tags: ["website", "conversion", "funnels"],
  },
  {
    id: "website-score",
    name: "Website Score & Insights",
    description:
      "Score your SEO, UX, and offer clarity in one place and track improvements over time.",
    category: "analytics",
    status: "available",
    internalRoute: "/dashboard/website-insights",
    roadmapThemes: ["launch", "growth"],
    tags: ["analytics", "seo", "ux"],
  },
  {
    id: "seo-brief-generator",
    name: "SEO Brief Generator",
    description:
      "Turn a topic or URL into an SEO-optimized content brief in minutes.",
    category: "content",
    status: "available",
    internalRoute: "/tools/seo-brief",
    roadmapThemes: ["growth", "scale"],
    tags: ["seo", "content"],
  },
  {
    id: "storyspark",
    name: "StorySpark",
    description:
      "AI-powered personalized children’s book generator for creators & parents.",
    category: "ai",
    status: "coming_soon",
    internalRoute: "/tools/storyspark",
    roadmapThemes: ["growth", "scale"],
    tags: ["ai", "product", "mvp"],
  },
  {
    id: "ops-checklist",
    name: "Ops Checklist Generator",
    description:
      "Turn messy processes into clean step-by-step checklists you can delegate or automate.",
    category: "ops",
    status: "coming_soon",
    internalRoute: "/tools/ops-checklist",
    roadmapThemes: ["growth", "scale"],
    tags: ["ops", "systems"],
  },
];

export type ToolFilter = {
  query: string;
  category: ToolCategory | "all";
  theme: RoadmapStageTheme | "all";
  status: ToolStatus | "all";
};

export function filterTools(
  tools: ToolResource[],
  filter: ToolFilter
): ToolResource[] {
  const q = filter.query.toLowerCase().trim();

  return tools.filter((tool) => {
    if (
      filter.category !== "all" &&
      tool.category !== filter.category
    ) {
      return false;
    }

    if (filter.theme !== "all" && !tool.roadmapThemes.includes(filter.theme)) {
      return false;
    }

    if (filter.status !== "all" && tool.status !== filter.status) {
      return false;
    }

    if (!q) return true;

    const haystack = (
      tool.name +
      " " +
      tool.description +
      " " +
      tool.tags.join(" ")
    ).toLowerCase();

    return haystack.includes(q);
  });
}
