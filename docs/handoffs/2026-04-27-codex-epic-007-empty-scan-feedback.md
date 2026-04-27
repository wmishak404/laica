# EPIC-007 Empty Scan Feedback Filed

**Agent:** codex
**Branch:** codex/equipment-vision-prompt-fix
**Date:** 2026-04-27

## Summary

Filed EPIC-007 to track a UI workflow gap: when image analysis correctly detects nothing, some scan surfaces explicitly tell the user while others silently do nothing. This is now tracked separately from EPIC-006 so model-quality work and UI-feedback work do not get blurred together.

## Changes

- `epics/007-vision-scan-no-detection-feedback.md`
  - New epic capturing the UX issue, current implementation evidence, scope, open questions, and resolution criteria.
- `epics/README.md`
  - Added EPIC-007 to the active read list as an `Open` epic.
- `epics/registry.md`
  - Added the new epic to the registry with its current backlog signal.
- `epics/001-ui-governance.md`
  - Added a dated note pointing out that scan feedback consistency is another utilitarian-surface issue now split into EPIC-007.

## Impact on other agents

- Read `epics/007-vision-scan-no-detection-feedback.md` before changing scan-result feedback in `user-settings` or `user-profiling`.
- This adds signal to `epics/001-ui-governance.md`: utilitarian scan flows should not mix silent no-op endings, browser alerts, and toasts without intention.
- EPIC-006 remains about detection correctness; EPIC-007 is about explaining valid empty results to the user.

## Open items

- No implementation yet.
- Still needs product choice on the preferred feedback pattern for zero-result scans:
  - toast only
  - inline status
  - both
- Multi-image mixed-result behavior is still intentionally undecided.

## Verification

- Read current scan flows in:
  - `client/src/components/cooking/user-settings.tsx`
  - `client/src/components/cooking/user-profiling.tsx`
- Confirmed current evidence:
  - `user-settings` already shows `No ingredients detected` / `No equipment detected` toasts
  - `user-profiling` pantry single-image flow shows an alert
  - `user-profiling` kitchen single-image and all-empty multi-image flows can end silently
