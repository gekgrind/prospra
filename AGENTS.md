# AGENTS.md

## Inherits from root AGENTS.md

This app follows all global rules defined in the root AGENTS.md.
The rules below are app-specific additions and clarifications.

## Purpose
Prospra is an AI mentor/coach product within the Entrepreneuria ecosystem. It should feel intelligent, supportive, structured, and founder-focused.

This repository should prioritize:
- trust
- clarity
- personalization
- stable product flows
- clean backend logic
- preserving the existing UI/design decisions

---

## Core Rules for Agents

### 1. Do not change the UI unless explicitly asked
Unless a task specifically requests visual changes, DO NOT change:
- layout
- spacing
- typography
- copy
- color palette
- Tailwind classes
- card structure
- component hierarchy
- visual emphasis

If a UI change is absolutely necessary for functionality:
- keep it minimal
- preserve the current visual system
- explain it in the final summary

### 2. Prefer logic, product behavior, and data wiring
Agents should focus on:
- auth flows
- onboarding
- persistence
- personalization
- session history
- form validation
- protected routes
- billing/subscription logic
- backend integration
- loading/error/success states

Do not make unsolicited design changes.

### 3. Preserve Prospra’s product voice
Prospra is not a generic AI assistant. It is a mentor/coach product.

It should feel:
- supportive
- strategic
- thoughtful
- credible
- founder-aware

Do not flatten its language into generic productivity-app phrasing.

### 4. Keep personalization central
If building features that affect recommendations, sessions, or workflows:
- preserve user context
- respect stored preferences
- connect logic to user state where appropriate

### 5. Reuse architecture patterns
Prefer:
- shared hooks
- shared services
- reusable components
- small focused files
- minimal duplication

Do not introduce unnecessary abstractions or broad refactors unless requested.

### 6. Respect auth and security
If this app uses Supabase or other auth systems:
- keep privileged operations server-side
- do not expose service-role keys
- reuse existing auth/session helpers
- preserve protected route behavior

### 7. Keep routes stable
Do not rename or restructure routes unless explicitly instructed.

### 8. Keep tasks scoped
Do not rewrite unrelated files while implementing one feature.
Do not perform “cleanup” refactors unless they are required.

---

## UI and Design Notes

### Visual style
Prospra should feel:
- premium
- calm
- intelligent
- clear
- helpful
- modern but not cold

Preserve the existing design language and avoid introducing generic admin-dashboard visuals unless explicitly requested.

### UX priorities
Prioritize:
- easy onboarding
- emotional clarity
- useful defaults
- trust-building states
- smooth continuation of prior work

---

## Engineering Preferences

### Preferred implementation style
- use existing repo patterns first
- preserve client/server boundaries
- keep code type-safe
- centralize repeated logic when appropriate
- prefer predictable flows over clever abstractions

### Data and persistence
When adding user-facing features:
- make sure user state persists appropriately
- include loading/error/success states
- use safe fallbacks

### App Router
Respect Next.js App Router conventions and existing repo patterns.

### Backend integrations
Reuse existing helpers/services before adding new ones.
If backend schema or migrations are needed:
- keep them minimal
- document assumptions

---

## Sub-agent guidance
Use sub-agents for:
- discovering auth/data patterns
- finding personalization logic
- locating existing hooks/components
- repo review

Do not have multiple sub-agents perform overlapping write-heavy edits.

Use:
- parallel discovery
- centralized implementation by the parent agent

---

## Final Review Checklist
Before completing a task, verify:
- UI remains unchanged unless explicitly requested
- imports are correct
- no type errors were introduced
- auth and protected routes still behave correctly
- personalization/state logic is consistent
- no secrets leak client-side
- no unnecessary duplication was added

---

## Output Expectations
When completing a task:
- group changes by file
- summarize the implementation clearly
- mention assumptions
- explicitly note any unavoidable UI changes
- note follow-up steps if backend setup is still needed