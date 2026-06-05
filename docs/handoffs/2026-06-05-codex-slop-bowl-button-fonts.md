# Slop Bowl Button Typography Alignment

**Agent:** codex
**Branch:** codex/slop-bowl-button-fonts
**Date:** 2026-06-05
**Initiative:** INIT-001
**INIT updated:** no - this fixes a Phase 3.1 Planning visual-consistency bug without changing phase status, scope, assets, validation state, or resume point.

## Summary

Slop Bowl generated-suggestion actions were visually drifting from adjacent Chef It Up recipe-suggestion actions because the Slop Bowl approval/feedback states used plain shadcn button sizing/weight (`py-3 text-lg`) instead of the Planning button contract (`h-12 rounded-xl font-extrabold`). The branch aligns those generated-suggestion and retry buttons with Chef It Up's post-suggestion controls, puts the Slop Bowl surface under the same `.planning-screen` typography contract, and adds a focused regression test so the drift is visible in local coverage.

## Changes

- `client/src/components/cooking/slop-bowl.tsx`
  - Adds `.planning-screen` to the Slop Bowl root wrapper so headings, copy, and controls inherit the Planning typography contract consistently across pantry-check, generating, approval, and feedback states.
  - Updates the generated-suggestion action buttons (`Let's cook this!`, `Try something else`, `Plan your own meal instead`) to match Chef It Up's `h-12 w-full rounded-xl font-extrabold` grammar.
  - Updates feedback-regeneration buttons (`Recommend another bowl`, `Skip and just surprise me`) to the same grammar.
  - Adds Planning display/copy classes to Slop Bowl approval and feedback headings/copy, and aligns the loading message weight.
  - Adds `font-extrabold` to the small pantry-confirmation `Add` button, which was the only nearby Slop Bowl action still on default button weight.
- `tests/unit/slop-bowl.test.tsx`
  - Adds a generated-recipe regression test that enters the approval state and asserts the Slop Bowl approval and feedback buttons keep the Planning button class contract.

## Impact on other agents

This conforms to PD-005 and `design_guidelines.md`: no new token literals, no new Button variant, and no new visual direction. The implementation reuses the existing Planning wrapper/typography contract rather than adding a parallel Slop Bowl-specific style path.

Future Phase 3.1 Ticket Pass or Slop Bowl cleanup should keep comparing rendered/computed controls against adjacent Chef It Up Planning controls, not just visible copy.

## Open items

- Replit validation passed visually on the pre-rebase branch head `9d30177`. The branch was then rebased onto current `origin/main` at `b040952`, which is a docs-only EFF-017 closeout commit. Post-rebase local checks passed at `e760850`.
- Local in-app browser navigation to the real Planning surface was blocked by local DB schema drift: guest auth reached `/api/auth/session`, but the local Neon target was missing the `anonymous_recipe_usage` table. No local DB push was attempted.

## Verification

- Base refreshed: yes
- Current base: `origin/main` at `b040952` (`Record EFF-017 PR 138 closeout`)
- Last Replit-validated at: `9d30177` before the docs-only rebase; Wilson confirmed the Slop Bowl generated-result buttons visually match the adjacent Chef It Up suggestion buttons in Replit.
- Local checks:
  - `npm ci` - passed
  - `npx vitest run tests/unit/slop-bowl.test.tsx tests/unit/meal-planning.test.tsx` - passed, 2 files / 16 tests
  - `npm run check` - passed
  - `npm run build` - passed; Vite emitted existing Browserslist/chunk-size warnings
  - `git diff --check` - passed
- Post-rebase local checks at `e760850`:
  - `npx vitest run tests/unit/slop-bowl.test.tsx tests/unit/meal-planning.test.tsx` - passed, 2 files / 16 tests
  - `npm run check` - passed
  - `npm run build` - passed; Vite emitted existing Browserslist/chunk-size warnings
  - `git diff --check` - passed
- Browser evidence:
  - Local dev server booted with `PORT=3000 npx --yes @dotenvx/dotenvx run -- npm run dev`.
  - The in-app browser opened `http://127.0.0.1:3000`, but the guest path could not reach Planning because `/api/auth/session` failed on the missing local `anonymous_recipe_usage` relation.
  - Wilson's Replit screenshots after `PORT=3000 npm run dev` show the Slop Bowl approval buttons (`Let's cook this!`, `Try something else`, `Plan your own meal instead`) aligned with the Chef It Up ticket buttons (`View prep tray`, `Refresh suggestions`).
