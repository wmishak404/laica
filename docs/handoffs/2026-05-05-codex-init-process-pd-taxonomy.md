# INIT-001 process and product-decision taxonomy cleanup

**Agent:** codex
**Branch:** codex/init-process-pd-taxonomy
**Date:** 2026-05-05
**Initiative:** INIT-001
**INIT updated:** yes

## Summary

Implemented Wilson's docs-only process cleanup plan for INIT-001 and product decisions. The branch keeps product rationale strong while reducing duplicate diary-like context across INIT, phase records, handoffs, and governance docs.

The main policy change is documentation taxonomy: top-level `PD-xxx` files are stable decision records with controlled amendments; feature-phase records are phase-scoped working specs/outcomes; INITs are current-state hubs; Efforts are active cross-cutting concerns; handoffs are point-in-time coordination.

## Changes

- Added the three-gate top-level PD rubric to `product-decisions/README.md`: durability, decision leverage, and alternatives rejected.
- Reorganized the PD index by type: Product/UX, Technical/Architecture, Process/Governance, Superseded, and Feature Phase Records.
- Added lightweight metadata to current top-level PDs: `Type`, `Scope`, and `Applies when`.
- Clarified `product-decisions/features/README.md` so feature-phase records may evolve during active delivery but should close with final accepted outcome, validation facts, and deferrals.
- Labeled feature-phase docs with `Document kind: Feature Phase Record`.
- Fixed stale feature-phase status in Slop Bowl Phase 2, marking the old API-alignment questions as resolved by Phase 3.
- Compacted `initiatives/INIT-001-mobile-refresh.md` into a current-state hub and updated `initiatives/registry.md`.
- Rewrote the heavy Phase 2.1 and Phase 2.2 records so final accepted outcomes, validation facts, durable lessons, and deferrals come first.
- Replaced live UI-governance/design-language read pointers with PD-005 plus `design_guidelines.md` where appropriate.

## Impact on other agents

Before starting INIT-001 Phase 3, read:

- `initiatives/INIT-001-mobile-refresh.md`
- `product-decisions/features/mobile-refresh/README.md`
- `product-decisions/features/mobile-refresh/phase-03-planning.md`
- `product-decisions/005-ui-governance.md`
- `design_guidelines.md`
- any active Effort whose checklist matches the work

Claude review request before merge:

> Can a fresh Claude session understand what to read, where to write new rationale, when to create/promote a PD, and how to start INIT-001 Phase 3 without reading old Phase 2.1 diary entries by default?

## Open items

- Claude should review this branch before merge, or Wilson should explicitly waive that review.
- No Replit validation is needed because this branch is docs-only.
- Larger file moves, such as moving feature-phase records out of `product-decisions/features/`, remain deferred until this taxonomy proves itself over another feature cycle.

## Verification

- `git diff --check`
- Stale-reference searches for live EFFORT-001/EFFORT-012 pointers and merged-phase validation language
- Manual scan that INIT-001 exposes the Phase 3 resume point and required Phase 3 inputs quickly

## Stack / base status

- Base refreshed: yes
- Current base: `0b29ccf14cab5ca1997e2f124f4e2b40effe198f`
- Last Replit-validated at: not needed (docs-only)
- Notes: Branch created from the current worktree base after PR #33 (`claude/ui-governance-graduation`) was merged.
