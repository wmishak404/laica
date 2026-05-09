# EPIC-021 scan upload runtime slice

**Agent:** codex
**Branch:** codex/epic-021-scan-upload-implementation
**Date:** 2026-05-08
**Initiative:** INIT-001
**INIT updated:** yes
**Replit validated:** yes at `ef28e59`

## Summary

Started the runtime implementation for [EPIC-021](../../epics/021-scan-upload-photo-limit-policy.md) after PR #52 merged the policy docs. This slice makes setup and Settings enforce the same 20-photo per-refresh cap, updates copy from "per batch" to "per refresh", keeps unsupported files out of the cap count, adds simple multi-photo progress and partial-success copy, makes the server vision limiter capable of consuming image counts, and adds bounded scan concurrency to reduce the full-refresh wait. The latest follow-up also handles the returning-user empty-Pantry corner case and active Settings scan cancellation.

This branch does not yet implement provider-level multi-image vision batching or final adaptive chunk-size thresholds. The current client still sends one `/api/vision/analyze` request per accepted image, now up to 4 at a time, so the server-side limit changes keep the current route aligned with the 40-image per-day-per-area policy without pretending chunking is complete.

## Changes

- `shared/scan-policy.ts`: centralizes scan image limits, Pantry/Kitchen scan labels, and the bounded scan-analysis concurrency cap of 4.
- `client/src/lib/boundedConcurrency.ts`: adds a small helper for running scan work with a fixed concurrency ceiling.
- `client/src/lib/profileReadiness.ts`: separates cooking-profile readiness from Pantry contents so returning users can intentionally have zero pantry items without being sent through first-time setup.
- `client/src/components/cooking/user-profiling.tsx`: setup scan uploads now use 20 supported images per refresh for both Pantry and Kitchen, filter unsupported files before over-cap checks, show per-refresh copy, preserve partial successes, show basic analyzing progress for multi-photo refreshes, and process up to 4 accepted photos at a time.
- `client/src/components/cooking/user-settings.tsx`: returning Settings now uses the same 20-photo cap, unsupported-file counting semantics, per-refresh copy, progress copy, partial-success summaries, and bounded 4-photo-at-a-time processing. The old 500ms delay between Settings photos was removed. Leaving Settings during an active scan now confirms and aborts; scan completion is ignored after cancel/unmount; inventory save/reset/manual/remove edits lock while any inventory scan is active; cross-section progress remains visible when switching Settings sections.
- `client/src/components/cooking/meal-planning.tsx` and `client/src/components/cooking/slop-bowl.tsx`: pantry-based generation blocks when Pantry is empty with explicit recovery copy and, where supported, a path to Settings > Pantry.
- `client/src/pages/app.tsx` and `client/src/pages/cooking-new.tsx`: profile completion no longer depends on Pantry item count, preserving Profile/Kitchen/History when Pantry is intentionally empty. The Planning choice screen now shows a quiet Pantry status line and blocks Chef It Up immediately on card tap if Pantry is empty.
- `server/rate-limit.ts`: adds image-count consumption support and raises the default signed-in vision short-window fallback to 40 so one accepted 20-photo refresh is not blocked by the older 12-request meter.
- `server/routes.ts`: moves the vision image limiter to after image body/base64 validation and consumes one image slot for the current single-image route; pantry recipe generation now returns typed `EMPTY_PANTRY` instead of generating with zero ingredients.
- `tests/unit/user-profiling.test.tsx`: updates setup cap expectations to 20 and adds unsupported-file-does-not-count plus bounded-concurrency coverage.
- `tests/unit/user-settings-scan-policy.test.tsx`: adds Settings Pantry/Kitchen same-limit over-cap coverage and bounded-concurrency coverage.
- `tests/unit/profile-readiness.test.ts`: covers empty-Pantry returning-user readiness.
- `tests/unit/planning-choice.test.tsx`: covers the Planning choice Pantry status line, empty-Pantry Chef It Up tap blocker, Settings > Pantry toast action, and non-empty Chef It Up entry.
- `tests/unit/meal-planning.test.tsx`: covers the empty-Pantry recipe-generation blocker.
- `tests/unit/user-settings-scan-policy.test.tsx`: covers active Settings scan cancellation on Back.
- `tests/unit/phase0-security-routes.test.ts`: covers the server-side empty-Pantry recipe blocker.
- `tests/unit/rate-limit.test.ts`: adds image-count limiter coverage.
- `product-decisions/011-scan-upload-photo-limit-policy.md`, `epics/021-scan-upload-photo-limit-policy.md`, `epics/020-workflow-documentation-audit.md`, and `initiatives/INIT-001-mobile-refresh.md`: record empty-Pantry guardrails, active-scan lifecycle decisions, and the corner-case testing methodology signal.

## Validation

- `npm ci`
- `npx vitest run tests/unit/user-profiling.test.tsx tests/unit/user-settings-scan-policy.test.tsx tests/unit/rate-limit.test.ts`
- `npx vitest run tests/unit/profile-readiness.test.ts tests/unit/meal-planning.test.tsx tests/unit/user-settings-scan-policy.test.tsx tests/unit/user-profiling.test.tsx tests/unit/rate-limit.test.ts tests/unit/phase0-security-routes.test.ts`
- `npx vitest run tests/unit/planning-choice.test.tsx`
- `npm run check`
- `npm run build`
- `git diff --check`
- Local dotenvx dev-server boot on port 3000, with `curl -I http://127.0.0.1:3000` returning HTTP 200
- Earlier in this branch: in-app browser smoke to `http://127.0.0.1:3000/`, confirming the client serves the unauthenticated Laica welcome screen

`npm run build` passed with the existing Vite chunk-size warning and existing dynamic/static Firebase import warning. The local browser smoke did not exercise authenticated Pantry/Settings scan flows because it landed on the unauthenticated welcome screen. Wilson ran authenticated Replit validation for the scan scenarios earlier in the branch, then completed a narrow final Replit validation at `ef28e59` after the Planning status copy/icon design adjustments.

## Cost and Latency Note

Wilson's Replit run found the serial scan path operating at about 1-2 seconds per photo. With a 20-photo cap, that means roughly 20-40 seconds for a maxed refresh, which is too long even with "X of 20" progress.

The latest patch processes up to 4 accepted images concurrently. At the same observed per-photo latency, a full 20-photo refresh should trend closer to 5-10 seconds because it runs in about 5 waves instead of 20. Direct provider cost should be unchanged versus the serial EPIC-021 implementation because the app still analyzes the same accepted images with the same one-image route; it only overlaps the calls.

Using the planning estimates in EPIC-021, the current per-image implementation remains roughly:

- 20-photo Pantry or Kitchen refresh: `$0.17-$0.22`
- Maxed Pantry plus Kitchen refresh, 40 total images: `$0.34-$0.45`
- Maxed daily usage, 40 Pantry plus 40 Kitchen images: `$0.67-$0.89`

Compared with the old 8 Pantry / 6 Kitchen maximum, the max-refresh spend rises because the cap now allows 40 images instead of 14. Bounded concurrency does not create that increase. Future provider-level batching is still the cost-reduction path, with the planning estimate closer to `$0.18-$0.28` per maxed user day.

## Abuse Guardrail Note

Wilson raised a fresh-account churn case: a user could sign in, scan 20 photos, avoid saving, sign out, then repeat with another fresh account. The current decision is not to add daily IP caps, global cross-area IP caps, or a save-before-scan gate in this slice.

Current protection is considered enough for rollout: scans require auth, accepted images count against per-user/per-area daily limits, and short-window IP limits make rapid repeat abuse annoying and bounded. OpenAI/project-level API limits are an additional last-resort spend backstop if something goes badly wrong, but they are not the normal product control because they can fail user flows outside Laica's scan-specific copy. This remains a known non-blocking risk to revisit if billing, usage, or account-churn signals show the heavier guardrails are needed.

## Replit Follow-up Note

Wilson reported that the core latest Replit testing looked good, including active-scan Save/Reset controls being non-pressable during scan. The remaining UX issue was that Chef It Up's empty-Pantry message fired only after cuisine/staple choices, which made the flow look like it could cook from only newly added staples. The latest patch moves that blocker to the Planning choice card tap and adds the morphing Pantry status line under the title. After removing the misaligned notification icon and deferring final visual treatment to Phase 3.1, Wilson validated the latest Replit build at `ef28e59` and confirmed all items work as designed.

## Closeout Note

- Wilson later confirmed provider-level multi-image batching and final adaptive chunk thresholds are not needed at this point. The validated bounded-concurrency implementation is accepted as the EPIC-021 resolution.
- Keep the final Pantry status visual treatment deferred to Phase 3.1. This slice intentionally keeps the line as plain supporting copy with no notification icon.
