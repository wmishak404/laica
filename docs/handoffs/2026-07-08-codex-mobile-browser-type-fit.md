# Mobile Browser Type Fit

**Agent:** codex
**Branch:** codex/mobile-browser-type-fit
**Date:** 2026-07-08
**Initiative:** INIT-001
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary
Wilson's mobile browser screenshots showed that Chef It Up setup, recipe suggestions, Prep Tray, and Slop Bowl menus can overfill the visible Chrome/Safari viewport even though the accepted Ticket Pass, Prep Tray, and Slop Bowl proportions still feel right. After an initial Replit load looked too subtle on-device, this branch adds a stronger short-mobile-browser pass: it uses `svh` sizing, compacts the time-selection and setup scanner screens, and preserves the explicit exclusions for Live Cooking preparing/active surfaces and Menu drawer typography.

## Changes
- `client/src/components/cooking/meal-planning.tsx`: adds a `meal-planning-screen` wrapper class to Chef It Up time, cuisine, staples, Ticket Pass, and Prep Tray sections so browser-fit type overrides stay out of the Planning choice shell, the Menu drawer, and public landing/demo ticket surfaces. The time screen also has `planning-time-screen` / `planning-time-content` hooks and resets browser scroll on step changes so the Next button is visible before scrolling in short mobile browser viewports.
- `client/src/components/cooking/user-profiling.tsx`: adds a `setup-scan-step` hook and resets browser/frame scroll on setup step changes so the pantry/tool setup scanner does not reopen chopped at the top.
- `client/src/components/cooking/slop-bowl.tsx`: adds Slop Bowl-specific `slop-bowl-screen` and `slop-bowl-menu-screen` hooks for its menu-like pantry-check, result, and feedback surfaces.
- `client/src/index.css`: adds MealPlanning-scoped font-size/line-height reductions for process headings, Ticket Pass titles/meta/chips/optional text, and Prep Tray body copy. It also adds Slop Bowl menu-scoped heading/copy/chip reductions, `svh` sizing for affected browser-fit roots, a short-viewport compact time-selector layout, and a compact setup scanner layout. The change avoids pulling accepted Menu drawer and Live Cooking surfaces into this pass.
- `tests/unit/slop-bowl.test.tsx`: asserts Slop Bowl pantry-check renders under the new scoped wrappers.
- `tests/unit/meal-planning.test.tsx`: asserts the time screen renders with the browser-fit scope hooks.
- `tests/unit/user-profiling.test.tsx`: asserts the setup pantry scanner renders with the browser-fit scope hook.
- `product-decisions/features/mobile-refresh/pd-phase-03-1-recipe-imagery.md`: records Wilson's type-fit direction, Slop Bowl inclusion, Live Cooking/Menu drawer guardrails, and a new drift row for mobile browser viewport overfill.
- `initiatives/INIT-001-mobile-refresh.md`: records the active branch and resume-point signal under Phase 3.1.

## Impact on other agents
Treat `.meal-planning-screen` as the scoped hook for Chef It Up/Ticket/Prep browser-fit typography, `.planning-time-screen` as the compact time-selector hook, `.setup-scan-step` as the setup scanner hook, and `.slop-bowl-menu-screen` as the scoped hook for Slop Bowl menu typography. Do not move these overrides back onto shared `.planning-screen`; that would risk pulling in surfaces Wilson explicitly said look okay. Keep `.menu-sheet` and `live-cooking-ui` out of this browser-fit pass unless Wilson reopens those surfaces.

## Open items
Replit was loaded with the first pass at `80f1712`, but Wilson reported the visible app still looked unchanged. The stronger second pass was then pushed and loaded on Replit at runtime head `f15cab7`; the served `.replit.dev` CSS contains `planning-time-screen`, `setup-scan-step`, `100svh`, and `slop-bowl-menu-screen`. A phone-browser skim remains the useful human visual check. Target the exact reported surfaces: Chef It Up time selection should show the Next button before scrolling, the setup pantry scanner title should not reopen chopped, and Ticket Pass / Prep Tray / Slop Bowl menu typography should visibly compact. Live Cooking preparing/active and the Menu drawer should remain unchanged.

## Verification
- `npm ci` passed; 1113 packages installed, 0 vulnerabilities reported.
- `npx vitest run tests/unit/slop-bowl.test.tsx tests/unit/meal-planning.test.tsx` passed after the PR #269/#273 rebase: 2 files, 29 tests.
- `npx vitest run tests/unit/slop-bowl.test.tsx tests/unit/meal-planning.test.tsx tests/unit/user-profiling.test.tsx` passed after the stronger short-browser pass: 3 files, 46 tests.
- `npm run check` passed: TypeScript plus UI lint.
- `npm run build` passed. Vite reported the existing Browserslist age warning, dynamic/static Firebase import warning, and large chunk warning.
- `git diff --check` passed.
- Built-CSS computed-style smoke passed in local headless Chromium after sandbox escalation. Observed values: MealPlanning display `25.28px`, MealPlanning selected-ticket title `20.48px`, use chip `11.2px`, Prep Tray copy `13.12px`; Slop Bowl display `24px`, Slop Bowl copy `13.12px`, Slop Bowl chip `12.16px`; Menu title stayed `30px`, menu destination text stayed `16px`, landing demo ticket title stayed `22.08px`, and Live Cooking stayed under its own `live-cooking-ui` styles.
- Replit fast-forwarded `codex/mobile-browser-type-fit` to `f15cab7` after Wilson reported the first pass was too subtle. The direct `.replit.dev` app served the stronger CSS hooks (`planning-time-screen`, `setup-scan-step`, `100svh`, `slop-bowl-menu-screen`). The open direct tab was on Live Cooking state, which is intentionally excluded from this browser-fit pass.

## Stack / base status
- Base refreshed: yes
- Current base: `origin/main` at `9618a15cce82e6b8444e1f471a2b55905c07e633`
- Last Replit-validated at: runtime code loaded at `f15cab7`; human phone-browser visual acceptance still pending
- Notes: independent Phase 3.1 browser-fit polish branch rebased after PR #269 and the PR #273 closeout merged; not stacked on another open branch.
