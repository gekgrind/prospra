// lib/roadmap.ts

export type RoadmapStageTheme =
  | "foundation"
  | "validation"
  | "launch"
  | "growth"
  | "scale";

export type RoadmapStage = {
  id: string;
  title: string;
  description: string;
  order: number;
  theme: RoadmapStageTheme;
};

export type RoadmapStep = {
  id: string;
  stageId: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  estimatedTimeHours: number;
  tags: string[];
};

export type RoadmapProgress = {
  completedStepIds: string[];
};

export type RoadmapData = {
  stages: RoadmapStage[];
  steps: RoadmapStep[];
  progress: RoadmapProgress;
};

export type StageProgress = {
  stage: RoadmapStage;
  totalSteps: number;
  completedSteps: number;
  percent: number;
};

export type OverallProgress = {
  totalSteps: number;
  completedSteps: number;
  percent: number;
};

const DEFAULT_COMPLETED_STEP_IDS: string[] = [
  "define-vision",
  "audience-snapshot",
  "simple-offer",
];

export function getDefaultRoadmap(): RoadmapData {
  const stages: RoadmapStage[] = [
    {
      id: "foundation",
      title: "Foundation & Clarity",
      description:
        "Lock in your vision, audience, and core offer so everything else has a spine.",
      order: 1,
      theme: "foundation",
    },
    {
      id: "validation",
      title: "Validation & Proof",
      description:
        "Test your idea with real humans and get proof people actually want this.",
      order: 2,
      theme: "validation",
    },
    {
      id: "launch",
      title: "Launch & Presence",
      description:
        "Build your basic marketing funnel, website, and launch assets.",
      order: 3,
      theme: "launch",
    },
    {
      id: "growth",
      title: "Growth & Systems",
      description:
        "Add repeatable acquisition channels and simple systems that save your sanity.",
      order: 4,
      theme: "growth",
    },
    {
      id: "scale",
      title: "Scale & Leverage",
      description:
        "Layer in leverage: automation, delegation, and higher-ticket or productized offers.",
      order: 5,
      theme: "scale",
    },
  ];

  const steps: RoadmapStep[] = [
    // FOUNDATION
    {
      id: "define-vision",
      stageId: "foundation",
      title: "Define your founder vision",
      description:
        "Write a one-page vision: who you help, how you help, and what ‘success’ looks like in 12–24 months.",
      difficulty: "easy",
      estimatedTimeHours: 1,
      tags: ["clarity", "mindset"],
    },
    {
      id: "audience-snapshot",
      stageId: "foundation",
      title: "Create an audience snapshot",
      description:
        "Document your ideal customer: pains, desires, language they use, and 3–5 real places they hang out.",
      difficulty: "medium",
      estimatedTimeHours: 2,
      tags: ["research", "customer"],
    },
    {
      id: "simple-offer",
      stageId: "foundation",
      title: "Draft a simple flagship offer",
      description:
        "Define one main offer: who it’s for, what problem it solves, price range, and 3–5 transformative outcomes.",
      difficulty: "medium",
      estimatedTimeHours: 2,
      tags: ["offer", "monetization"],
    },

    // VALIDATION
    {
      id: "validation-calls",
      stageId: "validation",
      title: "Run 3–5 validation conversations",
      description:
        "Talk to real humans in your audience. Validate pains, price sensitivity, and your offer framing.",
      difficulty: "medium",
      estimatedTimeHours: 3,
      tags: ["validation", "customer"],
    },
    {
      id: "beta-offer",
      stageId: "validation",
      title: "Launch a small beta",
      description:
        "Invite early adopters into a discounted or limited-time beta version of your offer.",
      difficulty: "hard",
      estimatedTimeHours: 4,
      tags: ["launch", "revenue"],
    },

    // LAUNCH
    {
      id: "website-basics",
      stageId: "launch",
      title: "Launch your lean website",
      description:
        "Publish a simple, clear website with one hero offer, one primary CTA, and basic credibility.",
      difficulty: "medium",
      estimatedTimeHours: 4,
      tags: ["website", "conversion"],
    },
    {
      id: "core-funnel",
      stageId: "launch",
      title: "Build a core funnel",
      description:
        "Design a simple funnel: traffic source → landing page → lead capture or consult call.",
      difficulty: "hard",
      estimatedTimeHours: 5,
      tags: ["funnel", "offers"],
    },

    // GROWTH
    {
      id: "primary-growth-channel",
      stageId: "growth",
      title: "Choose a primary growth channel",
      description:
        "Commit to one channel (SEO, content, ads, partnerships, etc.) and design a 90-day experiment.",
      difficulty: "medium",
      estimatedTimeHours: 3,
      tags: ["growth", "marketing"],
    },
    {
      id: "simple-system",
      stageId: "growth",
      title: "Add one simple system",
      description:
        "Systematize one recurring process (onboarding, content, support) with a checklist or automation.",
      difficulty: "medium",
      estimatedTimeHours: 3,
      tags: ["systems", "ops"],
    },

    // SCALE
    {
      id: "productize",
      stageId: "scale",
      title: "Productize or package your offer",
      description:
        "Turn 1:1 work into a productized service or scalable package with clear scope, price, and process.",
      difficulty: "hard",
      estimatedTimeHours: 4,
      tags: ["scale", "productized"],
    },
    {
      id: "team-or-tools",
      stageId: "scale",
      title: "Add leverage (team or tools)",
      description:
        "Delegate or automate at least one chunk of work using contractors, team members, or AI.",
      difficulty: "hard",
      estimatedTimeHours: 4,
      tags: ["team", "automation"],
    },
  ];

  const progress: RoadmapProgress = {
    completedStepIds: DEFAULT_COMPLETED_STEP_IDS,
  };

  return { stages, steps, progress };
}

export function getStageSteps(
  stageId: string,
  steps: RoadmapStep[]
): RoadmapStep[] {
  return steps.filter((step) => step.stageId === stageId);
}

export function computeStageProgress(
  stage: RoadmapStage,
  steps: RoadmapStep[],
  progress: RoadmapProgress
): StageProgress {
  const stageSteps = getStageSteps(stage.id, steps);
  const totalSteps = stageSteps.length;
  const completedSteps = stageSteps.filter((step) =>
    progress.completedStepIds.includes(step.id)
  ).length;

  const percent =
    totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100);

  return {
    stage,
    totalSteps,
    completedSteps,
    percent,
  };
}

export function computeOverallProgress(
  stages: RoadmapStage[],
  steps: RoadmapStep[],
  progress: RoadmapProgress
): OverallProgress {
  if (steps.length === 0) {
    return {
      totalSteps: 0,
      completedSteps: 0,
      percent: 0,
    };
  }

  const totalSteps = steps.length;
  const completedSteps = steps.filter((step) =>
    progress.completedStepIds.includes(step.id)
  ).length;

  const percent = Math.round((completedSteps / totalSteps) * 100);

  return {
    totalSteps,
    completedSteps,
    percent,
  };
}

export function getFocusStage(
  stages: RoadmapStage[],
  steps: RoadmapStep[],
  progress: RoadmapProgress
): StageProgress | null {
  if (stages.length === 0) return null;

  const stageProgressList = stages
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((stage) => computeStageProgress(stage, steps, progress));

  // Focus on the earliest stage that is not 100% complete
  const notDone = stageProgressList.find((sp) => sp.percent < 100);
  return notDone ?? stageProgressList[stageProgressList.length - 1];
}
