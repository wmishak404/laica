# Phase 3.1 Slop Bowl Pantry-Check Visual Alignment

**Agent:** codex
**Branch:** codex/mobile-refresh-phase-3-1-slop-pantry-align
**Date:** 2026-05-14
**Initiative:** INIT-001
**INIT updated:** no - the Phase 3.1 feature phase record was updated; INIT merge/PR state should be updated after this branch lands.

## Summary

This slice aligns Slop Bowl's pantry-check chips with Chef It Up Phase 3.2 pantry-confirmation grammar without changing Slop Bowl behavior. Saved Pantry ingredients now render as green check chips; manual temporary additions render as coral `+` chips with a visible `X`; the old visible `Added` label is gone. Saved Pantry chips remain removable only from the current bowl, not from saved Pantry.

## Changes

- `client/src/components/cooking/slop-bowl.tsx`: replaces pantry-check `Badge` chips with full-chip buttons carrying saved-vs-temporary icon grammar and clearer omit/remove aria labels.
- `client/src/index.css`: updates Slop Bowl pantry-check chip styling to match the Phase 3.2 saved/pending color, radius, typography, and icon treatment.
- `tests/unit/slop-bowl.test.tsx`: adds focused coverage for saved pantry chips, manual temporary chips, visible remove affordances, absence of `Saved`/`Added` labels, and omit-from-this-bowl behavior.
- `product-decisions/features/mobile-refresh/pd-phase-03-1-recipe-imagery.md`: records the slice and marks the Slop Bowl pantry-check visual drift fixed.
- `docs/handoffs/2026-05-14-codex-phase-3-1-slop-pantry-align.md`: records this handoff.

## Scope Boundaries

- Preserves Slop Bowl behavior: saved Pantry items can still be omitted from the current bowl and are not deleted from saved Pantry.
- Does not change Chef It Up Phase 3.2 behavior.
- Does not touch Planning card/whitespace grammar, Ticket Pass, Prep Tray, recipe generation, async imagery, or backend/API contracts.

## Validation

- `npx vitest run tests/unit/slop-bowl.test.tsx tests/unit/meal-planning.test.tsx`
- `npm run check`
- `npm run build`
- `git diff --check`

## Open Items

- Replit/authenticated visual validation is not yet run for this branch.
- If this lands before PR #72's docs-only closeout, reconcile the INIT resume signal during merge closeout so the latest Phase 3.1 status is not split across open docs branches.
