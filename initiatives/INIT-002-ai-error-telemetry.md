# INIT-002 — AI Error Telemetry & Eval Monitoring

**Status:** Planning
**Owner:** Wilson / Codex / Claude / Replit
**Created:** 2026-05-07
**Current phase:** Phase 0 — INIT hub + PD-010 + active-list updates
**Active PR:** Phase 0 docs PR (pending — to be opened from `claude/elated-poincare-269ddc`)
**Active branch:** `claude/elated-poincare-269ddc`

## Overview

INIT-002 sequences the operational AI error telemetry work tracked under [EPIC-019](../epics/019-ai-error-telemetry-and-eval-monitoring.md). The goal is operational signal — what's failing, where, for whom, in what cluster — that converts into evals, prompt fixes, product bugs, or infra tickets, **without** ever storing raw prompts, preferences, headers, images, audio, tokens, or stack traces with bodies.

The work is phased so the redaction allowlist is locked before any rows write, and so the field shape is validated against real Replit traffic before committing to a schema:

- Phase 0: INIT-002 hub, [PD-010](../product-decisions/010-ai-error-telemetry-allowlist.md) redaction policy, active-list updates
- Phase 1: Request-ID middleware + structured stdout logger + wire 9 AI route catch blocks (gated on EPIC-018 merging)
- Phase 2: Replit observation week — confirm field shape and classifier coverage against real failures
- Phase 3: `ai_error_events` table + bounded fire-and-forget writer with circuit breaker
- Phase 4: Protected admin APIs (`/summary`, `/list`, `/detail`, `/clusters`)
- Phase 5: Cluster→action triage validation (worked examples) + epic/INIT closeout

## Current Status

Phase 0 in progress on `claude/elated-poincare-269ddc`. The INIT hub, [EPIC-019](../epics/019-ai-error-telemetry-and-eval-monitoring.md), and [PD-010](../product-decisions/010-ai-error-telemetry-allowlist.md) are being filed together so the durable allowlist policy is published before any code writes a row. No source code lands in Phase 0.

Phase 1 is gated on [EPIC-018](../epics/018-authenticated-ai-error-handling.md) merging. EPIC-018 owns the typed-error route helper and the user-facing error classifier; INIT-002 Phase 1 imports that classifier and adds the telemetry writer alongside it. Starting Phase 1 before EPIC-018 merges would cause the two epics to compete for the same nine AI route catch blocks.

## Source Docs

- [EPIC-019 — AI error telemetry and eval monitoring](../epics/019-ai-error-telemetry-and-eval-monitoring.md)
- [PD-010 — AI error telemetry allowlist](../product-decisions/010-ai-error-telemetry-allowlist.md)
- [EPIC-018 — Authenticated AI error handling](../epics/018-authenticated-ai-error-handling.md) — owns the classifier and typed-error helper that Phase 1 imports
- [EPIC-010 — Local DB schema strategy](../epics/010-local-db-schema-strategy.md) — Replit-authoritative `db:push`; local agents do not push
- [Mobile Refresh AI privacy rules](../product-decisions/features/mobile-refresh/cross-phase-ai-privacy.md) — 90-day retention, redaction guidance, denylist
- [PD-007 — Epic status and registry workflow](../product-decisions/007-epic-status-and-registry-workflow.md) — status vocabulary used in EPIC-019
- [Replit Validation Focus Guide](../docs/workflows/replit-validation-focus.md) — targeted Replit validation by drift vector; INIT-002 phases pick rows from its matrix instead of re-testing everything
- [server/ai-privacy.ts](../server/ai-privacy.ts) — existing redaction utilities (`redactForAiLog`, `stripPromptMarkers`) reused as defense-in-depth

## Assets

None for v1. Telemetry is operational, not visual; admin APIs return JSON, not UI.

## Phase Progress

| Phase | Status | PR / branch | Current signal |
|---|---|---|---|
| Phase 0 — INIT hub + PD-010 | In Progress | `claude/elated-poincare-269ddc` (docs PR pending) | EPIC-019, INIT-002, PD-010 filed together; active-list updates pending |
| Phase 1 — stdout logger + 9 routes | Blocked on EPIC-018 | TBD | Phase 1 cannot start until EPIC-018 merges so the typed-error helper and classifier are stable |
| Phase 2 — Replit observation week | Planned | n/a (validation pass) | One week of real traffic; document classifier gaps and field nullability in PD-010 appendix |
| Phase 3 — DB schema + writer | Planned | TBD | `ai_error_events` schema + bounded writer + Replit `db:push` per EPIC-010 |
| Phase 4 — admin APIs | Planned | TBD | `/api/admin/ai-errors/{summary,list,detail,clusters}` mirroring existing admin pattern |
| Phase 5 — closeout + worked examples | Planned | TBD | Four cluster→action examples from real Replit data; epic and INIT flipped to Resolved/Complete |

## PRs and Branches

| PR | Status | Branch | Validation / merge signal |
|---|---|---|---|
| Phase 0 docs PR | Pending | `claude/elated-poincare-269ddc` | Docs-only; auto-push permitted under CLAUDE.md planning-doc rule |

## Epics and Governance

| Reference | Relevance |
|---|---|
| [EPIC-019](../epics/019-ai-error-telemetry-and-eval-monitoring.md) | The implementation epic this initiative drives |
| [EPIC-018](../epics/018-authenticated-ai-error-handling.md) | Sibling epic; owns classifier and typed-error helper. INIT-002 Phase 1 imports both |
| [EPIC-010](../epics/010-local-db-schema-strategy.md) | Replit-authoritative schema migration; gates Phase 3 `db:push` |
| [EPIC-005](../epics/005-testing-strategy-and-acceptance-criteria.md) | Acceptance criteria framework for merge readiness |
| [PD-010](../product-decisions/010-ai-error-telemetry-allowlist.md) | Redaction allowlist enforced at writer boundary |
| [Mobile Refresh AI privacy rules](../product-decisions/features/mobile-refresh/cross-phase-ai-privacy.md) | Retention and denylist baseline INIT-002 inherits |

## Changes Added After Initial Plan

- 2026-05-07 — During plan review, the pure error classifier was reassigned from INIT-002 Phase 0 to INIT-002 Phase 1 to resolve an ownership ambiguity with [EPIC-018](../epics/018-authenticated-ai-error-handling.md). EPIC-018 already owns the user-facing classification taxonomy; building the classifier inside it (or letting Phase 1 build it after EPIC-018 merges) avoids duplicate work and merge collisions on the 9 AI route catch blocks.
- 2026-05-07 — Phase 2 (Replit observation week) added between stdout logging and DB persistence so the field shape and classifier coverage can be validated against real failures before locking a schema.

## Validation State

Phase-specific Replit validation focus areas selected from the [Replit Validation Focus Guide](../docs/workflows/replit-validation-focus.md) matrix. Phases below should also use the guide's "Replit validation request" template in their PR descriptions and handoffs.

| Phase | Local checks | Replit validation focus (from the guide) | Last Replit-validated SHA |
|---|---|---|---|
| Phase 0 | n/a (docs only) | n/a (no runtime change) | n/a |
| Phase 1 | `npm run check`, `npm run build`, Vitest classifier+writer mocks, manual dotenvx dev-server smoke | **AI provider routes** + **ElevenLabs speech routes** + **Secrets** rows. Confirm: stdout JSON line per error class on each AI route, `X-Request-Id` round-trips, classifier still fires under real provider errors and rate-limit responses, no missing-secret crash on Replit deployment. Workspace + Deployment both. | not yet validated |
| Phase 2 | n/a (observation) | One week of production traffic; Replit log inspection daily. Capture classifier gaps and field nullability for PD-010 appendix. | not yet validated |
| Phase 3 | `npm run check`, `npm run build`, writer tests with mocked DB | **DB schema / migrations / Drizzle / persistence** row (the big one). After Replit `db:push`, trigger one error per class on each AI route. **Manual row inspection to confirm no raw payloads** (epic resolution criterion). Verify deployed app uses the intended DB and the new table is present in both workspace and deployment runtimes. | not yet validated |
| Phase 4 | `npm run check`, `npm run build` | **Auth UI / Firebase** row is unaffected; pick the **AI provider routes** row only to confirm admin endpoints respect `X-Admin-Secret` rejection on Replit. Hit `/api/admin/ai-errors/summary` with the secret; verify exemplars contain only allowlist fields. | not yet validated |
| Phase 5 | n/a (closeout) | n/a (docs-only) | n/a |

## Current Resume Point

**Phase 0 (in progress).** Next agent should:

1. Confirm `claude/elated-poincare-269ddc` is current with `origin/main`.
2. Verify Phase 0 deliverables exist on the branch:
   - `epics/019-ai-error-telemetry-and-eval-monitoring.md`
   - `initiatives/INIT-002-ai-error-telemetry.md`
   - `product-decisions/010-ai-error-telemetry-allowlist.md`
   - `initiatives/registry.md` and `initiatives/README.md` updated
   - `epics/README.md` and `epics/registry.md` updated
   - `CLAUDE.md` and `AGENTS.md` Current Active INITs sections updated
3. Open the Phase 0 docs PR if not already open.
4. **Do not start Phase 1.** Wait for [EPIC-018](../epics/018-authenticated-ai-error-handling.md) to merge first.
5. Once EPIC-018 lands, the next agent reads its merged classifier + typed-error helper and starts INIT-002 Phase 1 from a fresh branch off `main`.

## Chronology

- **2026-05-07** — Wilson asked for parallel persistent-error-logging design while EPIC-018 ships authenticated AI error UX. Claude reviewed EPIC-019, ran exploration agents over the AI route surface, admin pattern, and sibling docs (EPIC-018, EPIC-010, mobile-refresh AI privacy), and produced a phased implementation plan.
- **2026-05-07** — Wilson approved the plan with four decisions: (1) stdout-only first then DB later, (2) wire all 9 AI routes in v1, (3) wait for EPIC-018 to merge before Phase 1, (4) PD-010 at top-level. Asked to file the work as INIT-002 because it is now phased.
- **2026-05-07** — Phase 0 docs filed: EPIC-019, INIT-002, PD-010, registry/README updates.
- **2026-05-07** — Rebased Phase 0 docs branch onto `bc242a0` ([#40](https://github.com/wmishak404/laica/pull/40), Replit Validation Focus Guide). Updated INIT-002 Source Docs and Validation State to cite the new guide and pin per-phase focus rows from its matrix instead of re-testing everything.
