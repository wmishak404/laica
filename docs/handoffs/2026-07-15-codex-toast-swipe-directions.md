# Toast Swipe Directions

**Agent:** codex
**Branch:** `codex/toast-swipe-directions`
**PR:** not opened
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
- `tests/unit/toast.test.tsx`
  - Adds jsdom regression coverage for left, up, right, and down swipe behavior.

## Impact on other agents

Future toast behavior work should stay in `client/src/components/ui/toast.tsx` unless a specific callsite needs distinct copy, action, or duration. Do not create a new Effort for this exact swipe-direction issue unless validation finds remaining standalone follow-up.

The encrypted `.env` file was already locally modified before this branch and was intentionally left unstaged and untouched.

## Open items

- Human Replit/mobile browser validation was not run. For this low-risk shared UI primitive change, local unit coverage plus type/lint/build evidence should be sufficient for code review; a reviewer can still spot-check the Pantry destructive toast on mobile if desired.
- No PR has been opened yet.

## Verification

Local checks on `codex/toast-swipe-directions`:

- `npx vitest run tests/unit/toast.test.tsx` passed: 1 file / 4 tests.
- `npm run check` passed (`tsc` and UI lint).
- `npm run build` passed with existing warnings: stale Browserslist data, mixed Firebase dynamic/static import for `client/src/lib/firebase.ts`, and large client chunk size.
- `git diff --check` passed.

Coverage reasoning:

- The focused unit test proves the shared primitive calls `onOpenChange(false)` for left, up, and right swipe gestures, and does not call it for down swipes.
- Static and build checks prove the shared client primitive remains type-safe, lint-clean, and production-buildable.
- This does not prove real-device touch feel, animation polish in mobile Chrome, or every toast callsite's copy/action behavior.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `05774085e0bc39c2cebdffd2185ab5a0a86d1e2d`
- Last Replit-validated at: not required / not run
- Notes: branch was created fresh from `origin/main`; no active INIT or Effort ownership conflict was found.
