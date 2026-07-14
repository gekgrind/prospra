# Prospra Backend Audit

Generated 2026-07-13 by Claude Code. Full UI-to-backend wiring audit of the Prospra app.

## Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript, Tailwind 4
- **Database/Auth/Storage**: Supabase (shared `entrepreneuria-site` project across all Entrepreneuria apps — treat as production; migrations are written as files only, applied manually)
- **AI**: Vercel AI SDK + OpenAI (`gpt-4o` / `gpt-4o-mini` / `gpt-4.1-mini`); Anthropic via raw fetch in one route
- **Email**: Resend (lifecycle emails)
- **Tests**: No test framework. One ad-hoc verify script (`scripts/verify-website-coach-api.mjs`, `node:assert`). New features verified via `npm run lint` + `npx tsc --noEmit` + manual reasoning; noted per feature in Build Log.

### Conventions for new backend code (extracted from working routes)

- **Auth**: `const supabase = await createClient()` from `@/lib/supabase/server`; `supabase.auth.getUser()`; return `NextResponse.json({ error: "Unauthorized" }, { status: 401 })` if no user.
- **Validation**: manual field checks (no zod in routes, despite zod being installed); allow-list pattern for partial updates.
- **Errors**: try/catch → `console.error("[TAG]", error)` → `{ error: string }` with 400/401/403/500.
- **Schema**: snake_case, plural table names, `id uuid primary key default gen_random_uuid()`, `user_id uuid references auth.users(id) on delete cascade`, `created_at/updated_at timestamptz default now()`, RLS enabled with `<table>_<verb>_own` policies `using (auth.uid() = user_id)`, `check` constraints instead of enums, `(user_id, created_at desc)` index.
- **Migrations**: new files in `supabase/migrations/` named `YYYYMMDD_description.sql`, idempotent (`if not exists` / `drop ... if exists`).

### ⚠ Schema source-of-truth warning

No single file in this repo reflects the live database. `supabase/migrations/` holds only 3 incremental patches; the base schema lives in untracked `scripts/*.sql` (001–005, run manually); `lib/database.types.ts` is stale (lists only 9 tables; missing `action_plans`, `feedback_items`, `conversation_outputs`, `usage_events`, `website_intelligence`, `weekly_reviews`, `email_events`, `strategic_state`, and more). Several tables referenced in code (`uploads`, `plans`, `mentor_memories`, `ai_memory`, `website_snapshots`, `resource_documents`, `website_brain_embeddings`, `mentor_sync_logs`) have **no committed CREATE TABLE at all**. New migrations here are written defensively (`if not exists`) and should be reviewed against the live schema before applying.

Also noted: the 3 tables in `20260505_prospra_core_intelligence_foundation.sql` have **no RLS** — deviation from every other table; likely an oversight (they're only accessed server-side today).

---

## Feature Inventory

### Implemented — no backend work needed

| Feature | UI | Backend |
|---|---|---|
| Mentor chat (all 6 modes) | `app/(app)/mentor/page.tsx` | `/api/chat` — 980-line real route: context building, credit limits, streaming, mode prompts |
| Insights & Action Plan generation | mentor page | `/api/mentor/conversation-outputs` — real (`generateObject` + `conversation_outputs`) |
| Action plan task tracking | mentor page + `/dashboard/action-plans` | `/api/action-plans` + `/sync` + `/[planId]/tasks/[taskId]` — real |
| Board Review (premium) | mentor page | `/api/directorium/board-review` — real, premium-gated |
| Journal CRUD + AI recaps | `app/(app)/journal/page.tsx` | direct Supabase + `/api/journal-ai` — real |
| Onboarding + autosave | `app/(app)/onboarding` | `/api/onboarding`, `/api/onboarding-progress` — real |
| Settings/profile edit | `dashboard/settings/page.tsx` | direct Supabase writes — works (bypasses orphaned `/api/profile`) |
| Feedback submit + admin triage | `app/(app)/feedback`, `dashboard/feedback` | `/api/feedback` (+ `[id]/status`) — real, admin-gated |
| Main dashboard (founder score, health, momentum) | `dashboard/page.tsx` + `DashboardClient` | server-computed from profile/goals/usage — real |
| Prompt Lab | `dashboard/prompt-lab` | `/api/generate-prompt` — real (OpenAI + Anthropic fallback) |
| Web Intelligence analyze | `dashboard/website-insights`, `dashboard/web-intelligence` | `/api/web-intelligence/analyze` — real fetch+signal-extraction+heuristic scoring, persisted to `website_intelligence` |
| Site Strategist root analyze | `site-strategist/page.tsx` | `/api/site-strategist/analyze` — real HTML fetch + parser |
| SEO & UX Analyzer | `site-strategist/seo-ux` | `/api/site-strategist/seo-ux` — real crawler + Google PageSpeed API |
| Copy Architect | `site-strategist/copy-architect` | `/api/site-strategist/copy-architect` — real OpenAI |
| Ad Generator | `dashboard/ad-generator` | `/api/website/ad-campaign` — real OpenAI + website-brain context |
| Internal admin dashboard | `dashboard/internal` | `/api/internal/admin/metrics` — real, admin-gated |
| Weekly review (internal) | `dashboard/internal/weekly-review` | `/api/weekly-review` — real |
| Website Coach hub page | `dashboard/website-coach` | reads `profiles.website_data`; links into mentor modes — real |
| Rescan website | website-coach flow | `/api/website/rescan` → `website-analyzer` edge function — real |
| Lifecycle emails | n/a (background) | `/api/lifecycle/*` + Resend — real |
| Tools Library / filtering | `dashboard/tools-library` | static curated catalog (`lib/tools-library`) — static by design, not broken |

### Build list — UI-only / Partial (ordered: dependencies first, then smallest first)

#### 1. Fix `/api/credits` + `/api/usage` broken query — **Partial-Broken, S**
- UI: `components/UsageBar.tsx`, `components/PremiumFeaturePanel.tsx`, `components/UpgradeBanner.tsx`, mentor premium gating
- Bug: both routes query `messages.user_id` — column doesn't exist (`messages` has only `id, conversation_id, role, content, created_at`). Query throws; routes silently return hardcoded `{used:0, limit:20}` → usage displays are always wrong.
- Fix: count via join through `conversations` (user's conversation ids), or use `profiles.daily_credits_used` which `/api/chat` already maintains.

#### 2. Auth hardening: `/api/founder`, `/api/execution-systems` — **Partial-Broken, S**
- Both routes accept unauthenticated POSTs (no `getUser()` at all). Add the standard auth check.

#### 3. Chat memory extraction stub — **Partial-Broken, S**
- `extractMemories()` in `app/api/chat/route.ts` always returns `{memories: []}` — memory extraction is dead code despite being wired. Implement a real LLM extraction pass (fire-and-forget, per existing pattern) writing to `ai_memory`.

#### 4. Web Intelligence page doesn't load saved snapshot — **Partial, S**
- `dashboard/web-intelligence/page.tsx` initializes `EMPTY_WEBSITE_INTELLIGENCE_SNAPSHOT` while `dashboard/website-insights` server-loads the latest. Load persisted snapshot the same way.

#### 5. Business Roadmap persistence — **UI-only, M** (dependency for #6)
- UI: `dashboard/business-roadmap/page.tsx`, `dashboard/growth-coach/page.tsx`
- Reality: `getDefaultRoadmap()` in `lib/roadmap.ts` returns hardcoded stages/steps **and hardcoded completed steps** (`DEFAULT_COMPLETED_STEP_IDS`). No table, no endpoint, no way to check off a step.
- Build: `roadmap_progress` table (user_id + completed_step_ids), GET/PATCH `/api/roadmap-progress`, wire both pages; make steps toggleable.

#### 6. Growth Coach on real progress — **UI-only, S** (after #5)
- Same hardcoded roadmap source; consumes #5's data once wired.

#### 7. Sessions page — **UI-only, M**
- UI: `dashboard/sessions/page.tsx` — pure placeholder card ("No sessions available yet").
- Data already exists: `conversations` + `conversation_outputs` + `messages`. Build a server-loaded timeline (conversation list, message counts, summaries).

#### 8. Insights page — **UI-only, M**
- UI: `dashboard/insights/page.tsx` — pure placeholder card.
- Data exists: `founder_score_signals`, `shared_intelligence_insights`, `conversation_outputs`, `action_plans`, `website_intelligence`. Build server-loaded insights view + supporting queries.

#### 9. Resources page — **UI-only, M**
- UI: `dashboard/resources/page.tsx` — pure placeholder card.
- Backend exists but unused: `resource_documents` table populated by `sync_resources` edge function (SBA/SCORE/YC/IRS summaries + embeddings). Build GET `/api/resources` + list UI.

#### 10. CTA Analyzer backend — **UI-only, M**
- UI: `site-strategist/cta-analyzer/page.tsx` calls `runMockCtaAnalysis()` **client-side** from `lib/web-intelligence/cta-analyzer.ts` — no API route exists at all (only site-strategist tool with zero backend).
- Build: `POST /api/site-strategist/cta-analyzer` following the exact sibling pattern (auth + validation + analyzer), with real page-fetch signals; swap client to call the API.

#### 11. Website Coach AI engine — **Partial, M**
- `lib/web-intelligence/website-coach.ts` `analyzeWebsiteCoach()` has explicit TODO: returns template/heuristic fallback (`calculateMockScore` = string-length math). Route/auth/validation real.
- Build: fetch the actual page + OpenAI analysis (mirroring copy-architect), keep fallback for AI failure.

#### 12. Funnel Mapping AI engine — **Partial, M**
- Same shape: `analyzeFunnelMapping()` TODO → heuristic fallback on input string lengths. Route real.
- Build: OpenAI-backed diagnosis with fallback retained.

#### 13. Keyword Clusters real generation — **Partial, S/M**
- `clusterSeoKeywords()` generates clusters by string-template modifiers ("what is X", "best X"...). Route real.
- Build: OpenAI-backed clustering with template fallback.

#### 14. UX Scanner real backend — **Partial-Broken, M**
- `/api/website/ux-scan` returns a **hardcoded mock object** (same scores for every URL, explicit TODO). No auth check either.
- Build: auth + reuse the real web-intelligence pipeline (`analyzeWebsite` signals/scores) mapped into the page's `UxScanResult` shape.

#### 15. FounderFuel — **UI-only, M**
- UI: `tools/founderfuel` — template picker + local string interpolation. Three gaps: (a) "Use this in Mentor" button hardcoded `disabled`; (b) "Saved Prompts" sidebar hardcoded placeholder; (c) "Recent Generations" hardcoded placeholder.
- Build: `founderfuel_prompts` table + CRUD endpoint (save/list, recent generations), wire sidebar, enable "Use in Mentor" (deep-link to `/mentor?prompt=`).

#### 16. Documents — **Partial-Broken, M/L**
- `documents/page.tsx` reads `documents` table but **nothing ever writes to it** (permanently empty; empty-state says "upload through mentor chat" — no upload control exists anywhere). `/api/upload-file` is fully built but has zero callers. `/api/analyze-file` exists but its "vision" analysis just pastes the file URL into a text prompt.
- Build: upload UI on documents page → `/api/upload-file` → insert `documents` row; delete endpoint; fix analyze-file to note limitations.

#### 17. Upgrade / Stripe checkout — **Partial-Broken, L**
- `app/(app)/upgrade/page.tsx` form posts to `/api/upgrade` — **route does not exist**; submit navigates to a 404. No Stripe key in env (`profiles.stripe_customer_id` columns exist from migration).
- Build: `/api/upgrade` route stubbed behind `STRIPE_SECRET_KEY` config flag — full checkout-session flow coded but returns a clear "billing not configured" response until key exists. **Blocked on Stripe credentials.**

### Dead/orphaned code (flagged, not touched — see guardrails)

- `/api/mentor` — real logic, zero live callers, payload mismatch with its only historical caller (`components/ChatContainer.tsx`, itself unused).
- `/api/profile` (PATCH) + `/api/profile/get` — real, zero callers, response-shape bug (`SHARED_PROFILE_SELECT` mismatch).
- `/api/ad-campaign/generate` — literal empty skeleton (`// ... rest of your code`); the real route is `/api/website/ad-campaign`.
- `components/ChatContainer.tsx`, `components/OnboardingForm.tsx`, `components/JournalPageComponent.tsx` (queries nonexistent `daily_journal` table) — legacy, unused.
- Settings notification toggles (`weeklyDigest`, `productUpdates`, `investorUpdates`) persist to auth metadata but nothing consumes them — needs a product decision (digest email job), not built.
- `scripts/README.md` contains an unresolved git merge-conflict marker.

---

## Build Log

### 1. `/api/credits` + `/api/usage` fix — done (commit `fa2c00e0`)
- Files: `app/api/credits/route.ts`, `app/api/usage/route.ts`
- Replaced the broken `messages.user_id` count query with reads of `profiles.daily_credits_used` / `daily_credit_limit` / `last_credit_reset` — the exact counters `/api/chat` enforces.
- Decisions: limit fallback is now `daily_credit_limit ?? 5` (matching chat enforcement) instead of the previous hardcoded 20/15, so displayed numbers agree with what actually gates the user. Stale counters (last reset ≠ today) report 0; the reset itself still happens lazily in `/api/chat` (a GET should not write). Guest/error fallbacks left untouched.
- Verified: `tsc --noEmit` and eslint clean on both files. No test framework in repo — manual verification only.

### 2. Auth hardening — done (commit `4649a578`)
- Files: `app/api/founder/route.ts`, `app/api/execution-systems/route.ts`
- Added the standard `createClient` + `getUser()` → 401 check. Both remain stateless compute endpoints otherwise. Verified: tsc + eslint clean.

### 3. Chat memory extraction — done (commit `f4b48c9e`)
- Files: `app/api/chat/route.ts`
- Implemented the `extractMemories()` stub: gpt-4o-mini pass extracting 0–3 durable founder/business facts per exchange, persisted through the pre-existing `saveMemories()` → `mentor_memories` path (which `getMemories()` already reads back into context). Always uses gpt-4o-mini regardless of plan (extraction is background bookkeeping, not a premium surface). Errors degrade to `[]`, never blocking the chat stream.
- Assumption flagged: memory strings capped at 500 chars, max 3 per exchange — no product spec existed for this.

### 4. Web Intelligence snapshot hydration — done (commit `ef5413f6`)
- Files: `app/(app)/dashboard/web-intelligence/page.tsx` (now a server component), new `WebIntelligencePageClient.tsx` (the previous JSX, unchanged, accepting `initialSnapshot`).
- Page now hydrates from the latest `website_intelligence` row via the existing `getLatestWebsiteIntelligence()` helper, matching `/dashboard/website-insights`. No visual changes.

### 5+6. Roadmap progress persistence — done (commit `8acd8926`)
- Files: `supabase/migrations/20260713_roadmap_progress.sql`, `app/api/roadmap-progress/route.ts`, `lib/roadmap.ts`, business-roadmap + growth-coach pages.
- New `roadmap_progress` table (PK = `user_id`, `completed_step_ids jsonb`, RLS `_own` policies, updated_at trigger — follows `strategic_state` one-row-per-user pattern). GET/PATCH endpoint validates step ids against the static roadmap definition. Removed the fake `DEFAULT_COMPLETED_STEP_IDS`. Roadmap step markers are now toggle buttons with optimistic updates + rollback; Growth Coach reads the same real progress.
- **Migration not applied** — file only, per instruction. Until applied, GET/PATCH return 500 and the pages degrade to 0% progress (no crash).
- Assumption flagged: roadmap stages/steps stay static app content in `lib/roadmap.ts`; only per-user completion is persisted.

### 7. Sessions page — done (commit `d4086748`)
- Files: `app/(app)/dashboard/sessions/page.tsx`
- Server-loads conversations (latest 50) + message counts + `conversation_outputs` summaries/priorities; each card deep-links to `/mentor?conversation=<id>`. No new tables.

### 8. Insights page — done (commit `d352b891`)
- Files: `app/(app)/dashboard/insights/page.tsx`
- Server-aggregates founder score (latest `founder_score_signals` → existing `computeMultiFactorFounderScore`), action-plan completion, latest website scores/issues, recent session takeaways, and cross-app `shared_intelligence_insights`. Empty state preserved when no data exists.

### 9. Resources page — done (commit `c5d0b00e`)
- Files: `app/(app)/dashboard/resources/page.tsx`, `supabase/migrations/20260713_resource_documents_read_policy.sql`
- Lists `resource_documents` (populated by the `sync_resources` edge function, previously consumer-less). Guarded migration enables RLS + authenticated read policy on that table (created outside tracked migrations; policy state in live DB unknown — **verify before/after applying**).
- Note: the sync itself depends on the edge function being scheduled (no scheduler found in repo — likely Supabase dashboard cron). If the table is empty in production, that's the reason.

### 10. CTA Analyzer backend — done (commit `9d1ffda9`)
- Files: `lib/web-intelligence/cta-analyzer.ts`, new `app/api/site-strategist/cta-analyzer/route.ts`, cta-analyzer page.
- New route follows the exact sibling pattern (auth + manual validation). AI engine fetches the target page text and scores the CTA via gpt-4o-mini `generateObject` (dynamic-import + 15s timeout pattern copied from Copy Architect); the previous client-side heuristic is retained as `runFallbackCtaAnalysis` for no-key/failure. Page now calls the API.

### 11. Website Coach AI engine — done (commit on `lib/web-intelligence/website-coach.ts`)
- Real page fetch + gpt-4o-mini analysis replacing the string-length "mock score"; heuristic fallback retained. `npm run verify:website-coach-api` still passes (the repo's only automated test).

### 12. Funnel Mapping AI engine — done
- Files: `lib/web-intelligence/funnel-mapping.ts`. Same pattern: landing-page fetch + gpt-4o-mini funnel diagnosis (4 fixed stages, health score, assets/friction/actions), heuristic fallback retained.

### 13. Keyword clusters — done
- Files: `lib/web-intelligence/seo-keyword-clustering.ts`, keyword-clusters route. New async `generateKeywordClusters()` (AI with template fallback). Note: this endpoint still has **no UI caller** — it was orphaned before and remains available for a future UI.

### 14. UX Scanner — done
- Files: `app/api/website/ux-scan/route.ts` (rewritten). Now auth-gated and backed by the real `analyzeWebsite` pipeline; sections/issues derived from actual page signals; snapshot persisted to `website_intelligence`.
- Assumption flagged: `mobileScore` is approximated from structural signals (heading hierarchy, nav, alt coverage blended with UX score) — there is no real mobile crawl. Flagged for a product decision if a true mobile audit (e.g. PageSpeed mobile strategy) is wanted.

### 15. FounderFuel — done (commit `592c40c1`)
- Files: `supabase/migrations/20260713_founderfuel_prompts.sql`, new `app/api/founderfuel/prompts/route.ts` (GET/POST/PATCH), sidebar/output/page components.
- Generations are recorded on generate; new "Save Prompt" button pins to Saved Prompts; sidebar lists real saved/recent prompts (click to reload); "Use this in Mentor" (previously hardcoded disabled) deep-links to `/mentor?prompt=` which the mentor page already consumes. **Migration not applied** — until then the endpoints return 500 and the page degrades gracefully (prompt generation itself is unaffected).
- Decision: prompt generation stays client-side string templating (its designed behavior); persistence + handoff were the missing backend, not LLM generation. If FounderFuel should be AI-generated, that's a product call — flag for review.

### 16. Documents — done (commit `1e11442c`)
- Files: `app/api/upload-file/route.ts` (now records a `documents` row, with storage cleanup on insert failure), new `app/api/documents/[id]/route.ts` (DELETE: row + best-effort storage object), `components/documents/DocumentActions.tsx`, documents page (upload button, per-card delete, title links to file).
- Not done: `/api/analyze-file`'s fake "vision" analysis (interpolates the file URL as text) — left untouched since it has zero callers; needs a product decision on whether document AI analysis is a real feature.
- Assumption flagged: 20 MB client-side size cap and a common-document accept list on the file input.

### 17. Upgrade / Stripe — done, **BLOCKED on credentials** (commit `83f24b2e`)
- Files: new `app/api/upgrade/route.ts`, new `app/api/stripe/webhook/route.ts`, upgrade page (billing status notices), `.env.example`.
- Checkout: Stripe REST API via raw fetch (no SDK — follows the repo's raw-fetch precedent for Anthropic). Creates a subscription checkout session with `client_reference_id`/metadata `user_id`, reuses `profiles.stripe_customer_id` when present, 303-redirects to Stripe. Webhook: manual `Stripe-Signature` HMAC verification with 5-minute replay window; handles `checkout.session.completed` and `customer.subscription.updated/deleted`, updating `profiles` billing fields via the service-role client (background-job pattern).
- **Config flag**: without `STRIPE_SECRET_KEY` + `STRIPE_PREMIUM_PRICE_ID` the form now redirects back with a clear "billing unavailable" notice instead of the previous 404. Webhook returns 503 until `STRIPE_WEBHOOK_SECRET` is set.
- Needs from you: Stripe account keys, a Premium price ($19/mo hardcoded on the page — confirm), webhook endpoint registration, and an end-to-end test. Also updated `.env.example` with all env vars the codebase actually uses but never documented (OpenAI, Anthropic, Resend, PageSpeed, cron secret, admin emails, Stripe).

---

## Final Summary

**Total features audited**: 37 distinct features/tools (20 already implemented, 17 needing backend work).

**Completed**: 16 of 17 build-list items are fully coded, typechecked, linted, and committed individually (commits `fa2c00e0` → `83f24b2e`). The full production build (`next build`) passes.

**Blocked**: 1 — Stripe checkout/webhook is code-complete but **blocked on Stripe credentials** (`STRIPE_SECRET_KEY`, `STRIPE_PREMIUM_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`). It degrades gracefully until configured.

**Not yet live until you act**:
1. **Apply 3 new migrations** (`supabase db push` or SQL editor): `20260713_roadmap_progress.sql`, `20260713_founderfuel_prompts.sql`, `20260713_resource_documents_read_policy.sql`. Per your instruction, nothing was executed against the shared `entrepreneuria-site` project. Until applied, roadmap progress and FounderFuel persistence return errors (pages degrade gracefully).
2. **Stripe setup** (see item 17).

**Left for your decision (prioritized)**:
1. **Stripe credentials + price confirmation** — unblocks the only revenue feature.
2. **RLS missing on 3 intelligence tables** (`mentor_memory_entries`, `founder_score_signals`, `shared_intelligence_insights` from the 20260505 migration) — likely an oversight; currently safe only because access is server-side.
3. **Dead code cleanup** (not touched per guardrails): `/api/mentor`, `/api/profile`, `/api/profile/get`, `/api/ad-campaign/generate` (empty skeleton), `components/ChatContainer.tsx`, `components/OnboardingForm.tsx`, `components/JournalPageComponent.tsx` (queries a nonexistent table), plus the merge-conflict marker in `scripts/README.md`.
4. **Settings notification toggles** persist but nothing sends digests — needs a product decision (email job) before they're honest UI.
5. **`/api/analyze-file`** — decide whether document AI analysis is a feature; current implementation can't actually read file contents.
6. **Mobile score in UX Scanner** is approximated — decide if a real mobile audit is wanted (PageSpeed mobile strategy is already integrated in the SEO-UX tool and could be reused).
7. **Stale schema artifacts**: `lib/database.types.ts` should be regenerated (`supabase gen types`), and consider consolidating `scripts/*.sql` into tracked migrations — the repo currently has no reliable schema source of truth.
