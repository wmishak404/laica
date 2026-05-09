# Epic status audit

**Agent:** codex
**Branch:** codex/epic-status-audit
**Date:** 2026-05-09
**Initiative:** none
**INIT updated:** n/a

## Summary

Audited all epics from fresh `origin/main` (`3a4c256`) after Wilson asked whether any epics had stale closeout/status state. No additional epic met its full `Resolved` criteria. The stale signal was mostly status vocabulary: several epics were still `Open` even though implementation, validation evidence, or accepted workflow planning had already started.

## Changes

- Moved these epics from `Open` to `In Progress`:
  - [EPIC-004](../../epics/004-selection-controls-tap-targets.md)
  - [EPIC-005](../../epics/005-testing-strategy-and-acceptance-criteria.md)
  - [EPIC-007](../../epics/007-vision-scan-no-detection-feedback.md)
  - [EPIC-009](../../epics/009-consistent-comma-separated-ingredient-entry.md)
  - [EPIC-016](../../epics/016-slop-bowl-hex-literal-cleanup.md)
  - [EPIC-019](../../epics/019-ai-error-telemetry-and-eval-monitoring.md)
  - [EPIC-020](../../epics/020-workflow-documentation-audit.md)
- Updated [epics/README.md](../../epics/README.md) and [epics/registry.md](../../epics/registry.md) so the active read list and registry match the authoritative epic files.
- Added dated audit notes to each changed epic explaining why it is `In Progress` and what still blocks resolution.

## Why Nothing Newly Resolved

- EPIC-004: shipped full-row controls exist, but setup/settings closeout still needs keyboard/focus/assistive/mobile tap validation and a note handling the removed Weekly Cooking Time criterion.
- EPIC-007: explicit no-detection feedback shipped, but the named negative-control validation criterion remains open.
- EPIC-009: shared parser and Slop Bowl quick-add integration shipped, but browser/Replit quick-add validation remains open.
- EPIC-016: Slop Bowl hex cleanup started, but visual comparison and EPIC-015 enforcement remain open.
- EPIC-005 and EPIC-020: EPIC-020 owns the graduation path; the central testing/acceptance workflow artifact still does not exist.
- EPIC-019: INIT-002 Phase 0 and PD-010 merged, but runtime telemetry phases are still future work.

## Audit Result By Status

Resolved: EPIC-001, EPIC-002, EPIC-003, EPIC-006, EPIC-008, EPIC-012, EPIC-018, EPIC-021.

In Progress: EPIC-004, EPIC-005, EPIC-007, EPIC-009, EPIC-016, EPIC-019, EPIC-020.

Open: EPIC-010, EPIC-013, EPIC-014, EPIC-015.

Deferred: EPIC-017.

Numbering note: there is no current `epics/011-*.md` file. The only current reference found says the former EPIC-011 intent was folded into Phase 2.1 and superseded by that work.

## Verification

- Confirmed the worktree was at fresh `origin/main` before editing.
- Checked GitHub PR state with `gh pr list --state all --limit 80`.
- Searched active/read-list, registry, handoff, product-decision, initiative, and code evidence for each active epic.
- Ran `git diff --check`.
