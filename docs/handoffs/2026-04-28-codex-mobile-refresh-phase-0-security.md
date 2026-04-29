# Mobile refresh Phase 0 security implementation

**Agent:** codex
**Branch:** codex/mobile-refresh-phase-0-security
**Date:** 2026-04-28

## Summary

Implemented the first Phase 0 backend/security pass from `product-decisions/features/mobile-refresh/phase-00-cross-phase-security.md`.

This branch focuses on auth verification, protected cost-bearing routes, basic abuse limits, session ownership, body limits, logging cleanup, and AI prompt/log privacy guards. It does not implement Phase 1-5 UI changes.

## Changes

- `server/firebaseAuth.ts`
  - Replaced signature-less JWT payload decoding with Firebase Admin `verifyIdToken`.
  - Supports `FIREBASE_SERVICE_ACCOUNT_JSON`, `FIREBASE_SERVICE_ACCOUNT_BASE64`, or application default credentials.
  - Removed raw token/payload/user logging.
- `server/routes.ts`
  - Protected cost-bearing AI/speech/vision routes with Firebase auth.
  - Added route-class IP limits plus per-user limits.
  - Added cooking-session ownership checks on mutating `:id` routes.
  - Removed pantry mutation from cooking-session completion.
  - Added image decoded-size validation and route-specific vision JSON parsing.
  - Added server-side clamps for pantry labels, feedback text, voice questions, and cooking-assistance inputs.
- `server/index.ts`
  - Lowered global JSON/urlencoded limits to 1 MB.
  - Removed response-body logging from API request logs.
- `server/openai.ts`, `server/ai-privacy.ts`
  - Added prompt-marker stripping, AI log redaction, bounded AI log output, and 90-day opportunistic `aiInteractions` cleanup.
  - Removed verbose vision prompt/response logging.
- `server/rate-limit.ts`
  - Added simple in-memory rate-limit middleware with env-configurable per-user defaults.
- Client API calls
  - Added `apiFetch()` with one forced-token-refresh retry on 401.
  - Converted recipe, cooking, vision, speech synthesis, and speech transcription calls to the authenticated helper path.
- Tests
  - Added forged-token Firebase regression coverage.
  - Added protected-route and cross-user session mutation coverage.

## Impact on other agents

Phase 1-5 implementation can now assume the cost-bearing backend routes are protected. Client code should continue using `apiRequest()` / `apiFetch()` for any new API calls, especially AI, speech, vision, cooking-session, or pantry mutation paths.

Replit must provide Firebase Admin credentials before this branch can pass a service-backed smoke test. Recommended secret is one of:

- `FIREBASE_SERVICE_ACCOUNT_JSON`
- `FIREBASE_SERVICE_ACCOUNT_BASE64`

`FIREBASE_PROJECT_ID` can also be set explicitly; otherwise `VITE_FIREBASE_PROJECT_ID` is used as a fallback.

## Open items

- `npm audit --omit=dev` still reports Firebase Admin transitive moderate/low advisories through Google Cloud packages. `npm audit fix --force` attempts to downgrade Firebase Admin to `10.1.0`, which introduces critical/high advisories, so this branch intentionally stays on the current Firebase Admin line.
- Replit validation is still required for Firebase sign-in, OpenAI routes, ElevenLabs, Whisper, Vision, and DB-backed cooking-session persistence.
- The rate limiter is in-memory. That is acceptable for this Replit v1 pass, but a distributed store should be reconsidered if the app scales beyond one runtime.

## Verification

Local checks:

- `npm run check`
- `npx vitest run tests/unit/firebase-auth.test.ts tests/unit/phase0-security-routes.test.ts tests/unit/slop-bowl-route.test.ts`
- `npm run build`
- `npm audit --omit=dev` reviewed; remaining findings documented above

The first local Vitest route run failed in the sandbox because it could not bind `127.0.0.1`; rerunning with loopback permission passed.
