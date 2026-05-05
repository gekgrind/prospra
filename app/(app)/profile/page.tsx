import { redirect } from "next/navigation";
import { getSafeReturnTo } from "@/lib/auth/redirects";

type LegacyProfileRedirectPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LegacyProfileRedirectPage({
  searchParams,
}: LegacyProfileRedirectPageProps) {
  const params = await searchParams;
  const returnTo = getSafeReturnTo(params?.returnTo);

  redirect(`/dashboard/settings?returnTo=${encodeURIComponent(returnTo)}`);
}
