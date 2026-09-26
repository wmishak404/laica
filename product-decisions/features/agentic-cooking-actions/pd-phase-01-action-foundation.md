# INIT-005 Phase 1 - Action Foundation and Guardrails

**Status:** Specification merged in PR #367; runtime implementation next
**Owner:** Codex; product owner Wilson
**Date:** 2026-09-24
**Initiative:** [INIT-005](../../../initiatives/INIT-005-agentic-cooking-actions.md)
**Source plan:** [Agentic Cooking Actions](pd-agentic-cooking-actions-plan.md)
**Volatility:** External/vendor-dependent
**Review trigger:** Verify provider structured-output support and current auth/session, timer, and open-PR contracts before runtime implementation.

## Purpose and Authorization

Wilson selected a private production pilot and existing tap-to-talk on 2026-09-23, then authorized starting INIT-005 on 2026-09-24. This is the first task: record the reviewed plan and Phase 1 implementation contract. Merge this specification before a fresh Phase 1 runtime branch starts from updated `origin/main`.

The first release is Phase 1 foundation followed by Phase 2 `timer.start`. The seven-phase roadmap remains intact. This record owns foundation contracts; the master plan owns Phase 2 timer acceptance and later phases. The engineering defaults below implement the reviewed approach; they are not claims that runtime behavior exists or has passed validation.

Phase 1 may write action metadata but must not mutate a timer, current-cook fact, profile, recipe, or History. No real executor is available through a production route. Future consequential-action confirmation is tested with synthetic adapters, not a temporary user-facing mutation.

## Audit Findings and Dependencies

Read-only audit base: `895df8187008294197650be6a8cbcece4d2abf04`, matching GitHub main on 2026-09-24.

| Observed source | Finding and implementation consequence |
|---|---|
| `server/routes.ts`, `client/src/lib/openai.ts` | Assistance returns plain text; add a typed action interface without changing the legacy response contract. Both routes should reuse the same answer-only service, not fork prompts or assistance implementations. |
| `server/openai.ts` | `logInteraction` is fire-and-forget. Use a dedicated awaited action ledger; best-effort eval logging cannot grant execution authority. Current assistance uses `gpt-4.1-mini`; retain the baseline pending contract verification/evals rather than treating the reviewing agent's model as a runtime migration. |
| `client/src/components/cooking/live-cooking.tsx` | Timers are client-owned; largest-duration extraction, duration-only control visibility, per-tick countdowns, raw transcript console output, and local restoration need targeted Phase 2 changes. These are static observations, not a new production reproduction. |
| `server/routes.ts` transcription | Current Whisper path returns text with no confidence score. Current tap-to-talk uses bounded command recognition and interruption checks; no invented confidence field or second confirmation for accepted clear commands. |
| `shared/schema.ts`, cooking-session routes | Durable cooking sessions are linked-only. Initially gate actions to allowlisted linked accounts and owned active sessions; do not create guest server cooking History to make action scoping easier. |
| [PR #334](https://github.com/wmishak404/laica/pull/334), [EFF-034](../../../efforts/effort-034-production-readiness-mobile-p2-cleanup.md) | Shared-surface conflict for Phase 2 timer state/reset. Foundation is independent. Coordinate the timer owner before editing; retain Reset-to-Start intent without absorbing the Settings work or duplicating an active implementation. |
| [PR #281](https://github.com/wmishak404/laica/pull/281) | Shared contract overlap for step duration/normalization and session snapshots. Foundation need not wait; re-audit its merge state before Phase 2 step references. Do not assume its unmerged normalizer is on main. |

[INIT-003](../../../initiatives/INIT-003-anonymous-trial-and-account-upgrade.md) is a hard identity/persistence boundary. [INIT-004](../../../initiatives/INIT-004-ai-output-quality-evals.md) is parallel-safe with a separate action-eval lane. [EFF-017](../../../efforts/effort-017-environment-parity-and-ci-confidence.md) governs service-backed test evidence. This task adds no standalone Effort and does not resolve those owners' work.

## Foundation Implementation Contract

### Registry, proposal, and policy

- Shared TypeScript/Zod types define versioned action input/result schemas and discriminated advice, clarification, proposal, dispatch, and blocked responses. Unknown fields/kinds/versions fail validation.
- The server-controlled registry owns executors, allowed callers, context packs, risk, confirmation, expiration, and idempotency policy. Capability discovery filters by rollout, authenticated identity, caller, and owned active cook. No client-selected caller type, action kind, model field, or confirmation can grant a capability.
- Phase 1 exposes answer-only compatibility. Timer schemas and lifecycle tests may exist, but no enabled timer executor or dispatch is reachable. Other actions remain unavailable.
- Use one bounded model proposal per request, strict structured output plus server validation, and no autonomous tool/retry loop. Treat utterance, recipe text, and saved facts as untrusted data in structured user context.
- Direct-request authorization is computed by deterministic code from the current submitted utterance and validated duration source. A model's intent/confidence/authorization assertion is insufficient. Store only the resulting authorization source and parser/policy version, not the utterance.
- Consequential confirmation binds a single-use token to the immutable action kind/version, parameters digest, owner/cook, state revision, and expiry. Any change requires a new proposal; confirmation rechecks policy and rollout eligibility.
- Keep existing authentication/App Check and voice-class hour/day rate limits. Apply server body/context/output bounds; preserve the current 2,000-character utterance ceiling. Rate-limit status/receipt traffic as well, without allowing an exhausted proposal budget to prevent reconciliation.
- A state checksum is a concurrency check, never proof of ownership or a trusted recipe. Server ownership checks and client execution-time revision checks remain separate.

### Scope, persistence, and lifecycle

- Use dedicated PostgreSQL/Drizzle action and event records with transactional state transitions and uniqueness for scoped idempotency keys. Use a numeric owned cooking-session reference plus an opaque cook/browser-instance binding; resolve authenticated ownership through existing session storage. Do not duplicate raw Firebase UIDs into action/event payloads.
- Store a stable action id, action/registry/policy versions, bounded validated parameters, parameter digest, caller and auth mode, scope references, authorization/confirmation method, expiry/timestamps, status, and typed result/reason codes. Events are append-only within the retention window. A model or client cannot supply arbitrary event data.
- Persist proposal/authorization and the dispatch transition before releasing an execution directive. A failed transaction releases no authority. Reusing an idempotency key with the same request identity returns the existing action; different parameters or scope are rejected.
- Cancel/expire only undispatched work. Terminal results cannot be overwritten or executed again. An expired proposal cannot be revived by a valid-looking confirmation.
- Before dispatch, audit failure blocks the action. After dispatch, missing evidence becomes `outcome_unknown`; it does not mean success, cancellation, or definite failure. A late matching receipt may reconcile the outcome without creating new execution authority.
- Client receipts are evidence of browser-reported application, not proof of a physical alarm, food doneness, or an uncompromised browser. Reject wrong-owner, wrong-instance, wrong-action, changed-parameter, and undispatched receipts. Duplicate matching receipts are idempotent; contradictory receipts retain the recorded outcome and raise a safe diagnostic.
- Establish the receipt schema and state transitions in Phase 1 with synthetic adapters. Phase 2 owns persistent applied-action tracking, bounded receipt retries, stale-tab/reload handling, and the actual timer controller.

### Public interface

All routes live under `/api/cooking/actions`, use the authenticated owner, and return only bounded safe fields.

| Route | Contract |
|---|---|
| `GET /capabilities` | Return currently usable user-facing capabilities for the owned active cook. Non-pilot/guest callers receive no mutating capability. Internal policy/executor definitions are never exposed. |
| `POST /propose` | Accept the utterance, owned cook reference, browser/state binding, and request idempotency key. Return a typed answer/clarification/proposal/block; only a later enabled executor may produce dispatch. |
| `POST /confirm` | Bind token and idempotency to the exact stored proposal, recheck all gates, and reject unavailable actions. No cooking mutation in Phase 1. |
| `POST /cancel` | Cancel caller-owned undispatched work only; repeat cancellation is idempotent. |
| `GET /:actionId` | Return caller-owned safe status/result, including unresolved execution. Wrong-owner and missing ids are indistinguishable; no event-listing API. |
| `POST /:actionId/result` | Validate an action-bound receipt and reconcile only the existing dispatch. Never a route to invoke an executor. |

Existing `/api/cooking/assistance` remains the answer-only interface for non-pilot users. Avoid submitting one utterance to both routes or retrying a possibly dispatched action through another path. Ledger failure may degrade a pilot request to safe advice, but it must not report or repeat an action.

### Privacy and rollout

- Action records/blocking reports use allowlisted metadata only: no transcript/question excerpts, raw audio/images, tokens, emails, raw Firebase UIDs, provider errors, prompts, free-form model output, or reasoning. Internal IDs and confirmation/execution secrets never enter model context or stdout.
- The current utterance may be processed transiently to answer/authorize. Do not pass action requests into the existing full input/output eval logger. Reconstruct synthetic eval fixtures from safe reason/shape signals. Remove raw transcript console output when wiring the affected client flow.
- Enforce 90-day cleanup for terminal records/events. Retained dispatch uncertainty is evidence, not a reason to retain records indefinitely or revive an old execution. Preserve account/session deletion behavior without creating orphaned identity copies.
- Server-only rollout configuration must default to off with an empty pilot allowlist; per-action enablement is separate from global enablement. Configuration is checked again before dispatch, not just during discovery. Actual account identifiers are configured privately, never in docs or public fixtures.
- Phase 1 cannot enable a timer through configuration alone because no real executor is registered. Phase 2 initially enables only `timer.start.v1` for explicitly enrolled linked testers. Guest/non-pilot assistance, manual controls, and already-running timers remain usable when actions are disabled.
- Status and receipt reconciliation remain available to the owning caller after eligibility is revoked or dispatch is disabled. Kill controls revoke new dispatch authority, not the evidence path for work already sent.
- Preserve applicable safety rejection before any executor. Timer completion is a prompt to check the food, not a claim of safe doneness. Maintained food-safety rules and bundle recovery must be specified before later food-related mutations.

## Acceptance and Evidence

| Scenario | Required evidence |
|---|---|
| Registry/capabilities | Unknown or disabled kinds fail; caller/owner/guest/pilot filters cannot be overridden in a body or model response; no real Phase 1 executor is callable. |
| Authorization/confirmation | Clear-command source binding succeeds in synthetic tests; timing questions, negation, suggestions, injected recipe instructions, mismatched/expired/reused confirmation tokens fail closed. |
| Ownership/concurrency | Cross-account session/action reads and writes fail; stale cook/step/instance bindings fail; concurrent duplicates create one action; parameter changes under the same key fail. |
| Ledger failures | Injected proposal/authorization/dispatch persistence failure releases no directive; post-dispatch lost receipts become unresolved; retry reconciles the same action without re-execution. |
| Privacy/retention | Writer rejects forbidden fields; no transcript in console/ledger/eval artifacts; old terminal events are deleted; ownership references respect deletion boundaries. |
| Compatibility | Existing guest and non-pilot Q&A works; a ledger outage does not disable normal advice or manual timer controls. |
| Rollout | Global/action disable and allowlist removal stop new dispatch; status/receipt access survives disablement for the owning caller. |

Use the existing eval registry/harness with a distinct `cooking_action_proposal` lane. Version fixtures and policy/model/prompt provenance. Require zero executor reachability in forbidden, unauthorized, malformed, stale, and audit-failure tests. Record positive-command correctness and clarification rate separately; Phase 1 infrastructure tests do not prove spoken-command quality.

For runtime work, run focused unit/route tests, `npm run check`, `npm run build`, and the full schema-backed guest + linked E2E gate for each pushed review head. Apply the [testing evidence report](../../../docs/workflows/testing-and-acceptance.md): claimed behavior, command/source provenance, result, reasoning, and negative scope. This feature's new schema and auth/provider boundaries require Replit validation before merge; use direct shell/UI, never Replit Agent without separate approval.

Phase 2 must add real tap-to-talk/provider tests, mobile checks at 390x844 and 412x915, speech arbitration, background/resume, timer-on-untimed-step, and loss/replay tests. Keep its production rollout disabled until baseline smoke and explicit pilot activation approval. Runtime PRs register changed-since-production breadcrumbs.

## Current Delivery State and Resume

This task changes documentation only. No dependency install, provider call, schema push, executor, account enrollment, Replit validation, or production change is part of it. Documentation checks and point-in-time evidence belong in the handoff and PR.

PR #367 merged this specification as `16b47bcc069d6ad2559a44a8a65236850762590b` from exact validated head `994a6c065d836467c17519a609d0fc1aae3f0eb3`. After its mechanical INIT closeout, create a fresh `codex/` foundation branch from updated `origin/main`. Build registry/types and scope checks, transactional ledger and privacy enforcement, orchestration routes and disabled rollout controls, then deterministic acceptance/eval coverage. Do not start Phase 2's timer executor before the Phase 1 gate passes.
