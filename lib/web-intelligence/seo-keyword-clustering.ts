export type KeywordIntent = "informational" | "commercial" | "transactional" | "navigational";

export type KeywordCluster = {
  cluster: string;
  intent: KeywordIntent;
  keywords: string[];
};

export type KeywordClusteringResult = {
  seedKeyword: string;
  generatedAt: string;
  clusters: KeywordCluster[];
};

export type KeywordClusteringError = { error: string };

const MODIFIERS = {
  informational: ["what is", "guide", "tips", "examples", "strategy"],
  commercial: ["best", "top", "compare", "review", "alternatives"],
  transactional: ["buy", "pricing", "services", "agency", "consultant"],
  navigational: ["tools", "software", "platform", "template", "checklist"],
} as const;

export function normalizeSeedKeyword(value: string): string {
  const keyword = value.trim().toLowerCase();
  if (!keyword) {
    throw new Error("A seed keyword is required.");
  }
  if (keyword.length < 2) {
    throw new Error("Seed keyword is too short.");
  }
  return keyword;
}

const AI_GENERATION_TIMEOUT_MS = 15000;

async function clusterSeoKeywordsWithAi(
  seed: string
): Promise<KeywordClusteringResult | null> {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  try {
    const [{ generateObject }, { openai }, { z }] = await Promise.all([
      import("ai"),
      import("@ai-sdk/openai"),
      import("zod"),
    ]);

    const clusterSchema = z.object({
      clusters: z
        .array(
          z.object({
            cluster: z.string().min(1),
            intent: z.enum([
              "informational",
              "commercial",
              "transactional",
              "navigational",
            ]),
            keywords: z.array(z.string().min(1)).min(4).max(8),
          })
        )
        .min(3)
        .max(6),
    });

    const generateStructuredObject = generateObject as (options: {
      model: unknown;
      schema: unknown;
      prompt: string;
    }) => Promise<{ object: { clusters: KeywordCluster[] } }>;

    const { object } = await withTimeout(
      generateStructuredObject({
        model: openai("gpt-4o-mini"),
        schema: clusterSchema,
        prompt: `You are Prospra's SEO keyword clustering engine.

Generate realistic keyword clusters for the seed keyword: "${seed}"

Return strict JSON only.

Rules:
- Return 3-6 clusters, each with a short descriptive cluster name, a search intent (informational, commercial, transactional, or navigational), and 4-8 realistic keyword phrases people actually search.
- Keywords must be plausible real-world search queries related to the seed, not mechanical modifier combinations.
- Cover at least 3 distinct intents across the clusters.`,
      }),
      AI_GENERATION_TIMEOUT_MS
    );

    return {
      seedKeyword: seed,
      generatedAt: new Date().toISOString(),
      clusters: object.clusters,
    };
  } catch (error) {
    console.error("Keyword clustering AI generation failed; using fallback.", error);
    return null;
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error("Keyword clustering AI generation timed out.")),
      timeoutMs
    );
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export async function generateKeywordClusters(
  seedKeyword: string
): Promise<KeywordClusteringResult> {
  const seed = normalizeSeedKeyword(seedKeyword);
  const aiResult = await clusterSeoKeywordsWithAi(seed);

  if (aiResult) {
    return aiResult;
  }

  return clusterSeoKeywords(seed);
}

export function clusterSeoKeywords(seedKeyword: string): KeywordClusteringResult {
  const seed = normalizeSeedKeyword(seedKeyword);

  const clusters: KeywordCluster[] = [
    {
      cluster: `${seed} education`,
      intent: "informational",
      keywords: MODIFIERS.informational.map((modifier) => `${seed} ${modifier}`),
    },
    {
      cluster: `${seed} evaluation`,
      intent: "commercial",
      keywords: MODIFIERS.commercial.map((modifier) => `${modifier} ${seed}`),
    },
    {
      cluster: `${seed} conversion`,
      intent: "transactional",
      keywords: MODIFIERS.transactional.map((modifier) => `${seed} ${modifier}`),
    },
    {
      cluster: `${seed} workflow`,
      intent: "navigational",
      keywords: MODIFIERS.navigational.map((modifier) => `${seed} ${modifier}`),
    },
  ];

  return {
    seedKeyword: seed,
    generatedAt: new Date().toISOString(),
    clusters,
  };
}
