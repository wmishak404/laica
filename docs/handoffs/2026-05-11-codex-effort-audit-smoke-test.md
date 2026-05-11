# Effort audit smoke test

**Agent:** codex
**Branch:** codex/efforts-hygiene-audit
**Date:** 2026-05-11
**Initiative:** n/a
**INIT updated:** no

## Summary

Ran a docs-only smoke test of the Effort hygiene workflow using five temporary synthetic Efforts. The goal was to see whether the current acceptance criteria route work into the right durable home: standalone Effort, active INIT phase, shared workflow doc, or already-shipped closed phase history.

The workflow held up well. The main ambiguity found was phase-state detection: some future phase records are already marked `Accepted` as specs even though they are still the correct open home for future work. The audit workflow now explicitly says to use the INIT phase table, current phase, and current resume point instead of the phase-record `Status:` line alone.

## Synthetic cases and outcome

| Synthetic case | Expected durable home | Outcome |
|---|---|---|
| `EFF-990` Phase 4 inline cooking recovery | `INIT-001` Phase 4 | Passed. Phase 4 already owns live-cooking inline recovery and the INIT phase table marks Phase 4 as planned/future work. |
| `EFF-991` Phase 3.1 Planning card density | `INIT-001` Phase 3.1 | Passed. Phase 3.1 already owns Planning whitespace/card grammar and the drift inventory calls it out directly. |
| `EFF-992` PR verification note routing | `docs/workflows/testing-and-acceptance.md` | Passed. This is workflow governance, not feature backlog. |
| `EFF-993` Cross-surface pantry label normalization | Standalone active Effort | Passed. Scope spans setup, Settings, and future post-cook cleanup, so no single current unclosed phase honestly owns it. |
| `EFF-994` Added shelf chip grammar | Closed Phase 3.2 / INIT chronology | Passed. The behavior is already shipped and documented in Phase 3.2 and INIT-001 chronology. |

## Source docs checked during the smoke test

- `docs/workflows/effort-system-audit.md`
- `docs/workflows/testing-and-acceptance.md`
- `product-decisions/pd-007-effort-status-and-registry-workflow.md`
- `initiatives/INIT-001-mobile-refresh.md`
- `product-decisions/features/mobile-refresh/pd-phase-03-1-recipe-imagery.md`
- `product-decisions/features/mobile-refresh/pd-phase-03-2-progressive-staples.md`
- `product-decisions/features/mobile-refresh/pd-phase-04-cooking.md`

## Durable workflow change

Updated `docs/workflows/effort-system-audit.md` to clarify one important rule:

- When deciding whether an Effort belongs to an INIT phase, determine whether the phase is still open/future from the INIT phase table, current phase, and current resume point.
- Do not treat a feature phase record's `Status:` line by itself as the open/closed signal, because some future phase specs are already marked `Accepted`.

## Temporary artifacts

Created five synthetic Effort-shaped markdown files under `tmp/effort-audit-smoke/` for the drill, then deleted them after evaluation so the repo does not gain fake backlog items.

## Verification

- Structural smoke check: each synthetic file included the required Effort sections.
- Evidence sweep across INIT-001, Phase 3.1, Phase 3.2, Phase 4, PD-007, and the testing workflow.
- `git diff --check`

## Stack / base status

- Base refreshed: no
- Current base: `5cf5c8b4ec8d497f905fdd63a2aa85a8b3019f86`
- Last Replit-validated at: not needed (docs-only)
- Notes: This was a documentation workflow drill, not runtime validation.
