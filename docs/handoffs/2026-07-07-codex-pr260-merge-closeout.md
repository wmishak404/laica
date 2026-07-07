# PR #260 Merge Closeout

**Agent:** codex
**Branch:** codex/pr260-merge-closeout
**Date:** 2026-07-07
**Initiative:** INIT-001
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary

PR #260 is merged and now forms the current INIT-001 Phase 4 Live Cooking cockpit baseline. The merge locks in the accepted compact cooking surface after Ready Check: one `Start cooking` entry, sticky action headline, action-forward step-preview rail, compact cues, opt-in CC captions, bottom Repeat / Ask a question / mute controls, best-effort screen wake lock, and the atomic-step/action-label prompt plus client fallback behavior.

This closeout updates the durable INIT and Phase 4 records so later agents do not treat `codex/init-001-phase4-step-coach` as still in progress. Timer redesign, warm coral/rust cooking-background polish, full provider schema shape, formal step-preview eval calibration, production/release-batch Replit validation, and Phase 5 cleanup remain follow-up scope.

## Changes

- `initiatives/INIT-001-mobile-refresh.md`
  - Records PR #260 as merged as `72df557`.
  - Moves the cockpit branch from in-progress to merged in the phase table and PR table.
  - Updates the current resume point so future Phase 4 work starts from PR #260 as the merged cockpit baseline.
- `initiatives/registry.md`
  - Updates INIT-001's registry summary from current cockpit branch to merged cockpit baseline.
- `product-decisions/features/mobile-refresh/pd-phase-04-cooking.md`
  - Converts the Live Cooking cockpit slice from branch language to merged PR #260 history.
  - Records exact-head GitHub evidence at `0040f9f` and the deferred Replit validation lane.

## Impact on other agents

Treat PR #191, PR #236, PR #256, PR #258, and PR #260 as the merged Phase 4 baseline before doing more Live Cooking work. Later Phase 4 slices should preserve the speech arbitration, recovery/Finish honesty, invalid-step validation, Ready Check gating, and compact cockpit/action-label behavior unless Wilson explicitly changes direction.

I also read the parallel INIT-004 handoff on branch `codex/init-004-step-preview-evals` at `0d78da0`. The proposed fixture object shape maps cleanly to PR #260 runtime concepts:

- raw provider label: provider `actionLabel`
- normalized provider label: `normalizeStepActionLabel(...)` result when accepted or rescued
- fallback label: `deriveStepActionLabel(...)`
- final rendered preview/headline label: `buildStepPreviewLabels(...)` output, then `getStepHeadline(...)` for the current step
- sibling lists: the raw/normalized provider list before rendering and `buildStepPreviewLabels(...)` output after rendering

The one correction for INIT-004 is the hard rendered-card character limit: PR #260 currently uses `STEP_ACTION_LABEL_MAX_CHARS = 24` and `STEP_ACTION_LABEL_MAX_WORDS = 5`, so future fixtures should prefer `maxCharacters: 24` instead of the synthetic `28` when they want to mirror runtime exactly. Pixel/card-fit validation remains future scope.

## Open items

- Human Replit validation remains deferred to the next production/release batch. The batch should smoke PR #236, PR #256, PR #258, and PR #260 together: Ready Check -> generated atomic steps -> sticky action headline -> action-forward step-preview rail -> compact cues -> CC caption toggle -> bottom Repeat / Ask a question / mute controls -> optional timer -> Back/Finish cleanup.
- Warm coral/rust active-cooking background polish remains future Phase 4 design work.
- Full timer redesign remains future Phase 4 work.
- Formal `live_cooking_step_previews` eval fixtures/calibration continue under INIT-004, separate from PR #260 runtime.

## Verification

- PR #260 merged on GitHub as `72df55749b8c9a83ad6e5d5123a64592eb40dbfb`.
- Validated PR head before merge was `0040f9f43d78634b0341a20a16a43c3c5a06109d`.
- Exact-head GitHub checks were green before merge: `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, CodeQL `Analyze (actions)`, CodeQL `Analyze (javascript-typescript)`, and aggregate CodeQL. `trufflehog_push` skipped as expected.
- Closeout branch started from fresh `origin/main` at the merge commit.
- Closeout validation: `git diff --check`. `npm run check` was not rerun for this docs-only closeout because the fresh closeout worktree does not have `node_modules` installed; PR #260 code evidence remains the exact-head GitHub and local checks recorded above.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `72df55749b8c9a83ad6e5d5123a64592eb40dbfb`
- Last Replit-validated at: not yet validated for PR #260
- Notes: PR #260 human Replit validation is deferred to release/batch validation per the PR evidence and INIT-001 validation lane.
