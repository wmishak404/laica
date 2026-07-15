# EFF-028 Chef It Up Time Title And Prep Tray Fit

**Agent:** codex
**Branch:** `codex/eff-028-time-title-prep-tray`
**Date:** 2026-07-15
**Initiative:** INIT-001
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary

EFF-028 is implemented but not merged. The branch keeps the post-PR #291 setup/mobile-browser baseline intact while addressing only two adjacent Chef It Up visual-fit issues: the narrow-mobile time-selection title now clears the floating Back button through horizontal inset rather than moving the whole page downward, and the mobile Prep Tray ready selected image fills the hero area like the accepted desktop/PR #208 behavior.

The branch started from fresh `origin/main` at `05774085e0bc39c2cebdffd2185ab5a0a86d1e2d`. Before editing, Codex verified that PR #291 merged as `766d910b128f84213d2a79a8077100d3df4272d8` and docs closeout PR #292 merged as `05774085e0bc39c2cebdffd2185ab5a0a86d1e2d`.

## Changes

- `client/src/components/cooking/meal-planning.tsx`: adds a `.planning-process-heading` wrapper to the Chef It Up time, cuisine, and staple process headings so shared heading fit can be adjusted without changing behavior.
- `client/src/index.css`: adds short-mobile heading width/inset rules, applies the time-screen-only horizontal offset, removes ready-state Prep Tray hero padding on short mobile, and forces the ready Prep Tray image slot to fill the hero box with `height: 100%`, `min-height: 0`, and `object-fit: cover`.
- `tests/e2e/cooking-workflow.test.ts`: adds a range-based heading/back-button geometry assertion and runs the selected-image Prep Tray path at `320x740` so the EFF-028 title and ready-image geometry stays covered by the guest E2E lane once CI runs against a prepared schema.
- `efforts/effort-028-chef-it-up-time-title-clearance.md`, `efforts/README.md`, `efforts/registry.md`, and `initiatives/INIT-001-mobile-refresh.md`: record the active implementation branch, evidence, negative scope, and pending exact-head E2E gate.

## Impact on other agents

Do not start EFF-029 from this thread unless Wilson explicitly expands scope. The serial queue is: finish or block EFF-028 first, then hand off or create the next EFF-029 thread with the current merge facts and validation status.

This branch intentionally does not change providers, schema, prompts, durable navigation, Ticket Pass behavior, Ready Check behavior, Live Cooking behavior, image generation, image cache policy, or recipe routes. Pending/placeholder Prep Tray image states keep their centered slot sizing; only `data-image-state='ready'` on short mobile gets the full-bleed image-slot correction.

## Open items

- Push the branch and open the draft PR.
- Run or monitor exact-head GitHub `e2e_guest_smoke` after the branch is pushed. Local DB-backed E2E is not claimed because the decrypted local database failed schema health.
- Human Replit validation was not run in this thread. If requested, use Chrome mobile viewport/device toolbar, do not use Replit Agent, and check the time title, adjacent Chef It Up headings, and Prep Tray ready image.
- EFF-029 and EFF-030 remain unstarted here.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `05774085e0bc39c2cebdffd2185ab5a0a86d1e2d`
- Last Replit-validated at: not yet validated
- Notes: PR #291 (`766d910b128f84213d2a79a8077100d3df4272d8`) and PR #292 (`05774085e0bc39c2cebdffd2185ab5a0a86d1e2d`) were verified on `origin/main` before branch work began.

## Verification

Passed locally:

- `npm ci`
- `npm run setup:worktree`
- `npx vitest run tests/unit/meal-planning.test.tsx --testTimeout=15000` — 27 tests passed.
- `npm run test:unit` — 49 files / 382 tests passed.
- `npm run check`
- `npm run build` — passed with existing Browserslist, Firebase mixed import, and chunk-size warnings.
- `git diff --check`
- Headless Chromium compiled-CSS geometry at `320x740`: time heading text starts at `54.859375px`, Back button ends at `44px`; mobile Prep Tray ready slot equals hero box at `320 x 132.796875` with zero geometry delta and `object-fit: cover`. Screenshot saved at `/tmp/laica-eff028-compiled-css-mobile.png`.
- Headless Chromium compiled-CSS geometry at `900x800`: desktop Prep Tray ready slot equals hero box at `900 x 152` with zero geometry delta and `object-fit: cover`.

Not claimed:

- `npm run env:run -- npm run db:health` failed read-only schema health against the local decrypted database: missing tables `ai_interactions`, `prompt_versions`, `anonymous_recipe_usage`, `recipe_image_cache`, and missing column `cooking_sessions.recipe_snapshot`. Per the testing workflow, Codex did not run `db:push` against that database.
- A prior local DB-backed Playwright attempt did not reach the EFF-028 UI assertions because the stale database rejected startup/guest setup with missing `anonymous_recipe_usage`.
