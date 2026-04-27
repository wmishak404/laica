# EPIC-007 Empty Scan Feedback Filed

**Agent:** codex
**Branch:** codex/equipment-vision-prompt-fix
**Date:** 2026-04-27

## Summary

Filed EPIC-007 as a small backlog reminder discovered during equipment-scan validation: when image analysis correctly detects nothing, some scan surfaces explicitly tell the user while others silently do nothing. This is intentionally narrower than a broad scan-UX initiative and exists so the gap is not forgotten while EPIC-006 continues.

## Changes

- `epics/007-vision-scan-no-detection-feedback.md`
  - New `Open` epic capturing the no-detection feedback gap as a validation follow-up rather than an implementation-ready UX project.
- `epics/README.md`
  - Added EPIC-007 to the active read list as an `Open` epic.
- `epics/registry.md`
  - Added the new epic to the registry with its current backlog signal.
- `epics/006-equipment-vision-exclusions.md`
  - Added a dated note linking EPIC-007 as a follow-up discovered during equipment-scan validation.

## Impact on other agents

- Read `epics/007-vision-scan-no-detection-feedback.md` before changing scan-result feedback in `user-settings` or `user-profiling`.
- EPIC-006 remains about detection correctness; EPIC-007 preserves a smaller UI follow-up discovered during that validation work.
- This epic does not yet commit the team to a broader scan-feedback redesign.

## Open items

- No implementation yet.
- Final UI pattern is intentionally undecided.
- Multi-image mixed-result behavior is intentionally undecided.

## Verification

- Read current scan flows in:
  - `client/src/components/cooking/user-settings.tsx`
  - `client/src/components/cooking/user-profiling.tsx`
- Confirmed current evidence:
  - `user-settings` already shows `No ingredients detected` / `No equipment detected` toasts
  - `user-profiling` pantry single-image flow shows an alert
  - `user-profiling` kitchen single-image and all-empty multi-image flows can end silently
