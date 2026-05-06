import "server-only";

export type SharedIntelligenceSource = "prospra" | "architecta";

export type SharedIntelligenceSnapshot = {
  app: SharedIntelligenceSource;
  generatedAt?: string | null;
  businessState?: {
    stage?: string | null;
    model?: string | null;
    offer?: string | null;
    audience?: string | null;
    blockers?: string[] | null;
  } | null;
  growthPriorities?: {
    now?: string[] | null;
    next?: string[] | null;
  } | null;
  contentAlignment?: {
    coreMessage?: string | null;
    proofPoints?: string[] | null;
    channels?: string[] | null;
  } | null;
  raw?: Record<string, unknown> | null;
};

export type UnifiedContext = {
  mergedAt: string;
  sources: SharedIntelligenceSource[];
  businessState: {
    stage: string | null;
    model: string | null;
    offer: string | null;
    audience: string | null;
    blockers: string[];
  };
  growthPriorities: {
    now: string[];
    next: string[];
  };
  contentAlignment: {
    coreMessage: string | null;
    proofPoints: string[];
    channels: string[];
  };
};

function pickFirstText(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    const cleaned = typeof value === "string" ? value.trim() : "";
    if (cleaned.length > 0) return cleaned;
  }
  return null;
}

function uniqueList(values: Array<string[] | null | undefined>): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const list of values) {
    if (!list) continue;

    for (const item of list) {
      const cleaned = item.trim();
      const key = cleaned.toLowerCase();
      if (!cleaned || seen.has(key)) continue;
      seen.add(key);
      output.push(cleaned);
    }
  }

  return output;
}

function sortByFreshness(snapshots: SharedIntelligenceSnapshot[]) {
  return [...snapshots].sort((a, b) => {
    const aTime = a.generatedAt ? Date.parse(a.generatedAt) : 0;
    const bTime = b.generatedAt ? Date.parse(b.generatedAt) : 0;
    return bTime - aTime;
  });
}

export function mergeSharedIntelligence(
  snapshots: SharedIntelligenceSnapshot[]
): UnifiedContext {
  const byFreshness = sortByFreshness(snapshots);
  const [primary, secondary] = byFreshness;

  return {
    mergedAt: new Date().toISOString(),
    sources: byFreshness.map((item) => item.app),
    businessState: {
      stage: pickFirstText(
        primary?.businessState?.stage,
        secondary?.businessState?.stage
      ),
      model: pickFirstText(
        primary?.businessState?.model,
        secondary?.businessState?.model
      ),
      offer: pickFirstText(
        primary?.businessState?.offer,
        secondary?.businessState?.offer
      ),
      audience: pickFirstText(
        primary?.businessState?.audience,
        secondary?.businessState?.audience
      ),
      blockers: uniqueList([
        primary?.businessState?.blockers ?? null,
        secondary?.businessState?.blockers ?? null,
      ]),
    },
    growthPriorities: {
      now: uniqueList([
        primary?.growthPriorities?.now ?? null,
        secondary?.growthPriorities?.now ?? null,
      ]),
      next: uniqueList([
        primary?.growthPriorities?.next ?? null,
        secondary?.growthPriorities?.next ?? null,
      ]),
    },
    contentAlignment: {
      coreMessage: pickFirstText(
        primary?.contentAlignment?.coreMessage,
        secondary?.contentAlignment?.coreMessage
      ),
      proofPoints: uniqueList([
        primary?.contentAlignment?.proofPoints ?? null,
        secondary?.contentAlignment?.proofPoints ?? null,
      ]),
      channels: uniqueList([
        primary?.contentAlignment?.channels ?? null,
        secondary?.contentAlignment?.channels ?? null,
      ]),
    },
  };
}

export async function buildUnifiedContext(
  loaders: {
    prospra: () => Promise<SharedIntelligenceSnapshot>;
    architecta: () => Promise<SharedIntelligenceSnapshot>;
  }
): Promise<UnifiedContext> {
  const [prospra, architecta] = await Promise.all([
    loaders.prospra(),
    loaders.architecta(),
  ]);

  return mergeSharedIntelligence([prospra, architecta]);
}

export function getExampleMergedOutput(): UnifiedContext {
  return mergeSharedIntelligence([
    {
      app: "prospra",
      generatedAt: "2026-05-05T10:00:00.000Z",
      businessState: {
        stage: "Early revenue",
        model: "Cohort coaching + templates",
        offer: "Founder momentum system",
        audience: "Solo founders with first traction",
        blockers: ["Inconsistent lead flow", "Weak positioning proof"],
      },
      growthPriorities: {
        now: ["Stabilize weekly pipeline", "Tighten onboarding conversion"],
        next: ["Build referral loop"],
      },
      contentAlignment: {
        coreMessage: "Help founders turn strategy into execution every week.",
        proofPoints: ["82% weekly plan completion", "Documented founder wins"],
        channels: ["Mentor sessions", "Weekly review email"],
      },
    },
    {
      app: "architecta",
      generatedAt: "2026-05-05T09:56:00.000Z",
      businessState: {
        stage: "Early revenue",
        model: "Productized strategy sprints",
        offer: "Clarity-to-conversion messaging",
        audience: "Service founders refining market narrative",
        blockers: ["Weak positioning proof", "Low landing-page clarity"],
      },
      growthPriorities: {
        now: ["Clarify homepage promise"],
        next: ["Launch case-study sequence", "Build referral loop"],
      },
      contentAlignment: {
        coreMessage: "Position the offer around measurable founder outcomes.",
        proofPoints: ["Outcome-led copy framework", "Before/after messaging examples"],
        channels: ["Homepage", "Case studies", "Email nurture"],
      },
    },
  ]);
}
