# Efforts hygiene audit

**Agent:** codex
**Branch:** `codex/efforts-hygiene-2026-06-01`
**Date:** 2026-06-01
**Initiative:** none
**INIT updated:** no

## Summary

The weekly hygiene pass found the Effort system mostly healthy after the INIT-003 closeout. The active Efforts remain standalone follow-ups rather than resolved work or INIT-owned phase scope, but `CLAUDE.md` had drifted from the active Effort read list by missing EFF-024 and EFF-025. This branch refreshes that mirror and leaves the Effort files, registry, and README otherwise unchanged.

## Changes

- `CLAUDE.md`
  - Adds EFF-024 and EFF-025 to the active Efforts mirror so Claude sees the same current read-before-work list as `AGENTS.md` and `efforts/README.md`.
- `docs/handoffs/2026-06-01-codex-efforts-hygiene-audit.md`
  - Records the weekly audit decisions and validation.

## Audit Decisions

- EFF-010 remains `Open` as a standalone local database workflow Effort. PR #107 validated `anonymous_recipe_usage` in Replit, but no durable local DB ownership model, `db:push` permission boundary, `.env.keys` provisioning workflow, or schema-health check exists yet.
- EFF-022 remains `Open` as standalone prompt/eval work. INIT-003 points to it as the home for cuisine-fit follow-up, and no merged prompt or eval work has satisfied its resolution criteria.
- EFF-024 remains `Open` as standalone guest privacy/trust copy work. INIT-003 intentionally points to it for later UX/copy treatment, and no merged branch has chosen or validated the user-facing surface.
- EFF-025 remains `Open` as standalone Settings dirty-state work. It spans guest and linked Settings inventory behavior and is not yet implemented or owned by one specific unclosed INIT phase.
- EFF-017 remains `Deferred`; the accepted Phase 4 harness pilot has not started.
- EFF-023 remains `Deferred`; the broad modernization strategy is still parked, with exact security-alert details intentionally kept out of public docs.

## Impact on other agents

Use `efforts/README.md` as the authoritative active read list. `AGENTS.md` and `CLAUDE.md` now mirror that list for EFF-010, EFF-022, EFF-024, and EFF-025.

No active Effort was closed or moved into an INIT/PD/workflow doc during this pass. Future work should still treat INIT-003 as the owner for Google promotion/import and linked-only Phase 5 memory boundaries, while using EFF-022, EFF-024, and EFF-025 for the standalone follow-ups called out in the INIT-003 resume point.

## Open items

- Request Claude peer review on the docs-only PR before merge.
- No Replit validation is required for this docs-only audit.

## Verification

- Started from fresh `origin/main` at `900c756352fc7b46cf00031dd2752ff8ceb844b9`.
- Reviewed `efforts/README.md`, `efforts/registry.md`, EFF-010, EFF-022, EFF-024, EFF-025, deferred EFF-017/EFF-023, active INITs, `product-decisions/README.md`, PD-007, recent handoffs, and workflow docs.
- Ran status-mirroring and active-Effort reference searches across `initiatives/`, `product-decisions/`, `docs/workflows/`, `efforts/`, `AGENTS.md`, and `CLAUDE.md`.
- Run before PR: `git diff --check`.
