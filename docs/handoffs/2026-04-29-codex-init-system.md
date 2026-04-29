# INIT System

**Agent:** codex
**Branch:** codex/mobile-refresh-phase-2-setup
**Date:** 2026-04-29
**Initiative:** [INIT-001 — Mobile Refresh](../../initiatives/INIT-001-mobile-refresh.md)
**INIT updated:** yes

## Summary

Created the INIT documentation layer for multi-phase initiatives and filed INIT-001 for Mobile Refresh. INITs are living project hubs that connect phase docs, product decisions, epics, assets, PRs, handoffs, validation status, and current resume context.

## Changes

- `initiatives/README.md`
  - Defines INIT purpose, lifecycle, status model, update protocol, and cross-artifact linking rules.
- `initiatives/registry.md`
  - Adds the searchable INIT index.
- `initiatives/INIT-001-mobile-refresh.md`
  - Captures Mobile Refresh current state across Phase 0-5, assets, PRs, epics, validation, changes added after initial planning, and resume point.
- Workflow and relationship docs
  - Updated `AGENTS.md`, `CLAUDE.md`, `docs/handoffs/README.md`, `product-decisions/README.md`, and `epics/README.md` with INIT reading/citation/update expectations.
- Mobile-refresh source docs
  - Added INIT links to the mobile-refresh feature docs and PD-009.

## Impact on other agents

Before resuming Mobile Refresh work, agents should read INIT-001 first, then open the deeper source docs it links. Any future change that moves Mobile Refresh phase status, PR status, validation status, assets, or major direction should update INIT-001 in the same branch when practical.

## Open items

- PR #23 remains draft and not merge-ready.
- Latest PR #23 head must be revalidated in Replit after this docs commit.
- Future phase PRs should keep INIT-001 current as phase status changes.

## Verification

Docs-only change. Verify with `git diff --check`, confirm no source/env/schema/package/script files changed, and spot-check INIT links.
