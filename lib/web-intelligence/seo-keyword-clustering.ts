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
