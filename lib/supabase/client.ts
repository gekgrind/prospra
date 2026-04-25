import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseProjectConfig } from "@/lib/config/ecosystem";
import { getSharedAuthCookieOptions } from "@/lib/supabase/shared-auth-cookie";

export function createClient() {
  const { url, anonKey } = getSupabaseProjectConfig();

  return createBrowserClient(url, anonKey, {
    cookieOptions: getSharedAuthCookieOptions(),
  });
}
