# Efforts Hygiene Audit

**Agent:** codex
**Branch:** codex/efforts-hygiene-2026-05-20
**Date:** 2026-05-20
**Initiative:** INIT-003
**INIT updated:** yes

## Summary

Weekly hygiene started from fresh `origin/main` at `37329f7`. The Efforts system is now back to one active standalone item: EFF-010. The audit also found stale source-of-truth mirrors outside `efforts/README.md`: AGENTS/CLAUDE still listed resolved EFF-014 as active, and INIT-003 still described the Phase 0 docs branch as active even though commit `f3de076` is already on `origin/main`.

## Changes

- `AGENTS.md` and `CLAUDE.md` now list INIT-003 in the active INIT read list and remove resolved EFF-014 from the active Effort read list.
- `efforts/effort-010-local-db-schema-strategy.md` now has a 2026-05-20 audit note confirming it remains the only active standalone Effort. INIT-002/003 both have schema-adjacent future phases, but neither resolves local DB model, `db:push`, `.env.keys`, or schema-health ownership.
- `efforts/registry.md` refreshes EFF-010's last signal to the 2026-05-20 audit.
- `efforts/effort-007-vision-scan-no-detection-feedback.md`, `efforts/effort-013-pantry-manual-entry-spell-correction.md`, `efforts/effort-014-scan-session-diff-and-duplicate-refinement.md`, `efforts/effort-018-authenticated-ai-error-handling.md`, and `initiatives/INIT-001-mobile-refresh.md` time-qualify old "kept open/active" notes so resolved Efforts do not look active in history.
- `initiatives/INIT-003-anonymous-trial-and-account-upgrade.md`, `initiatives/registry.md`, and `product-decisions/pd-012-public-anonymous-trial-and-account-upgrade.md` now mark Phase 0 docs as on `origin/main` at `f3de076` and point the initiative to Phase 1 runtime work next.

## Impact on other agents

Start Effort-related work from `efforts/README.md`: the active read list contains only EFF-010. Use resolved EFF-013/EFF-014 as history, not active queues. For anonymous trial work, read INIT-003 and start Phase 1 from fresh `origin/main`; do not resume the historical docs branch.

Claude peer review should focus on whether the source-of-truth routing is correct: EFF-010 stays standalone, EFF-014 is no longer active, and INIT-003 Phase 0 is accurately treated as merged without inventing runtime validation.

## Open items

- No runtime work was performed.
- No Replit validation is needed for this docs-only audit.
- INIT-003 Phase 1 runtime is still not started.
- EFF-010 remains unresolved until a durable local DB workflow chooses the local database model, `db:push` authority, `.env.keys` provisioning path, and schema-health check.

## Verification

- `git fetch origin --prune` refreshed `origin/main`.
- Audited `efforts/README.md`, `efforts/registry.md`, active INITs 001-003, `product-decisions/README.md`, PD-007, `docs/workflows/effort-system-audit.md`, `docs/workflows/documentation-routing.md`, and `docs/workflows/environment-parity-spec.md`.
- Ran status-mirroring search for stale active-Effort phrasing across `initiatives/`, `product-decisions/`, `docs/workflows/`, `efforts/`, `AGENTS.md`, and `CLAUDE.md`.
- Run before push: `git diff --check`.
