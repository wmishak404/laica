# Phase 3.1 Planning Pantry-Count Coral Slice

**Agent:** codex
**Branch:** codex/mobile-refresh-phase-3-1-pantry-count-coral
**Date:** 2026-05-14
**Initiative:** INIT-001
**INIT updated:** no - the Phase 3.1 feature phase record was updated; INIT PR/status fields did not change.

## Summary

This slice continues Phase 3.1 from PR #71 and changes only the Planning choice status line: when Pantry has saved items, the dynamic count phrase now receives Planning coral emphasis while the rest of the helper sentence stays neutral. Empty-Pantry behavior and copy remain unchanged, and the branch does not touch broader Planning facelift work, Slop Bowl pantry-check alignment, Ticket Pass / Prep Tray, or imagery.

## Changes

- `client/src/pages/app.tsx`: adds `getPlanningPantryCountLabel`, reuses it in `getPlanningPantryStatusCopy`, and wraps only the rendered count phrase in `planning-pantry-count`.
- `client/src/index.css`: adds `.planning-pantry-count` using the existing Planning coral token family, with no raw hex utilities.
- `tests/unit/planning-choice.test.tsx`: verifies singular/plural count phrases are highlighted and still compose the same status sentence.
- `product-decisions/features/mobile-refresh/pd-phase-03-1-recipe-imagery.md`: records this narrow implementation slice and marks the pantry-count drift fixed.
- `docs/handoffs/2026-05-14-codex-phase-3-1-pantry-count-coral.md`: records this handoff.

## Impact on other agents

Treat the Planning status sentence contract as unchanged except for visual emphasis on the count phrase. The next Phase 3.1 work should still avoid broadening this branch into Slop Bowl pantry-check visual alignment, Ticket Pass / Prep Tray polish, or imagery. Those remain separate accepted slices.

## Open items

- Replit/authenticated visual validation is not yet run for this branch.
- PR #71 is still the lower-stack context for this work. If PR #71 merges before this branch, rebase this branch onto fresh `origin/main` and refresh validation notes before merging.
- Broader Planning visual-fit review remains open as a later slice if screenshots show spacing/hierarchy drift.

## Stack / base status

- Base refreshed: stacked on PR #71 head `41d0d7a9ae69bc8b726da74147346ea108d05a9d`
- Lower PR context: [PR #71](https://github.com/wmishak404/laica/pull/71) / `codex/mobile-refresh-phase-3-1-planning-copy`
- Current base before stack: `origin/main` at `59ee34901b93f23872dd822d377ed39f44540f18`
- Last Replit-validated at: not yet validated
- Notes: this branch intentionally includes PR #71 commits because the status-line slice builds on the Slop It Up Planning-entry copy branch.

## Verification

- `npm ci`
- `npx vitest run tests/unit/planning-choice.test.tsx`
- `npm run check`
- `npm run build`
- `git diff --check`
