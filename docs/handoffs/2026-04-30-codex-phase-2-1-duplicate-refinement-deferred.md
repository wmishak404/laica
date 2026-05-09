# Phase 2.1 duplicate refinement deferred to EFFORT-014

**Agent:** codex
**Branch:** codex/mobile-refresh-phase-2-1-setup-polish
**Date:** 2026-04-30
**Initiative:** INIT-001
**INIT updated:** yes

## Summary

Wilson retested mobile setup after the duplicate-prevention pass. Upload smoke from different sources passed, and the current implementation skipped some already-saved scan items. Duplicate-like entries can still appear because repeated scans may label the same physical object differently.

Wilson chose to defer ultra-refined duplicate cleanup out of Phase 2.1. Codex filed EFFORT-014 for a future scan-session review pattern where Pantry/Equipment lists can show what is new from the latest scan, what overlapped with saved inventory, and which duplicate-like entries users may want to clean up.

## Changes

- Added [EFFORT-014 — Scan session diff and duplicate refinement](../../efforts/effort-014-scan-session-diff-and-duplicate-refinement.md).
- Updated [efforts/README.md](../../efforts/README.md) and [efforts/registry.md](../../efforts/registry.md) so EFFORT-014 is active and discoverable.
- Updated [Phase 2.1 setup polish](../../product-decisions/features/mobile-refresh/phase-02-1-setup-polish.md) to clarify that exact/near-exact duplicate mitigation ships in Phase 2.1, while semantic/model-label duplicate refinement is deferred.
- Updated [design-language.md](../../product-decisions/features/mobile-refresh/design-language.md) with the future latest-scan chip-state direction.
- Updated [INIT-001](../../initiatives/INIT-001-mobile-refresh.md), [EFFORT-005](../../efforts/effort-005-testing-strategy-and-acceptance-criteria.md), [EFFORT-007](../../efforts/effort-007-vision-scan-no-detection-feedback.md), and [EFFORT-012](../../efforts/effort-012-laica-design-language.md) with the validation/deferment signal.

## Impact on other agents

- Phase 2.1 should not keep expanding duplicate cleanup beyond the current exact/near-exact mitigation unless Wilson reopens the scope.
- Future work that changes Pantry/Kitchen scan result chips, latest-scan indicators, duplicate cleanup, or post-cook rescan review must read EFFORT-014.
- The old Profile/Settings visual UI remains a later Mobile Refresh concern; this handoff only documents scan-result behavior and future chip-state direction.

## Open items

- PR/merge docs still need the final `Last Replit-validated at: <commit-sha>` once Wilson confirms which commit SHA should be considered validated after this docs-only follow-up.
- EFFORT-014 is open backlog; no implementation is expected before Phase 2.1 merge.

## Verification

- Docs-only change; no local code checks required for this handoff.
- Human validation signal recorded: mobile upload smoke from different sources passed, current duplicate mitigation skipped some items, duplicate-like refinement deferred.

## Stack / base status

- Base refreshed: yes
- Current base: origin/main at `4ef300c`
- Last Replit-validated at: not yet validated
- Notes: Runtime smoke was reported against the duplicate-prevention branch head, but the final PR description should record an explicit validation SHA after Wilson confirms the final branch head to merge.
