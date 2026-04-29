# Mobile Refresh Phase 2 Setup

**Agent:** codex
**Branch:** codex/mobile-refresh-phase-2-setup
**Date:** 2026-04-29

## Summary

Implemented the Phase 2 setup/profile pass as a stacked branch on top of Phase 1. The new setup flow is camera-first, removes Weekly Cooking Time from the user-facing profile path, and moves the profile selections toward full-row mobile controls.

This branch is stacked on `codex/mobile-refresh-phase-1-auth`, which is itself stacked on `codex/mobile-refresh-phase-0-security`. Until those merge, open this PR against the Phase 1 branch.

## Changes

- `client/src/components/cooking/user-profiling.tsx`
  - Replaced the old six-step desktop-like onboarding with a five-step mobile setup flow:
    - Pantry embedded camera scan
    - Kitchen embedded camera scan, skippable
    - Cooking skill full-row selection
    - Dietary restrictions full-row multi-select
    - Setup confirmation
  - Added batch upload support with client limits:
    - Pantry: 8 photos per batch
    - Kitchen: 6 photos per batch
  - Added no-detection toasts for pantry and kitchen scans.
  - Added warm/coral pantry/equipment chips and deduped merge behavior.

- `client/src/components/ui/native-camera.tsx`
  - Changed the camera primitive from "open the device camera picker" to an embedded `getUserMedia` preview with capture.
  - Keeps upload fallback when permission is blocked or unsupported.

- `client/src/lib/entryParsing.ts`
  - Added shared comma-separated parsing, label normalization, and case-insensitive dedupe helpers.

- `client/src/components/cooking/user-settings.tsx`
  - Removed Weekly Cooking Time from settings.
  - Added camera buttons for pantry/equipment settings scans.
  - Reused shared comma parsing for pantry/equipment manual entry.
  - Converted profile skill and dietary selections to full-row mobile controls.

- `client/src/components/cooking/slop-bowl.tsx`
  - Reused shared comma parsing so `buns, mayo` becomes two temporary pantry badges.

- `client/src/pages/app.tsx`, `client/src/components/cooking/meal-planning.tsx`, `client/src/pages/cooking-new.tsx`
  - Removed Weekly Cooking Time from client completion gates and profile payloads.
  - Normalized legacy `None` dietary values to `No restrictions`.

- `server/routes.ts`, `server/openai.ts`
  - Removed Weekly Cooking Time from Slop Bowl readiness checks and prompt inputs.
  - Slop Bowl now uses a conservative default 60-minute target until Phase 3's per-session time slider replaces it.

- `epics/004-selection-controls-tap-targets.md`
- `epics/007-vision-scan-no-detection-feedback.md`
- `epics/009-consistent-comma-separated-ingredient-entry.md`
  - Added dated implementation notes for the Phase 2 branch.

## Impact on other agents

- Phase 3 should treat Weekly Cooking Time as removed. The planning time slider can be implemented as per-session state without reviving the old profile field.
- The `weekly_time` DB column remains in `shared/schema.ts` by design; do not drop it in this phase.
- Phase 5 cleanup quick-add should reuse `client/src/lib/entryParsing.ts`.
- Embedded camera behavior requires browser permission and must be validated in Replit/local browser with an authenticated user.

## Open items

- Replit/authenticated validation is still required:
  - First-time user enters setup immediately.
  - Pantry camera preview loads, captures, and merges scan results.
  - Camera denied path leaves upload/manual entry available.
  - Pantry batch upload enforces 8-photo client limit.
  - Kitchen batch upload enforces 6-photo client limit.
  - Known negative-control scan produces explicit no-detection feedback.
  - Manual `buns, mayo` creates separate badges.
  - Settings no longer shows Weekly Cooking Time.
- Browser-level Slop Bowl quick-add validation is still needed before EPIC-009 can close.

## Verification

- `git diff --check`
- `npm run check`
- `npm run build`
- `npx vitest run tests/unit/slop-bowl-route.test.ts`
- Local unauthenticated browser smoke at `http://127.0.0.1:3000`:
  - Landing still renders.
  - `Weekly Cooking Time` is not present on the unauthenticated shell.
  - Full setup requires authenticated Replit/local Firebase validation.
