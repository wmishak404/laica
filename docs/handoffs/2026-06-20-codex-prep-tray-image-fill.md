# Prep Tray Image Fill

**Agent:** codex
**Branch:** `codex/prep-tray-image-fill`
**Date:** 2026-06-20
**Initiative:** INIT-001
**INIT updated:** yes

## Summary

This branch handles the narrow INIT-001 Phase 3.1 Prep Tray image-area alignment slice: approved selected-recipe images now fill the whole upper Prep Tray hero panel above the recipe details instead of rendering as a smaller centered thumbnail. The change keeps the PR #192 selected-image runtime intact: Ticket Pass stays placeholder-only, Prep Tray resolves only the selected image, and cooking remains non-blocking while imagery is pending.

## Changes

- `client/src/components/cooking/meal-planning.tsx`: adds a `data-image-state` hook to `.planning-prep-hero` so the ready image state can be styled separately from pending/placeholder states.
- `client/src/index.css`: stretches only the ready Prep Tray image slot to the full hero panel, keeps `object-fit: cover`, and preserves the centered placeholder/spinner treatment for pending and unavailable imagery.
- `tests/e2e/cooking-workflow.test.ts`: extends the selected-image Playwright smoke to assert the ready Prep Tray image slot matches the hero bounds.
- `initiatives/INIT-001-mobile-refresh.md`: records `codex/prep-tray-image-fill` as the active branch and updates the Phase 3.1 resume point.
- `product-decisions/features/mobile-refresh/pd-phase-03-1-recipe-imagery.md`: records the implementation slice and marks the specific “Prep Tray selected image underuses the hero box” drift as implemented pending merge.

## Impact on other agents

This is visual/layout scope only. Do not infer provider, prompt, schema, Ticket Pass, navigation, cooking, or ingredient-chip changes from this branch. Pending/placeholder Prep Tray states intentionally remain centered; only the `ready` selected-image state becomes full-hero.

PD-005 / `design_guidelines.md` interaction: conforms. The existing Prep Tray tone-forward comment remains in the component, no token-equivalent hex classes or shadcn primitive overrides were added, and the new Playwright assertion checks rendered geometry rather than class names alone.

## Open items

- Replit or CI Playwright should still exercise the new geometry assertion in an environment with a current schema. Local Playwright did not reach the changed code because the decrypted local DB is missing `anonymous_recipe_usage`.
- Full PR merge readiness still needs the branch rebased onto current `origin/main`, then ready-for-review CI. The primary Replit visual ask passed before that rebase.

## Verification

Passed locally:

- `npm ci`
- `npx vitest run tests/unit/meal-planning.test.tsx` — 24 tests passed
- `npm run check`
- `npm run build`
- `git diff --check`
- Database-free rendered-CSS Chromium geometry check against built CSS — ready Prep Tray hero and image slot both measured `390 x 152` with `object-fit: cover`
- Wilson Replit visual smoke on 2026-06-21 at `fb14852bc50a7028a011d24b9135109e0bc0f151` accepted the primary ask: the ready selected recipe image occupies the full upper Prep Tray panel above the details, with readable recipe details and CTA below.

Attempted but not claimed:

- `CI=true PORT=5012 PLAYWRIGHT_BASE_URL=http://127.0.0.1:5012 npm run env:run -- npx playwright test tests/e2e/cooking-workflow.test.ts --project=chromium -g "selected recipe preview imagery"`
- First sandboxed attempt failed before app startup because `tsx` could not create its IPC socket.
- Escalated rerun started the app but failed before image assertions because the decrypted local DB lacks `anonymous_recipe_usage`; guest setup timed out waiting for `Get started`. Per EFF-010, no shared local DB schema push was run from this worktree.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `1148533fe42b52da266bd09b4772ed0e76743638`
- Last Replit-validated at: `fb14852bc50a7028a011d24b9135109e0bc0f151` for the primary visual ask
- Notes: branch starts from `origin/main`; no lower-stack branch dependency. `origin/main` advanced after this validation, so exact-head merge readiness still needs a rebase and CI. If the rebase is docs-only/runtime-identical for this surface, use the validation as targeted visual signal rather than broad release validation.
