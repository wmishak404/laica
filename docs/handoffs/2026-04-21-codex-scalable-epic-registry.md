# Scalable Effort Registry

**Agent:** codex
**Branch:** codex/epic-status-registry
**Date:** 2026-04-21

## Summary

Refined the Effort status workflow so new agent windows get a small active-work entrypoint while the project still keeps complete resolved/deferred history. This follows Wilson's direction to avoid loading thousands of closed Efforts into default context later.

## Changes

- Added `product-decisions/pd-007-effort-status-and-registry-workflow.md` as the durable accepted workflow.
- Added `efforts/registry.md` as the complete all-Effort index.
- Slimmed `efforts/README.md` so it keeps the status model, active Effort read list, and a link to the full registry.
- Updated `AGENTS.md` and `CLAUDE.md` to direct agents to `efforts/README.md` first and `efforts/registry.md` only when historical context is directly relevant.
- Updated `product-decisions/README.md` to include PD-007.

## Impact on other agents

For ordinary feature work, read `efforts/README.md` and then only the active Efforts that match the governed domain. Do not read all resolved Efforts by default.

Use `Resolved` as the closed/completed status. Do not introduce a separate `Closed` status.

## Open items

No runtime or product behavior changed. If the Effort registry later grows too large for one markdown file, it can be generated or sharded by year/status without changing the default agent workflow.

## Verification

Documentation-only change. Verified the README no longer carries the all-Effort table, the registry lists all five current items, and EFF-002/EFF-003 are marked `Resolved`.
