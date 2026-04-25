import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseProjectConfig } from "@/lib/config/ecosystem";
import {
  applySharedAuthCookieOptions,
  getSharedAuthCookieOptions,
} from "@/lib/supabase/shared-auth-cookie";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseProjectConfig();

  return createServerClient(url, anonKey, {
    cookieOptions: getSharedAuthCookieOptions(),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(
              name,
              value,
              applySharedAuthCookieOptions(options)
            );
          });
        } catch {
          // Ignore when called from Server Components.
          // Middleware handles session refresh cookie writes.
        }
      },
    },
  });
}
