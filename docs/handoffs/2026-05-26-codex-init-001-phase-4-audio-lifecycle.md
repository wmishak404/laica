# INIT-001 Phase 4 audio lifecycle acceptance note

**Agent:** codex
**Branch:** codex/init-003-preauth-homepage
**Date:** 2026-05-26
**Initiative:** INIT-001
**INIT updated:** yes

## Summary

Wilson's Replit validation of PR #102 found that voice playback can continue after pressing Back to Planning from the cooking guide when voice synthesis has already been triggered. This should be treated as INIT-001 Phase 4 acceptance scope, not as an INIT-003 Plan B blocker, because Phase 4 owns the final cooking-guide lifecycle and hands-busy audio behavior.

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

- Phase 4 implementation must add the actual audio cleanup behavior and tests/smoke coverage.
- PR #102 Replit validation passed the reported happy paths at `a55ae46`; this docs-only follow-up moves the branch head if pushed and therefore needs the PR validation SHA refreshed before merge under the current workflow rules.
