# Mobile Browser Type Fit

**Agent:** codex
**Branch:** codex/mobile-browser-type-fit
**Date:** 2026-07-08
**Initiative:** INIT-001
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary
Wilson's mobile browser screenshots showed that Chef It Up recipe suggestions and Prep Tray can overfill the visible Chrome/Safari viewport even though the accepted Ticket Pass and Prep Tray proportions still feel right. This branch keeps those proportions and shrinks only MealPlanning runtime typography, explicitly leaving the Live Cooking active phase and Menu drawer typography unchanged.

## Changes
- `client/src/components/cooking/meal-planning.tsx`: adds a `meal-planning-screen` wrapper class to Chef It Up time, cuisine, staples, Ticket Pass, and Prep Tray sections so browser-fit type overrides stay out of Slop Bowl, the Planning choice shell, the Menu drawer, and public landing/demo ticket surfaces.
- `client/src/index.css`: adds MealPlanning-scoped font-size/line-height reductions for process headings, Ticket Pass titles/meta/chips/optional text, and Prep Tray body copy. The change avoids repositioning or changing accepted ticket/prep object proportions.
- `product-decisions/features/mobile-refresh/pd-phase-03-1-recipe-imagery.md`: records Wilson's type-fit direction, Live Cooking/Menu drawer guardrails, and a new drift row for mobile browser viewport overfill.
- `initiatives/INIT-001-mobile-refresh.md`: records the active branch and resume-point signal under Phase 3.1.

## Impact on other agents
Treat `.meal-planning-screen` as the scoped hook for Chef It Up/Ticket/Prep browser-fit typography. Do not move these overrides back onto `.planning-screen`; Slop Bowl also uses `.planning-screen` and should not inherit this slice unless separately validated. Also keep `.menu-sheet` and `live-cooking-ui` out of this browser-fit pass unless Wilson reopens those surfaces.

## Open items
No Replit/mobile-browser manual visual pass has been run for this branch yet. The local evidence confirms scope and build health, but it does not fully prove the final iOS Chrome/Safari viewport with real browser chrome. A targeted Replit/mobile browser skim of Ticket Pass and Prep Tray is the useful final visual check before production/release confidence.

## Verification
- `npm ci` passed; 1113 packages installed, 0 vulnerabilities reported.
- `npx vitest run tests/unit/meal-planning.test.tsx` passed: 1 file, 25 tests.
- `npm run check` passed: TypeScript plus UI lint.
- `npm run build` passed. Vite reported the existing Browserslist age warning, dynamic/static Firebase import warning, and large chunk warning.
- `git diff --check` passed.
- Built-CSS computed-style smoke passed in local headless Chromium after sandbox escalation. Observed values: MealPlanning display `25.28px`, MealPlanning selected-ticket title `20.48px`, ticket meta `12.48px`, use chip `11.2px`, Prep Tray copy `13.12px`, while Menu title stayed `30px`, menu destination text stayed `16px`, and landing demo ticket title stayed `22.08px`.

## Stack / base status
- Base refreshed: yes
- Current base: `origin/main` at `2eaf393ed720e0095cccaae4ddc1c0910f1c06c4`
- Last Replit-validated at: not yet validated
- Notes: independent Phase 3.1 browser-fit polish branch from fresh `origin/main`; not stacked on another open branch.
