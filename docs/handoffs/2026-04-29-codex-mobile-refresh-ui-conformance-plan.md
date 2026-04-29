# Mobile Refresh UI Conformance Plan

**Agent:** codex
**Branch:** codex/mobile-refresh-phase-2-setup
**Date:** 2026-04-29

## Summary

Captured Wilson's Phase 2 UI review as a docs-only planning correction. The new rule is that mobile-refresh mockups are implementation inputs and phase acceptance must include visual conformance, not only functional behavior.

## Changes

- `product-decisions/features/mobile-refresh/README.md`
  - Added a cross-phase mockup conformance gate for phases with linked mockups.
  - Clarified that phase PRs are not ready when primary screens remain visually pre-refresh unless the visual work is explicitly deferred.
- `product-decisions/features/mobile-refresh/phase-02-setup.md`
  - Added a 2026-04-29 scope correction for PR #23 feedback.
  - Recorded that setup visual polish and Back/escape from camera flow are Phase 2 readiness items.
- `product-decisions/features/mobile-refresh/phase-03-planning.md`
  - Added a visual scope note that the unchanged Planning cards are pre-refresh UI and are not acceptable Phase 3 completion.
- `epics/001-ui-governance.md`
  - Added new evidence that mockup conformance should be part of UI governance.
- `epics/005-testing-strategy-and-acceptance-criteria.md`
  - Added new evidence that deterministic checks can miss visual acceptance failures.

## Impact on other agents

PR #23 should stay draft until the setup flow is visually polished toward the Phase 2 mockup and the Pantry/Kitchen camera steps have a clear Back/escape path. Future Phase 3-5 validation should compare primary screens against the linked mockups as part of acceptance.

## Open items

- Decide whether Planning entry visual redesign stays in Phase 3 or is pulled forward into a Phase 2.x polish pass.
- Wilson still has additional manual PR #23 testing to complete beyond this UI documentation update.

## Verification

Docs-only change. Verify with `git diff --check` and by confirming no source, env, package, script, or schema files changed.
