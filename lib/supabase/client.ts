import { createBrowserClient } from "@supabase/ssr";

// This client syncs auth cookies correctly so API routes receive the session.
// Without this, API routes ALWAYS return 401.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          if (typeof document === "undefined") return null;
          const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
          return match ? match[2] : null;
        },
        set(name, value, options) {
          if (typeof document === "undefined") return;
          let cookie = `${name}=${value}; path=${options?.path ?? "/"};`;
          if (options?.maxAge) cookie += ` max-age=${options.maxAge};`;
          if (options?.sameSite) cookie += ` samesite=${options.sameSite};`;
          if (options?.secure) cookie += " secure;";
          document.cookie = cookie;
        },
        remove(name, options) {
          if (typeof document === "undefined") return;
          document.cookie = `${name}=; path=${options?.path ?? "/"}; max-age=0;`;
        }
      }
    }
  );
}
