# Efforts Hygiene Current Fixes

**Agent:** codex
**Branch:** `codex/efforts-hygiene-current-fixes`
**Date:** 2026-06-18
**Initiative:** none
**INIT updated:** n/a

## Summary

This branch supersedes stale PR #183 with a current-base hygiene pass that carries forward only the still-useful factual fixes. It does not reuse #183's old audit conclusion because the active Effort set changed after PR #192 added EFF-027, and PR #196 now separately owns the new Efforts hygiene-plus-implementation automation workflow.

## Changes

- `efforts/effort-010-local-db-schema-strategy.md`
  - Updates the header date to 2026-06-17, matching the latest local imagery Playwright sandbox note already in the Effort.
- `efforts/registry.md`
  - Refreshes EFF-010's last signal to the current sandbox-or-CI local DB drift guidance.
  - Refreshes EFF-017's last signal to the 2026-06-10 CI/test-gate follow-up state.
  - Refreshes EFF-025's last signal to the merged PR #173 Settings remount mitigation while keeping the dirty-state reminder work open.
  - Leaves EFF-022's PR #188 wording and EFF-027 intact.
- `initiatives/INIT-001-mobile-refresh.md`
  - Replaces stale EFF-017 "deferred / Phase 4 harness pilot" wording with the current EFF-017 validation-lane ownership model in the source-doc table, resume point, and sequencing table.
- `product-decisions/features/mobile-refresh/README.md`
  - Updates the Mobile Refresh feature README to point Phase 4 validation planning at EFF-017's current lane ownership instead of the older "do not replace current Replit gate" phrasing.

## Impact on other agents

PR #183 should be treated as superseded by this branch, not merged as-is. Future Efforts hygiene runs should start from current `origin/main`, include EFF-027 in active-list reasoning, and respect PR #196's automation workflow once it merges.

## Open items

- PR #183 should be closed after this fresh branch is published.
- PR #196 remains separate and should continue to own the automation workflow/process changes.
- Active Effort mirror parity for EFF-027 is intentionally left to PR #196. This branch preserves EFF-027 in `efforts/README.md` and `efforts/registry.md` but does not duplicate PR #196's `AGENTS.md` / `CLAUDE.md` edits.

## Verification

- `git diff --check`
- Active Effort status search across `efforts/README.md`, `efforts/registry.md`, `AGENTS.md`, and `CLAUDE.md` confirmed this branch preserves EFF-027 in the authoritative Efforts docs. The remaining `AGENTS.md` / `CLAUDE.md` EFF-027 mirror addition is intentionally owned by PR #196.
- Status-drift search for stale EFF-017 phrasing in `initiatives/INIT-001-mobile-refresh.md` and `product-decisions/features/mobile-refresh/README.md` returned no matches after this branch's edits.

Replit validation is not required. This branch is docs-only and changes no runtime code, tests, dependencies, schema, deployment config, or product UI.
