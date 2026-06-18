# INIT-001 Phase 4 audio lifecycle acceptance note

**Agent:** codex
**Branch:** codex/init-003-preauth-homepage
**Date:** 2026-05-26
**Initiative:** INIT-001
**INIT updated:** yes

## Summary

Wilson's Replit validation of PR #102 found that voice playback can continue after pressing Back to Planning from the cooking guide when voice synthesis has already been triggered. This should be treated as INIT-001 Phase 4 acceptance scope, not as an INIT-003 Plan B blocker, because Phase 4 owns the final cooking-guide lifecycle and hands-busy audio behavior.

## 2026-06-17 status update

[PR #191](https://github.com/wmishak404/laica/pull/191) implements the runtime fix for this reported exit bug on `codex/init-001-cooking-audio-cleanup`: Back to Planning, Finish, and unmount now share audio lifecycle cleanup; delayed speech, late synthesis responses, browser speech synthesis, retry timers, and abandoned recording work are cancelled or ignored after exit. Wilson's 2026-06-17 follow-up expanded the merge bar from this single exit bug to the broader Live Cooking speech-arbitration matrix. The 2026-06-18 PR update implemented that matrix for current Live Cooking controls with passing deterministic tests. The exit bug and matrix should be treated as implemented in PR #191, but not resolved on `main` until the PR lands.

## Changes

- `product-decisions/features/mobile-refresh/pd-phase-04-cooking.md`
  - Added an Audio lifecycle decision section.
  - Added an acceptance criterion requiring Back to Planning, Finish, sign-out, browser back, route changes, and unmounts to stop playback and cancel queued synthesis/recording work.
- `initiatives/INIT-001-mobile-refresh.md`
  - Added the Replit-discovered Phase 4 audio lifecycle acceptance item to the INIT-003 Plan B cross-note.

## Validation

- Docs-only change.
- `git diff --check`

## Open items

- PR #191 adds the exit audio cleanup behavior, the current-control speech-arbitration layer, and passing deterministic coverage for the expanded matrix documented in `product-decisions/features/mobile-refresh/pd-phase-04-cooking.md`. Remaining action before merge readiness: exact-head full local validation, non-draft GitHub checks, Wilson review/merge decision, and post-merge INIT closeout from fresh `origin/main`.
- PR #102 Replit validation passed the reported happy paths at `a55ae46`; this docs-only follow-up moves the branch head if pushed and therefore needs the PR validation SHA refreshed before merge under the current workflow rules.
