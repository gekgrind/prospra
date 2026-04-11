import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseProjectConfig } from "@/lib/config/ecosystem";

export function createClient() {
  const { url, anonKey } = getSupabaseProjectConfig();

  return createBrowserClient(url, anonKey);
}