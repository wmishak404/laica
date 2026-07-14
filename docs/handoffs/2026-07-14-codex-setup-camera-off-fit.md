# Setup camera off-state fit

**Agent:** codex
**Branch:** codex/setup-camera-off-fit
**Date:** 2026-07-14
**Initiative:** INIT-001
**INIT updated:** no
**Resolves blocked handoff:** none

## Summary

This branch starts from the Replit-validated `8c48ec4` mobile-browser build because Wilson reported that build did not reproduce the setup navigation bugs. It keeps that baseline and narrowly adjusts setup browser behavior: Pantry and Tools camera-off states avoid decorative corner marks, and first-time setup now has an explicit bounded content scrollport above the Back/Next rail so setup pages stop at the rail instead of continuing into inert blank space. Step transitions also reset the owned setup scrollport so a bottom-scrolled Ready screen does not leak its scroll position back into Dietary, Cooking Skill, or earlier pages.

## Changes

- `client/src/components/ui/native-camera.tsx`: adds explicit setup camera state icon/copy hooks while keeping non-setup camera behavior unchanged.
- `client/src/components/cooking/user-profiling.tsx`: moves scrolling into a dedicated `.setup-scroll-body`, keeps the Back/Next rail outside that scroller, and resets the setup scrollport plus document scroll on setup step/view transitions, including Ready -> Back and tools-capture transitions.
- `client/src/index.css`: adds the bounded setup shell/content-scroll/rail containment, changes setup camera viewfinders to a 4:3 proportion, adds base layout rules for setup camera off/error states, keeps a reserved control zone so copy and controls do not overlap on mobile-browser setup pages, and uses the dynamic mobile viewport for the setup shell.
- `tests/unit/user-profiling.test.tsx`: verifies first-run Pantry setup renders the new setup camera state hooks, still has no setup corner ornaments, and resets both frame/body scroll when backing out of the Ready confirmation.
- `tests/unit/user-settings-scan-policy.test.tsx`: verifies returning Settings Pantry/Tools reuse the same setup camera state hooks and still have no setup corner ornaments.
- `design_guidelines.md`: tightens the setup camera principle to include camera-like preview proportion alongside the existing no-crowded-brackets/control-zone guidance, and records the no-scroll-leak rule for step-based mobile-browser flows.
- `efforts/effort-028-setup-skill-next-action.md`, `efforts/README.md`, `efforts/registry.md`: records Wilson's later-scope request to add an explicit bottom Next action to the cooking-comfort setup page without folding that work into this repair branch.
- `efforts/effort-029-chrome-setup-tap-hit-test-drift.md`, `initiatives/INIT-001-mobile-refresh.md`: records Wilson's Chrome-only intermittent setup tap mismatch as separate Phase 3.1/4 browser-fit follow-up; refresh cleared the issue and DuckDuckGo did not reproduce it.

## Impact on other agents

Do not rebase this branch onto a later `codex/mobile-browser-type-fit` head without checking Wilson's reported setup navigation regressions first. The intended base is the known-good Replit build `8c48ec4`; this is a small visual fix layered on top of that baseline.

## Open items

- Not loaded to Replit yet in this branch.
- Do not run or claim Replit validation until this branch is current with `origin/main`, merge conflicts are resolved, and exact-head CI/E2E has passed. Any Replit validation before that point is exploratory only.
- No mobile-device manual QA has been claimed for this branch. When Replit validation is ready, follow PR #288's mobile-first Chrome/Replit methodology: inspect UI and visual cues in Chrome mobile view by default, record the device preset or viewport, exact branch/SHA, Replit URL, and whether browser chrome was expanded/collapsed. Desktop Chrome/Replit visual checks do not count as a pass for this mobile-browser UI build.
- The required mobile-view Replit checklist for this branch is: Pantry and Tools camera off-states have no decorative corner squares and no text/control overlap; Pantry/Tools manual-entry flows remain tappable; setup scroll ends at the Back/Next rail with no inert blank tail; Ready -> Back resets scroll position for Dietary, Cooking Skill, Tools, and Pantry; existing accepted Chef It Up and Slop It Up browser proportions/actions are not regressed; Live Cooking active/preparing surfaces and the Menu drawer remain outside this branch's visual-fit claims.
- Camera proportion/text composition is intentionally deferred to thread `019f5f00-e389-7873-af20-a47a3ff66da3`; this branch's latest follow-up only changed scroll containment.
- EFF-028 is intentionally open for a later UX consistency pass: the cooking-comfort setup page still advances by tapping a skill option and does not yet have a bottom Next action.
- EFF-029 is intentionally open for a later Chrome-specific interaction investigation: setup taps could intermittently target the wrong visible item or make Ready Back untappable on Chrome, while refresh restored correct behavior and DuckDuckGo did not reproduce it.

## Verification

- `npx vitest run tests/unit/user-profiling.test.tsx tests/unit/user-settings-scan-policy.test.tsx tests/unit/native-camera.test.tsx`
- `npm run check`
- `npm run build`

## Stack / base status

- Base refreshed: no
- Current base: `8c48ec4` (`codex: clean up setup browser scan fit`)
- Last Replit-validated at: `8c48ec4` baseline only; this follow-up branch is not yet Replit-validated.
- Replit validation lane: deferred until after rebase/current-branch work, conflicts, and exact-head CI/E2E; then run PR #288 mobile-first Chrome/Replit validation for the checklist above.
- Notes: intentionally based on Wilson's known-good navigation build rather than the later divergent branch head.
