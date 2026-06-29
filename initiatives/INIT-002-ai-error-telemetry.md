# INIT-002 — AI Error Telemetry & Eval Monitoring

**Status:** In Progress
**Owner:** Wilson / Codex / Claude / Replit
**Created:** 2026-05-07
**Current phase:** Phase 2 — Replit observation week

## Overview

INIT-002 sequences the operational AI error telemetry work formerly filed as [EFF-019](../efforts/effort-019-ai-error-telemetry-and-eval-monitoring.md). EFF-019 is now resolved as a standalone Effort because this INIT is the active source of truth. The goal is operational signal — what's failing, where, for whom, in what cluster — that converts into evals, prompt fixes, product bugs, or infra tickets, **without** ever storing raw prompts, preferences, headers, images, audio, tokens, or stack traces with bodies.

As of 2026-06-09, successful or partially successful AI output-quality evals live in [INIT-004](INIT-004-ai-output-quality-evals.md). INIT-002 still owns operational AI failures and safe error-cluster handoff; INIT-004 owns recipe/Slop Bowl/cooking-step quality rubrics, human labels, judge calibration, daily reports, and prompt-candidate workflow.

Bridge rule: INIT-002 may hand a cluster to INIT-004 only as a safe fixture candidate reconstructed from operational shape, such as `feature`, `route`, `error_class`, `error_code`, counts, latency, and `input_shape_hash`. Do not pass raw prompts, preferences, model outputs, images, audio, transcripts, stack traces, headers, tokens, user ids, or full request payloads into INIT-004. Provider outage, auth, network, upstream auth, upstream 5xx, secrets, and deployment clusters usually remain INIT-002/infra work; recurring validation, unknown, or response-contract clusters are the likely bridge candidates after an engineer recreates a redacted or synthetic fixture.

The work is phased so the redaction allowlist is locked before any rows write, and so the field shape is validated against real Replit traffic before committing to a schema:

- Phase 0: INIT-002 hub, [PD-010](../product-decisions/pd-010-ai-error-telemetry-allowlist.md) redaction policy, active-list updates
- Phase 1: Request-ID middleware + structured stdout logger + wire 9 AI route catch blocks (unblocked — EFF-018 merged via [#43](https://github.com/wmishak404/laica/pull/43))
- Phase 2: Replit observation week — confirm field shape and classifier coverage against real failures
- Phase 3: `ai_error_events` table + bounded fire-and-forget writer with circuit breaker
- Phase 4: Protected admin APIs (`/summary`, `/list`, `/detail`, `/clusters`)
- Phase 5: Cluster→action triage validation (worked examples) + INIT closeout

## Current Status

**Phase 0 merged** via [PR #41](https://github.com/wmishak404/laica/pull/41) at `cb94f28` on 2026-05-08. The INIT hub, former [EFF-019](../efforts/effort-019-ai-error-telemetry-and-eval-monitoring.md), [PD-010](../product-decisions/pd-010-ai-error-telemetry-allowlist.md), and active-list updates in CLAUDE.md / AGENTS.md / `efforts/` / `initiatives/` are now on `main`. No source code landed in Phase 0.
**Phase 1 merged** via [PR #159](https://github.com/wmishak404/laica/pull/159) as `382ebd07f106ac241e2ed1caa69d34c46a66882c` on 2026-06-10. It shipped the non-persistent telemetry foundation: a server-side `classifyAiError` mirroring EFF-018's taxonomy (400/401/403/404/413/429/5xx/network), request-id middleware scoped to `/api/*`, and a structured stdout JSON logger wired into the 9 AI route catch blocks. No DB persistence landed in Phase 1 — that remains Phase 3 after the Replit observation week.

The final Phase 1 head `76b536170c5c47d7cb04016b3c4cae451544da3b` was rebased onto `origin/main` at `02c11668b5de9367f79ce4a1f68d7caf5c42ee05` after PR #163 documented the Replit Agent approval guard and PR #162 removed the legacy Replit auth dependency island. Final local validation, GitHub unit/E2E/security checks, and direct Replit shell/browser validation all passed before merge.

## Source Docs

- [EFF-019 — AI error telemetry and eval monitoring](../efforts/effort-019-ai-error-telemetry-and-eval-monitoring.md)
- [INIT-004 — AI output quality evals and prompt improvement](INIT-004-ai-output-quality-evals.md) — successful/partial output-quality evals; receives safe operational cluster handoffs from INIT-002 when a cluster becomes a quality fixture candidate
- [PD-010 — AI error telemetry allowlist](../product-decisions/pd-010-ai-error-telemetry-allowlist.md)
- [AI error handling and telemetry workflow](../docs/workflows/ai-error-handling-and-telemetry.md)
- [EFF-018 — Authenticated AI error handling](../efforts/effort-018-authenticated-ai-error-handling.md) — `Resolved` 2026-05-07. Owns the **client-side** classifier (`ApiRequestError` in [`client/src/lib/rateLimitHandler.ts`](../client/src/lib/rateLimitHandler.ts)) and the typed-error route payloads in [`server/routes.ts`](../server/routes.ts). INIT-002 Phase 1 mirrors its taxonomy in a new server-side `classifyAiError` function
- [EFF-010 — Local DB schema strategy](../efforts/effort-010-local-db-schema-strategy.md) — resolved policy history; ADR-0001 and the testing/local-sandbox workflows now govern Replit-authoritative schema work and local sandbox-only pushes
- [Mobile Refresh AI privacy rules](../product-decisions/features/mobile-refresh/pd-cross-phase-ai-privacy.md) — 90-day retention, redaction guidance, denylist
- [PD-007 — Effort status and registry workflow](../product-decisions/pd-007-effort-status-and-registry-workflow.md) — Effort status vocabulary and closeout workflow
- [Replit Validation Focus Guide](../docs/workflows/replit-validation-focus.md) — targeted Replit validation by drift vector; INIT-002 phases pick rows from its matrix instead of re-testing everything
- [server/ai-privacy.ts](../server/ai-privacy.ts) — existing redaction utilities (`redactForAiLog`, `stripPromptMarkers`) reused as defense-in-depth

## Assets

None for v1. Telemetry is operational, not visual; admin APIs return JSON, not UI.

## Phase Progress

| Phase | Status | PR / branch | Current signal |
|---|---|---|---|
| Phase 0 — INIT hub + PD-010 | Merged | [#41](https://github.com/wmishak404/laica/pull/41) (`cb94f28`) | EFF-019, INIT-002, PD-010, active-list updates landed on `main` 2026-05-08; EFF-019 later resolved into this INIT |
| Phase 1 — stdout logger + 9 routes | Merged | [#159](https://github.com/wmishak404/laica/pull/159) / `382ebd0` | Server-side classifier, `/api/*` request IDs, and JSON stdout logger wired into 9 AI route catch blocks. Final head `76b5361` passed local checks, GitHub unit/E2E/security, and direct Replit shell/browser validation before merge |
| Phase 2 — Replit observation week | Current | n/a (validation pass) | One week of real traffic; document classifier gaps and field nullability in PD-010 appendix |
| Phase 3 — DB schema + writer | Planned | TBD | `ai_error_events` schema + bounded writer + Replit-authoritative schema handling per ADR-0001 and the testing/local-sandbox workflows |
| Phase 4 — admin APIs | Planned | TBD | `/api/admin/ai-errors/{summary,list,detail,clusters}` mirroring existing admin pattern |
| Phase 5 — closeout + worked examples | Planned | TBD | Four cluster→action examples from real Replit data; INIT flipped to Complete |

## PRs and Branches

| PR | Status | Branch | Validation / merge signal |
|---|---|---|---|
| [#41](https://github.com/wmishak404/laica/pull/41) | Merged | `claude/elated-poincare-269ddc` | Docs-only; squash-merged at `cb94f28` on 2026-05-08. Rebased twice during review: once onto `bc242a0` (PR #40 Replit Validation Focus Guide) and once onto `24decb2` (PR #44 EFF-018 closeout) |
| [#159](https://github.com/wmishak404/laica/pull/159) | Merged | `codex/init-002-phase-1-telemetry` | Squash-merged as `382ebd0` on 2026-06-10. Final head `76b5361` passed local `npm ci`, targeted Vitest, `npm run check`, `npm run build`, `npm run test:unit`, GitHub unit/E2E/security checks, and direct Replit shell/browser validation |

## Efforts and Governance

| Reference | Relevance |
|---|---|
| [AI error handling and telemetry workflow](../docs/workflows/ai-error-handling-and-telemetry.md) | Agent entrypoint for telemetry workflow, privacy boundaries, and source-of-truth routing |
| [EFF-019](../efforts/effort-019-ai-error-telemetry-and-eval-monitoring.md) | Resolved historical filing; active telemetry implementation now lives in this INIT |
| [EFF-018](../efforts/effort-018-authenticated-ai-error-handling.md) | `Resolved` 2026-05-07. Owns the client-side classifier and typed-error route payloads. INIT-002 Phase 1 mirrors its taxonomy in a server-side classifier |
| [EFF-010](../efforts/effort-010-local-db-schema-strategy.md) | Resolved local DB policy history; current schema-push boundaries live in ADR-0001 and the testing/local-sandbox workflows |
| [Testing and Acceptance Workflow](../docs/workflows/testing-and-acceptance.md) | Acceptance criteria and validation evidence routing for merge readiness |
| [PD-010](../product-decisions/pd-010-ai-error-telemetry-allowlist.md) | Redaction allowlist enforced at writer boundary |
| [Mobile Refresh AI privacy rules](../product-decisions/features/mobile-refresh/pd-cross-phase-ai-privacy.md) | Retention and denylist baseline INIT-002 inherits |

## Changes Added After Initial Plan

- 2026-05-07 — During plan review, the pure error classifier was reassigned from INIT-002 Phase 0 to INIT-002 Phase 1 to resolve an ownership ambiguity with [EFF-018](../efforts/effort-018-authenticated-ai-error-handling.md). EFF-018 already owns the user-facing classification taxonomy; building the classifier inside it (or letting Phase 1 build it after EFF-018 merges) avoids duplicate work and merge collisions on the 9 AI route catch blocks.
- 2026-05-07 — Phase 2 (Replit observation week) added between stdout logging and DB persistence so the field shape and classifier coverage can be validated against real failures before locking a schema.
- 2026-05-07 — EFF-018 ([PR #43](https://github.com/wmishak404/laica/pull/43)) merged with a *client-side* classifier in `rateLimitHandler.ts` / `queryClient.ts` and *typed server-side error payloads* in `server/routes.ts` — but no server-side classifier function. Phase 1 now owns building `server/aiErrorClassifier.ts` mirroring EFF-018's wider taxonomy (400/401/403/404/413/429/5xx/network) so the user-facing copy and telemetry stay aligned. This is a clarification of ownership, not a new phase.
- 2026-06-01 — Automation-backed merge gates now require evidence reports with full reasoning and provenance per [Testing and Acceptance Workflow](../docs/workflows/testing-and-acceptance.md). When INIT-002 later adds eval-backed gates, each eval result must identify the fixture/dataset, evaluator version or prompt/model version when relevant, metric/threshold, sample size, failure examples or cluster summaries, privacy/redaction posture, artifact location, and negative scope.
- 2026-06-09 — Wilson accepted a separate [INIT-004](INIT-004-ai-output-quality-evals.md) for AI output-quality evals and prompt improvement. INIT-002's eval adjacency is now limited to safe operational error clusters becoming future quality fixtures; INIT-004 owns human-labeled rubrics, calibrated judge metrics, daily quality reporting, and prompt-candidate workflow for successful/partial outputs.
- 2026-06-09 — After PR #160 merged, PR #159 was rebased onto fresh `origin/main` and the INIT-002/INIT-004 bridge was narrowed to safe fixture reconstruction from operational cluster shape only. Raw telemetry content never becomes eval input.
- 2026-06-10 — After PR #163 and PR #162 merged, PR #159 was rebased onto `origin/main` at `02c11668b5de9367f79ce4a1f68d7caf5c42ee05`. PR #162 removed the legacy Replit auth dependencies that pulled blocked `es5-ext@0.10.64`, so final PR #159 validation can proceed without the prior Replit package-firewall install blocker. Replit Agent remains approval-required; PR-level Replit validation should use direct shell/browser checks.
- 2026-06-10 — PR #159 merged as `382ebd07f106ac241e2ed1caa69d34c46a66882c` after final-head local, GitHub, and direct Replit validation passed. Phase 2 is now the active resume point. The direct Replit pass proved exact-head shell/browser validation is viable without Replit Agent, but it did not complete the longer Phase 2 observation week or force live provider failures.

## Validation State

Phase-specific Replit validation focus areas selected from the [Replit Validation Focus Guide](../docs/workflows/replit-validation-focus.md) matrix. Phases below should also use the guide's "Replit validation request" template in their PR descriptions and handoffs.

Any local, CI, Replit automation, or future eval result used as a merge gate must include the evidence report required by [Testing and Acceptance Workflow](../docs/workflows/testing-and-acceptance.md), not just "tests passed." For INIT-002 eval work, evidence artifacts must follow [PD-010](../product-decisions/pd-010-ai-error-telemetry-allowlist.md) and avoid raw prompts, preferences, headers, images, audio, tokens, stack traces with bodies, or user-identifying payloads.

| Phase | Local checks | Replit validation focus (from the guide) | Last Replit-validated SHA |
|---|---|---|---|
| Phase 0 | n/a (docs only) | n/a (no runtime change) | n/a — merged at `cb94f28` |
| Phase 1 | Final head `76b5361`: `git diff --check origin/main...HEAD`, `npm ci`, focused Vitest classifier/logger/auth route coverage, `npm run check`, `npm run build`, `npm run test:unit`, GitHub unit + E2E guest smoke | Direct Replit shell/browser validation passed without Replit Agent: exact-head `npm ci`, `npm run check`, `npm run build`, `npm run test:unit`, Replit startup, `X-Request-Id` on `/api/*` 401 responses, and Google sign-out/sign-in with `wilson@ishak.net`. This was PR-level merge evidence only; Phase 2 still handles the longer observation pass across **AI provider routes** + **ElevenLabs speech routes** + **Secrets** rows. | `76b536170c5c47d7cb04016b3c4cae451544da3b` |
| Phase 2 | n/a (observation) | One week of production traffic; Replit log inspection daily. Capture classifier gaps and field nullability for PD-010 appendix. | not yet validated |
| Phase 3 | `npm run check`, `npm run build`, writer tests with mocked DB | **DB schema / migrations / Drizzle / persistence** row (the big one). After Replit `db:push`, trigger one error per class on each AI route. **Manual row inspection to confirm no raw payloads**. Verify deployed app uses the intended DB and the new table is present in both workspace and deployment runtimes. | not yet validated |
| Phase 4 | `npm run check`, `npm run build` | **Auth UI / Firebase** row is unaffected; pick the **AI provider routes** row only to confirm admin endpoints respect `X-Admin-Secret` rejection on Replit. Hit `/api/admin/ai-errors/summary` with the secret; verify exemplars contain only allowlist fields. | not yet validated |
| Phase 5 | n/a (closeout) | n/a (docs-only) | n/a |

## Current Resume Point

**Phase 2 observation week is current.** Next agent should not start DB persistence or admin API work yet. Observe the Phase 1 stdout logger under real Replit traffic and record classifier gaps, nullability questions, and route/error-class examples before Phase 3 schema work.

Minimum Phase 2 focus:
1. Confirm `X-Request-Id` continues to round-trip on real `/api/*` responses during normal Replit use.
2. Capture at least one safe, redacted stdout JSON line per reachable operational failure class when it naturally appears or can be triggered without leaking raw user/provider content.
3. Exercise or observe the **AI provider routes**, **ElevenLabs speech routes**, and **Secrets** rows from the [Replit Validation Focus Guide](../docs/workflows/replit-validation-focus.md).
4. Record any classifier gaps, unexpected `unknown` clusters, missing or noisy fields, and field-nullability decisions in this INIT and [PD-010](../product-decisions/pd-010-ai-error-telemetry-allowlist.md) before Phase 3.
5. Do not use Replit Agent unless Wilson explicitly approves it; direct shell/browser validation is now proven viable for targeted PR evidence but is still manual, not an accepted automated Replit-environment gate.

## Chronology

- **2026-05-07** — Wilson asked for parallel persistent-error-logging design while EFF-018 ships authenticated AI error UX. Claude reviewed EFF-019, ran exploration agents over the AI route surface, admin pattern, and sibling docs (EFF-018, EFF-010, mobile-refresh AI privacy), and produced a phased implementation plan.
- **2026-05-07** — Wilson approved the plan with four decisions: (1) stdout-only first then DB later, (2) wire all 9 AI routes in v1, (3) wait for EFF-018 to merge before Phase 1, (4) PD-010 at top-level. Asked to file the work as INIT-002 because it is now phased.
- **2026-05-07** — Phase 0 docs filed: EFF-019, INIT-002, PD-010, registry/README updates.
- **2026-05-07** — Rebased Phase 0 docs branch onto `bc242a0` ([#40](https://github.com/wmishak404/laica/pull/40), Replit Validation Focus Guide). Updated INIT-002 Source Docs and Validation State to cite the new guide and pin per-phase focus rows from its matrix instead of re-testing everything.
- **2026-05-07** — EFF-018 merged ([#43](https://github.com/wmishak404/laica/pull/43)) and was closed out ([#44](https://github.com/wmishak404/laica/pull/44)). Rebased Phase 0 docs branch onto `24decb2`. Renamed our EFF-019 file to match the canonical filename PR #44 created (`efforts/effort-019-ai-error-telemetry-and-eval-monitoring.md`). Flipped Phase 1 from `Blocked on EFF-018` to `Unblocked, planned`. Documented that EFF-018 ships a client-side classifier and typed server-side error payloads, but no server-side classifier function — INIT-002 Phase 1 owns that mirror.
- **2026-05-08** — Phase 0 docs PR ([#41](https://github.com/wmishak404/laica/pull/41)) squash-merged at `cb94f28`. Closeout pass updated INIT-002 status, phase table, PRs and Branches, validation state, current resume point, and chronology, plus the `initiatives/registry.md` last-signal column.
- **2026-05-09** — Effort cleanup resolved EFF-019 as a standalone item. Active implementation remains in INIT-002, with PD-010 and `docs/workflows/ai-error-handling-and-telemetry.md` as the durable governance/workflow entrypoints.
- **2026-06-01** — Wilson accepted automation evidence reports with full reasoning and provenance as the standard before automated tests or future evals can be used as merge gates. INIT-002 eval phases must inherit that standard and keep privacy/redaction provenance visible.
- **2026-06-09** — Wilson split output-quality evals into [INIT-004](INIT-004-ai-output-quality-evals.md). INIT-002 remains the operational error telemetry home and may hand safe clusters into INIT-004 later.
- **2026-06-10** — PR #163 merged the Replit Agent approval guard, then PR #162 merged the legacy Replit auth dependency cleanup that removed the blocked `es5-ext@0.10.64` path. PR #159 was rebased onto the new `origin/main` at `02c1166`; local validation was refreshed before final GitHub CI/E2E plus direct Replit shell/browser validation.
- **2026-06-10** — PR #159 merged as `382ebd0` after final head `76b5361` passed local checks, GitHub unit/E2E/security checks, and direct Replit shell/browser validation. Phase 2 Replit observation is now the next planned milestone; Phase 3 DB persistence remains blocked on Phase 2 signal.
