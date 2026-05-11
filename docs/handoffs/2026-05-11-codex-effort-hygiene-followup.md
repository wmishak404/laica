# Weekly effort hygiene follow-up

**Agent:** codex
**Branch:** codex/efforts-hygiene-audit
**Date:** 2026-05-11
**Initiative:** INIT-001
**INIT updated:** yes

## Summary

Ran the weekly docs-only Effort hygiene pass from fresh `origin/main`. The main result is that `EFFORT-013` and `EFFORT-014` are no longer treated as active standalone Efforts; both now live under `INIT-001`, and this follow-up adds an explicit `Future Initiative-Owned Follow-Ups` section so the work has a forward-looking home instead of reading as "done because closed."

## Changes

- Closed `efforts/effort-013-pantry-manual-entry-spell-correction.md` as `Resolved` with a final note pointing future work to `INIT-001` plus the relevant Mobile Refresh phase record.
- Closed `efforts/effort-014-scan-session-diff-and-duplicate-refinement.md` as `Resolved` with the same INIT-owned follow-up rationale for richer scan-review and rescan-cleanup work.
- Updated `efforts/README.md` and `efforts/registry.md` so the active list now contains only `EFFORT-010` and `EFFORT-015`.
- Updated `AGENTS.md` and `CLAUDE.md` so future agents read `INIT-001` rather than stale active-Effort entries for pantry spell correction and richer scan review.
- Updated `initiatives/INIT-001-mobile-refresh.md` and `initiatives/registry.md` so those two follow-ups now have an explicit forward-looking INIT home, not just historical closed-phase deferrals.
- Updated `docs/workflows/effort-system-audit.md` so the recurring automation prompt now distinguishes between shipped work that belongs in a closed phase/chronology note and unshipped work that needs a forward-looking INIT follow-up section.
- Cleaned two resolved-history notes (`effort-007`, `effort-012`) that still described `EFFORT-014` as active.

## Claude Review Checklist

Please review this branch before merge for:

- Boundary correctness: `EFFORT-013` and `EFFORT-014` should now clearly read as Mobile Refresh phase work, not standalone backlog tracks.
- Active-list narrowness: `efforts/README.md`, `AGENTS.md`, and `CLAUDE.md` should only list the two true standalones.
- Source-of-truth links: future pantry spell correction and richer scan-review guidance should point to `INIT-001`'s forward-looking follow-up section first, then to the historical Mobile Refresh phase docs.
- Audit workflow wording: the recurring prompt should now require a forward-looking INIT home whenever an Effort closes into initiative-owned work.

## Impact on other agents

When future work touches pantry spell correction or richer scan-review UX, start from `initiatives/INIT-001-mobile-refresh.md`'s `Future Initiative-Owned Follow-Ups` section, then update the relevant Mobile Refresh phase record instead of reopening a standalone Effort unless the scope escapes Mobile Refresh.

The only active standalone Efforts after this pass are:

- `efforts/effort-010-local-db-schema-strategy.md`
- `efforts/effort-015-ui-governance-enforcement.md`

## Open items

- Claude peer review is requested through the PR before merge.
- No runtime code changed; no Replit validation is needed.

## Verification

- `git diff --check`
- Manual link/reference sweep across `efforts/`, `INIT-001`, and Mobile Refresh phase docs
- Verified the active Effort list in `efforts/README.md`, `AGENTS.md`, and `CLAUDE.md` now excludes `EFFORT-013` and `EFFORT-014`
- Verified `INIT-001` now contains an explicit forward-looking home for those two follow-ups rather than only closed-phase deferral notes

## Stack / base status

- Base refreshed: yes
- Current base: `5cf5c8b4ec8d497f905fdd63a2aa85a8b3019f86`
- Last Replit-validated at: not needed (docs-only)
- Notes: Branch created directly from fresh `origin/main`.
