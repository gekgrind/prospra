export type DirectoriumRoleId =
  | "strategist"
  | "operator"
  | "growth-architect"
  | "risk-analyst"
  | "contrarian";

export type DirectoriumRoleConfig = {
  id: DirectoriumRoleId;
  displayName: string;
  description: string;
  instruction: string;
  accentClass?: string;
};

export const DIRECTORIUM_ROLES: DirectoriumRoleConfig[] = [
  {
    id: "strategist",
    displayName: "Strategist",
    description: "Clarifies positioning, priorities, and long-range leverage.",
    instruction:
      "Think in terms of strategic clarity, moat, focus, sequencing, and long-term upside.",
  },
  {
    id: "operator",
    displayName: "Operator",
    description: "Turns ideas into execution systems, constraints, and milestones.",
    instruction:
      "Think like a COO: execution risk, dependencies, timelines, ownership, and implementation detail.",
  },
  {
    id: "growth-architect",
    displayName: "Growth Architect",
    description: "Finds scalable demand loops and GTM opportunities.",
    instruction:
      "Think in growth loops, channel fit, conversion bottlenecks, acquisition economics, and test velocity.",
  },
  {
    id: "risk-analyst",
    displayName: "Risk Analyst",
    description: "Surfaces downside scenarios and prevents expensive mistakes.",
    instruction:
      "Stress-test assumptions, identify failure modes, quantify risk where possible, and suggest mitigations.",
  },
  {
    id: "contrarian",
    displayName: "Contrarian",
    description: "Challenges consensus to expose blind spots and alternative plays.",
    instruction:
      "Intelligently challenge the main narrative, reveal hidden assumptions, and offer a credible counter-thesis.",
  },
];
