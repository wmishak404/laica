# INIT-005 Phase 1 - Action Foundation and Guardrails

**Status:** Implemented in PR #369; awaiting Wilson code/schema review
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

## Implemented Foundation Defaults — 2026-09-25

- The production registry contains the `timer.start` v1 contract with **no executor**. Global `COOKING_ACTIONS_ENABLED=false`, empty `COOKING_ACTIONS_PILOT_UIDS`, and `COOKING_ACTION_TIMER_START_ENABLED=false` remain the defaults. Environment changes alone cannot enable a Phase 1 action. No UI, enrollment, or production activation occurs in this branch.
- `shared/cooking-actions.ts` defines strict requests/results; `server/cooking-actions/` owns policy, service, routes, and the transactional ledger. A verified request maps to the server-owned `live_cooking` caller. Opaque browser/cook IDs, numeric session, step index, state checksum, and active-timer signal bind each stored proposal. Client state remains untrusted; Phase 2 must recheck it at application time.
- PostgreSQL locks the owned cooking-session row before reading or changing its action records. A unique `(session_id, idempotency_key)` prevents duplicate records within that session. Request identity contains parsed duration, scope, and request time, never an utterance or utterance hash. Changing parameters/browser/state within that namespace rejects the request. Keys are session-scoped; a different session is a separate namespace.
- A request carries `requestedAt`; new proposals accept at most a 120-second age and five seconds of future clock skew. This prevents an old request from creating new authority after its 90-day ledger record is removed. The proposal expires 120 seconds after that request time; a slow provider cannot extend it. The provider has a 15-second timeout, zero SDK retries, and 700 output tokens.
- The deterministic binder accepts one whole explicit timer command with integer digits or supported English numbers and seconds/minutes/hours, bounded to 1–86,400 seconds. Questions, negation, quoted instructions, ranges, bundled commands, decimal durations, and unsupported number phrases do not authorize. Step-derived duration is deferred to Phase 2's step/controller contract; "start the timer" currently requires clarification. This is a conservative grammar, not a claim about spoken recognition quality.
- Confirmation and receipt tokens are random, hashed at rest, and returned only by the committing request. Confirmation consumes the stored hash. Duplicate proposal/status calls return safe status, never a replayed token/directive; if a confirmation token response is lost, cancel and make a fresh proposal. Losing a dispatch response becomes an unknown outcome; Phase 2 must reconcile from its applied-action journal, never rerun a status result.
- Missing receipts become `outcome_unknown` on status/receipt access after 30 seconds. Matching late receipts resolve the original action; conflicting receipts append a diagnostic without overwriting the result. Revoking flags/eligibility stops dispatch while owner status and receipts remain accessible. Status and receipts have independent hourly budgets of 300/120; the proposal/confirmation routes retain voice hour/day budgets.
- Record reads reject ages over 90 days. A startup and hourly sweep deletes old records of every status and cascades their events; physical deletion can lag the cutoff by one sweep interval while the process is running. Session deletion cascades both tables. No raw UID copy or free-form payload exists in the ledger/event shape.
- Both interfaces use `getCookingAssistance`; action mode adds a strict structured-output contract and omits input/output eval logging. The model remains `gpt-4.1-mini`. Action-path access logs suppress IDs; API errors expose safe enums only. The separate `cooking_action_proposal` eval lane contains eight synthetic fixtures; no live utterances are exported.

Provider contract sources checked 2026-09-25: [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs) and [GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini). Local SDK compatibility is covered by provider-boundary tests; a live contract canary must succeed before treating real provider availability as proven.

## Current Delivery State and Resume

PR #367 merged the specification as `16b47bcc069d6ad2559a44a8a65236850762590b`; authorized mechanical closeout PR #368 merged as `45bd7e7912eb0b5748ee7d79dc8621fa8641b3ab`. This foundation branch starts from that fresh main commit.

Local typecheck/lint/build, 465 unit tests, and all 27 public fixture validations pass. Of those, eight fixtures exercise the separate action lane: three positive commands match their authored proposals, zero of three require clarification, and five blocking examples propose no action. These are deterministic synthetic results, not live model/speech metrics. Fifty-four focused tests cover policy/lifecycle, HTTP/provider privacy, and the action eval lane. The full E2E gate adds three real PostgreSQL tests for concurrent duplicates, transaction rollback, retention, and cascade deletion, plus verified linked-user empty-capability checks.

Local live-provider canary returned `provider_auth` (HTTP 401 category), without logging payloads or changing credentials. Replit targeted checks and source-head CI passed; the final review-head rerun and exact evidence are tracked in PR #369. See the [foundation handoff](../../../docs/handoffs/2026-09-25-codex-init-005-action-foundation.md) and review PR for current evidence. Do not merge without explicit Wilson review/approval and required Replit proof; do not start Phase 2 before that gate.

### Live-provider learning: narration is not authorization

The initial Replit canary at `35defa0b` generated a well-formed timer proposal for one narrated recipe instruction despite the negative-intent prompt. The deterministic whole-utterance binder rejects that text; it does not receive authority from the model. The follow-up adds explicit narrated-command and timing-question prompt examples plus exact service regression cases. Keep these cases separate from positive-command usefulness metrics. A schema-valid provider result is never evidence of user authorization; future action kinds require their own code-level source binding before executor registration.

The v2 negative examples suppressed all three supported positive commands in the next Replit canary. The v3 refinement balances explicit positive shapes with blocking examples and distinguishes the current utterance from recipe reference material. Positive correctness and clarification are independent checks; suppressing all action proposals is not an acceptable quality fix. Keep the deterministic server gate unchanged while refining model behavior.


### Review checkpoint

[PR #369](https://github.com/wmishak404/laica/pull/369) contains the implementation. At source head `1f71b03e`, 465 unit tests and 13 schema-backed E2E cases passed; Replit install/typecheck/build/schema health, auth-denial/private response and retention probes passed. The v3 live canary returned correct proposals for 3/3 positive commands and none for 5/5 negative cases. The two additive tables were applied to Replit development after reviewing the exact DDL; its primary publication history and preview were preserved. Final-head evidence lives in the PR and handoff. Phase 1 remains open until Wilson approves the code/schema merge; timer UI, speech/hardware, real browser receipt application and production activation remain Phase 2.
