import { getAllEcosystemAppUrls, type EcosystemApp } from "@/lib/config/ecosystem";

export function getEcosystemAppHref(app: EcosystemApp, path = "/"): string | null {
  const appUrls = getAllEcosystemAppUrls();
  const base = appUrls[app];

  if (!base) return null;

  return new URL(path, base).toString();
}
