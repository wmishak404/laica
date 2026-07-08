# Mobile Browser Type Fit

**Agent:** codex
**Branch:** codex/mobile-browser-type-fit
**Date:** 2026-07-08
**Initiative:** INIT-001
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary
Wilson's mobile browser screenshots showed that Chef It Up recipe suggestions, Prep Tray, and Slop Bowl menus can overfill the visible Chrome/Safari viewport even though the accepted Ticket Pass, Prep Tray, and Slop Bowl proportions still feel right. This branch keeps those proportions and shrinks scoped MealPlanning plus Slop Bowl menu typography, explicitly leaving Live Cooking preparing/active surfaces and Menu drawer typography unchanged.

## Changes
- `client/src/components/cooking/meal-planning.tsx`: adds a `meal-planning-screen` wrapper class to Chef It Up time, cuisine, staples, Ticket Pass, and Prep Tray sections so browser-fit type overrides stay out of the Planning choice shell, the Menu drawer, and public landing/demo ticket surfaces.
- `client/src/components/cooking/slop-bowl.tsx`: adds Slop Bowl-specific `slop-bowl-screen` and `slop-bowl-menu-screen` hooks for its menu-like pantry-check, result, and feedback surfaces.
- `client/src/index.css`: adds MealPlanning-scoped font-size/line-height reductions for process headings, Ticket Pass titles/meta/chips/optional text, and Prep Tray body copy. It also adds Slop Bowl menu-scoped heading/copy/chip reductions. The change avoids repositioning or changing accepted ticket/prep/Slop Bowl object proportions.
- `tests/unit/slop-bowl.test.tsx`: asserts Slop Bowl pantry-check renders under the new scoped wrappers.
- `product-decisions/features/mobile-refresh/pd-phase-03-1-recipe-imagery.md`: records Wilson's type-fit direction, Slop Bowl inclusion, Live Cooking/Menu drawer guardrails, and a new drift row for mobile browser viewport overfill.
- `initiatives/INIT-001-mobile-refresh.md`: records the active branch and resume-point signal under Phase 3.1.

## Impact on other agents
Treat `.meal-planning-screen` as the scoped hook for Chef It Up/Ticket/Prep browser-fit typography, and `.slop-bowl-menu-screen` as the scoped hook for Slop Bowl menu typography. Do not move these overrides back onto shared `.planning-screen`; that would risk pulling in surfaces Wilson explicitly said look okay. Keep `.menu-sheet` and `live-cooking-ui` out of this browser-fit pass unless Wilson reopens those surfaces.

## Open items
No Replit/mobile-browser manual visual pass has been run for this branch yet. The local evidence confirms scope and build health, but it does not fully prove the final iOS Chrome/Safari viewport with real browser chrome. A targeted Replit/mobile browser skim of Ticket Pass, Prep Tray, and Slop Bowl menus is the useful final visual check before production/release confidence.

## Verification
- `npm ci` passed; 1113 packages installed, 0 vulnerabilities reported.
- `npx vitest run tests/unit/slop-bowl.test.tsx tests/unit/meal-planning.test.tsx` passed: 2 files, 28 tests.
- `npm run check` passed: TypeScript plus UI lint.
- `npm run build` passed. Vite reported the existing Browserslist age warning, dynamic/static Firebase import warning, and large chunk warning.
- `git diff --check` passed.
- Built-CSS computed-style smoke passed in local headless Chromium after sandbox escalation. Observed values: MealPlanning display `25.28px`, MealPlanning selected-ticket title `20.48px`, use chip `11.2px`, Prep Tray copy `13.12px`; Slop Bowl display `24px`, Slop Bowl copy `13.12px`, Slop Bowl chip `12.16px`; Menu title stayed `30px`, menu destination text stayed `16px`, landing demo ticket title stayed `22.08px`, and Live Cooking stayed under its own `live-cooking-ui` styles.

## Stack / base status
- Base refreshed: yes
- Current base: `origin/main` at `2eaf393ed720e0095cccaae4ddc1c0910f1c06c4`
- Last Replit-validated at: not yet validated
- Notes: independent Phase 3.1 browser-fit polish branch from fresh `origin/main`; not stacked on another open branch.
