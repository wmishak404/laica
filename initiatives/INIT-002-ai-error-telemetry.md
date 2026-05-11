# INIT-002 — AI Error Telemetry & Eval Monitoring

**Status:** Planning
**Owner:** Wilson / Codex / Claude / Replit
**Created:** 2026-05-07
**Current phase:** Phase 1 — Request-ID middleware + structured stdout logger + 9 AI route catch blocks (next)
**Active PR:** None (Phase 0 [#41](https://github.com/wmishak404/laica/pull/41) merged at `cb94f28` on 2026-05-08)
**Active branch:** None (Phase 1 starts on a fresh branch off `main`)

## Overview

INIT-002 sequences the operational AI error telemetry work formerly filed as [EFF-019](../efforts/effort-019-ai-error-telemetry-and-eval-monitoring.md). EFF-019 is now resolved as a standalone Effort because this INIT is the active source of truth. The goal is operational signal — what's failing, where, for whom, in what cluster — that converts into evals, prompt fixes, product bugs, or infra tickets, **without** ever storing raw prompts, preferences, headers, images, audio, tokens, or stack traces with bodies.

The work is phased so the redaction allowlist is locked before any rows write, and so the field shape is validated against real Replit traffic before committing to a schema:

- Phase 0: INIT-002 hub, [PD-010](../product-decisions/pd-010-ai-error-telemetry-allowlist.md) redaction policy, active-list updates
- Phase 1: Request-ID middleware + structured stdout logger + wire 9 AI route catch blocks (unblocked — EFF-018 merged via [#43](https://github.com/wmishak404/laica/pull/43))
- Phase 2: Replit observation week — confirm field shape and classifier coverage against real failures
- Phase 3: `ai_error_events` table + bounded fire-and-forget writer with circuit breaker
- Phase 4: Protected admin APIs (`/summary`, `/list`, `/detail`, `/clusters`)
- Phase 5: Cluster→action triage validation (worked examples) + INIT closeout

## Current Status

**Phase 0 merged** via [PR #41](https://github.com/wmishak404/laica/pull/41) at `cb94f28` on 2026-05-08. The INIT hub, former [EFF-019](../efforts/effort-019-ai-error-telemetry-and-eval-monitoring.md), [PD-010](../product-decisions/pd-010-ai-error-telemetry-allowlist.md), and active-list updates in CLAUDE.md / AGENTS.md / `efforts/` / `initiatives/` are now on `main`. No source code landed in Phase 0.
**Phase 1 is the next work.** Start from a fresh branch off `main`. Build a server-side `classifyAiError` mirroring EFF-018's taxonomy (400/401/403/404/413/429/5xx/network), a request-id middleware scoped to `/api/*`, and a structured stdout JSON logger; wire all three into the 9 AI route catch blocks. No DB persistence in Phase 1 — that's Phase 3 after a Replit observation week (Phase 2).

## Source Docs

- [EFF-019 — AI error telemetry and eval monitoring](../efforts/effort-019-ai-error-telemetry-and-eval-monitoring.md)
- [PD-010 — AI error telemetry allowlist](../product-decisions/pd-010-ai-error-telemetry-allowlist.md)
- [AI error handling and telemetry workflow](../docs/workflows/ai-error-handling-and-telemetry.md)
- [EFF-018 — Authenticated AI error handling](../efforts/effort-018-authenticated-ai-error-handling.md) — `Resolved` 2026-05-07. Owns the **client-side** classifier (`ApiRequestError` in [`client/src/lib/rateLimitHandler.ts`](../client/src/lib/rateLimitHandler.ts)) and the typed-error route payloads in [`server/routes.ts`](../server/routes.ts). INIT-002 Phase 1 mirrors its taxonomy in a new server-side `classifyAiError` function
- [EFF-010 — Local DB schema strategy](../efforts/effort-010-local-db-schema-strategy.md) — Replit-authoritative `db:push`; local agents do not push
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
| Phase 1 — stdout logger + 9 routes | Planned (next) | TBD | EFF-018 merged via [#43](https://github.com/wmishak404/laica/pull/43). Phase 1 builds a server-side `classifyAiError` mirroring EFF-018's taxonomy, request-id middleware, and JSON stdout logger wired into 9 AI route catch blocks |
| Phase 2 — Replit observation week | Planned | n/a (validation pass) | One week of real traffic; document classifier gaps and field nullability in PD-010 appendix |
| Phase 3 — DB schema + writer | Planned | TBD | `ai_error_events` schema + bounded writer + Replit `db:push` per EFF-010 |
| Phase 4 — admin APIs | Planned | TBD | `/api/admin/ai-errors/{summary,list,detail,clusters}` mirroring existing admin pattern |
| Phase 5 — closeout + worked examples | Planned | TBD | Four cluster→action examples from real Replit data; INIT flipped to Complete |

## PRs and Branches

| PR | Status | Branch | Validation / merge signal |
|---|---|---|---|
| [#41](https://github.com/wmishak404/laica/pull/41) | Merged | `claude/elated-poincare-269ddc` | Docs-only; squash-merged at `cb94f28` on 2026-05-08. Rebased twice during review: once onto `bc242a0` (PR #40 Replit Validation Focus Guide) and once onto `24decb2` (PR #44 EFF-018 closeout) |

## Efforts and Governance

| Reference | Relevance |
|---|---|
| [AI error handling and telemetry workflow](../docs/workflows/ai-error-handling-and-telemetry.md) | Agent entrypoint for telemetry workflow, privacy boundaries, and source-of-truth routing |
| [EFF-019](../efforts/effort-019-ai-error-telemetry-and-eval-monitoring.md) | Resolved historical filing; active telemetry implementation now lives in this INIT |
| [EFF-018](../efforts/effort-018-authenticated-ai-error-handling.md) | `Resolved` 2026-05-07. Owns the client-side classifier and typed-error route payloads. INIT-002 Phase 1 mirrors its taxonomy in a server-side classifier |
| [EFF-010](../efforts/effort-010-local-db-schema-strategy.md) | Replit-authoritative schema migration; gates Phase 3 `db:push` |
| [Testing and Acceptance Workflow](../docs/workflows/testing-and-acceptance.md) | Acceptance criteria and validation evidence routing for merge readiness |
| [PD-010](../product-decisions/pd-010-ai-error-telemetry-allowlist.md) | Redaction allowlist enforced at writer boundary |
| [Mobile Refresh AI privacy rules](../product-decisions/features/mobile-refresh/pd-cross-phase-ai-privacy.md) | Retention and denylist baseline INIT-002 inherits |

## Changes Added After Initial Plan

- 2026-05-07 — During plan review, the pure error classifier was reassigned from INIT-002 Phase 0 to INIT-002 Phase 1 to resolve an ownership ambiguity with [EFF-018](../efforts/effort-018-authenticated-ai-error-handling.md). EFF-018 already owns the user-facing classification taxonomy; building the classifier inside it (or letting Phase 1 build it after EFF-018 merges) avoids duplicate work and merge collisions on the 9 AI route catch blocks.
- 2026-05-07 — Phase 2 (Replit observation week) added between stdout logging and DB persistence so the field shape and classifier coverage can be validated against real failures before locking a schema.
- 2026-05-07 — EFF-018 ([PR #43](https://github.com/wmishak404/laica/pull/43)) merged with a *client-side* classifier in `rateLimitHandler.ts` / `queryClient.ts` and *typed server-side error payloads* in `server/routes.ts` — but no server-side classifier function. Phase 1 now owns building `server/aiErrorClassifier.ts` mirroring EFF-018's wider taxonomy (400/401/403/404/413/429/5xx/network) so the user-facing copy and telemetry stay aligned. This is a clarification of ownership, not a new phase.

## Validation State

Phase-specific Replit validation focus areas selected from the [Replit Validation Focus Guide](../docs/workflows/replit-validation-focus.md) matrix. Phases below should also use the guide's "Replit validation request" template in their PR descriptions and handoffs.

| Phase | Local checks | Replit validation focus (from the guide) | Last Replit-validated SHA |
|---|---|---|---|
| Phase 0 | n/a (docs only) | n/a (no runtime change) | n/a — merged at `cb94f28` |
| Phase 1 | `npm run check`, `npm run build`, Vitest classifier+writer mocks, manual dotenvx dev-server smoke | **AI provider routes** + **ElevenLabs speech routes** + **Secrets** rows. Confirm: stdout JSON line per error class on each AI route, `X-Request-Id` round-trips, classifier still fires under real provider errors and rate-limit responses, no missing-secret crash on Replit deployment. Workspace + Deployment both. | not yet validated |
| Phase 2 | n/a (observation) | One week of production traffic; Replit log inspection daily. Capture classifier gaps and field nullability for PD-010 appendix. | not yet validated |
| Phase 3 | `npm run check`, `npm run build`, writer tests with mocked DB | **DB schema / migrations / Drizzle / persistence** row (the big one). After Replit `db:push`, trigger one error per class on each AI route. **Manual row inspection to confirm no raw payloads**. Verify deployed app uses the intended DB and the new table is present in both workspace and deployment runtimes. | not yet validated |
| Phase 4 | `npm run check`, `npm run build` | **Auth UI / Firebase** row is unaffected; pick the **AI provider routes** row only to confirm admin endpoints respect `X-Admin-Secret` rejection on Replit. Hit `/api/admin/ai-errors/summary` with the secret; verify exemplars contain only allowlist fields. | not yet validated |
| Phase 5 | n/a (closeout) | n/a (docs-only) | n/a |

## Current Resume Point

**Phase 1 (planned, ready to start).** Next agent should:
1. `git fetch origin && git checkout -b claude/init-002-phase-1-stdout-logger origin/main`. Verify [`server/ai-privacy.ts`](../server/ai-privacy.ts) and EFF-018's typed-error payloads in [`server/routes.ts`](../server/routes.ts) are present (they should be, since both are on `main`).
2. Symlink `.env.keys` per [`CLAUDE.md`](../CLAUDE.md) worktree note if running locally.
3. Read [EFF-018's client-side classifier](../client/src/lib/rateLimitHandler.ts) and [`queryClient.ts`](../client/src/lib/queryClient.ts) to extract the canonical taxonomy (400/401/403/404/413/429/5xx/network).
4. Build:
   - `server/aiErrorClassifier.ts` — pure `classifyAiError(err, ctx)` returning `{ errorClass, errorCode, httpStatus, retryAfterSeconds, vendor }`. Mirror EFF-018's taxonomy. Wrap callers in try/catch with `unknown/500` fallback so a classifier bug never takes down a route.
   - `server/requestId.ts` — Express middleware scoped to `/api/*`. UUID v4 to `req.requestId`, set `X-Request-Id` response header. Always overwrite client-supplied value.
   - `server/aiErrors.ts` — `logAiError(input)` that writes one JSON line to `console.error` with the [PD-010](../product-decisions/pd-010-ai-error-telemetry-allowlist.md) allowlist shape. No DB. Reuse [`server/ai-privacy.ts`](../server/ai-privacy.ts) `redactForAiLog` as defense-in-depth.
5. Wire all three into the 9 AI route catch blocks in [`server/routes.ts`](../server/routes.ts): `/api/recipes/suggestions`, `/api/recipes/pantry`, `/api/recipes/slop-bowl`, `/api/cooking/steps`, `/api/cooking/assistance`, `/api/vision/analyze`, `/api/speech/synthesize`, `/api/speech/voices`, `/api/speech/transcribe`. Each catch adds ~3 lines.
6. Tests: table-driven `tests/server/aiErrorClassifier.test.ts`; mocked-writer assertions in `tests/server/aiErrors.test.ts`.
7. Validate locally (`npm run check`, `npm run build`, vitest, manual dotenvx dev-server smoke). Open PR with the [Replit Validation Focus Guide](../docs/workflows/replit-validation-focus.md) "Replit validation request" template citing the **AI provider routes**, **ElevenLabs speech routes**, and **Secrets** matrix rows.
If the v0 `error_class` enum in PD-010 cannot cleanly express EFF-018's wider HTTP taxonomy, propose an enum expansion as a PD-010 amendment in the same PR.

## Chronology

- **2026-05-07** — Wilson asked for parallel persistent-error-logging design while EFF-018 ships authenticated AI error UX. Claude reviewed EFF-019, ran exploration agents over the AI route surface, admin pattern, and sibling docs (EFF-018, EFF-010, mobile-refresh AI privacy), and produced a phased implementation plan.
- **2026-05-07** — Wilson approved the plan with four decisions: (1) stdout-only first then DB later, (2) wire all 9 AI routes in v1, (3) wait for EFF-018 to merge before Phase 1, (4) PD-010 at top-level. Asked to file the work as INIT-002 because it is now phased.
- **2026-05-07** — Phase 0 docs filed: EFF-019, INIT-002, PD-010, registry/README updates.
- **2026-05-07** — Rebased Phase 0 docs branch onto `bc242a0` ([#40](https://github.com/wmishak404/laica/pull/40), Replit Validation Focus Guide). Updated INIT-002 Source Docs and Validation State to cite the new guide and pin per-phase focus rows from its matrix instead of re-testing everything.
- **2026-05-07** — EFF-018 merged ([#43](https://github.com/wmishak404/laica/pull/43)) and was closed out ([#44](https://github.com/wmishak404/laica/pull/44)). Rebased Phase 0 docs branch onto `24decb2`. Renamed our EFF-019 file to match the canonical filename PR #44 created (`efforts/effort-019-ai-error-telemetry-and-eval-monitoring.md`). Flipped Phase 1 from `Blocked on EFF-018` to `Unblocked, planned`. Documented that EFF-018 ships a client-side classifier and typed server-side error payloads, but no server-side classifier function — INIT-002 Phase 1 owns that mirror.
- **2026-05-08** — Phase 0 docs PR ([#41](https://github.com/wmishak404/laica/pull/41)) squash-merged at `cb94f28`. Closeout pass updated INIT-002 status, phase table, PRs and Branches, validation state, current resume point, and chronology, plus the `initiatives/registry.md` last-signal column.
- **2026-05-09** — Effort cleanup resolved EFF-019 as a standalone item. Active implementation remains in INIT-002, with PD-010 and `docs/workflows/ai-error-handling-and-telemetry.md` as the durable governance/workflow entrypoints.
