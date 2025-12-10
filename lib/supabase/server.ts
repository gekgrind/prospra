import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Cast to any so TypeScript stops complaining about .get
          const store: any = cookieStore;
          const cookie = store.get(name);
          return cookie?.value;
        },
        set(_name: string, _value: string, _options: CookieOptions) {
          // No-op in App Router server context – Supabase just needs this shape
        },
        remove(_name: string, _options: CookieOptions) {
          // Same here – required by Supabase, safe to leave empty on the server
        },
      },
    }
  );
}
