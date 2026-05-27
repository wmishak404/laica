# INIT-003 production gates

**Agent:** codex
**Branch:** `codex/init-003-production-gates`
**Date:** 2026-05-27
**Initiative:** INIT-003
**INIT updated:** yes

## Summary

This branch turns the public anonymous guest MVP from "usable in the happy path" into a locally verified production-gate slice. It adds quota accounting, a server kill switch, anonymous abuse-control keying, Firebase App Check posture, and linked-only durable-save boundaries while intentionally leaving the fuller Phase 4 Google promotion/import flow and anonymous Slop Bowl dry-run for later phases.

## Changes

- `shared/schema.ts`
  - Adds `anonymous_recipe_usage` for anonymous Firebase UID quota accounting without creating `auth_users` rows.
- `server/storage.ts`
  - Adds quota read/reserve/refund methods. Reservation is atomic and refunded on provider failure so validation errors and failed generations do not consume the intended successful-generation quota.
- `server/routes.ts`
  - Adds typed `UPGRADE_REQUIRED` responses for recipe-cap and durable-save boundaries.
  - Enforces the anonymous 10-generation Chef It Up quota on `/api/recipes/suggestions` and `/api/recipes/pantry`.
  - Returns anonymous quota metadata from `/api/auth/session` and successful anonymous recipe responses.
  - Blocks anonymous durable profile/settings/pantry/cooking-session/history routes.
  - Keeps Slop Bowl linked-only until a later explicit anonymous dry-run phase.
- `server/firebaseAuth.ts`
  - Adds `ANONYMOUS_AUTH_DISABLED` kill switch handling.
  - Adds optional Firebase App Check verification behind `FIREBASE_APP_CHECK_ENFORCED`.
- `server/security.ts`
  - Allows the Google reCAPTCHA script/frame sources needed by Firebase App Check under production CSP.
- `server/rate-limit.ts`
  - Keys anonymous user-scoped rate limits by client IP instead of anonymous Firebase UID.
- `client/src/lib/firebase.ts`, `client/src/lib/queryClient.ts`, `client/src/hooks/useFirebaseAuth.ts`
  - Initializes Firebase App Check when `VITE_FIREBASE_APP_CHECK_SITE_KEY` is configured.
  - Sends `X-Firebase-AppCheck` on API requests.
  - Verifies guest sign-in against `/api/auth/session` so the server kill switch is honored before entering the app.
  - Routes Google backend sync through the shared API client so App Check is included.
- `client/src/lib/rateLimitHandler.ts`
  - Adds user-facing classification for `UPGRADE_REQUIRED`, anonymous-disabled, and App Check errors.
- `.env.example`
  - Documents the new public-gate env vars.
- `tests/unit/*`, `tests/setup.ts`
  - Adds coverage for App Check, kill switch, quota enforcement/refund, linked-only durable saves, Slop Bowl linked-only guard, and anonymous IP-keyed rate limits.
- `initiatives/INIT-003-anonymous-trial-and-account-upgrade.md`, `initiatives/registry.md`, `efforts/effort-010-local-db-schema-strategy.md`, `efforts/registry.md`
  - Records the branch state, local validation, Replit validation requirements, and EFF-010 schema-workflow signal.

## Impact on other agents

Do not run local `npm run db:push` to apply `anonymous_recipe_usage`; EFF-010 still owns the local DB mutation policy. Replit must apply/validate this schema through the project-authoritative path before branch merge readiness.

`FIREBASE_APP_CHECK_ENFORCED` should stay off until Firebase Console App Check is configured for the public domain and `VITE_FIREBASE_APP_CHECK_SITE_KEY` is present in the matching client environment. Once enabled, protected API calls depend on the `X-Firebase-AppCheck` client header.

Anonymous Slop Bowl remains explicitly linked-only in this branch. That is intentional and follows the INIT's "anonymous Slop Bowl dry-run later" boundary.

## Open items

- Replit validation is still required for auth, schema, DB-backed persistence, AI routes, App Check, and deployment-bound behavior.
- Open a PR from `codex/init-003-production-gates` after pushing.
- Phase 4 Google link/promotion/import remains follow-up scope.
- Phase 5 / anonymous Slop Bowl dry-run remains follow-up scope unless Wilson explicitly pulls it forward.

## Verification

Local checks passed on 2026-05-27:

- `npm ci`
- `npx vitest run tests/unit/firebase-auth.test.ts tests/unit/auth-session-route.test.ts tests/unit/anonymous-production-gates-route.test.ts tests/unit/rate-limit.test.ts tests/unit/security-hardening.test.ts tests/unit/live-cooking-guest-session.test.tsx tests/unit/slop-bowl-route.test.ts tests/unit/phase0-security-routes.test.ts`
- `npm run check`
- `npm run build`

`npm run build` emitted existing-style Vite warnings about stale Browserslist data, Firebase dynamic/static import chunking, and a chunk larger than 500 kB; the build completed successfully.

## Replit validation request

Validated locally:

- [x] `npm ci`
- [x] `npm run check`
- [x] `npm run build`
- [x] focused Vitest suite listed above
- [ ] manual localhost smoke

Replit validation target:

- [x] Workspace / preview before merge
- [ ] Deployment or production-equivalent public domain before enabling public anonymous auth

Focus areas:

- [x] Secrets in deployment
- [x] Firebase auth (anonymous and Google sign-in)
- [x] Firebase Admin token verification
- [x] DB writes/reads + schema
- [x] AI routes
- [x] Firebase App Check
- [x] Vision / uploads enough to confirm App Check/auth headers do not break setup scans
- [x] ElevenLabs speech sanity enough to confirm auth middleware changes did not regress protected speech routes

Steps to run on Replit:

1. Apply/confirm `anonymous_recipe_usage` exists through the Replit-authoritative schema path.
2. Configure `VITE_FIREBASE_APP_CHECK_SITE_KEY`; keep `FIREBASE_APP_CHECK_ENFORCED` off for the first baseline smoke.
3. From the public landing page, start anonymous guest mode and complete setup with pantry/equipment/profile data.
4. Generate Chef It Up recipes successfully as a guest and confirm quota metadata/logs progress.
5. Drive the same anonymous UID to 10 successful recipe generations, then confirm attempt `#11` returns `UPGRADE_REQUIRED` with "unlock more recipes" copy and does not call the provider.
6. Confirm guest profile/setup persistence remains same-browser local, while direct guest calls to durable profile/settings/cooking-session/history endpoints return `UPGRADE_REQUIRED` with "save your kitchen" copy.
7. Set `ANONYMOUS_AUTH_DISABLED=true`, restart, and confirm anonymous protected API calls return `ANONYMOUS_ACCESS_DISABLED`; unset it before continuing.
8. Enable `FIREBASE_APP_CHECK_ENFORCED=true`, restart, and confirm anonymous setup/recipe flow, Google sign-in/upsert, profile writes, vision scan, cooking steps, and speech routes still work with App Check tokens.
9. Confirm linked Google sign-in/upsert, linked profile writes, linked History, and linked cooking-session persistence still work.

Last Replit-validated at: not yet validated.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `c1d084fad0d94d6204a687051a6103111ada6426`
- Last Replit-validated at: not yet validated for this branch
- Notes: `codex/init-003-production-gates` was reset from old Phase 3 base `515b7ec` onto fresh `origin/main` after PR #105 and PR #106. PR #102 was previously Replit-validated at `c952d13c9918356de2c5aaf31cb0dbde6f2d1824`, but this production-gates branch needs fresh Replit validation.
