# EFF-034 Timer and Settings Cleanup

**Agent:** codex
**Branch:** codex/efforts-hygiene-2026-07-22
**Date:** 2026-07-22
**Initiative:** INIT-001
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary

The daily Efforts hygiene pass started from fresh `origin/main` `742694d9` and found no active Effort read-list, registry, entrypoint, open-owner, or blocked-handoff drift that required a standalone hygiene-only change. EFF-034 was selected as the next unblocked mobile-readiness slice because it covers two already accepted P2 findings and does not require a product, provider, schema, security, or Replit-side decision.

This branch fixes both EFF-034 findings while keeping the Effort `In Progress` until exact-head GitHub E2E and review complete. Timer Reset now returns a duration-bearing Live Cooking timer to the fresh Start state, and the returning Settings hub no longer creates an inert blank document tail below the hub cards.

## Changes

- `client/src/components/cooking/live-cooking.tsx`
  - Makes `resetTimer()` clear elapsed timer state to `0`, preserving Pause -> `Resume timer` while making Reset -> `Start <duration> timer`.
- `client/src/components/cooking/user-settings.tsx`
  - Removes component-level full-screen and bottom-padding ownership from the returning Settings hub shell.
- `client/src/pages/app.tsx`
  - Removes the generic `pb-20` phase wrapper around the Settings phase, which was extending the document below the app viewport.
- `client/src/index.css`
  - Gives non-inventory `.returning-ui` the bottom-nav-aware height and padding contract.
  - Keeps inventory dock behavior separate from EFF-033's `.returning-ui-inventory` contract.
- `tests/unit/live-cooking-guest-session.test.tsx`
  - Extends timer coverage for Start -> Pause -> Resume and Start -> Pause -> Reset -> Start.
- `tests/e2e/cooking-workflow.test.ts`
  - Adds provider-light guest workflow coverage that Reset returns to `Start 2 min timer`.
- `tests/e2e/linked-dev-auth.test.ts`
  - Adds a returning Settings hub mobile geometry guard for no blank tail under the fixed bottom nav.
- `tests/unit/setup-button-css.test.ts`
  - Adds CSS ownership coverage for non-inventory Settings bottom-nav clearance.
- `tests/unit/user-settings-scan-policy.test.tsx`
  - Guards against reintroducing `min-h-screen` / `pb-24` on the Settings hub root and shell.
- `docs/assets/mobile-refresh/2026-07-22-codex-eff-034-settings-hub-after-390x844.png`
  - Captures the replacement Settings hub state at `390x844`.
- `docs/assets/mobile-refresh/2026-07-22-codex-eff-034-timer-reset-after-390x844.png`
  - Captures the timer after Start -> Pause -> Reset at `390x844`.
- `efforts/effort-034-production-readiness-mobile-p2-cleanup.md`, `efforts/README.md`, and `efforts/registry.md`
  - Mark EFF-034 `In Progress` and record the implementation/validation state.
- `initiatives/INIT-001-mobile-refresh.md` and `initiatives/registry.md`
  - Record the EFF-034 branch as current INIT-001 follow-up signal.
- `product-decisions/features/mobile-refresh/pd-phase-02-2-returning-setup-settings.md` and `product-decisions/features/mobile-refresh/pd-phase-04-cooking.md`
  - Add the Settings scroll-ownership and timer-reset implementation signals.
- `docs/production-validation-registry.md`
  - Adds the pending changed-since-last-production check for this runtime branch.

## Impact on other agents

EFF-032 remains separate and still owns first-time setup compact camera fit. EFF-033 remains resolved and should not be reopened for this Settings hub work; this branch intentionally avoids `.returning-ui-inventory` and the page-level inventory dock contract except to preserve its exemption.

Future agents touching Settings should treat the hub and inventory as separate scroll/clearance owners: non-inventory Settings uses `.returning-ui`, while Pantry/Tools use `.returning-ui-inventory` plus the page-level action dock.

Future agents touching Live Cooking timer state should preserve the distinction between ready/reset (`timer === 0`), paused (`timer > 0` and not running), running, and complete.

## Open items

- Open a PR from this branch and let exact-head GitHub checks run, especially `e2e_guest_smoke`.
- Do not merge without Wilson approval.
- Human Replit validation is deferred to release/batch validation unless Wilson wants a PR-level mobile smoke; the focused release check is recorded in `docs/production-validation-registry.md`.
- EFF-034 should stay `In Progress` until the PR merges and closeout can verify the final head.

## Verification

Local checks passed:

- `npx vitest run tests/unit/live-cooking-guest-session.test.tsx tests/unit/user-settings-scan-policy.test.tsx tests/unit/setup-button-css.test.ts tests/unit/planning-choice.test.tsx --testTimeout=15000`
- `npm run check`
- `npm run test:unit`
- `npm run build`
- `npm audit --audit-level=high`
- `git diff --check`
- `npx playwright test --project=chromium --list`

The high audit gate still reports the known low `body-parser` and moderate `protobufjs` advisories outside the high threshold. Build still reports the existing stale Browserslist, Firebase dynamic/static import, and bundle-size warnings.

Local service-backed E2E is not claimed. Starting local dev through dotenvx required running outside the sandbox because `tsx` hit an IPC `listen EPERM` under `/var/folders/.../tsx-501/...pipe`; after startup, the configured local Neon endpoint returned disabled-endpoint failures for `/api/auth/session` via `anonymous_recipe_usage`. The screenshot probe therefore used Playwright route stubs for auth/session and provider routes and is visual/geometry evidence only.

UI-only screenshot evidence at `390x844`:

- Settings probe: `documentHeight: 844`, `viewportHeight: 844`, `scrollTail: 0`, bottom-nav height `57`.
- Timer probe after Start -> Pause -> Reset: `timerState: {"text":"0:02:00","state":"ready"}`.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `742694d9d209dba04674ce7188319d7f449c4a6e`
- Last Replit-validated at: not validated; human Replit validation deferred to release/batch unless Wilson asks for PR-level mobile smoke
- Notes: not stacked on another branch; open PR #274 is EFF-022-adjacent and not touched; open PR #281 is cooking-schema work and not touched
