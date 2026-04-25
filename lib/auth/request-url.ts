import { headers } from "next/headers";
import { getEcosystemAppUrl } from "@/lib/config/ecosystem";

export async function getCurrentProspraUrl(fallbackPath: string) {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto =
    headerStore.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "https";

  if (host) {
    return new URL(fallbackPath, `${proto}://${host}`).toString();
  }

  return new URL(fallbackPath, getEcosystemAppUrl("prospra")).toString();
}
