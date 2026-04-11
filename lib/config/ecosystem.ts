const APP_KEYS = ["prospra", "architecta", "directorium", "synceri"] as const;

export type EcosystemApp = (typeof APP_KEYS)[number];

function cleanEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function requiredValue(value: string | undefined, name: string): string {
  const cleaned = cleanEnv(value);
  if (!cleaned) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return cleaned;
}

export function getSupabaseProjectConfig() {
  return {
    url: requiredValue(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      "NEXT_PUBLIC_SUPABASE_URL"
    ),
    anonKey: requiredValue(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    ),
  };
}

export function getEcosystemCookieDomain(): string | undefined {
  return cleanEnv(process.env.NEXT_PUBLIC_ENTREPRENEURIA_COOKIE_DOMAIN);
}

export function getEcosystemAppUrl(app: EcosystemApp): string | undefined {
  switch (app) {
    case "prospra":
      return cleanEnv(process.env.NEXT_PUBLIC_PROSPRA_APP_URL);
    case "architecta":
      return cleanEnv(process.env.NEXT_PUBLIC_ARCHITECTA_APP_URL);
    case "directorium":
      return cleanEnv(process.env.NEXT_PUBLIC_DIRECTORIUM_APP_URL);
    case "synceri":
      return cleanEnv(process.env.NEXT_PUBLIC_SYNCERI_APP_URL);
    default:
      return undefined;
  }
}

export function getAllEcosystemAppUrls() {
  return {
    prospra: getEcosystemAppUrl("prospra"),
    architecta: getEcosystemAppUrl("architecta"),
    directorium: getEcosystemAppUrl("directorium"),
    synceri: getEcosystemAppUrl("synceri"),
  };
}