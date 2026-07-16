# Toast Swipe Directions

**Agent:** codex
**Branch:** `codex/toast-swipe-directions`
**PR:** #293, merged at `d7aadd2764abb5e6ba36a77c491e40241ba35211`
**Date:** 2026-07-15
**Initiative:** none
**INIT updated:** no
**Effort:** none

## Summary

This branch resolves the shared toast dismissal follow-up Wilson resurfaced from mobile use: toasts can now dismiss by swiping left, up, or right, while downward swipes remain ignored. The change lives in the shared toast primitive so Pantry, setup, Planning, Slop Bowl, and other toast callsites inherit the behavior without one-off gesture logic.

The follow-up was not an active Effort. Provenance is `docs/handoffs/2026-04-30-codex-phase-2-1-test-results-followup.md`, which listed "toast left/up swipe dismissal" as a non-gating shared toast primitive follow-up. `efforts/README.md` active read list did not include a toast-dismissal Effort.

## Changes

- `client/src/components/ui/toast.tsx`
  - Keeps Radix's existing right-swipe dismissal path.
  - Adds shared pointer tracking for left and up swipes because Radix Toast supports only one `swipeDirection` per provider.
  - Preserves the same 50px dismissal threshold as Radix.
  - Ignores downward swipes and cancels short left/up drags.
  - Adds Y-axis Radix swipe CSS variable classes so upward gestures get the same move/end styling path as horizontal gestures.
  - Sets Tailwind exit-animation translate variables for left/up dismissals so the closed-state animation exits in the swipe direction instead of falling back to the default right-side exit.
- `tests/unit/toast.test.tsx`
  - Adds jsdom regression coverage for left, up, right, and down swipe behavior, including left/up exit-animation direction.

## Impact on other agents

Future toast behavior work should stay in `client/src/components/ui/toast.tsx` unless a specific callsite needs distinct copy, action, or duration. Do not create a new Effort for this exact swipe-direction issue unless validation finds remaining standalone follow-up.

The encrypted `.env` file was already locally modified before this branch and was intentionally left unstaged and untouched.

## Open items

- Wilson confirmed a mobile browser spot check on 2026-07-16 before merge, but the exact viewport/device preset was not captured. Treat that as supplemental product-feel evidence, not a formal viewport-recorded Replit validation gate.
- `docs/production-validation-registry.md` now carries PR #293 as a focused production-readiness regression item: trigger a toast on mobile, verify right/left/up dismissal, verify direction-matched exit animation, verify down swipe does not dismiss, and record the browser or device preset.

## Verification

Local checks on `codex/toast-swipe-directions`:

- `npx vitest run tests/unit/toast.test.tsx` passed: 1 file / 4 tests.
- `npm run check` passed (`tsc` and UI lint).
- `npm run build` passed with existing warnings: stale Browserslist data, mixed Firebase dynamic/static import for `client/src/lib/firebase.ts`, and large client chunk size.
- `git diff --check` passed.

Coverage reasoning:

- The focused unit test proves the shared primitive calls `onOpenChange(false)` for left, up, and right swipe gestures, sets left/up closed-state exit direction variables, and does not call dismissal for down swipes.
- Static and build checks prove the shared client primitive remains type-safe, lint-clean, and production-buildable.
- Wilson's mobile browser spot check provides supplemental touch-feel signal for the shared behavior.
- This does not prove every toast callsite's copy/action behavior or replace the formal production-readiness regression, which should still record the mobile browser or device preset used.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `05774085e0bc39c2cebdffd2185ab5a0a86d1e2d`
- Last Replit-validated at: not required / not run; Wilson mobile browser spot check confirmed on 2026-07-16 with viewport/device not recorded
- Notes: branch was created fresh from `origin/main`; no active INIT or Effort ownership conflict was found.
