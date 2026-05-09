# Epic Status Registry

**Agent:** codex
**Branch:** codex/epic-status-registry
**Date:** 2026-04-21

## Summary

Added a compact Effort status model so new agent windows can quickly tell which Efforts are active versus resolved. This addresses the confusion where EFFORT-002 and EFFORT-003 were closed in their individual files, but that closure was not obvious enough from the top-level discovery surface.

Follow-up note: this initial handoff was refined by `2026-04-21-codex-scalable-epic-registry.md`, which moved the complete all-epic list into `efforts/registry.md` and kept `efforts/README.md` focused on active work.

## Changes

- `efforts/README.md` now defines the approved status vocabulary: `Open`, `In Progress`, `Blocked`, `Deferred`, and `Resolved`.
- `efforts/registry.md` now includes an all-epic registry with EFFORT-002 and EFFORT-003 explicitly marked `Resolved`.
- `efforts/README.md` keeps the status model and active read list for Efforts agents must check before governed work.
- `AGENTS.md` and `CLAUDE.md` now instruct agents to check the active read list first and treat `Resolved` as closed/completed.

## Impact on other agents

Agents should use `efforts/README.md` as the first stop for Effort status. The active read list remains intentionally short, while resolved Efforts remain discoverable for historical context through `efforts/registry.md`.

Do not introduce a separate `Closed` status; use `Resolved` when an epic's resolution criteria or accepted decision is complete.

## Open items

No product or runtime work is included. If the status system needs automation later, EFFORT-005 is the right place to discuss validation/reporting workflow, but this change intentionally stays lightweight.

## Verification

Documentation-only change. Confirmed the affected markdown files render as plain tables/lists and no app checks were required.
