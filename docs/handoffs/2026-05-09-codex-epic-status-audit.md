# Epic status audit (superseded by Effort cleanup)

**Agent:** codex
**Branch:** codex/epic-status-audit
**Date:** 2026-05-09
**Initiative:** none
**INIT updated:** n/a

## Summary

Audited all former Epics from fresh `origin/main` (`3a4c256`) after Wilson asked whether any items had stale closeout/status state. This first pass was superseded by [the Effort system cleanup handoff](2026-05-09-codex-effort-system-cleanup.md), which closed the groomed stale/governance items and renamed the system to Efforts.

## Changes

- In the initial pass, moved these items from `Open` to `In Progress` before Wilson approved closing them:
  - [EFFORT-004](../../efforts/effort-004-selection-controls-tap-targets.md)
  - [EFFORT-005](../../efforts/effort-005-testing-strategy-and-acceptance-criteria.md)
  - [EFFORT-007](../../efforts/effort-007-vision-scan-no-detection-feedback.md)
  - [EFFORT-009](../../efforts/effort-009-consistent-comma-separated-ingredient-entry.md)
  - [EFFORT-016](../../efforts/effort-016-slop-bowl-hex-literal-cleanup.md)
  - [EFFORT-019](../../efforts/effort-019-ai-error-telemetry-and-eval-monitoring.md)
  - [EFFORT-020](../../efforts/effort-020-workflow-documentation-audit.md)
- Updated [efforts/README.md](../../efforts/README.md) and [efforts/registry.md](../../efforts/registry.md) so the active read list and registry matched the authoritative files at that point.
- Added dated audit notes to each changed file explaining why it was `In Progress` and what still blocked resolution at that point.

## Why Nothing Newly Resolved

- EFFORT-004: shipped full-row controls exist, but setup/settings closeout still needs keyboard/focus/assistive/mobile tap validation and a note handling the removed Weekly Cooking Time criterion.
- EFFORT-007: explicit no-detection feedback shipped, but the named negative-control validation criterion remains open.
- EFFORT-009: shared parser and Slop Bowl quick-add integration shipped, but browser/Replit quick-add validation remains open.
- EFFORT-016: Slop Bowl hex cleanup started, but visual comparison and EFFORT-015 enforcement remain open.
- EFFORT-005 and EFFORT-020: EFFORT-020 owns the graduation path; the central testing/acceptance workflow artifact still does not exist.
- EFFORT-019: INIT-002 Phase 0 and PD-010 merged, but runtime telemetry phases are still future work.

## Superseded Audit Result By Status

Resolved: EFFORT-001, EFFORT-002, EFFORT-003, EFFORT-006, EFFORT-008, EFFORT-012, EFFORT-018, EFFORT-021.

In Progress: EFFORT-004, EFFORT-005, EFFORT-007, EFFORT-009, EFFORT-016, EFFORT-019, EFFORT-020.

Open: EFFORT-010, EFFORT-013, EFFORT-014, EFFORT-015.

Deferred: EFFORT-017.

Numbering note: there is no current `efforts/effort-011-*.md` file. The only current reference found says the former EFFORT-011 intent was folded into Phase 2.1 and superseded by that work.

## Verification

- Confirmed the worktree was at fresh `origin/main` before editing.
- Checked GitHub PR state with `gh pr list --state all --limit 80`.
- Searched active/read-list, registry, handoff, product-decision, initiative, and code evidence for each active item.
- Ran `git diff --check`.
