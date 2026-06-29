# INIT-001 Ingredient Chip Unification

**Agent:** codex
**Branch:** `codex/init-001-ingredient-chip-unification`
**Date:** 2026-06-24
**Initiative:** INIT-001
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary

This slice makes recipe ingredient chips read as the same kind of saved pantry facts users already see in setup, Settings, Chef It Up staples, and Slop Bowl. Ticket Pass `Uses` chips and Prep Tray `Use these` chips now use green checked pantry-fact styling, while optional extras stay visually separate so the user can tell what Laica knows is already in their kitchen.

## Architecture Triage

- INIT-004 Phase 3 remains the highest eval-system leverage lane, but open PR #232 (`codex/init-004-eval-summary`) is already non-draft, green, and explicitly waiting on Wilson's merge decision. This run treated it as active/owned and did not rebase, edit, comment, or merge it.
- INIT-002 remains in Phase 2 Replit observation. Phase 3 DB persistence is still blocked until observation records classifier gaps and field-nullability decisions.
- INIT-003 later guest cook/History import remains waiting on INIT-001 Phase 5 semantics.
- INIT-001 Phase 3.1 still had a documented, unowned, bounded ingredient-chip consistency milestone after PR #208. It is independent of PR #232 and avoids provider, schema, prompt, navigation, and Replit-side decisions.

Decision: selected INIT-001 ingredient-chip unification as the smallest ready implementation milestone with clear product value and low architectural risk.

## Changes

- `client/src/components/cooking/meal-planning.tsx`
  - Adds a shared local renderer for checked pantry-fact chips.
  - Uses it for Ticket Pass `Uses` chips and Prep Tray `Use these` chips.
  - Leaves optional extras on their existing optional styling.
- `client/src/index.css`
  - Gives `.planning-use-chip` its own checked pantry-fact chip shape, border, color, font weight, icon handling, and overflow-safe text.
- `tests/unit/meal-planning.test.tsx`
  - Adds focused coverage that known ingredients render as checked pantry-fact chips in Ticket Pass and Prep Tray.
  - Asserts optional extras do not receive the checked pantry-fact icon.
- `initiatives/INIT-001-mobile-refresh.md`
  - Records the branch, scope, validation signal, and updated Phase 3.1 resume point.
- `initiatives/registry.md`
  - Records the latest INIT-001 branch signal.
- `product-decisions/features/mobile-refresh/pd-phase-03-1-recipe-imagery.md`
  - Records the implementation slice and updates the drift row from deferred to implemented-in-branch.

## Impact on other agents

Future Phase 3.1 visual work should treat checked green chips as the grammar for known saved/detected pantry facts across Ticket Pass and Prep Tray. Optional extras, pending/removable additions, and Slop Bowl omit-from-this-bowl behavior stay distinct.

This branch conforms to PD-005 and `design_guidelines.md`: it uses tokenized planning colors, `lucide-react` icons, no new navigation, no hex-literal styling, and no shadcn Button override.

## Open items

- Open a PR and run exact-head GitHub checks, including `unit`, `e2e_guest_smoke`, audit, secret scan, and CodeQL.
- Wilson owns the explicit merge decision because this is UI/runtime code.
- Replit validation is not required before merge unless Wilson wants a visual smoke; this is a narrow existing-surface styling change with focused automated coverage and no provider/auth/schema/deployment change.

## Verification

- Initial focused `npx vitest run tests/unit/meal-planning.test.tsx` failed before tests because dependencies were missing in the worktree (`vitest/config` and `@vitejs/plugin-react` unresolved).
- `npm ci` passed and installed dependencies from the lockfile; npm reported 0 vulnerabilities.
- `npx vitest run tests/unit/meal-planning.test.tsx` passed: 25 tests.
- `npm run test:unit` passed: 44 files / 316 tests.
- `npm run check` passed (`tsc` plus UI lint).
- `npm audit --audit-level=high` passed with 0 vulnerabilities.
- `npm run build` passed with existing Browserslist/Firebase dynamic-import/chunk-size warnings.
- `git diff --check` passed.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `0c94f76ab69ded678fd4cfff067f97e458bd80ac`
- Last Replit-validated at: not yet validated; not expected for this narrow existing-surface chip styling slice unless Wilson requests visual smoke
- Notes: not stacked on another branch. Open PR #232 was skipped as active/owned INIT-004 work.
