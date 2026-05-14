# Phase 3.1 Planning Copy Slice

**Agent:** codex
**Branch:** codex/mobile-refresh-phase-3-1-planning-copy
**Date:** 2026-05-14
**Initiative:** INIT-001
**INIT updated:** no - the Phase 3.1 feature phase record was updated; INIT status/PR state did not change.

## Summary

Phase 3.1's first runtime slice is intentionally small and now implemented: the Planning entry labels the Slop Bowl path as `Slop It Up`, uses one approved italic supporting-copy line selected once per app mount, and keeps the underlying feature identity as `Slop Bowl`. The branch did not expand into broader Planning facelift, Slop Bowl pantry-check alignment, Ticket Pass / Prep Tray polish, or imagery.

## Changes

- `client/src/pages/app.tsx`: adds the approved Slop It Up supporting-copy list, stable mount-time random selection, `Slop It Up` front-door title, and italic Slop It Up supporting copy while preserving the existing `slop-bowl` flow state and component path.
- `tests/unit/planning-choice.test.tsx`: covers the new card title/copy treatment, approved-copy source, italic class, removal of the old fixed copy, and click-through to the existing Slop Bowl flow.
- `product-decisions/features/mobile-refresh/pd-phase-03-1-recipe-imagery.md`: marks the Slop It Up card contract implemented and records that this branch stayed within the first runtime slice.
- `docs/handoffs/2026-05-14-codex-phase-3-1-planning-copy.md`: records this transfer note.

## Impact on other agents

Continue to treat `Slop It Up` as the Planning-card label only. Backend/API contracts, route state, Slop Bowl component naming, guard copy, generated recipe language, and durable product docs still use `Slop Bowl` unless Wilson explicitly approves a wider rename.

The broader Phase 3.1 facelift remains open. Pantry-check visual alignment, Ticket Pass / Prep Tray polish, and async imagery were deliberately untouched.

## Open items

- Authenticated Planning-entry screenshot validation still needs Replit/manual browser coverage before Phase 3.1 closeout. Local in-app browser access reached the signed-out landing screen only.
- Replit validation is not complete for this runtime branch. Last Replit-validated at: not yet validated.

## Stack / base status

- Base refreshed: yes
- Current base: origin/main at `59ee34901b93f23872dd822d377ed39f44540f18`
- Last Replit-validated at: not yet validated
- Notes: independent Phase 3.1 runtime branch from fresh `origin/main`; not stacked on another open PR.

## Verification

- `npm ci`
- `npx vitest run tests/unit/planning-choice.test.tsx`
- `git diff --check`
- `npm run check`
- `npm run build`
- Local dotenvx dev server booted on port 3000; unauthenticated browser access showed the signed-out Laica landing page, so authenticated Planning visual validation remains deferred to Replit/manual preview.
