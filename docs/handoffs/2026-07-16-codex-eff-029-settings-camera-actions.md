# EFF-029 Setup/Settings camera and action clearance

**Agent:** codex
**Branch:** `codex/eff-029-settings-camera-actions`
**Date:** 2026-07-16
**Initiative:** INIT-001
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary

Daily Efforts hygiene found the active pool aligned after EFF-028 merged and selected EFF-029 as the next non-conflicting implementation slice: EFF-017 has open PR #277, EFF-022 remains behind higher-priority INIT-001 work, and EFF-030 has since resolved through PR #296 / PR #302 closeout on `main`. This branch fixes first-time setup and returning Settings Pantry/Tools camera proportions, plus returning Settings pinned action clearance, without changing scan behavior, setup step flow, or bottom-nav IA.

## Hygiene result

Active Efforts are now EFF-017, EFF-022, and EFF-029. EFF-028 is resolved on `main` by PR #294 / PR #298 closeout, and EFF-030 is resolved on `main` by PR #296 / PR #302 closeout. EFF-029 moved from `Open` to `In Progress` on this branch. No additional active Effort was resolved, moved into an INIT, or promoted to a PD/workflow doc by this branch. Agent entrypoints still link to `efforts/README.md` and `initiatives/README.md` rather than mirroring active IDs. Blocked handoffs remain unrelated to this slice.

## Effort implementation choice

EFF-029 was selected because PR #291 cleared its sequencing gate, PR #294 / PR #298 resolved EFF-028, and the reported bug affects Pantry/Tools mobile usability. The initial implementation was returning-Settings-specific, but Wilson clarified during Replit validation that first-time setup Pantry/Tools needs the same camera proportion fix. The branch avoids EFF-028 because it is already resolved, avoids EFF-017 because PR #277 remains the current existing slice, avoids EFF-022 because runtime fallback work is intentionally behind higher-priority INIT-001 visual/layout fixes, and avoids EFF-030 because PR #296 resolved the setup cooking-skill Next-action work on `main`.

## Changes

- `client/src/components/cooking/user-profiling.tsx`
  - Wraps first-time setup Pantry/Tools `NativeCamera` in `.setup-inventory-camera`.
- `client/src/components/cooking/user-settings.tsx`
  - Wraps returning Settings Pantry/Tools `NativeCamera` in `.returning-inventory-camera`.
- `client/src/index.css`
  - Overrides first-time setup and returning inventory cameras to `aspect-ratio: 4 / 5`.
  - Keeps the narrow mobile `.setup-scan-step` camera override at `4 / 5` instead of reverting setup to `4 / 3`.
  - Adjusts setup/returning camera-off spacing and icon scale inside the taller frame.
  - Adds `--returning-bottom-nav-clearance` and sticks `.returning-actions` above the fixed Cook/Menu nav.
- `package-lock.json`
  - Updates transitive `websocket-driver` from `0.7.4` to `0.7.5` after the fresh PR dependency audit failed on GHSA-mp7j-qc5w-4988 / GHSA-xv26-6w52-cph6. `package.json` did not change.
- `tests/unit/user-profiling.test.tsx`
  - Guards that first-time setup Pantry and Tools render the setup camera wrapper.
- `tests/unit/user-settings-scan-policy.test.tsx`
  - Guards that Pantry and Tools render the returning camera wrapper.
- `tests/unit/setup-button-css.test.ts`
  - Guards the `4 / 5` setup/returning camera rules and returning action-rail bottom-nav clearance.
- `efforts/README.md`, `efforts/effort-029-settings-camera-action-clearance.md`, `efforts/registry.md`
  - Records the active implementation signal.
- `initiatives/INIT-001-mobile-refresh.md`, `initiatives/registry.md`
  - Records the INIT-001 EFF-029 implementation signal and pending validation.

## Impact on other agents

The camera proportion fix now applies to first-time setup and returning Settings Pantry/Tools. The action-rail bottom-nav clearance is still returning-Settings-specific. Do not treat this branch as changing bottom-nav IA, scan providers, upload limits, manual entry behavior, dirty-state prompts, setup step flow, or EFF-030's shipped setup cooking-skill Next-action behavior.

EFF-029 should not be duplicated while this branch/PR is active. EFF-030 is resolved by PR #296.

## Open items

- Changed-since-last-prod production readiness regression should include first-time setup Pantry/Tools and returning Settings Pantry/Tools mobile visual checks if PR #295 ships in the release batch.
- PR review, exact-head GitHub CI including `e2e_guest_smoke`, and Wilson merge approval are still pending.
- If this branch merges, close EFF-029 only after final validation and accepted merge state make the resolution criteria true.

## Verification

- `npm run setup:worktree` created the `.env.keys` symlink without printing secrets.
- `npx vitest run tests/unit/user-profiling.test.tsx tests/unit/user-settings-scan-policy.test.tsx tests/unit/setup-button-css.test.ts --testTimeout=15000` passed after the scope correction: 3 files / 34 tests.
- `npm run test:unit` passed: 50 files / 387 tests.
- `npm run check` passed.
- `npm run build` passed with existing Browserslist, Firebase dynamic/static import, and chunk-size warnings.
- `git diff --check` passed.
- `npm audit --audit-level=high` passed after `npm audit fix` made the lockfile-only `websocket-driver@0.7.5` remediation.
- Exact-head local built-CSS Chromium geometry probe passed outside the sandbox after sandboxed Chromium hit a macOS Mach-port permission failure:
  - 390 x 740 mobile viewport measured first-time setup camera `336 x 420`, ratio `1.25`.
  - 390 x 740 mobile viewport measured returning camera `338 x 422.5`, ratio `1.25`.
  - Sticky Settings actions measured `92.31px` above the fixed bottom nav.
  - Camera controls stayed inside both frames, and camera-off copy stayed above controls in both frames.
- Wilson reported a PR-level spot check looked good on 2026-07-16. Exact viewport was not recorded, so the production-readiness registry still carries the focused release-batch visual check.
- Local dev server start through `PORT=3000 npm run env:run -- npm run dev` failed inside the sandbox on the known `tsx` IPC pipe restriction, then started successfully outside the sandbox and was stopped. The visual check used built CSS rather than live app/Firebase routing.
- `PORT=3000 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm run env:run -- npm run db:health` failed inside the sandbox on the same `tsx` IPC restriction, then reached the real DB check outside the sandbox and failed because the configured endpoint is disabled. Local DB-backed Playwright E2E was not run; rely on PR CI `e2e_guest_smoke` for exact-head merge-gate E2E.

## Negative scope

No server routes, schema, prompts, provider logic, upload limits, scan analysis, navigation IA, auth-mode visibility, first-time setup flow, EFF-028, EFF-030, or Live Cooking behavior changed. The only dependency change is the lockfile-only transitive `websocket-driver` audit remediation described above.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `3330fa6ead1753686d4b0d3df482a7feb28c809b`
- Last Replit-validated at: `7450a4269564dc82467a8414e8a8098eca3c15df` for Wilson's PR-level spot check; exact viewport not recorded
- Notes: branch was renamed to `codex/eff-029-settings-camera-actions` before publish.
