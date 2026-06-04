# 2026-06-04 — Codex EFF-017 Linked Dev-Auth Lane

## Summary

Branch `codex/eff-017-linked-dev-auth` implements the first deterministic linked-account dev-auth lane from the EFF-017 retro. It creates a guarded dev-only Firebase custom-token endpoint for allowlisted synthetic users and adds API-level Playwright coverage that exchanges the custom token through Firebase before calling linked-only app routes.

The key point for future agents: this is not a Google popup automation path and not a backend auth bypass. It gives CI a repeatable linked-user Firebase bearer-token lane while keeping real Google popup/linking UX in the Replit/live validation lane.

## Branch

- Branch: `codex/eff-017-linked-dev-auth`
- Base: fresh `origin/main` at `559a7c10e483b2b77dd9766bf7db7286c3ce75b9`
- Last Replit-validated at: not yet validated

## Implementation

- Added `server/devAuth.ts`.
  - Registers guarded behavior for `POST /api/dev/auth/linked-token`.
  - Unavailable when `NODE_ENV=production`, when `REPLIT_DEPLOYMENT` is truthy, or when `LAICA_DEV_AUTH_ENABLED` is not explicitly enabled.
  - Requires `X-Laica-Dev-Auth` to match `LAICA_DEV_AUTH_SECRET`.
  - Only accepts allowlisted `dev-test-*` UIDs from `LAICA_DEV_AUTH_ALLOWED_USERS`.
  - Seeds the synthetic linked user through `storage.upsertUser`.
  - Mints a Firebase custom token through Firebase Admin and returns it with private no-store headers.
- Exported `createFirebaseCustomToken` from `server/firebaseAuth.ts`.
- Registered `/api/dev/auth/linked-token` in `server/routes.ts`.
- Added `tests/unit/dev-auth-route.test.ts` and extended `tests/unit/firebase-auth.test.ts`.
- Added `tests/e2e/linked-dev-auth.test.ts`.
  - Calls the dev token endpoint.
  - Exchanges the custom token through Firebase Identity Toolkit.
  - Uses the resulting Firebase ID token against `/api/auth/session` and `/api/auth/user`.
- Extended the existing conditional GitHub E2E job with `LAICA_DEV_AUTH_*` env for the linked smoke.
- Added the env contract to `.env.example`.
- Updated EFF-017 and the mobile-refresh dev-test harness note.

## Evidence Report

### Claim

The branch adds a deterministic CI lane for linked-account route access without automating real Google popup completion and without weakening protected route auth. Protected linked routes still receive Firebase bearer tokens verified by the server.

### Command / Check Provenance

- Local macOS worktree, branch `codex/eff-017-linked-dev-auth`.
- `npx vitest run tests/unit/dev-auth-route.test.ts tests/unit/firebase-auth.test.ts`
- `npm run check`
- `npm run test:unit`
- `npm run build`
- `git diff --check`
- `npx playwright test tests/e2e/linked-dev-auth.test.ts --project=chromium --list`

### Source Provenance

- Guarded dev endpoint: `server/devAuth.ts`
- Route registration: `server/routes.ts`
- Firebase Admin custom-token helper: `server/firebaseAuth.ts`
- Unit guardrails: `tests/unit/dev-auth-route.test.ts`
- Firebase helper regression: `tests/unit/firebase-auth.test.ts`
- CI linked smoke: `tests/e2e/linked-dev-auth.test.ts`
- CI env lane: `.github/workflows/ci.yml`
- Env contract: `.env.example`
- Durable context: `efforts/effort-017-environment-parity-and-ci-confidence.md`, `product-decisions/features/mobile-refresh/pd-dev-test-harness.md`

### Observed Result

- Focused Vitest: 2 files / 13 tests passed.
- Full unit suite: 33 files / 218 tests passed.
- `npm run check`: TypeScript and UI lint passed.
- `npm run build`: Vite/esbuild production build passed with existing bundle-size/dynamic-import warnings.
- `git diff --check`: passed with no whitespace errors.
- Playwright discovery listed 1 Chromium test in `tests/e2e/linked-dev-auth.test.ts`.

### Reasoning

The unit tests prove the endpoint is unavailable outside the explicit dev lane, refuses missing guard headers, validates synthetic UID/email shape, rejects unallowlisted users, and calls the mocked storage/Firebase dependencies only for the allowlisted happy path. The Playwright smoke is intentionally API-level: it proves the custom token can become a Firebase ID token and then exercise linked-only app routes, but only after GitHub Actions runs it with the disposable Neon branch and Firebase test-project env.

### Negative Scope

Still unvalidated: live Google popup sign-in, anonymous-to-Google linking UX, Firebase Console authorized-domain state beyond the separate OAuth-start preflight lane, live OpenAI quality, ElevenLabs audio quality, real storage integration beyond the GitHub E2E harness, full Replit deployment behavior, Replit-shell Playwright until Chromium dependencies are configured, and exhaustive corner cases.

## Follow-Up

- Watch PR CI for the existing conditional `e2e_guest_smoke` job, now named at the step level as `E2E (guest + linked dev-auth smoke)`.
- If CI passes, this lane can become the foundation for browser-level `signInWithCustomToken` setup/profile/settings/linked-flow coverage.
- Keep full Google popup completion and linking behavior in Replit human or explicit live-smoke lanes unless a durable decision changes the policy.
