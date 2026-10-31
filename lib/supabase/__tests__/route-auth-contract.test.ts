// @vitest-environment node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Static guard for the shared-session contract. /api is outside proxy.ts, so a
// route handler is the only place an API request's session can be refreshed;
// a handler that builds its own client either reads the wrong cookie or
// rotates the shared refresh token without saving it.

const ROOT = path.resolve(__dirname, "../../..");
const SKIP_DIRS = new Set(["node_modules", ".next", "__tests__", "_archived", ".claude"]);

function sourceFiles(dir: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;

    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...sourceFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.(ts|tsx)$/.test(entry)) {
      files.push(full);
    }
  }

  return files;
}

function relative(file: string) {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

/** Every `createServerClient(...)` call's argument text, parens balanced. */
export function serverClientCalls(source: string) {
  const calls: string[] = [];
  const pattern = /createServerClient\s*\(/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source))) {
    let depth = 1;
    let index = match.index + match[0].length;

    while (index < source.length && depth > 0) {
      if (source[index] === "(") depth += 1;
      if (source[index] === ")") depth -= 1;
      index += 1;
    }

    calls.push(source.slice(match.index + match[0].length, index - 1));
  }

  return calls;
}

/** Why a createServerClient call breaks the contract, or null if it doesn't. */
export function serverClientViolation(call: string) {
  if (!/cookieOptions:\s*getSharedAuthCookieOptions\(\)/.test(call)) {
    return "does not pass cookieOptions: getSharedAuthCookieOptions()";
  }
  if (!/\bgetAll\s*\(/.test(call)) {
    return "has no getAll cookie reader";
  }
  if (/\b(get|set|remove)\s*\([^)]*\)\s*\{/.test(call.replace(/\b(getAll|setAll)\s*\(/g, ""))) {
    return "uses the deprecated get/set/remove cookie adapter";
  }

  const setAll = call.match(/\bsetAll\s*\([^)]*\)\s*\{([\s\S]*)$/);
  if (!setAll || !/\.set\s*\(/.test(setAll[1])) {
    return "has a missing or no-op setAll, so a refresh is never saved";
  }

  return null;
}

export function importsSupabaseSsr(source: string) {
  return /from\s+["']@supabase\/ssr["']/.test(source);
}

export function importsRequestClient(source: string) {
  return /["']@\/lib\/supabase\/request-client["']|["'][./]+(lib\/)?supabase\/request-client["']/.test(source);
}

const files = [
  ...sourceFiles(path.join(ROOT, "app")),
  ...sourceFiles(path.join(ROOT, "lib")),
  path.join(ROOT, "proxy.ts"),
];

describe("shared-session contract", () => {
  it("route handlers build no Supabase client of their own", () => {
    const offenders = files
      .filter((file) => /(^|[\\/])route\.tsx?$/.test(file))
      .filter((file) => importsSupabaseSsr(readFileSync(file, "utf8")))
      .map(relative);

    expect(offenders).toEqual([]);
  });

  it("every server client reads the shared cookie and saves refreshes", () => {
    const violations: string[] = [];
    let calls = 0;

    for (const file of files) {
      for (const call of serverClientCalls(readFileSync(file, "utf8"))) {
        calls += 1;
        const violation = serverClientViolation(call);
        if (violation) violations.push(`${relative(file)}: ${violation}`);
      }
    }

    expect(violations).toEqual([]);
    // lib/supabase/server.ts and proxy.ts; a refactor that hides them would
    // otherwise make this test pass vacuously.
    expect(calls).toBeGreaterThanOrEqual(2);
  });

  it("the get-only request client is gone and nothing imports it", () => {
    expect(existsSync(path.join(ROOT, "lib/supabase/request-client.ts"))).toBe(false);
    expect(
      files.filter((file) => importsRequestClient(readFileSync(file, "utf8"))).map(relative)
    ).toEqual([]);
  });
});

describe("shared-session contract rules fire on known-bad code", () => {
  const good = `createServerClient(url, key, {
    cookieOptions: getSharedAuthCookieOptions(),
    cookies: {
      getAll() { return store.getAll(); },
      setAll(list) { list.forEach(({ name, value, options }) => store.set(name, value, options)); },
    },
  })`;

  it("accepts the factory's shape", () => {
    expect(serverClientCalls(good)).toHaveLength(1);
    expect(serverClientViolation(serverClientCalls(good)[0])).toBeNull();
  });

  it.each([
    [
      "missing cookieOptions",
      `createServerClient(url, key, { cookies: { getAll() { return []; }, setAll(l) { l.forEach((c) => store.set(c.name, c.value)); } } })`,
      /cookieOptions/,
    ],
    [
      "no-op setAll",
      `createServerClient(url, key, { cookieOptions: getSharedAuthCookieOptions(), cookies: { getAll() { return []; }, setAll() { /* no-op */ } } })`,
      /setAll/,
    ],
    [
      "get-only adapter",
      `createServerClient(url, key, { cookieOptions: getSharedAuthCookieOptions(), cookies: { get(name: string) { return undefined; } } })`,
      /getAll/,
    ],
    [
      "deprecated get/set/remove",
      `createServerClient(url, key, { cookieOptions: getSharedAuthCookieOptions(), cookies: { getAll() { return []; }, get(name) { return x; }, set() {}, remove() {} } })`,
      /deprecated/,
    ],
  ])("rejects %s", (_label, source, reason) => {
    const [call] = serverClientCalls(source);
    expect(serverClientViolation(call)).toMatch(reason);
  });

  it("spots route-level client construction and request-client imports", () => {
    expect(importsSupabaseSsr(`import { createServerClient } from "@supabase/ssr";`)).toBe(true);
    expect(importsSupabaseSsr(`import { createClient } from "@/lib/supabase/server";`)).toBe(false);
    expect(importsRequestClient(`import { x } from "@/lib/supabase/request-client";`)).toBe(true);
    expect(importsRequestClient(`import { x } from "../../lib/supabase/request-client";`)).toBe(true);
  });
});
