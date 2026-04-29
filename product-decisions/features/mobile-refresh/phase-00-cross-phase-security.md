# Mobile Refresh Phase 0 — Cross-Phase Security and Backend Readiness

**Status:** Accepted
**Phase owner:** Wilson
**Date:** 2026-04-28
**Initiative:** [INIT-001 — Mobile Refresh](../../../initiatives/INIT-001-mobile-refresh.md)

## Goal

Harden auth, cost-bearing AI routes, session ownership, body limits, logging, and abuse controls before the mobile-refresh UI relies on those flows.

## Decisions

### Firebase auth verification

- Replace signature-less Firebase JWT payload decoding with Firebase Admin `verifyIdToken`.
- Use the service-account strategy for deployment.
- Replit Secrets are the production/runtime source. Local validation can use dotenvx and mocked middleware tests.
- Remove raw token, decoded payload, and user-object logging.

### Future dev-test auth

Agent-driven authenticated smoke should eventually use a dev-only Firebase custom-token lane, not a backend auth bypass. Any future test harness must preserve Firebase Admin token verification on protected routes, be unavailable in production, require explicit opt-in, and stay limited to deterministic test users.

### Cost-bearing route protection

All AI or paid-service routes must require Firebase auth before Phase 2-5 implementation depends on them:

- recipe suggestions and pantry recipe generation
- Slop Bowl recipe generation
- vision analysis
- cooking-step generation and cooking assistance
- speech synthesis and transcription
- Phase 5 next-meal seed generation

### Client auth fetch migration

Create a shared client API helper that attaches the Firebase bearer token and retries once after token refresh on 401. Convert call sites before adding server auth to currently public AI routes.

### Session ownership

Every mutating cooking-session route must verify `session.authUserId === req.firebaseUser.uid` before update, completion, cleanup, or deletion.

### Body limits and upload abuse

- Lower global JSON body limit to about 1 MB.
- Add a route-specific vision body limit around 6 MB.
- Verify decoded image bytes server-side and reject images over 4 MB with 413.
- Client batch caps are UX hints only; server limits are authoritative.

### Rate limits

Use env-configurable defaults with both route-class and per-uid limits:

| Route class | Default limit |
|-------------|---------------|
| Vision | 12 calls / 15 min, 40 / day per uid |
| Chef It Up recipe generation | 10 / hour, 30 / day per uid |
| Slop Bowl recipe generation | 8 / hour, 25 / day per uid |
| Cooking voice help | 20 questions / session, daily cap configurable |
| Speech audio minutes | per-session and daily caps configurable |
| Feedback | anonymous allowed, IP-limited and content-limited |

## Acceptance Criteria

- Forged Firebase token regression test returns 401.
- Firebase Admin is configured without committing service-account secrets.
- Public AI routes return 401 without a valid token.
- Converted client fetch sites keep working after token expiry via one refresh retry.
- Cross-user session update/complete attempts return 403.
- Oversized vision body returns 413 before reaching OpenAI.
- Rate limits return 429 for repeated calls past the configured threshold.
- API request logging no longer includes raw response bodies, tokens, raw images, or raw audio.

## Epic Interactions

- EPIC-005: Adds security/data acceptance criteria before feature merge readiness.
- EPIC-010: Schema-affecting follow-up work still uses Replit as the authority; local agents do not run `db:push` against shared DBs.

## Replit Validation Gate

Before deployment-bound merge, verify Firebase sign-in, recipe generation, cooking-session persistence, feedback writes, ElevenLabs routes, Whisper route, and vision route in Replit.
