# Remove Guest Bottom-Nav Shortcut

**Agent:** codex
**Branch:** `codex/remove-guest-bottom-nav-menu`
**Date:** 2026-06-09
**Initiative:** INIT-003
**INIT updated:** yes

## Summary

Wilson rejected the guest-only bottom-nav promotion shortcut as an unapproved durable navigation addition. This branch removes that one-function `Save progress` icon from the guest bottom nav while preserving the existing app menu and planning reminder paths for guest sign-up.

## Changes

- `client/src/pages/app.tsx`
  - Removes the guest-only bottom-nav `Save progress` / `UserPlus` button.
  - Leaves the existing bottom-nav app menu button in place so guests can still open Settings, Feedback, Sign up, and Start over from the menu surface.
- `tests/unit/planning-choice.test.tsx`
  - Adds a regression that guest promotion is not exposed as a bottom-nav `Save progress` shortcut while remaining available in the menu.
- `product-decisions/pd-012-public-anonymous-trial-and-account-upgrade.md`
  - Records Wilson's 2026-06-09 correction and the durable rule that guest promotion should not appear as a bottom-nav shortcut without explicit approval.
- `initiatives/INIT-003-anonymous-trial-and-account-upgrade.md`
  - Updates Phase 4 status with the follow-up correction.

## Validation

- Git provenance: `git fetch origin` confirmed `HEAD` `ccf3c8f` contains latest fetched `origin/main` `23e4cfd` (`git merge-base --is-ancestor origin/main HEAD` passed).
- `npm ci` — passed; installed dependencies into this worktree after the first Vitest attempt found missing packages.
- `npx vitest run tests/unit/planning-choice.test.tsx` — passed, 1 file / 19 tests.
- `npm run check` — passed.
- `npm run build` — passed with existing Browserslist, Firebase dynamic/static import chunk, and large bundle warnings.
- `git diff --check` — passed.
- Local in-app browser check was attempted at `http://127.0.0.1:3000` with a mobile viewport, but this worktree could not decrypt `.env` because `.env.keys` is not linked. The app loaded the Vite runtime overlay with `Firebase: Error (auth/invalid-api-key)`, so no browser visual claim is made from this local run.
- After linking `.env.keys` per the worktree setup rule, `PORT=3000 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx @dotenvx/dotenvx run -- npm run db:health` — failed against the local configured database. Missing tables: `ai_interactions`, `prompt_versions`, `anonymous_recipe_usage`; missing column: `cooking_sessions.recipe_snapshot`.
- `PORT=3000 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx @dotenvx/dotenvx run -- npm run test:e2e` — failed, 7 Chromium tests run: 1 passed, 4 failed, 2 skipped. The failed guest tests reached the landing page, clicked `Start cooking now`, and then timed out waiting for setup `Get started`; web server logs show `/api/auth/session` failing because relation `anonymous_recipe_usage` does not exist. This is recorded as local schema drift blocking service-backed E2E, not evidence of a bottom-nav shortcut regression.

## Deferrals

- No existing menu contents were redesigned.
- No guest promotion/linking logic changed.
- Replit validation is not yet refreshed for this branch.
- Local service-backed E2E remains blocked until the validation database has the schema expected by latest `origin/main`.
