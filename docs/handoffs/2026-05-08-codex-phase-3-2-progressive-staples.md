# Phase 3.2 progressive pantry staple check

**Agent:** codex
**Branch:** `codex/mobile-refresh-phase-3-2-progressive-staples`
**Date:** 2026-05-08
**Initiative:** INIT-001
**INIT updated:** yes

## Summary

Implemented Phase 3.2 for the Chef It Up staple-check step. The four visible staple rows now behave like a rolling queue: selected staples move into an Added shelf, the next ranked missing staples reveal, chips can undo before submit, and pantry saves still happen only when `View recipe suggestions` starts generation.

Sequencing check: Phase 3.2 is not blocked by Phase 3.1. It builds on the merged PR #45 generation lock/cancel behavior. Phase 3.1 remains the design facelift and recipe-imagery pass, and should preserve or intentionally restyle the Phase 3.2 Added shelf / rolling queue when it starts.

Follow-up after Wilson's Replit check at `968d39a`: the core rolling queue and submit-time pantry persistence worked, but chip undo was not visually obvious. The branch now keeps the same Added-only behavior, adds a visible right-side `X` to Added chips, updates the helper copy to make submit timing explicit, and documents Slop Bowl pantry-check visual alignment as Phase 3.1 scope.

## Changes

- `shared/planning-staples.ts` adds `getAllStapleCandidatesForCuisines(...)` for the full ranked missing-staple queue while keeping `getStapleCandidatesForCuisines(...)` capped at four for compatibility.
- `client/src/components/cooking/meal-planning.tsx` renders an Added shelf, shows at most four unselected rows from the full queue, supports chip undo with visible `X` affordances, tracks seen staple candidates separately from selected staples, removes the four-staple restore cap, and snapshots the Added shelf / visible rows during loading.
- `client/src/index.css` adds Added shelf/chip styling plus lightweight row/chip entry animations with a `prefers-reduced-motion` fallback.
- `tests/unit/planning-staples.test.ts` covers the full-list helper and capped-helper compatibility.
- `tests/unit/meal-planning.test.tsx` covers rolling reveal, visible-X Added chip undo, Back-before-submit no-save behavior, selected-vs-seen submission context, loading freeze with Back cancel, and successful three-suggestion reveal.
- Docs updated: INIT-001, mobile-refresh phase index, Phase 3 record, Phase 3.1 record, Phase 3.2 feature record, EPIC-004, and EPIC-005.

## Impact on other agents

- Phase 3.1 should treat Phase 3.2 as the current Chef It Up staple-check behavior if this branch merges before the facelift branch starts.
- Phase 3.1 should also compare Slop Bowl's pantry-check menu against the newer Chef It Up Phase 3.2 chip/row direction and align visual grammar where behavior overlaps. Do not change Slop Bowl behavior unless Phase 3.1 deliberately takes that on.
- There are no server route, payload contract, database, or environment-variable changes.
- EPIC-004 interaction: conforms. The queue keeps full-row rows and uses full chip targets for undo; the visible `X` improves discoverability without shrinking the tap target, and rows/chips disable during submit.
- EPIC-005 interaction: conforms. Deterministic UI state is covered by Vitest; authenticated pantry-save/generation behavior still needs Replit validation.

## Open items

- Replit validation is required before merge:
  - Authenticated Chef It Up with cuisines that produce more than four missing staples.
  - Select two visible staples and verify two new rows appear.
  - Confirm the Added chip `X` is visually obvious, then undo one Added chip and verify it returns to the queue.
  - Press Back before submit and verify pending additions are not saved.
  - Submit and verify no reshuffle/taps during `Finding recipes...`.
  - Press Back during loading and verify no late auto-advance.
  - Repeat and let suggestions complete; verify Ticket Pass appears and confirmed staples remain saved to pantry.

## Verification

- `npx vitest run tests/unit/meal-planning.test.tsx tests/unit/planning-staples.test.ts`
- `npm run check`
- `npm run build`
- `git diff --check`

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `7b0e22b1898d7dd91b99d33f90d512b9404afda2`
- Last Replit-validated at: not yet validated for Phase 3.2
- Notes: PR #45 merged the generation lock/cancel fix as `8892327`; PR #41 merged independent INIT-002/AI telemetry docs as `cb94f28`; PR #39 closed out Phase 3 as `1454ba5`; PR #48 added Phase 3.1 Slop It Up scope as `7b0e22b`; this branch is rebased on top.
