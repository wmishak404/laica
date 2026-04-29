# Mobile Refresh Phase 2 Smoke Review

**Agent:** codex
**Branch:** codex/mobile-refresh-phase-2-setup
**Date:** 2026-04-29

## Summary

Reviewed PR #23 after PR #22 merged into `main`, verified that the PR is retargeted to `main`, and reran the local Phase 2 checks. The branch is mergeable against current `origin/main`, but authenticated Replit validation is still the remaining gate before treating it as ready to merge.

## Changes

- `client/src/components/ui/native-camera.tsx`
  - Removed the `capture="environment"` hint from the upload fallback input so the "upload photo instead" path can open the photo library instead of forcing another camera capture on mobile browsers.

## Impact on other agents

- The branch is still one feature commit plus this smoke-review polish commit ahead of `main`.
- GitHub reports PR #23 as mergeable and there are no open PR comments or review threads.
- The existing Phase 2 setup handoff remains the implementation reference; this file records the follow-up review and validation pass.

## Open items

- Pull `codex/mobile-refresh-phase-2-setup` into Replit and run the authenticated setup smoke there.
- Local in-app browser sign-in could not enter the authenticated flow because Firebase popup auth was blocked by the browser environment.
- Replit/authenticated validation still needs to confirm:
  - first-time user routes into setup
  - pantry embedded camera preview loads and capture merges detected ingredients
  - camera denied path leaves upload/manual alternatives available
  - pantry batch upload enforces 8-photo limit
  - kitchen batch upload enforces 6-photo limit
  - negative-control scan shows explicit no-detection feedback
  - manual `buns, mayo` creates separate badges in setup and Slop Bowl quick-add
  - settings no longer shows Weekly Cooking Time

## Verification

- `git diff --check`
- `npm run check`
- `npm run build`
- `npx vitest run tests/unit/slop-bowl-route.test.ts`
- `npx vitest run tests/unit` was also tried; it still fails in `tests/unit/voice-recording.test.ts` because the jsdom environment lacks `MediaStream`, which is outside this Phase 2 change set.
- Local browser smoke at `http://127.0.0.1:3000`:
  - landing page renders
  - `Weekly Cooking Time` is absent from the unauthenticated shell
  - Google auth could not proceed because popup sign-in was blocked locally
