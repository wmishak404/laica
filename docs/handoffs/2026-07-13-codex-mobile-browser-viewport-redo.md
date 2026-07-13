# Mobile Browser Viewport Redo

**Agent:** codex
**Branch:** codex/mobile-browser-viewport-redo
**Date:** 2026-07-13
**Initiative:** INIT-001
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary

This branch is the first narrow redo after PR #280 was closed. It treats PR #280 only as negative implementation evidence and starts from fresh `origin/main` `deaf17e`. The implementation is intentionally scoped to Planning entry plus the first Chef It Up decision steps, preserving Planning typography and avoiding Setup, Settings, Slop Bowl, Live Cooking, navigation, provider, schema, and Replit setup changes.

## Changes

- `client/src/pages/app.tsx`
  - Adds a Planning-only `planning-browser-shell` wrapper for the authenticated Planning phase.
  - Adds scoped hooks to the Planning choice shell/header/stack.
- `client/src/components/cooking/meal-planning.tsx`
  - Adds scoped hooks to the time, cuisine, and staples steps.
  - Marks the time-step `Next` button as the bottom action lane without changing its label, size, or behavior.
- `client/src/index.css`
  - Adds Planning-only browser-flow sizing using `100svh` with `100vh` fallback and a bottom-nav reservation.
  - Keeps the cuisine/staples list as the single scroll owner with the primary continuation in the page's bottom action lane.
  - Adds a short-height mobile rule that tightens decorative Planning spacing and the time-step clock, not the semantic heading/body/action type.
- `initiatives/INIT-001-mobile-refresh.md`
  - Records PR #280 as closed negative evidence and this branch as the narrow redo slice.

## Impact on other agents

- Do not copy PR #280 implementation code into future viewport work.
- The accepted principles are still tracked in open docs-only PR #282 / branch `codex/mobile-browser-ux-principles`; this branch used that handoff as input but did not stack on it.
- Future slices should keep using scoped wrappers/shared primitives before global CSS. Setup remains intentionally untouched here.

## Open items

- Actual phone-browser visual validation is still required before merge. Desktop/headless mobile viewport smoke is functional/layout evidence only.
- PR #282 is still open as of this handoff. If it merges first, rebase this branch and keep the docs language de-duplicated.

## Verification

- `npm ci` passed.
- `npx vitest run tests/unit/meal-planning.test.tsx tests/unit/planning-choice.test.tsx` passed: 57 tests.
- `npm run check` passed.
- `npm run build` passed with existing Browserslist staleness, Firebase dynamic/static import, and large chunk warnings.
- `git diff --check` passed.
- DB-free Chromium geometry smoke against the built CSS passed at 390x700:
  - Planning choice: body scroll tail `0`; primary card bottom `366`; secondary card bottom `536`; bottom nav top `603`.
  - Time step: body scroll tail `0`; `Next` bottom `594`; bottom nav top `603`.
  - Cuisine step: body scroll tail `0`; action lane bottom `594`; bottom nav top `603`; cuisine list scroll delta `549`, making the list the scroll owner.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `deaf17e`
- Last Replit-validated at: not yet validated
- Notes: started from fresh `origin/main`; no PR #280 implementation commits were reused.
