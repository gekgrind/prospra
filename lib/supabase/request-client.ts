import { createServerClient } from "@supabase/ssr";
import { getSupabaseProjectConfig } from "@/lib/config/ecosystem";

export function createRequestSupabaseClient(request: Request) {
  const { url, anonKey } = getSupabaseProjectConfig();

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        const raw = request.headers.get("cookie");
        if (!raw) return undefined;

        const cookie = raw
          .split(";")
          .map((value) => value.trim())
          .find((value) => value.startsWith(`${name}=`));

        const parsed = cookie?.slice(name.length + 1);
        return parsed?.length ? parsed : undefined;
      },
    },
  });
}
