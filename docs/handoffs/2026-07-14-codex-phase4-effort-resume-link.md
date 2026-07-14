# Phase 4 Effort Resume Link

**Date:** 2026-07-14
**Branch:** `codex/chef-preview-image-effort`
**Owner:** Codex
**Status:** Docs-only routing update; no runtime implementation

## Summary

Wilson asked whether EFF-028 and EFF-029 would appear when an agent or automation resumes INIT-001 Phase 4. They would not have appeared from the Phase 4 resume path because EFF-028 was linked to Phase 3 / Phase 3.1 and EFF-029 was only in a separate draft PR linked to Phase 2.1 / Phase 2.2. This branch consolidates both Effort filings and adds Phase 4 resume pointers so automation sees them as the next adjacent work before another Phase 4 runtime slice.

## Changed

- Brought EFF-029 into this branch so the Phase 4 links point to files present in the same branch.
- Updated `initiatives/INIT-001-mobile-refresh.md` `## Current Resume Point` so the first next-focus item says to pick up EFF-028 and EFF-029 after thread `019f3b47-9d04-7a03-8973-2a9cd1bb19b4` merges.
- Updated `product-decisions/features/mobile-refresh/pd-phase-04-cooking.md` with a 2026-07-14 adjacent Efforts section plus Effort Interactions entries for EFF-028 and EFF-029.
- Preserved the scope boundary: these are adjacent visual/layout tasks before more Phase 4 runtime work, not new provider, schema, prompt, navigation, Ready Check, Prep Tray content, or Live Cooking behavior.

## Coordination

This branch supersedes the separate EFF-029-only draft PR #286 because it carries EFF-029 plus the Phase 4 routing link. PR #287 should be the branch automation/agents use for the combined docs update.

The implementation gate remains unchanged: do not implement EFF-028 or EFF-029 until Codex thread `019f3b47-9d04-7a03-8973-2a9cd1bb19b4` has merged.

## Validation

Docs-only validation:

- `git diff --check`
- Targeted `rg` checks for `EFF-028`, `EFF-029`, `019f3b47`, and `adjacent Efforts`

Replit validation is not required because this branch changes documentation and routing only.
