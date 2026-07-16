# EFF-029: Setup/Settings camera height and action clearance

**Status:** Resolved
**Owner:** Wilson / Codex / Claude
**Created:** 2026-07-14
**Updated:** 2026-07-16
**Linked Initiative:** [INIT-001 - Mobile Refresh](../initiatives/INIT-001-mobile-refresh.md)
**Related docs:** [Phase 2.1 Setup Polish](../product-decisions/features/mobile-refresh/pd-phase-02-1-setup-polish.md), [Phase 2.2 Returning Setup / Settings](../product-decisions/features/mobile-refresh/pd-phase-02-2-returning-setup-settings.md), [PD-005 UI Governance](../product-decisions/pd-005-ui-governance.md), [design guidelines](../design_guidelines.md)

## One-line summary

Fix first-time setup and returning Settings Pantry/Tools scan layout so the camera object feels closer to a 4:5 phone-camera frame, and keep returning Settings pinned inventory actions above the bottom nav instead of under it.

## Context

Wilson's 2026-07-14 mobile Safari/Replit screenshots of the logged-in Settings Kitchen Inventory pages show two related visual/layout regressions on both Pantry and Tools:

1. The camera preview object is too short vertically. Wilson wants it increased toward a 4:5 frame so it feels closer to an iPhone camera app, not a squat embedded panel. The `Camera is off` empty-state text and controls currently look disproportionate inside the shortened camera area.
2. The pinned Pantry/Tools action buttons at the bottom of the Settings page are covered by the main bottom navigation bar with the Cook and Menu icons. The actions should remain pinned within the Settings content but clear the app nav, not hide beneath it.

The screenshots were first recorded from returning logged-in Settings, but Wilson clarified on 2026-07-16 that the first-time setup Pantry/Tools scan pages need the same camera proportion fix. Returning Settings intentionally reuses setup's camera object and action grammar, so the implementation should inspect the shared setup/returning CSS and components before choosing whether the fix belongs in a shared camera/action primitive or in returning Settings-specific layout.

Sequencing note from Wilson: do not implement this Effort until Codex thread `019f3b47-9d04-7a03-8973-2a9cd1bb19b4` has merged, because that release was large and already creating bugs/design drift. That upstream work, the EFF-028 implementation PR, and the EFF-028 closeout landed before PR #295 resolved this Effort.

This is not the production vision-scan 500 blocker recorded in `docs/handoffs/2026-06-21-codex-prod-vision-scan-investigation-blocked.md`; this Effort is a client layout/visual follow-up.

## Scope

- Target first-time setup Pantry/Tools and returning logged-in Settings Kitchen Inventory -> Pantry and Kitchen Inventory -> Tools.
- Increase the camera preview/object height toward a 4:5 aspect ratio while preserving the accepted setup-derived camera controls: camera-off toggle, blank shutter, tips/help button, and in-frame state messaging.
- Rebalance the `Camera is off` empty-state typography, icon scale, spacing, and controls so the off state feels proportionate in the taller camera frame.
- Fix the returning Settings pinned Pantry/Tools action area so Save/Reset or equivalent bottom actions are visible, tappable, and positioned above the authenticated bottom nav on mobile Safari/Replit viewports.
- Account for safe-area and browser chrome realities on narrow mobile screens.
- Preserve existing Pantry and Tools behavior: scan, upload, manual entry, remove/reset/save, dirty-state reminders, and leave/switch prompts.
- If the shared `NativeCamera`/setup camera object is changed, verify first-time setup Pantry/Tools camera surfaces do not regress.

Out of scope:

- Reopening EFF-028 or bundling Chef It Up time/Prep Tray follow-up work into this setup/settings slice.
- Changing durable bottom-nav IA, icon set, labels, auth-mode visibility, or navigation behavior.
- Changing scan provider behavior, upload limits, scan rate limits, server routes, schema, or prompt/model logic.
- Reworking Settings IA beyond Pantry/Tools action clearance.
- Changing first-time setup step flow or Back/Next rail behavior.
- Solving the production vision-scan 500 investigation.

## Decisions made so far

- Treat the camera-height and bottom-action overlap as one implementation follow-up because both affect the same Pantry/Tools scan layout family.
- Cover first-time setup and returning logged-in Settings Pantry/Tools camera proportions together. The authenticated bottom-nav clearance remains returning Settings-specific.
- Use a 4:5 camera-object target as the visual direction.
- Keep bottom actions pinned, but above the main bottom nav.
- Sequence implementation after EFF-028's merge closeout lands, starting from fresh `origin/main`.

## Final implementation choices

- PR #295 uses strict `aspect-ratio: 4 / 5` for first-time setup and returning Settings inventory camera wrappers.
- Returning bottom action clearance lives in the returning Settings inventory shell through `--returning-bottom-nav-clearance`; the app-shell bottom nav IA is unchanged.
- The explicit `.setup-inventory-camera` and `.returning-inventory-camera` wrappers stay inventory-only until another setup scan surface needs the same treatment.

## Agent checklist

- [ ] Confirm EFF-028's merge closeout has landed, then start from fresh `origin/main` before implementation.
- [ ] Read this Effort, INIT-001, Phase 2.1, Phase 2.2, PD-005, `design_guidelines.md`, and the relevant recent Settings handoffs before implementation.
- [ ] Inspect `client/src/components/cooking/user-settings.tsx`, `client/src/components/ui/native-camera.tsx`, `client/src/index.css`, and current tests before choosing the fix location.
- [ ] Verify first-time setup Pantry and Tools at a narrow mobile viewport.
- [ ] Verify Pantry and Tools returning Settings at a narrow mobile viewport with bottom nav visible.
- [ ] Record visual evidence and negative scope in the PR/handoff.

## Resolution criteria

1. First-time setup and returning Settings Pantry/Tools camera objects render with a taller, phone-camera-like frame close to 4:5, and the camera-off state no longer looks cramped or disproportionate.
2. Returning Settings Pantry and Tools pinned action buttons are fully visible and tappable above the main bottom nav on representative mobile Safari/Replit viewports.
3. Upload/manual actions, scan/camera controls, dirty reminders, save/reset behavior, and Pantry/Tools section switching remain unchanged.
4. No durable bottom-nav IA or auth-mode visibility changes ship.
5. Any shared camera/action-shell change is checked against first-time setup and returning Settings so accepted setup/returning visual parity is preserved or any intentional deviation is documented.
6. The implementation PR records exact visual validation, command/check provenance, source files inspected, and remaining unvalidated scope.

## 2026-07-14 - Effort filed

Codex filed this Effort from Wilson's screenshot-backed request. No runtime implementation has started. Implementation is explicitly gated on thread `019f3b47-9d04-7a03-8973-2a9cd1bb19b4` merging first.

## 2026-07-14 - Phase 4 routing merged

[PR #287](https://github.com/wmishak404/laica/pull/287) merged as `430a5d8` from final head `9051805`, routing this Effort into INIT-001 / Phase 4 as the next adjacent returning Settings camera/action-layout target alongside EFF-028 after thread `019f3b47-9d04-7a03-8973-2a9cd1bb19b4` merged. At that point, the Effort remained `Open` and no runtime implementation had started.

## 2026-07-16 - Next after EFF-028

EFF-028 resolved when PR #294 merged as `4e872deeb494b72f56ce5011a5b1bd213ee9fb29`, and its merge-closeout docs have landed on `main`. EFF-029 is the next serial adjacent INIT-001 visual/setup follow-up unless Wilson reprioritizes. Start from fresh `origin/main` and keep scope to first-time setup and returning Settings Pantry/Tools camera height plus returning Settings pinned-action clearance.

## 2026-07-16 - Setup/Settings layout implementation started

Daily Efforts hygiene confirmed PR #291 from Codex thread `019f3b47-9d04-7a03-8973-2a9cd1bb19b4` has merged, clearing the sequencing gate, and PR #294 / PR #298 resolved EFF-028. EFF-017 has open PR #277, EFF-022 remains behind higher-priority INIT-001 work, and EFF-030 has since resolved through PR #296 / PR #302 closeout, so this branch remains the active adjacent setup/settings layout slice.

Initial implementation kept the camera fix returning-Settings-specific. Wilson clarified during Replit validation that first-time setup Pantry/Tools should receive the same camera proportion treatment, so the branch now shares the camera proportion rules across setup and returning inventory scan surfaces while keeping authenticated bottom-nav action clearance returning-only:

- `UserProfiling` wraps first-time setup Pantry/Tools `NativeCamera` in `.setup-inventory-camera`.
- `UserSettings` wraps returning Settings Pantry/Tools `NativeCamera` in `.returning-inventory-camera`.
- CSS overrides both wrappers to restore a strict `4 / 5` camera frame for Pantry/Tools scan surfaces, including the narrow mobile `.setup-scan-step` override that previously forced first-time setup back to `4 / 3`.
- Returning Settings gets `--returning-bottom-nav-clearance`, and `.returning-actions` sticks above that clearance instead of at viewport bottom so the authenticated Cook/Menu nav no longer covers Save/Settings actions.
- The camera-off state gets proportionate spacing/icon sizing inside the taller setup and returning inventory frames.

Validation so far:

- Focused Vitest/CSS guards passed: `npx vitest run tests/unit/user-profiling.test.tsx tests/unit/user-settings-scan-policy.test.tsx tests/unit/setup-button-css.test.ts --testTimeout=15000`.
- Full local unit and static checks passed after the setup scope correction: `npm run test:unit` (50 files / 387 tests), `npm run check`, `npm run build`, `npm audit --audit-level=high`, and `git diff --check`. Build retained the existing Browserslist, Firebase dynamic/static import, and chunk-size warnings.
- Exact-head built-CSS Chromium geometry at a 390 x 740 mobile viewport measured the first-time setup camera at `336 x 420` (`4 / 5`) and the returning camera at `338 x 422.5` (`4 / 5`); returning sticky actions were `92.31px` above the fixed bottom nav, camera controls stayed inside both frames, and camera-off copy stayed above controls in both frames.
- Wilson reported a PR-level spot check looked good on 2026-07-16. Exact viewport was not recorded, so `docs/production-validation-registry.md` still carries the focused changed-since-last-prod production readiness check if PR #295 ships in the release batch.
- Local DB-backed Playwright E2E was not run because `db:health` reached the configured dotenvx database outside the sandbox and failed with `The endpoint has been disabled`. Exact-head GitHub `e2e_guest_smoke` remains the required merge-gate E2E lane for the PR.
- Fresh PR dependency audit initially failed on the existing transitive `websocket-driver@0.7.4` critical advisory path through Firebase packages. The branch kept that remediation lockfile-only by accepting `npm audit fix`'s `websocket-driver@0.7.5` update; `package.json` did not change, and `npm audit --audit-level=high` then passed.

## 2026-07-16 - Resolved by PR #295

[PR #295](https://github.com/wmishak404/laica/pull/295) merged on 2026-07-16 as `edd547ccd623d511d095a5ecb9251bb81850c783` from final head `4c9d8b84f6fd29d8aac5fb20546f2e7836137172`, resolving EFF-029.

Merged behavior:

- First-time setup Pantry/Tools and returning Settings Pantry/Tools now use inventory camera wrappers with strict `4 / 5` camera framing.
- The camera-off state spacing and icon scale are proportionate inside the taller frames.
- Returning Settings Pantry/Tools actions stay pinned above the fixed Cook/Menu bottom nav.
- Upload/manual/scan controls, dirty reminders, save/reset behavior, section switching, bottom-nav IA, provider routes, schema, prompts, and Live Cooking behavior remain unchanged.

Validation and release follow-up:

- Exact-head GitHub checks passed on final head `4c9d8b84`: `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, CodeQL, Analyze actions, and Analyze javascript-typescript.
- Earlier implementation evidence included focused Vitest/CSS guards, full local unit/check/build/audit, and built-CSS Chromium geometry showing setup and returning cameras at `4 / 5` with returning actions `92.31px` above the fixed bottom nav.
- Wilson reported a PR-level spot check looked good on 2026-07-16. Exact viewport was not recorded, so `docs/production-validation-registry.md` still carries the focused release-batch visual check for PR #295.
