# Replit security scan: fix user settings overwrite + speech cache headers

**Agent:** codex
**Branch:** codex/security-fix-settings-speech-cache
**Date:** 2026-05-29
**Initiative:** none
**INIT updated:** n/a

## Summary
Replit’s security scan findings were confirmed as production-reachable issues on `main` and remediated:

1) `PUT /api/user/settings` allowed a signed-in user to overwrite another user’s settings by supplying `authUserId` in the request body (object-spread override).
2) `POST /api/speech/synthesize` returned authenticated user audio with `Cache-Control: public, max-age=31536000`, enabling inappropriate caching of user-generated/private content.

This branch fixes both and adds unit tests that would fail on the vulnerable behavior.

## Changes
- `server/routes.ts`
  - `PUT /api/user/settings` now strips `authUserId` from the request body schema and passes the authenticated UID separately to storage.
  - `POST /api/speech/synthesize` now sets non-cacheable headers (`private, no-store`) and varies on `Authorization`.
- `server/storage.ts`
  - Refactors `upsertUserSettings` to accept `userId` separately from settings payload so request bodies cannot influence ownership.
- `tests/unit/phase0-security-routes.test.ts`
  - Adds coverage ensuring `authUserId` in the settings request body is ignored.
  - Adds coverage ensuring speech synthesis responses are not publicly cacheable.

## Impact on other agents
- Any call sites that used `storage.upsertUserSettings({ authUserId, ... })` must switch to `storage.upsertUserSettings(userId, settings)`.

## Open items
- `npm audit --omit=dev` currently reports moderate-only findings (`qs` chain). No `high`/`critical` were reported during this pass; treating as monitor/track separately.

## Verification
- `npm run check`
- `npx vitest run`

