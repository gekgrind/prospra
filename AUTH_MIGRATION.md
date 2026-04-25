# Prospra Auth Migration

## Archived legacy auth files

- `_archived/auth/app/(auth)/login/page.tsx`
- `_archived/auth/app/(auth)/sign-up/page.tsx`
- `_archived/auth/app/(auth)/reset-password/page.tsx`
- `_archived/auth/app/(auth)/update-password/page.tsx`
- `_archived/auth/app/(auth)/verify-email/page.tsx`
- `_archived/auth/components/TurnstileWidget.tsx`

## Active auth entry points

- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/request-client.ts`
- `lib/auth/redirects.ts`
- `lib/auth/sessions.ts`
- `lib/auth/admin.ts`
- `proxy.ts`
- `app/(auth)/login/page.tsx`
- `app/(auth)/sign-up/page.tsx`
- `app/(auth)/reset-password/page.tsx`
- `app/(auth)/update-password/page.tsx`
- `app/(auth)/verify-email/page.tsx`
- `app/(auth)/logout/page.tsx`
- `components/ProfileMenu.tsx`
- `components/app-sidebar.tsx`

## Shared auth assumptions

- Prospra consumes the shared Entrepreneuria Supabase project and shared cookie domain.
- Supabase SSR clients use the shared `entrepreneuria-auth-token` cookie with `domain=.entrepreneuria.io`, `path=/`, `sameSite=lax`, and production-only `secure`.
- Canonical auth pages live on `NEXT_PUBLIC_APP_URL` using the same path names (`/login`, `/sign-up`, `/reset-password`, `/update-password`, `/verify-email`).
- Prospra keeps using shared user/session/profile state locally for protected routes, profile lookups, avatar rendering, and access checks.

## Redirect behavior

- Protected Prospra routes now redirect unauthenticated users to the shared login route with a preserved `next` target.
- Legacy local auth routes remain only as thin compatibility redirects to the shared auth site.
- Root `/` redirects unauthenticated users to the shared sign-up route instead of serving an app-owned sign-up flow.
- Local logout remains active only to clear the shared Supabase session from Prospra, then sends users through the shared `/logout` route with a shared login fallback.
