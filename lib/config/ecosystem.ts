export type EcosystemApp =
  | "prospra"
  | "architecta"
  | "directorium"
  | "synceri";

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

export function getEcosystemSiteUrl(): string | undefined {
  return (
    cleanEnv(process.env.NEXT_PUBLIC_APP_URL) ?? "https://entrepreneuria.io"
  );
}

export function getEcosystemCookieDomain(): string | undefined {
  return (
    cleanEnv(process.env.NEXT_PUBLIC_ENTREPRENEURIA_COOKIE_DOMAIN) ??
    ".entrepreneuria.io"
  );
}

export function getEcosystemAppUrl(app: EcosystemApp): string | undefined {
  switch (app) {
    case "prospra":
      return (
        cleanEnv(process.env.NEXT_PUBLIC_PROSPRA_APP_URL) ??
        "https://prospra.entrepreneuria.io"
      );
    case "architecta":
      return (
        cleanEnv(process.env.NEXT_PUBLIC_ARCHITECTA_APP_URL) ??
        "https://architecta.entrepreneuria.io"
      );
    case "directorium":
      return (
        cleanEnv(process.env.NEXT_PUBLIC_DIRECTORIUM_APP_URL) ??
        "https://directorium.entrepreneuria.io"
      );
    case "synceri":
      return (
        cleanEnv(process.env.NEXT_PUBLIC_SYNCERI_APP_URL) ??
        "https://synceri.entrepreneuria.io"
      );
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
