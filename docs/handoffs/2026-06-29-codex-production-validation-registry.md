# Production Validation Registry

**Agent:** codex
**Branch:** `codex/production-validation-registry`
**Date:** 2026-06-30
**Initiative:** none
**INIT updated:** n/a
**Resolves blocked handoff:** none

## Summary

This pass creates a compact production-validation registry so future release work can answer two questions without re-reading scattered handoffs: what production last proved, and what the next production push must test based on changes since that proof. Wilson approved keeping PR #242 and using the proposed release-batch smoke scope on 2026-06-30. The registry records the 2026-06-22 production smoke evidence, calls out the missing exact production-smoked SHA/build marker, refreshes the current candidate to `origin/main` at `f9909af7cbc7104f9eb4da7b3a8642215fce461e`, and carries forward the approved focused checks for PR #234 ingredient chips, PR #237 Settings unsaved inventory reminders, and PR #236 Live Cooking recovery.

## Changes

- `docs/production-validation-registry.md`
  - Adds the current production-smoke baseline, the known SHA/build-marker gap, the merged-since-baseline review table, and the next production push smoke scope.
  - Refreshes the current main candidate after PR #243 and PR #238 merged. PR #238 and docs closeouts #243/#241 add no extra focused production smoke beyond the approved #234/#237/#236 scope.
- `docs/workflows/replit-validation-focus.md`
  - Points production-publish validation to the registry as the current release ledger.
- `docs/handoffs/2026-06-29-codex-production-validation-registry.md`
  - Records this docs pass for agent coordination.

## Impact on other agents

Start future production-push preparation with `docs/production-validation-registry.md`, then use `docs/workflows/replit-validation-focus.md` for the evidence format and detailed validation procedure. Do not keep carrying old deferred UI notes as separate blockers unless the recovered production SHA shows they were not included, Wilson asks for a full regression/visual pass, or a new change touches those surfaces.

## Open items

- The exact SHA/build marker for the 2026-06-22 production smoke was not recorded in the source handoff. The next production pass must recover or replace it and then update the registry with `Last production-smoked at: <sha>`.
- No Replit or production smoke was performed in this docs-only pass.

## Verification

- Branch rebased onto `origin/main` at `f9909af7cbc7104f9eb4da7b3a8642215fce461e` after PR #243 and PR #238 merged.
- `git diff --check origin/main...HEAD` passed.
- `npm run check` passed after `npm ci` installed missing local dependencies; no code/runtime files changed.
