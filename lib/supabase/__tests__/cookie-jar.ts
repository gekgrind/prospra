// Stand-in for the `cookies()` store from next/headers in route-handler tests.
// Seeded from a request's Cookie header, it records every write with its
// options so a test can check exactly what would reach Set-Cookie.

export type CookieWrite = {
  name: string;
  value: string;
  options: Record<string, unknown>;
};

export function parseCookieHeader(raw: string | null | undefined) {
  const cookies = new Map<string, string>();

  for (const part of (raw ?? "").split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const index = trimmed.indexOf("=");
    if (index === -1) continue;

    cookies.set(trimmed.slice(0, index), trimmed.slice(index + 1));
  }

  return cookies;
}

export function createCookieJar(cookieHeader?: string | null) {
  const cookies = parseCookieHeader(cookieHeader);
  const writes: CookieWrite[] = [];

  return {
    writes,
    getAll() {
      return [...cookies].map(([name, value]) => ({ name, value }));
    },
    get(name: string) {
      const value = cookies.get(name);
      return value === undefined ? undefined : { name, value };
    },
    set(name: string, value: string, options: Record<string, unknown> = {}) {
      writes.push({ name, value, options });

      if (value === "" || options.maxAge === 0) {
        cookies.delete(name);
      } else {
        cookies.set(name, value);
      }
    },
    /** The jar's current contents, as the browser would send them next time. */
    toHeader() {
      return [...cookies].map(([name, value]) => `${name}=${value}`).join("; ");
    },
  };
}

export type CookieJar = ReturnType<typeof createCookieJar>;
