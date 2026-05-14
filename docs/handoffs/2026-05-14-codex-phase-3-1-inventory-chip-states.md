# Phase 3.1 Inventory Chip State Alignment

**Agent:** codex
**Branch:** `codex/mobile-refresh-phase-3-1-inventory-chip-states`
**PR:** [#74](https://github.com/wmishak404/laica/pull/74) draft
**Date:** 2026-05-14
**Initiative:** INIT-001
**Stacking:** stacked on PR #73 / `codex/mobile-refresh-phase-3-1-slop-pantry-align`
**INIT updated:** yes
**Related Effort:** EFF-014

## Summary

This slice aligns first-time setup and returning Settings Pantry/Kitchen inventory review chips with the Chef It Up / Slop Bowl state grammar. Existing saved items render as green checked chips; newly added manual/scan items render as coral `+` chips with an `X`; duplicate scan matches mark the existing chip as found again without adding another row. The state is client-only and clears on setup Continue or successful Settings save.

EFF-014 is now `In Progress` with the Setup/Settings implementation path documented. Keep it active until this stacked branch merges and Wilson completes the Replit/mobile validation checklist; then the closeout pass can mark it `Resolved` and leave Phase 5 post-cook rescan labels in the Phase 5 record.

## Changes

- `client/src/lib/entryParsing.ts`: extends merge metadata with `foundAgain` entries for duplicates that match pre-existing inventory.
- `client/src/lib/inventoryReviewState.ts`: adds client-only review-state helpers for recent/found-again/saved chip states.
- `client/src/components/cooking/inventory-review-chip.tsx`: adds the shared setup/settings inventory chip component.
- `client/src/components/cooking/user-profiling.tsx`: applies recent/found-again chip state to first-time Pantry/Kitchen setup and clears state on Continue.
- `client/src/components/cooking/user-settings.tsx`: applies the same chip state grammar to returning Pantry/Kitchen Settings and clears state after successful saves/resets.
- `client/src/index.css`: adds tokenized green/coral review-chip styles and quiet found-again emphasis.
- Tests cover merge metadata, Settings saved/recent/found-again behavior, setup Continue clearing, and updated scan overlap copy.
- INIT-001, Phase 3.1, EFF-014, the effort read list/registry, `design_guidelines.md`, and mobile-refresh design language were updated.

## Scope Boundaries

- Does not touch broader Planning facelift, Planning cards/whitespace, Ticket Pass, Prep Tray, recipe generation, async imagery, or backend/API contracts.
- Does not change Chef It Up or Slop Bowl behavior beyond depending on PR #73's chip grammar baseline.
- Does not implement fuzzy/semantic duplicate detection or auto-merge duplicate-like labels.
- Does not implement Phase 5 post-cook cleanup/rescan UI; Phase 5 keeps `Already saved` / `Found again` / `New` ownership.

## Validation

- `npx vitest run tests/unit/entry-parsing.test.ts tests/unit/user-settings-scan-policy.test.tsx tests/unit/user-profiling.test.tsx`
- `npx vitest run tests/unit/entry-parsing.test.ts tests/unit/user-settings-scan-policy.test.tsx tests/unit/user-profiling.test.tsx tests/unit/meal-planning.test.tsx tests/unit/slop-bowl.test.tsx`
- `npm run check`
- `npm run build`
- `git diff --check`
- `PORT=3000 npx @dotenvx/dotenvx run -- npm run dev` smoke via bounded start/curl/kill returned HTTP 200 after linking the standard ignored worktree `.env.keys`.

Pending:

- Wilson/Replit visual check for Settings Pantry/Kitchen and setup Pantry/Kitchen chip states.

## Manual Validation Needed

- Settings Pantry and Kitchen: existing chips are green checked; manual/scan additions are coral `+`; Save turns recent chips green.
- Repeated scan: no duplicate row; matching saved chip gets the quiet found-again cue and scan copy.
- Setup Pantry and Kitchen: same state behavior; Continue clears recent/found-again state if returning to the step.
- Chef It Up and Slop Bowl chip conventions remain unchanged.
