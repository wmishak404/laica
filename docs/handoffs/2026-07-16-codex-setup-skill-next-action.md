# Setup skill Next action

**Agent:** codex
**Branch:** `codex/setup-skill-next-action`
**Date:** 2026-07-16
**Initiative:** [INIT-001 - Mobile Refresh](../../initiatives/INIT-001-mobile-refresh.md)
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary

The first-time setup cooking-skill page now follows the same deliberate Back/Next rhythm as the surrounding setup pages. Users select `Beginner`, `Intermediate`, or `Expert`, see the selected row state, and then tap the bottom `Next` button to continue to Dietary. This makes setup progression clearer and more consistent without changing Pantry, Tools, Dietary, Ready, returning Settings, provider routes, schema, navigation, or Live Cooking behavior.

## Changes

- `client/src/components/cooking/user-profiling.tsx`
  - Removes cooking-skill row auto-advance.
  - Renders the shared setup bottom `Next` action on step 3.
  - Reuses the existing `canProceed()` guard so `Next` stays disabled until a skill is selected.
- `tests/unit/user-profiling.test.tsx`
  - Replaces the old auto-advance expectation with select-then-Next coverage.
  - Updates the ready-confirmation scroll-reset test path to tap `Next` after selecting a skill.
- `tests/e2e/cooking-workflow.test.ts`
  - Updates the guest setup smoke helper to tap bottom `Next` after selecting the cooking-skill row.
- `efforts/effort-030-setup-skill-next-action.md`, `efforts/README.md`, `efforts/registry.md`
  - Records Wilson's 2026-07-16 decision and marks EFF-030 `In Progress`.
- `initiatives/INIT-001-mobile-refresh.md`, `initiatives/registry.md`
  - Records the active EFF-030 branch and selected setup interaction.

## Impact on other agents

EFF-030 no longer needs the row-tap versus explicit-Next decision. Future work should treat select-then-Next as the accepted first-time setup behavior for the cooking-skill page.

Returning Settings cooking-profile edits were intentionally not changed. If that surface should later adopt the same explicit action pattern, it needs its own scoped decision or follow-up.

## Open items

- Exact-head GitHub checks need to be rerun after the E2E helper update.
- Wilson reported the behavior looked great from his own spot check before the merge-readiness refresh. Exact-head human Replit validation is still not claimed after rebasing onto PR #294/#298; the accepted deferral remains release/batch validation unless Wilson wants another PR-level mobile setup smoke.

## Verification

Passed locally after rebasing onto current `origin/main`:

- `npm ci`
- `npm audit --audit-level=high` - found 0 vulnerabilities
- `npx vitest run tests/unit/user-profiling.test.tsx --testTimeout=15000` - 18 tests passed
- `npm run test:unit` - 50 files / 386 tests passed
- `npm run check`
- `npm run build` - passed with existing Browserslist, Firebase mixed import, and chunk-size warnings
- `git diff --check origin/main...HEAD`

GitHub ready-for-review follow-up:

- First ready-for-review run at `bb64c04b` passed `unit`, `npm-audit`, `trufflehog_pr`, and CodeQL, but failed `e2e_guest_smoke` because the Playwright setup helper still expected cooking-skill row tap to auto-advance.
- This branch now updates the E2E helper to match the accepted select-then-Next behavior; exact-head GitHub E2E needs rerun after push.

Value claim: first-time setup now uses one consistent interaction model across the setup pages: select the relevant page option, then use the bottom `Next` action to continue.

Evidence limits: local tests cover the React interaction contract and setup flow state; Wilson's own spot check accepted the behavior before the rebase; GitHub exact-head CI/E2E has not run yet; no exact-head Replit/mobile visual smoke is claimed after the rebase.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `d3051cda`
- Last Replit-validated at: Wilson spot check before rebase; exact-head Replit validation deferred to release/batch validation
- Notes: independent EFF-030 setup-flow slice. It does not take over PR #294, PR #281, or any other active branch.
