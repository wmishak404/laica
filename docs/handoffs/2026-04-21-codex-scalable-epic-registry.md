# Scalable Epic Registry

**Agent:** codex
**Branch:** codex/epic-status-registry
**Date:** 2026-04-21

## Summary

Refined the epic status workflow so new agent windows get a small active-work entrypoint while the project still keeps complete resolved/deferred epic history. This follows Wilson's direction to avoid loading thousands of closed epics into default context later.

## Changes

- Added `product-decisions/007-epic-status-and-registry-workflow.md` as the durable accepted workflow.
- Added `epics/registry.md` as the complete all-epic index.
- Slimmed `epics/README.md` so it keeps the status model, active epic read list, and a link to the full registry.
- Updated `AGENTS.md` and `CLAUDE.md` to direct agents to `epics/README.md` first and `epics/registry.md` only when historical context is directly relevant.
- Updated `product-decisions/README.md` to include PD-007.

## Impact on other agents

For ordinary feature work, read `epics/README.md` and then only the active epics that match the governed domain. Do not read all resolved epics by default.

Use `Resolved` as the closed/completed status. Do not introduce a separate `Closed` status.

## Open items

No runtime or product behavior changed. If the epic registry later grows too large for one markdown file, it can be generated or sharded by year/status without changing the default agent workflow.

## Verification

Documentation-only change. Verified the README no longer carries the all-epic table, the registry lists all five current epics, and EPIC-002/EPIC-003 are marked `Resolved`.
