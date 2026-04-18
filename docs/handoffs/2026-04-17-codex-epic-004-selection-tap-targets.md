# EPIC-004 Selection Tap Targets

**Agent:** codex
**Branch:** codex/epic-002-003-flow-fixes
**Date:** 2026-04-17

## Summary
Created a new backlog epic for the cooking-profile selection-control usability issue Wilson flagged during localhost review: radio-style menus currently require overly precise clicking on the dot itself, but visually read like full selectable rows.

The new epic frames the work as a focused form-control/tap-target problem rather than folding it into the broader UI governance effort. It also records the exact duplicated code paths in onboarding and settings so implementation can happen as a targeted client pass later.

## Changes
- `epics/004-selection-controls-tap-targets.md`
  - New epic documenting the problem, current code evidence, scope, open questions, checklist, and resolution criteria.
- `epics/README.md`
  - Added EPIC-004 to the open-epic index.
- `AGENTS.md`
  - Added EPIC-004 to the repo-level open-epics rule so future work on onboarding/settings selection rows reads it first.
- `epics/001-ui-governance.md`
  - Added a dated note linking this new issue back to the broader governance track as utilitarian-form consistency signal.

## Impact on other agents
- EPIC-004 is now the source of truth before anyone changes the cooking-profile radio-style selection rows in onboarding or settings.
- EPIC-001 is still deferred overall, but this new epic adds concrete evidence that form-control hit areas are part of the governance story.
- No code behavior changed in this pass; this is planning-doc work only.

## Open items
- The implementation itself is still open.
- Wilson may want to choose between a subtler full-row selection list and a more card-like button treatment if proposed UI options differ meaningfully.
- Once implementation lands, the epic should gain a dated resolution note and be removed from the open-epic lists.

## Verification
- Verified current implementation references in:
  - `client/src/components/cooking/user-profiling.tsx`
  - `client/src/components/cooking/user-settings.tsx`
  - `client/src/components/ui/radio-group.tsx`
- No runtime verification needed; this pass only adds planning artifacts.
