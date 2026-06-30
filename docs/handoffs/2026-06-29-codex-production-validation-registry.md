# Production Validation Registry

**Agent:** codex
**Branch:** `codex/production-validation-registry`
**Date:** 2026-06-30
**Initiative:** none
**INIT updated:** n/a
**Resolves blocked handoff:** none

## Summary

This pass creates a compact production-validation registry so future release work can answer two questions without re-reading scattered handoffs: what production last proved, and what the next production push must test based on changes since that proof. Wilson approved keeping PR #242 and using the proposed release-batch smoke scope on 2026-06-30. The registry records the 2026-06-22 production smoke evidence, calls out the missing exact production-smoked SHA/build marker, refreshes the current candidate to `origin/main` at `a4450a60ca4767f0250b3c28b6999bd88dab25e3`, and carries forward the approved focused checks for PR #234 ingredient chips, PR #237 Settings unsaved inventory reminders, PR #236 Live Cooking recovery, PR #245 Live Cooking transcript pin behavior, and PR #244 admin/transcription boundary hardening. PR #247 and PR #248 are listed as current docs/planning merges but add no extra production smoke.

## Changes

- `docs/production-validation-registry.md`
  - Adds the current production-smoke baseline, the known SHA/build-marker gap, the merged-since-baseline review table, and the next production push smoke scope.
  - Refreshes the current main candidate after PR #245, PR #244, PR #247, and PR #248 merged. PR #247, PR #248, PR #238, and docs closeouts #243/#241 add no extra focused production smoke beyond the approved #234/#237/#236/#245/#244 scope.
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

- Branch rebased onto `origin/main` at `a4450a60ca4767f0250b3c28b6999bd88dab25e3` after PR #245, PR #244, PR #247, and PR #248 merged.
- `git diff --check origin/main...HEAD` passed.
- `npm ci` passed and reported `found 0 vulnerabilities`.
- `npm run check` passed.
- `npm run build` passed with existing Browserslist age, Firebase dynamic/static import, and chunk-size warnings; no code/runtime files changed.
