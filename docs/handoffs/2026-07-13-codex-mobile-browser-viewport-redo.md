# Mobile Browser Viewport Redo

**Agent:** codex
**Branch:** codex/mobile-browser-viewport-redo
**Date:** 2026-07-13
**Initiative:** INIT-001
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary

This branch is the first narrow redo after PR #280 was closed. It treats PR #280 only as negative implementation evidence and starts from fresh `origin/main` `deaf17e`. The implementation is intentionally scoped to browser-viewport navigation/action-lane structure: Planning entry plus the first Chef It Up decision steps, with a follow-up Settings action-lane clearance fix after Wilson confirmed Settings feature/function changes remain out of scope but navigation pins may be corrected. It preserves Planning typography and avoids Setup, Slop Bowl, Live Cooking, provider, schema, and Replit setup changes.

Wilson's phone-browser review caught an implementation drift in the first pass: selecting one staple added the `Added` shelf, but the staples screen did not have a real scroll owner, so `View recipe suggestions` fell below the visible action lane. The correction keeps the larger Planning typography and fixes the structure instead: short steps get visible top content, a scrollable body, a pinned primary action lane, and a slightly shorter bottom nav with the same actions/order/visibility.

Wilson's later Settings Pantry screenshots caught the reference case for future pinned-navigation work: first the Settings inventory save row was sticky at `bottom: 0`, so the fixed app bottom nav covered it; the first offset then read as a floating translucent sheet above the nav. The final fix keeps Pantry/Tools/Profile order, save behavior, Back behavior, and Settings content unchanged while attaching the existing Settings action row directly above the compact app nav with an opaque footer-lane background.

## Changes

- `client/src/pages/app.tsx`
  - Adds a Planning-only `planning-browser-shell` wrapper for the authenticated Planning phase.
  - Adds scoped hooks to the Planning choice shell/header/stack.
  - Compacts the bottom-nav padding only; nav actions, order, auth visibility, and behavior stay unchanged.
- `client/src/components/cooking/meal-planning.tsx`
  - Adds scoped hooks to the time, cuisine, and staples steps.
  - Marks the time-step `Next` button as the bottom action lane without changing its label or behavior.
  - Wraps the staples `Added` shelf and candidate list in the same scroll-owner pattern used by cuisine.
- `client/src/index.css`
  - Adds Planning-only browser-flow sizing using `100svh` with `100vh` fallback and a bottom-nav reservation.
  - Keeps early Chef It Up step bodies as the scroll owner and makes the mobile primary continuation lane explicitly fixed directly above the compact app bottom nav.
  - Preserves Planning headline/body/card/ingredient-row type sizes rather than shrinking everything to fit one viewport.
  - Attaches the existing returning Settings sticky action row directly above the compact app bottom nav with an opaque background, without changing Settings flow or save/back behavior.
- `initiatives/INIT-001-mobile-refresh.md`
  - Records PR #280 as closed negative evidence, the first-pass selected-staples drift, and the corrected narrow redo slice.

## Impact on other agents

- Do not copy PR #280 implementation code into future viewport work.
- The accepted principles are still tracked in open docs-only PR #282 / branch `codex/mobile-browser-ux-principles`; this branch used that handoff as input but did not stack on it.
- Future slices should keep using scoped wrappers/shared primitives before global CSS. Setup remains intentionally untouched here. For non-Planning pages, Settings is now the reference pattern: page-level sticky action lanes must reserve the app-bottom-nav space instead of sharing `bottom: 0` with the nav.
- Real phone-browser review should include dynamic states such as one or several selected staples, not only empty/default screens.

## Open items

- Actual phone-browser visual validation is still required before merge. Desktop/headless mobile viewport smoke is functional/layout evidence only.
- PR #282 is still open as of this handoff. If it merges first, rebase this branch and keep the docs language de-duplicated.

## Verification

- `npm ci` passed.
- `npx vitest run tests/unit/meal-planning.test.tsx tests/unit/planning-choice.test.tsx` passed: 57 tests.
- `npm run check` passed.
- `npm run build` passed with existing Browserslist staleness, Firebase dynamic/static import, and large chunk warnings.
- `git diff --check` passed.
- Initial DB-free Chromium geometry smoke at 390x700 passed, but it missed the selected-staples state and was not representative of the phone-browser visible height.
- Corrective DB-free Chromium geometry smoke against built CSS passed at 402x534:
  - Planning choice: body scroll tail `0`; primary card bottom `329`; compact bottom nav top `469`; nav tap target `48px`; choice scroll delta `57`.
  - Time step: body scroll tail `0`; `Next` bottom `460`; compact bottom nav top `469`; nav tap target `48px`; time scroll delta `82`.
  - Cuisine step: body scroll tail `0`; action lane bottom `460`; compact bottom nav top `469`; nav tap target `48px`; cuisine list scroll delta `703`.
  - Staples empty / one selected / three selected: body scroll tail `0`; action lane bottom `460`; compact bottom nav top `469`; nav tap target `48px`; list scroll deltas `301` / `412` / `458`.
- Final action-lane geometry smoke against built CSS passed at 402x534:
  - Settings action row bottom `469px`, compact bottom nav top `469px`, gap `0`, opaque footer-lane background, `Settings` then `Save pantry changes`, each `48px` tall.
  - Planning time action bottom `469px`, compact bottom nav top `469px`, gap `0`, computed action position `fixed`, body scroll tail `0`.
  - Planning cuisine/staples action lane bottom `469px`, compact bottom nav top `469px`, gap `0`, computed action position `fixed`, list scroll delta present, body scroll tail `0`.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `deaf17e`
- Last Replit-validated at: not yet validated
- Notes: started from fresh `origin/main`; no PR #280 implementation commits were reused.
