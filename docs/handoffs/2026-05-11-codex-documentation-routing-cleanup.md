# Documentation routing cleanup

**Agent:** codex
**Branch:** codex/documentation-routing-cleanup
**Date:** 2026-05-11
**Initiative:** none
**INIT updated:** n/a

## Summary

Implemented Wilson's documentation-system cleanup request after reviewing the product decision and Effort taxonomy. The branch fixes the immediate discoverability issues and adds a compact cross-doc routing workflow so future agents can make one source-of-truth decision during closeout instead of appending another checklist item to every doc.

## Changes

- Added `docs/workflows/documentation-routing.md` as the central routing and closeout workflow for PDs, feature phase records, INITs, Efforts, workflow docs, and handoffs.
- Added consult-before-filing and closed-phase-boundary guardrails so agents identify the product capability and governing context before deciding where to write, and do not create late minor phases under already closed INIT phases.
- Updated `product-decisions/README.md` to link the routing workflow, add optional volatility/review-trigger metadata, and index PD-010.
- Marked `pd-003-openai-model-strategy.md` as external/vendor-dependent so future model/cost work verifies current provider facts before implementation.
- Updated `efforts/README.md` and `efforts/registry.md` to show full `EFF-NNN` IDs and use current `pd-*` / `pd-phase-*` filename examples.
- Linked the new routing workflow from testing/acceptance, Effort audit, AGENTS.md, and CLAUDE.md so the closeout habit applies across future builds without duplicating a long checklist.

## Impact on other agents

Before closing a branch that changes product rationale, UX direction, validation scope, workflow rules, or planning-doc ownership, use `docs/workflows/documentation-routing.md` to choose the primary durable home. Update indexes/read lists only when ownership or active status changes, then record validation and deferrals in the handoff/PR.

The first step is now explicitly consultative: identify the product capability or operating discipline, read the relevant INIT/PD/Effort/epic/workflow/design/validation docs, then choose the file. This is meant to prevent routing by entry point, such as treating a Pantry/Kitchen scan change as setup-only because the user complaint surfaced during setup.

If an INIT has already moved past a phase, do not create a late `pd-phase-02-3-*` style minor phase for active work. Route to the current/future phase, INIT current state, a top-level PD, or a true standalone Effort after the consultation pass.

The active Effort list now displays `EFF-010`, `EFF-013`, `EFF-014`, and `EFF-015` explicitly. `EPIC-NNN` remains only as historical `Former ID` metadata inside renamed Effort files.

## Open items

- No runtime work was changed.
- Future volatile PDs should add `Volatility` and `Review trigger` metadata when provider, price, legal, standards, or platform facts are part of the accepted decision.

## Verification

- `git diff --check`
- `rg -n "PD-pd|product-decisions/PD|EFFORT-014|\\| # \\| Title|PD-xxx|PD-XXX" product-decisions efforts docs/workflows AGENTS.md CLAUDE.md` (expected no matches)
- `rg -n "PD-010|pd-010|documentation-routing|EFF-014" product-decisions efforts docs/workflows AGENTS.md CLAUDE.md`

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `d1cf381`
- Last Replit-validated at: not needed (docs-only)
- Notes: branched from freshly rebased `claude/eloquent-blackwell-e7a5d7`, which was equal to `origin/main`.
