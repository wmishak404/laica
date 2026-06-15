# Efforts Hygiene Audit

**Agent:** codex
**Branch:** `codex/efforts-hygiene-2026-06-15`
**Date:** 2026-06-15
**Base:** rebased onto fresh `origin/main` at `27affa18cb535b4562be5c2535a6ad4fefc5b26b`

## Summary

This weekly audit kept the active Effort taxonomy unchanged. EFF-010, EFF-017, EFF-022, and EFF-025 still have unresolved standalone work; none should close, move wholly into an active INIT phase, or graduate into a PD/workflow doc yet. The durable updates refreshed stale registry/header summaries where PR #182 had not already supplied newer closeout wording, and replaced an old INIT-001 resume-point sentence that described EFF-017 as a future Phase 4 pilot instead of the current active validation owner.

## Audit Surface

Reviewed:

- `efforts/README.md`
- `efforts/registry.md`
- active Efforts EFF-010, EFF-017, EFF-022, and EFF-025
- active INITs INIT-001 through INIT-004
- `initiatives/registry.md`
- `product-decisions/README.md`
- `product-decisions/pd-007-effort-status-and-registry-workflow.md`
- `docs/workflows/`, with focus on `documentation-routing.md`, `effort-system-audit.md`, `testing-and-acceptance.md`, `environment-map.md`, `local-diagnostics-sandbox.md`, `environment-parity-spec.md`, `evaluations.md`, `replit-validation-focus.md`, `security-due-diligence.md`, `agent-merge-authority.md`, and `operating-principles.md`
- recent handoffs and merged docs/runtime changes since the 2026-06-08 hygiene pass
- first-contact active Effort mirrors in `AGENTS.md` and `CLAUDE.md`

## Decisions

| Effort | Decision | Rationale |
|---|---|---|
| EFF-010 local DB schema strategy | Keep active standalone | The local diagnostics sandbox gives agents a safer disposable-DB path, but the routine local database ownership model, `.env.keys` provisioning, and general `db:push` permission boundary remain unresolved. |
| EFF-017 environment parity + CI confidence | Keep active standalone / In Progress | CI, E2E, OAuth preflight, direct Replit validation, and cleanup coverage all advanced, but provider canary scope, automated Replit-environment gate design, coverage ratcheting, production/deployment proof, and remaining live-surface coverage are still open. |
| EFF-022 cross-cuisine recommendation prompts | Keep active standalone | INIT-004 now uses EFF-022 examples for eval labels and fixtures, but that is measurement scaffolding only. The cuisine-fit product rule, prompt behavior, picker/display guidance, and fallback story remain unresolved. |
| EFF-025 Settings unsaved inventory reminder | Keep active standalone | PR #173 mitigated Settings route loss after remount, but it did not add dirty-state reminders, save affordance clarity, or unsaved-leave handling for Pantry/Tools/Profile inventory edits. |

No active Effort was resolved, deferred, repointed to an INIT phase, or promoted into a PD/workflow doc. The active read list in `efforts/README.md`, `AGENTS.md`, and `CLAUDE.md` already matches and was not changed.

## Changes

- Updated `EFF-010`'s `Updated` header from 2026-05-29 to 2026-06-10 to match its local diagnostics sandbox signal.
- Refreshed active Effort `Last signal` summaries in `efforts/registry.md` for EFF-010, EFF-017, and EFF-025.
- Preserved PR #182's newer EFF-022 registry wording while keeping EFF-022 active in this audit decision.
- Updated the INIT-001 resume point, INIT-001 sequencing table, and Mobile Refresh feature README to point Phase 4 validation planning at active EFF-017 and the current CI/Replit risk-lane model.
- Added this handoff.
- Rebased the PR over the merged PR #184 Planning toast cleanup, PR #185 merge closeout, and PR #182 INIT-004 Phase 2 closeout without changing the Effort taxonomy decision.

## Verification

- `rg -n "effort-0(10|17|22|25)|EFF-0(10|17|22|25)|Status:|Current active Efforts|Active Efforts" efforts/README.md efforts/registry.md AGENTS.md CLAUDE.md` confirmed active read-list mirror parity.
- `rg -n "current Replit validation gate|Reopen authenticated smoke automation|remains open|still active|active Effort|current active|active Effort read list|keep EFF-|keeps EFF-" initiatives product-decisions docs/workflows efforts` was reviewed for status-drift candidates. Current Mobile Refresh resume/sequence drift was updated; remaining hits are source-of-truth text, dated historical notes, or workflow examples.
- `git diff --check` passed.
- After rebasing, `git diff --check origin/main...HEAD` passed.
- Runtime validation: not required. This branch is docs-only and changes no runtime code, tests, config, dependencies, schema, or deployment files.

## Claude Review Request

Please review the taxonomy decision before merge:

1. Confirm the four active Efforts should remain active standalone items.
2. Confirm the registry summaries accurately reflect the latest merged signal without changing source-of-truth status.
3. Confirm no active Effort should move into INIT-001, INIT-002, INIT-003, INIT-004, a top-level PD, or `docs/workflows/`.
