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

- Git provenance: `git fetch origin` confirmed branch head `aa7ba84` contains latest fetched `origin/main` `23e4cfd` (`git merge-base --is-ancestor origin/main HEAD` passed).
- `npm ci` — passed; installed dependencies into this worktree after the first Vitest attempt found missing packages.
- `npx vitest run tests/unit/planning-choice.test.tsx` — passed, 1 file / 19 tests.
- `npm run check` — passed.
- `npm run build` — passed with existing Browserslist, Firebase dynamic/static import chunk, and large bundle warnings.
- `git diff --check` — passed.
- Local in-app browser check was attempted at `http://127.0.0.1:3000` with a mobile viewport, but this worktree could not decrypt `.env` because `.env.keys` is not linked. The app loaded the Vite runtime overlay with `Firebase: Error (auth/invalid-api-key)`, so no browser visual claim is made from this local run.
- After linking `.env.keys` per the worktree setup rule, `PORT=3000 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx @dotenvx/dotenvx run -- npm run db:health` — failed against the local configured database. Missing tables: `ai_interactions`, `prompt_versions`, `anonymous_recipe_usage`; missing column: `cooking_sessions.recipe_snapshot`.
- `PORT=3000 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx @dotenvx/dotenvx run -- npm run test:e2e` — failed, 7 Chromium tests run: 1 passed, 4 failed, 2 skipped. The failed guest tests reached the landing page, clicked `Start cooking now`, and then timed out waiting for setup `Get started`; web server logs show `/api/auth/session` failing because relation `anonymous_recipe_usage` does not exist. This is recorded as local schema drift blocking service-backed E2E, not evidence of a bottom-nav shortcut regression.
- GitHub Actions `e2e_guest_smoke` — passed on branch head `aa7ba84` in job `80227147011` / run `27176727230`. Step evidence: Preflight Secrets, Create Neon Branch (schema-only), DB Push (apply schema), DB Schema Health, E2E (guest + linked dev-auth smoke), and Delete Neon Branch all completed successfully. Claim: the remote non-production ephemeral Neon lane exercised the current schema plus guest smoke for this exact head; negative scope remains live provider quality, real Google popup completion, Replit deployment behavior, and Replit human validation.

## Deferrals

- No existing menu contents were redesigned.
- No guest promotion/linking logic changed.
- Signup-continuation risk check: considered for this PR. The branch removes the guest-only bottom-nav shortcut but does not change quota walls, signup-required route guards, Google/custom-token linking handlers, guest data preservation, or resume-after-link behavior. Existing CI covers guest blocks and linked destination state separately; the continuous guest-blocked -> sign-up/link -> continue journey remains an optional EFF-017 validation lane for future changes that alter those surfaces.
- Replit validation is not yet refreshed for this branch.
- Local dotenvx-backed E2E remains blocked against the decrypted worktree `.env` database until that database has the schema expected by latest `origin/main`; use the GitHub ephemeral Neon lane as the merge-gate E2E evidence unless a local `DATABASE_URL` is explicitly pointed at an equivalent prepared non-production test database.
