# Effort hygiene audit

**Agent:** codex
**Branch:** codex/efforts-hygiene-audit-2026-05-12
**Date:** 2026-05-12
**Initiative:** INIT-001, INIT-002
**INIT updated:** no - reviewed active INITs, but no phase/status/resume-point change was needed

## Summary

Ran the weekly docs-only Effort hygiene audit from fresh `origin/main` at `d1cf381`. All four active Efforts remain valid standalone follow-ups: `EFF-010`, `EFF-013`, `EFF-014`, and `EFF-015`.

No active Effort was resolved by merged work, cleanly absorbed by a specific unclosed INIT phase, or ready to graduate into a PD/workflow doc. The audit did find two documentation hygiene fixes: `PD-010` was missing from the product-decision README, and the Mobile Refresh design-language note for future scan-review chips still implied that work should stay inside INIT-001 by default even though `EFF-014` remains the active owner under the corrected routing rule.

## Changes

- `efforts/effort-010-local-db-schema-strategy.md`: added a 2026-05-12 audit note explaining why the draft parity spec and deferred EFF-017 do not satisfy the local DB workflow resolution criteria.
- `efforts/effort-013-pantry-manual-entry-spell-correction.md`: added a 2026-05-12 audit note confirming pantry spell correction is still unshipped and not owned by one unclosed Mobile Refresh phase.
- `efforts/effort-014-scan-session-diff-and-duplicate-refinement.md`: added a 2026-05-12 audit note clarifying that Phase 5 owns post-cook rescan labels only, not the broader setup/Settings/latest-scan duplicate-review scope.
- `efforts/effort-015-ui-governance-enforcement.md`: added `Updated` metadata and an audit note confirming no ESLint config or PR template exists on `main` yet.
- `efforts/registry.md`: refreshed the last-signal text for all active Efforts.
- `product-decisions/README.md`: added the missing `PD-010` index row.
- `product-decisions/features/mobile-refresh/pd-design-language.md`: refreshed the future scan-review chip note to point at active `EFF-014` until a specific unclosed phase or implementation slice takes ownership.

## Impact on other agents

Continue to use `efforts/README.md` as the active read list. It remains unchanged: `EFF-010`, `EFF-013`, `EFF-014`, and `EFF-015` are still active.

For Mobile Refresh work, do not infer that scan-review chip-state ownership moved into INIT-001 just because related phase records mention future visual states. Start from `EFF-014` unless the branch explicitly updates a specific unclosed phase to own the broader duplicate-review scope.

For AI telemetry work, `PD-010` is now discoverable from `product-decisions/README.md` as well as INIT-002 and the AI error workflow.

## Open items

- No Efforts were closed in this audit.
- Claude peer review is requested before merge because this PR touches Effort routing rationale and source-of-truth discoverability.
- Replit validation is not required; this is docs-only.

## Stack / base status

- Base refreshed: yes
- Current base: origin/main at `9c6d3ef`
- Last Replit-validated at: n/a - docs-only
- Notes: independent docs-only hygiene branch, not stacked on another open PR.

## Verification

- `git diff --check`
- Manual source-of-truth review:
  - `efforts/README.md`
  - `efforts/registry.md`
  - active Effort files `010`, `013`, `014`, `015`
  - `initiatives/registry.md`
  - `INIT-001`
  - `INIT-002`
  - `product-decisions/README.md`
  - `PD-005`
  - `PD-007`
  - `docs/workflows/`
