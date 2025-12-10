import { proxy } from "./app/proxy";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  return proxy(request);
}

export const config = {
  matcher: [
    // Run on everything except static assets & callback helpers
    "/((?!_next/static|_next/image|favicon.ico|auth/callback).*)",
  ],
};
