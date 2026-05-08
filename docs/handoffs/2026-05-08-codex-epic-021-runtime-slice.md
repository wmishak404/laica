# EPIC-021 scan upload runtime slice

**Agent:** codex
**Branch:** codex/epic-021-scan-upload-implementation
**Date:** 2026-05-08
**Initiative:** INIT-001
**INIT updated:** yes
**Replit validated:** not yet

## Summary

Started the runtime implementation for [EPIC-021](../../epics/021-scan-upload-photo-limit-policy.md) after PR #52 merged the policy docs. This slice makes setup and Settings enforce the same 20-photo per-refresh cap, updates copy from "per batch" to "per refresh", keeps unsupported files out of the cap count, adds simple multi-photo progress and partial-success copy, and makes the server vision limiter capable of consuming image counts.

This branch does not yet implement provider-level multi-image vision batching or final adaptive chunk-size thresholds. The current client still sends one `/api/vision/analyze` request per accepted image, so the server-side limit changes keep the current route aligned with the 40-image per-day-per-area policy without pretending chunking is complete.

## Changes

- `shared/scan-policy.ts`: centralizes scan image limits and Pantry/Kitchen scan labels.
- `client/src/components/cooking/user-profiling.tsx`: setup scan uploads now use 20 supported images per refresh for both Pantry and Kitchen, filter unsupported files before over-cap checks, show per-refresh copy, preserve partial successes, and show basic analyzing progress for multi-photo refreshes.
- `client/src/components/cooking/user-settings.tsx`: returning Settings now uses the same 20-photo cap, unsupported-file counting semantics, per-refresh copy, progress copy, and partial-success summaries.
- `server/rate-limit.ts`: adds image-count consumption support and raises the default signed-in vision short-window fallback to 40 so one accepted 20-photo refresh is not blocked by the older 12-request meter.
- `server/routes.ts`: moves the vision image limiter to after image body/base64 validation and consumes one image slot for the current single-image route.
- `tests/unit/user-profiling.test.tsx`: updates setup cap expectations to 20 and adds unsupported-file-does-not-count coverage.
- `tests/unit/user-settings-scan-policy.test.tsx`: adds Settings Pantry/Kitchen same-limit over-cap coverage.
- `tests/unit/rate-limit.test.ts`: adds image-count limiter coverage.
- `epics/021-scan-upload-photo-limit-policy.md` and `initiatives/INIT-001-mobile-refresh.md`: record the implementation slice and remaining open work.

## Validation

- `npm ci`
- `npx vitest run tests/unit/user-profiling.test.tsx tests/unit/user-settings-scan-policy.test.tsx tests/unit/rate-limit.test.ts`
- `npm run check`
- `npm run build`
- `git diff --check`
- Local dotenvx dev-server boot on port 3000, with elevated local `curl -I http://127.0.0.1:3000` returning HTTP 200
- In-app browser smoke to `http://127.0.0.1:3000/`, confirming the client serves the unauthenticated Laica welcome screen

`npm run build` passed with the existing Vite chunk-size warning and existing dynamic/static Firebase import warning. The local browser smoke did not exercise authenticated Pantry/Settings scan flows because it landed on the unauthenticated welcome screen; Replit/mobile validation still needs to cover the signed-in high-photo-count scan behavior. No Replit validation has been run yet.

## Remaining EPIC-021 Work

- Decide whether provider-level multi-image batching and adaptive chunk thresholds should land in this branch or a follow-up. This slice only prepares the policy/cap/rate-limit semantics and keeps the current per-image API path.
- Replit/mobile validate setup Pantry, setup Kitchen, Settings Pantry, and Settings Kitchen high-photo-count refresh behavior.
- If provider-level batching lands later, make sure server-side rate limits count accepted images rather than requests, and keep PD-010 telemetry to `image_count` only.
- Add PR description validation notes with `Last Replit-validated at: not yet validated` unless Replit validation is completed before opening the PR.
