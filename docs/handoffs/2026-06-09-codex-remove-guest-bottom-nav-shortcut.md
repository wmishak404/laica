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

- `npm ci` — passed; installed dependencies into this worktree after the first Vitest attempt found missing packages.
- `npx vitest run tests/unit/planning-choice.test.tsx` — passed, 1 file / 19 tests.
- `npm run check` — passed.
- `npm run build` — passed with existing Browserslist, Firebase dynamic/static import chunk, and large bundle warnings.
- `git diff --check` — passed.
- Local in-app browser check was attempted at `http://127.0.0.1:3000` with a mobile viewport, but this worktree could not decrypt `.env` because `.env.keys` is not linked. The app loaded the Vite runtime overlay with `Firebase: Error (auth/invalid-api-key)`, so no browser visual claim is made from this local run.

## Deferrals

- No existing menu contents were redesigned.
- No guest promotion/linking logic changed.
- Replit validation is not yet refreshed for this branch.
