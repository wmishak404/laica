# Mobile Browser Type Fit

**Agent:** codex
**Branch:** codex/mobile-browser-type-fit
**Date:** 2026-07-08
**Initiative:** INIT-001
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary
Wilson's mobile browser screenshots showed that short Chef It Up setup/selection screens, Ticket Pass, Prep Tray, and the Slop Bowl generated-result action stack can overfill the visible Chrome/Safari viewport even though the accepted object proportions still feel right. The clarified rule is not to make every page tiny: short interactions should expose their useful controls in the same mobile-browser viewport before scrolling where practical, while long content pages only need to start cleanly at the top. This branch uses `svh` sizing plus scoped compaction for the short interactions, keeps long Pantry/Settings and Slop Bowl pantry-check examples readable, and preserves the explicit exclusions for Live Cooking preparing/active surfaces and Menu drawer typography.

## Changes
- `client/src/components/cooking/meal-planning.tsx`: adds a `meal-planning-screen` wrapper class to Chef It Up time, cuisine, staples, Ticket Pass, and Prep Tray sections so browser-fit type overrides stay out of the Planning choice shell, the Menu drawer, and public landing/demo ticket surfaces. The time screen also has `planning-time-screen` / `planning-time-content` hooks, Ticket Pass has `planning-tickets-screen`, Prep Tray has `planning-prep-screen`, and MealPlanning resets browser scroll on step changes so short-flow controls start from the top before scrolling.
- `client/src/components/cooking/user-profiling.tsx`: adds a `setup-scan-step` hook and resets browser/frame scroll on setup step changes so the pantry/tool setup scanner does not reopen chopped at the top.
- `client/src/components/cooking/slop-bowl.tsx`: adds Slop Bowl-specific `slop-bowl-screen` / `slop-bowl-menu-screen` hooks plus `slop-bowl-approval-screen` / `slop-approval-actions` for the generated-result lower action stack. The pantry-check chip list is left as a long-content pass case.
- `client/src/index.css`: adds MealPlanning-scoped short-browser compaction for the time selector, cuisine/staple rows and fixed actions, Ticket Pass titles/meta/chips/rows/actions, Prep Tray hero/body/chips/CTA, and first-time setup scanner text/camera controls. It also tightens only the Slop Bowl generated-result action stack while leaving the accepted Pantry/Settings long page, Slop Bowl pantry-check long chip list, Menu drawer, and Live Cooking surfaces out of this pass.
- `tests/unit/slop-bowl.test.tsx`: asserts Slop Bowl pantry-check renders under the scoped wrappers and generated-result controls sit inside the compact approval-action hook.
- `tests/unit/meal-planning.test.tsx`: asserts the time, Ticket Pass, and Prep Tray screens render with the browser-fit scope hooks.
- `tests/unit/user-profiling.test.tsx`: asserts the setup pantry scanner renders with the browser-fit scope hook.
- `product-decisions/features/mobile-refresh/pd-phase-03-1-recipe-imagery.md`: records Wilson's type-fit direction, Slop Bowl inclusion, Live Cooking/Menu drawer guardrails, and a new drift row for mobile browser viewport overfill.
- `initiatives/INIT-001-mobile-refresh.md`: records the active branch and resume-point signal under Phase 3.1.

## Impact on other agents
Treat `.meal-planning-screen` as the broad MealPlanning browser-fit hook, `.planning-time-screen`, `.planning-cuisine-screen`, `.planning-tickets-screen`, and `.planning-prep-screen` as the short-interaction sizing hooks, `.setup-scan-step` as the first-time setup scanner hook, and `.slop-bowl-approval-screen` / `.slop-approval-actions` as the generated-result action-stack hooks. Do not move these overrides back onto shared `.planning-screen`; that would risk pulling in surfaces Wilson explicitly said look okay. Keep `.menu-sheet`, `live-cooking-ui`, long Pantry/Settings inventory pages, and the Slop Bowl pantry-check chip list out of forced same-viewport fitting unless Wilson reopens those surfaces.

## Open items
Replit was loaded with earlier passes at `80f1712` and `f15cab7`, but Wilson reported the visible app still looked too unchanged. After Wilson clarified that desktop Chrome/Replit QA is not a fair visual gate for this issue, no desktop Chrome/Replit visual testing was used for the latest follow-up. A phone-browser skim remains the useful human visual check. Target the exact reported surfaces: Chef It Up time selection should show the Next button before scrolling, cuisine should keep `No preference`/CTA reachable with the cuisine list scrollable, Ticket Pass should expose `View prep tray`, Prep Tray should make the main CTA easier to reach, setup scanner should not reopen chopped at the top, and Slop Bowl generated-result should fit the `Plan your own meal instead` button above the bottom nav. Live Cooking preparing/active, the Menu drawer, long Pantry/Settings inventory pages, and the Slop Bowl pantry-check chip list should remain unchanged unless Wilson reopens them.

## Verification
- `npm ci` passed; 1113 packages installed, 0 vulnerabilities reported.
- `npx vitest run tests/unit/slop-bowl.test.tsx tests/unit/meal-planning.test.tsx` passed after the PR #269/#273 rebase: 2 files, 29 tests.
- `npx vitest run tests/unit/slop-bowl.test.tsx tests/unit/meal-planning.test.tsx tests/unit/user-profiling.test.tsx` passed after the latest clarified short-interaction pass: 3 files, 46 tests.
- `npm run check` passed after the latest clarified short-interaction pass: TypeScript plus UI lint.
- `npm run build` passed after the latest clarified short-interaction pass. Vite reported the existing Browserslist age warning, dynamic/static Firebase import warning, and large chunk warning.
- `git diff --check` passed after the latest clarified short-interaction pass.
- Built-CSS computed-style smoke passed in local headless Chromium after sandbox escalation. Observed values: MealPlanning display `25.28px`, MealPlanning selected-ticket title `20.48px`, use chip `11.2px`, Prep Tray copy `13.12px`; Slop Bowl display `24px`, Slop Bowl copy `13.12px`, Slop Bowl chip `12.16px`; Menu title stayed `30px`, menu destination text stayed `16px`, landing demo ticket title stayed `22.08px`, and Live Cooking stayed under its own `live-cooking-ui` styles.
- Replit fast-forwarded `codex/mobile-browser-type-fit` to `f15cab7` after Wilson reported the first pass was too subtle. The direct `.replit.dev` app served the stronger CSS hooks (`planning-time-screen`, `setup-scan-step`, `100svh`, `slop-bowl-menu-screen`). The open direct tab was on Live Cooking state, which is intentionally excluded from this browser-fit pass.

## Stack / base status
- Base refreshed: yes
- Current base: `origin/main` at `9618a15cce82e6b8444e1f471a2b55905c07e633`
- Last Replit-validated at: runtime code loaded at `f15cab7` for an earlier pass; latest clarified short-interaction follow-up intentionally has no desktop Chrome/Replit visual QA per Wilson's instruction. Human phone-browser visual acceptance still pending after deployment/load.
- Notes: independent Phase 3.1 browser-fit polish branch rebased after PR #269 and the PR #273 closeout merged; not stacked on another open branch.
