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
- `efforts/effort-030-setup-skill-next-action.md`, `efforts/README.md`, `efforts/registry.md`: records Wilson's later-scope request to add an explicit bottom Next action to the cooking-comfort setup page without folding that work into this repair branch.
- `efforts/effort-031-chrome-setup-tap-hit-test-drift.md`, `initiatives/INIT-001-mobile-refresh.md`: records Wilson's Chrome-only intermittent setup tap mismatch as separate Phase 3.1/4 browser-fit follow-up; refresh cleared the issue and DuckDuckGo did not reproduce it.

## Impact on other agents

Do not rebase this branch onto a later `codex/mobile-browser-type-fit` head without checking Wilson's reported setup navigation regressions first. The intended base is the known-good Replit build `8c48ec4`; this is a small visual fix layered on top of that baseline.

## Open items

- Camera proportion/text composition is intentionally deferred to thread `019f5f00-e389-7873-af20-a47a3ff66da3`; this branch's latest follow-up only changed scroll containment.
- EFF-030 is intentionally open for a later UX consistency pass: the cooking-comfort setup page still advances by tapping a skill option and does not yet have a bottom Next action.
- EFF-031 is intentionally open for a later Chrome-specific interaction investigation: setup taps could intermittently target the wrong visible item or make Ready Back untappable on Chrome, while refresh restored correct behavior and DuckDuckGo did not reproduce it.
- Live Cooking active/preparing surfaces, the Menu drawer visual treatment, real-device browser address-bar collapse/expand behavior, and full recipe-generation/service-provider QA remain outside this branch's claimed validation scope.

## Verification

- Rebased exact head: `eada41353a5c2f7ab24b82606594a211ccb25cbf`.
- `git diff --check origin/main...HEAD` passed.
- `npx vitest run tests/unit/user-profiling.test.tsx tests/unit/user-settings-scan-policy.test.tsx tests/unit/native-camera.test.tsx tests/unit/meal-planning.test.tsx tests/unit/slop-bowl.test.tsx tests/unit/planning-choice.test.tsx tests/unit/live-cooking-guest-session.test.tsx --testTimeout=15000` passed: 7 files / 139 tests.
- `npm run check` passed.
- `npm run build` passed with the existing Browserslist, Firebase dynamic/static import, and chunk-size warnings.
- `npm run test:unit` passed: 48 files / 380 tests.
- GitHub exact-head checks passed after marking PR #291 ready for review: `unit`, `e2e_guest_smoke`, `trufflehog_pr`, `npm-audit`, and CodeQL. Earlier draft-created `unit`/`e2e_guest_smoke` runs were skipped by workflow condition, then reran and passed after the PR left draft.

### Replit mobile Chrome validation

- Replit workspace loaded exact PR head `eada413` with direct shell commands, not Replit Agent.
- Replit app URL validated: `https://337eb835-685d-4e60-adfa-b3dc60ccf6c8-00-ouidv5a6jdpx.riker.replit.dev/`.
- Chrome extension viewport override: `430x740`. App-reported CSS viewport: `537x925`. This is mobile-oriented Chrome extension validation per PR #288 methodology, not real-device browser-chrome collapse/expand validation.
- First-run Pantry setup: `Enter manually` stayed on step `1/5`, `Next` blocked until at least three ingredients, saving `hummus, eggs, rice` populated the pantry list, and `Next` advanced to Tools.
- First-run Pantry camera: `.setup-camera-card setup-camera-pantry`, `.setup-viewfinder`, `.setup-camera-state-icon`, `.setup-camera-state-copy`, and `.setup-camera-controls` were present; no corner/bracket ornament selector matched; copy and controls occupied separate vertical zones.
- First-run Tools setup: the initial Tools choice rendered, `Add tools` opened Tools capture, `Enter manually` stayed on step `2/5` instead of advancing, and `Skip for now` advanced to Cooking Skill.
- First-run Tools camera: `.setup-camera-card setup-camera-kitchen`, `.setup-viewfinder`, `.setup-camera-state-icon`, `.setup-camera-state-copy`, and `.setup-camera-controls` were present; no corner/bracket ornament selector matched; copy and controls occupied separate vertical zones.
- Cooking Skill: the page rendered at `3/5`, selecting `Intermediate` advanced to Dietary. The requested explicit bottom `Next` action remains deferred to EFF-030.
- Dietary: selecting `Gluten Free` and `Dairy Free` selected the intended rows; `Next` advanced to Ready.
- Ready: rendered at `5/5` with `docH === innerHeight === 925` and `scrollY === 0`; `Back` returned to Dietary with `windowScrollY === 0` and setup body `scrollTop === 0`; `Next` returned to Ready without the inert bottom tail.
- `Finish setup` landed on the post-setup planning choice screen with `docH === innerHeight === 925` and `scrollY === 0`.
- Chef It Up card opened the time selection page; the page had an enabled `Next` action and `docH === innerHeight === 925`; Back returned to planning choices.
- Slop It Up card responded in the guest state by showing the sign-in/save-account notice. Full Slop recipe generation was not exercised in this pass.
- Returning Settings -> Kitchen Inventory -> Pantry and Tools camera surfaces reused the setup camera hooks and had no corner/bracket ornaments in Chrome inspection.

## Stack / base status

- Base refreshed: yes, rebased onto fresh `origin/main` after PR #287 and PR #290 merged.
- Current base: `origin/main` at `9dcb37da4e57f4c655816e6a0c399fa67365f43f`
- Last Replit-validated at: `eada41353a5c2f7ab24b82606594a211ccb25cbf`
- Replit validation lane: completed for this branch's mobile-browser setup camera/scroll containment checklist using Chrome extension mobile viewport validation; real mobile device and full provider/service QA remain outside this branch's claim.
- Notes: intentionally based on Wilson's known-good navigation build rather than the later divergent branch head.
