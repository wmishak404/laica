# Effort System Cleanup

**Agent:** codex
**Branch:** codex/epic-status-audit
**Date:** 2026-05-09
**Initiative:** INIT-001, INIT-002
**INIT updated:** yes

## Summary

Renamed the former `epics/` system to `efforts/`, changed numbered filenames to `effort-###-...`, closed Wilson's groomed stale/governance items, and moved durable workflow content into central docs. The goal is to make Efforts narrow standalone follow-ups rather than a bloated mix of initiative tasks, governance records, and stale to-do lists.

## What Changed Per Effort

| Former Epic | New Status | What changed | Why |
|---|---|---|---|
| EFFORT-004 | `Resolved` | Closed and left a final resolution note in `effort-004-selection-controls-tap-targets.md` | Mobile Refresh phases already established the full-row/chip selection pattern; remaining polish belongs in INIT-001 phases |
| EFFORT-005 | `Resolved` | Graduated useful testing/acceptance policy into `docs/workflows/testing-and-acceptance.md` | Testing strategy is workflow governance, not a standalone Effort |
| EFFORT-007 | `Resolved` | Closed and pointed future scan-feedback work to INIT-001 phase records / EFFORT-014 where relevant | Refreshed scan surfaces already handle no-detection feedback; this is mobile-refresh behavior |
| EFFORT-009 | `Resolved` | Closed with parser/manual-entry resolution note | Shared parser behavior already shipped through Phase 2/2.1 and was preserved in Phase 3 |
| EFFORT-016 | `Resolved` | Closed and pointed Slop Bowl visual/token cleanup to INIT-001 Phase 3.1 plus EFFORT-015 enforcement | INIT-001 owns the redesign pass; enforcement remains separate |
| EFFORT-019 | `Resolved` | Closed as a standalone Effort and repointed active work to INIT-002, PD-010, and the AI error workflow | AI telemetry is an active initiative with privacy governance, not a parallel Effort |
| EFFORT-020 | `Resolved` | Moved audit findings into `docs/workflows/effort-system-audit.md`, `testing-and-acceptance.md`, and PD-007 | The audit describes how to run the Effort system, so it belongs in workflow docs |
| EFFORT-010, 013, 014, 015 | Active | Renamed and kept in the active Effort list | These remain standalone follow-up work for now |
| EFFORT-017 | `Deferred` | Renamed and kept out of the active read list | Environment parity remains deferred until INIT-001 is done |

## Changes

- `epics/` moved to `efforts/`; numbered files now use `effort-###-short-name.md`.
- `efforts/README.md` now defines Efforts as standalone follow-up work and lists only EFFORT-010, 013, 014, and 015 as active.
- `efforts/registry.md` records resolved dates and final signals for the closed items.
- `product-decisions/pd-007-effort-status-and-registry-workflow.md` replaces the old Epic workflow decision and records when not to create an Effort.
- Product-decision files now use a `pd-` filename prefix: top-level records use `pd-###-short-name.md`, and feature records use names such as `pd-phase-03-planning.md` or `pd-design-language.md`. README files remain folder indexes.
- Added `docs/workflows/testing-and-acceptance.md`, `docs/workflows/ai-error-handling-and-telemetry.md`, and `docs/workflows/effort-system-audit.md`.
- Updated `AGENTS.md`, `CLAUDE.md`, INIT-001, INIT-002, initiative registry, and related product/phase docs so active guidance points to Efforts, INITs, workflow docs, or PDs as appropriate.

## Claude Review Checklist

Please review this branch before merge for:

- Taxonomy boundary: active Efforts should be standalone, not active INIT phase work or governance docs.
- Closeout rationale: EFFORT-004/007/009/016 should be safe to close under INIT-001 ownership; EFFORT-005/019/020 should be safe to close under workflow/INIT/PD ownership.
- Link migration: source-of-truth docs should not point agents to `epics/` paths or closed Efforts as active read requirements.
- Filename readability: numbered Effort files should all use `effort-###-...`.
- Product-decision readability: product-decision and feature-record filenames should use the `pd-` prefix, while README files stay as folder indexes.
- Active list narrowness: `efforts/README.md`, `AGENTS.md`, and `CLAUDE.md` should only list EFFORT-010, 013, 014, and 015 as active.

## Impact on other agents

Agents should start with `efforts/README.md` only when their work intersects a standalone active Effort. If work belongs to an INIT or feature phase, update the INIT/phase record instead of creating a new Effort. If work is governance/process, update `docs/workflows/`, an ADR, or a PD instead.

## Open items

- Claude peer review is requested through the PR.
- No runtime code changed; no Replit validation is needed.

## Verification

Planned local docs checks:

- `git diff --check`
- Search for stale live `epics/` references.
- Verify `efforts/README.md` active list excludes closed items.
- Verify `efforts/registry.md` records resolved dates/final signals.
- Search for stale product-decision filenames without the `pd-` prefix.
- Resolve local Markdown links after the filename migration.
