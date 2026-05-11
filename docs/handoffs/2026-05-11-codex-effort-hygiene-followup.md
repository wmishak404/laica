# Weekly effort hygiene follow-up

**Agent:** codex
**Branch:** codex/efforts-hygiene-audit
**Date:** 2026-05-11
**Initiative:** INIT-001
**INIT updated:** yes

## Summary

Ran the weekly docs-only Effort hygiene pass from fresh `origin/main`. After Wilson's follow-up clarification, the final result is that `EFF-013` and `EFF-014` stay active standalone Efforts for now. They remain adjacent to `INIT-001`, but they do not yet belong to a specific unclosed Mobile Refresh phase, so they should not be closed into the initiative yet.

## Changes

- Kept `efforts/effort-013-pantry-manual-entry-spell-correction.md` and `efforts/effort-014-scan-session-diff-and-duplicate-refinement.md` active after re-checking whether any current unclosed Mobile Refresh phase naturally owns them.
- Updated `efforts/README.md`, `efforts/registry.md`, `AGENTS.md`, and `CLAUDE.md` so the active list again includes `EFF-013` and `EFF-014`.
- Updated `initiatives/INIT-001-mobile-refresh.md` and `initiatives/registry.md` so the INIT stays aware of these Efforts without claiming them as owned phase work yet.
- Updated `docs/workflows/effort-system-audit.md` so the recurring automation prompt now requires an acceptance check before closing an Effort into an INIT: does it naturally belong to a specific unclosed phase, and has the work actually been addressed already?
- Tightened that workflow again so the automation explicitly reviews `initiatives/registry.md`, `product-decisions/pd-007-effort-status-and-registry-workflow.md`, and `docs/workflows/testing-and-acceptance.md`, plus any domain-specific source docs that are the likely durable home.
- Cleaned two resolved-history notes (`effort-007`, `effort-012`) that still described `EFF-014` as active.

## Claude Review Checklist

Please review this branch before merge for:

- Boundary correctness: `EFF-013` and `EFF-014` should remain active Efforts unless a future branch updates a specific unclosed Mobile Refresh phase to own them.
- Active-list accuracy: `efforts/README.md`, `AGENTS.md`, and `CLAUDE.md` should again list `EFF-010`, `EFF-013`, `EFF-014`, and `EFF-015` as active.
- Source-of-truth links: `INIT-001` should point to these Efforts as adjacent follow-ups, not as already-rehomed phase work.
- Audit workflow wording: the recurring prompt should now require a natural unclosed-phase fit before closing an Effort into an INIT.
- Source-doc coverage: the recurring prompt should explicitly name the core Effort/INIT/workflow docs instead of relying on a broad `docs/workflows/` scan.

## Impact on other agents

When future work touches pantry spell correction or richer scan-review UX, start from the active Effort and the relevant Mobile Refresh phase history together. Only resolve the Effort into `INIT-001` if that branch explicitly updates a specific unclosed phase to own the scope.

The active standalone Efforts after this pass are:

- `efforts/effort-010-local-db-schema-strategy.md`
- `efforts/effort-013-pantry-manual-entry-spell-correction.md`
- `efforts/effort-014-scan-session-diff-and-duplicate-refinement.md`
- `efforts/effort-015-ui-governance-enforcement.md`

## Open items

- Claude peer review is requested through the PR before merge.
- No runtime code changed; no Replit validation is needed.

## Verification

- `git diff --check`
- Manual link/reference sweep across `efforts/`, `INIT-001`, and Mobile Refresh phase docs
- Verified the active Effort list in `efforts/README.md`, `AGENTS.md`, and `CLAUDE.md` now includes `EFF-013` and `EFF-014` again
- Verified `INIT-001` now treats those two items as adjacent active Efforts unless a future unclosed phase explicitly takes ownership
- Verified the automation prompt now explicitly names `docs/workflows/effort-system-audit.md`, `docs/workflows/testing-and-acceptance.md`, `product-decisions/pd-007-effort-status-and-registry-workflow.md`, and `initiatives/registry.md`

## Stack / base status

- Base refreshed: yes
- Current base: `5cf5c8b4ec8d497f905fdd63a2aa85a8b3019f86`
- Last Replit-validated at: not needed (docs-only)
- Notes: Branch created directly from fresh `origin/main`.
