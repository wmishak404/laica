# EFFORT-006 closeout and epic-workflow cleanup

**Agent:** codex
**Branch:** codex/epic-006-closeout
**Date:** 2026-04-27

## Summary

Closed the documentation gap after PR #17 merged. EFFORT-006 is now formally marked `Resolved`, EFFORT-007 remains `Open`, and the workflow docs now explicitly require an epic closeout pass after merged code satisfies an epic's resolution criteria.

This handoff also records a small process improvement for EFFORT-005: merge-ready feature work and epic bookkeeping should not drift apart.

## Changes

- `efforts/effort-006-equipment-vision-exclusions.md`
  - Flipped status from `In Progress` to `Resolved`
  - Added a final dated resolution section referencing PR #17, fixture validation, and the implementation handoffs
- `efforts/README.md`
  - Removed EFFORT-006 from the active epic read list
- `efforts/registry.md`
  - Marked EFFORT-006 as `Resolved` with `2026-04-27` as the resolved date
  - Updated the final signal to reflect prompt tightening, the narrow equipment filter, and fixture validation merged via PR #17
- `efforts/effort-005-testing-strategy-and-acceptance-criteria.md`
  - Added a dated note that epic closure after merge needs a docs pass, not just merged code
- `AGENTS.md`
  - Added the missing currently active Efforts (`007`, `009`, `010`)
  - Added an explicit “epic closeout after merge” workflow section
- `CLAUDE.md`
  - Mirrored the epic closeout rule
  - Added the missing active Efforts (`007`, `009`, `010`)
  - Expanded the planning-doc auto-push note to include `CLAUDE.md`

## Impact on other agents

- EFFORT-006 should now be treated as historical context, not an active read-before-work epic.
- EFFORT-007 is still active and should be read before changing zero-result image-scan messaging.
- After future feature PRs merge, agents should not assume the merge implicitly closes the related epic. Do a short follow-up docs pass from fresh `main` to:
  1. flip status
  2. add a final resolution note
  3. update `efforts/README.md`
  4. update `efforts/registry.md`
  5. push a handoff

## Open items

- EFFORT-007 remains open until the UI explicitly communicates valid zero-result scans on the silent surfaces.
- EFFORT-005 is still open; this change adds workflow signal but does not resolve the broader testing/acceptance-criteria strategy.

## Verification

- `git diff --check`
- Read-through consistency check across:
  - `efforts/effort-006-equipment-vision-exclusions.md`
  - `efforts/README.md`
  - `efforts/registry.md`
  - `AGENTS.md`
  - `CLAUDE.md`
