import { redirect } from "next/navigation";
import { buildSharedAuthHref } from "@/lib/auth/redirects";

type AuthRedirectPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function UpdatePasswordPage({
  searchParams,
}: AuthRedirectPageProps) {
  redirect(buildSharedAuthHref("/update-password", await searchParams));
}
