# EPIC-006 closeout and epic-workflow cleanup

**Agent:** codex
**Branch:** codex/epic-006-closeout
**Date:** 2026-04-27

## Summary

Closed the documentation gap after PR #17 merged. EPIC-006 is now formally marked `Resolved`, EPIC-007 remains `Open`, and the workflow docs now explicitly require an epic closeout pass after merged code satisfies an epic's resolution criteria.

This handoff also records a small process improvement for EPIC-005: merge-ready feature work and epic bookkeeping should not drift apart.

## Changes

- `epics/006-equipment-vision-exclusions.md`
  - Flipped status from `In Progress` to `Resolved`
  - Added a final dated resolution section referencing PR #17, fixture validation, and the implementation handoffs
- `epics/README.md`
  - Removed EPIC-006 from the active epic read list
- `epics/registry.md`
  - Marked EPIC-006 as `Resolved` with `2026-04-27` as the resolved date
  - Updated the final signal to reflect prompt tightening, the narrow equipment filter, and fixture validation merged via PR #17
- `epics/005-testing-strategy-and-acceptance-criteria.md`
  - Added a dated note that epic closure after merge needs a docs pass, not just merged code
- `AGENTS.md`
  - Added the missing currently active epics (`007`, `009`, `010`)
  - Added an explicit “epic closeout after merge” workflow section
- `CLAUDE.md`
  - Mirrored the epic closeout rule
  - Added the missing active epics (`007`, `009`, `010`)
  - Expanded the planning-doc auto-push note to include `CLAUDE.md`

## Impact on other agents

- EPIC-006 should now be treated as historical context, not an active read-before-work epic.
- EPIC-007 is still active and should be read before changing zero-result image-scan messaging.
- After future feature PRs merge, agents should not assume the merge implicitly closes the related epic. Do a short follow-up docs pass from fresh `main` to:
  1. flip status
  2. add a final resolution note
  3. update `epics/README.md`
  4. update `epics/registry.md`
  5. push a handoff

## Open items

- EPIC-007 remains open until the UI explicitly communicates valid zero-result scans on the silent surfaces.
- EPIC-005 is still open; this change adds workflow signal but does not resolve the broader testing/acceptance-criteria strategy.

## Verification

- `git diff --check`
- Read-through consistency check across:
  - `epics/006-equipment-vision-exclusions.md`
  - `epics/README.md`
  - `epics/registry.md`
  - `AGENTS.md`
  - `CLAUDE.md`
