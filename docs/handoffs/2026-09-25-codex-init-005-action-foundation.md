# INIT-005 Phase 1 action foundation

**Agent:** Codex
**Branch:** `codex/init-005-action-foundation`
**Date:** 2026-09-25
**Initiative:** [INIT-005](../../initiatives/INIT-005-agentic-cooking-actions.md)
**INIT updated:** yes — phase state, registry, feature index and phase/master plan
**Resolves blocked handoff:** none

## Summary

The foundation implements the action contract and evidence boundary while the production registry remains unable to execute an action. A directive can only leave a committed transaction; retries return status, and missing receipts remain unresolved rather than claiming success. This creates the Phase 1 review surface for the accepted Phase 2 private tap-to-talk timer pilot. It does not ship a timer, enroll accounts, or publish production.

Wilson authorized merging the specification and starting foundation here. PR #367 merged as `16b47bcc069d6ad2559a44a8a65236850762590b`; its mechanical closeout #368 merged as `45bd7e7912eb0b5748ee7d79dc8621fa8641b3ab`. Code merge and pilot activation still need explicit approval.

## Changes

- `shared/cooking-actions.ts`, `server/cooking-actions/`: strict versioned schemas, server caller/pilot policy, bounded explicit-duration binder, proposal/confirmation/cancel/status/receipt service, owned session locking, metadata-only ledger, token hashes, and retention. Only tests inject a synthetic browser dispatcher.
- `shared/schema.ts`, `scripts/db-schema-health.ts`: two additive tables, session-scoped unique request keys, indexed retention, cascading session/action deletion, schema preflight requirements.
- `server/routes.ts`, `server/rate-limit.ts`, `server/index.ts`: authenticated private API, independent status/receipt budgets, 16 KB action JSON bound, ID-free access logging, startup/hourly retention.
- `server/openai.ts`: same assistance service/model, with one strict bounded action-proposal mode and no action input/output interaction logging. Safe categorical provider errors support the read-only synthetic canary in `scripts/check-cooking-action-provider.ts` / `npm run check:action-provider`.
- Eval registry/criteria/harness plus eight synthetic fixtures; four focused unit files and three disposable-PostgreSQL E2E cases, plus linked-token capability assertions and updated fixture inventory.
- INIT/phase/master plan/index, EFF-017 signal, production-validation breadcrumb, and this handoff preserve the implementation defaults and remaining gates.

## Impact on other agents

Read the [Phase 1 implementation defaults](../../product-decisions/features/agentic-cooking-actions/pd-phase-01-action-foundation.md#implemented-foundation-defaults--2026-09-25) before adding an executor. Phase 2 owns actual browser revision checking, the applied-action journal, timer controller, step-derived duration, existing transcript console cleanup, speech arbitration, mobile layout and pilot activation. PR #334/EFF-034 (timer reset) and #281 (step schema) remain shared-surface checks before Phase 2; they do not block this independent foundation. INIT-003 identity boundaries are preserved. EFF-017 conforms/adds database evidence; no new Effort is created.

The primary local checkout's pre-existing encrypted `.env` edit was left alone. The managed worktree key is an ignored helper-created symlink; no secret values were read, printed, committed or changed.

## Verification

**Value claim:** the infrastructure withholds authority until owner/policy/audit checks pass and keeps dispatch evidence distinct from reported application. No user-visible timer benefit is claimed in Phase 1.

**Local evidence:** Node 24.14.1/npm 11.11.0, `npm ci`, `npm run check`, `npm run build`, `npm run test:unit` (57 files / 465 tests), `npm run eval:fixtures` (27 fixtures, eight action-lane cases), `git diff --check`. Relevant source: `tests/unit/cooking-actions.test.ts`, `cooking-action-routes.test.ts`, `cooking-action-provider.test.ts`, `cooking-action-evals.test.ts`. Existing 411-test baseline remains included. Build retains existing bundle-size/dynamic-import warnings; locked dependencies report five moderate audit findings, with no dependency changes in this branch.

**Test impact:** deterministic gates, malformed/injected inputs, owner isolation, stale/changed scope, confirmation expiry/replay, all pre-dispatch audit failure points, concurrency, late/conflicting receipts, retention and privacy are covered. Synthetic positive commands: 3/3 authored proposals match, clarification 0/3; five negative fixtures propose no action. Fifty-four focused tests are infrastructure evidence, not a live-provider benchmark.

**Exact-head CI:** full unit and schema-backed guest/linked E2E gates must run after each pushed review head. The new E2E file exercises real PostgreSQL locks/transactions/cascades with a synthetic provider/dispatcher; it does not activate the production registry. Record final run/head/results in this handoff follow-up and the review PR; no merge readiness is claimed while pending/skipped/failed.

**Live provider diagnostic:** local dotenvx credentials returned `provider_auth` (HTTP 401 category); credentials were left unchanged. Replit succeeded after the prompt refinement: all three positive commands correct, zero positive clarifications and zero proposals across five negative examples. This is one eight-case synthetic canary, not a speech or broad model-quality benchmark.

**Evidence limits:** no production publish, pilot enrollment, real action execution, audible speech, Google popup/App Check production proof, or mobile change. The targeted Replit schema/provider/auth-denial/retention checks below passed; positive linked-token capability checks are CI evidence, not a claimed Replit Google/App Check end-to-end test. No local/shared `.env` database schema push was performed. No Replit Agent was used.

## Stack / base status

- Base refreshed: yes; foundation started after #367/#368 merged.
- Current base: `origin/main` at `45bd7e7912eb0b5748ee7d79dc8621fa8641b3ab`.
- Last Replit-validated at: `1f71b03e92d9cb7b3700ad8f1b98e811bc406535` (implementation head; see final-head rule below).
- Replit read-only inspection: clean `main` with a local `Published your App` commit (not replaced). Preserve this history when preparing isolated validation.

## Open items / resume

1. Final review artifact: [PR #369](https://github.com/wmishak404/laica/pull/369). This evidence-only follow-up triggers a fresh full CI gate. Final review-head SHA, CI result and post-documentation Replit rerun are recorded in the PR body after this commit, avoiding an endless evidence-only commit loop. Do not infer final-head validation from the previous source-head evidence below.
2. Wilson reviews and explicitly approves the code/schema merge. The selected Replit scope is schema/provider/auth rejection/private responses/empty production registry/retention; linked Firebase tokens and real DB lifecycle are tested in CI. No production publish, pilot enrollment, UI or audible-speech claim. Replit positive Google/App Check interaction and full mobile timer acceptance remain the Phase 2/release lane.
3. After an approved merge, perform immediate INIT docs closeout from fresh main; then audit #334/#281 ownership before Phase 2.
4. Replit development now has the two additive foundation tables. Its main checkout and running preview remain on the pre-existing publication commit `896f6ef8a7389f9a12cf8c64d9914ca19d2a6fc6`; do not overwrite that history. Isolated `/tmp/laica-init005-validation` is a validation checkout, not the deployed source. Local credentials still fail the optional provider diagnostic; Replit credentials work.

## Replit live-provider learning — first review head

At `35defa0bdaeb110efea95478438c8c819c0f5b47`, an isolated Replit checkout (`/tmp/laica-init005-validation`) used Node 20.20.0/npm 10.8.2 and Replit-injected secrets (presence only verified). `npm ci` passed. The live eight-case canary produced correct durations for all three positive commands, with zero positive clarifications. One of five negative examples, the narrated recipe instruction, produced a model timer proposal. No action service/executor was invoked by the canary; the deterministic whole-utterance binder rejects this exact text. The model boundary therefore cannot confer authority even when structured output is valid.

Follow-up tightens the narration-versus-current-command examples and adds the exact observed case to the service-level blocking tests. Earlier provider results are not final-head approval; rerun after the prompt commit. Local `provider_auth` is specific to local credentials, not Replit provider availability. The Replit primary checkout, live preview and publication history remain unchanged; no schema push or Agent task occurred during these checks.

## First implementation head CI

Head `35defa0bdaeb110efea95478438c8c819c0f5b47` passed [CI run 36205229471](https://github.com/wmishak404/laica/actions/runs/36205229471), including all 463 unit tests and all 13 E2E cases (the 10 existing guest/linked cases plus three new real-PostgreSQL lifecycle cases). Disposable Neon schema push/health and cleanup succeeded. CodeQL, dependency audit and PR secret scan also passed. This proves the first implementation's automated boundary, not the follow-up prompt head; the next push triggers a fresh complete gate.

## Canary refinement — balance authorization and useful proposals

The v2 prompt at `b9b6fb522bdc803e61f13dd51a97a9780350d699` eliminated the five negative proposals but also returned advice for all three supported positive commands. This fails the positive-command canary and is not accepted as a fix. The v3 prompt explicitly identifies the current utterance field, distinguishes proposing from executing, gives positive response shapes alongside blocking examples, and scopes the shared cooking-style prompt to advice text. Neither change weakens the deterministic authorization gate. Replit `db:health` at v2 reported only the two expected new tables missing (`cooking_actions`, `cooking_action_events`).

## Implementation-head evidence — ready for human review

**Review PR:** [#369](https://github.com/wmishak404/laica/pull/369)
**Source head:** `1f71b03e92d9cb7b3700ad8f1b98e811bc406535`
**Base:** `45bd7e7912eb0b5748ee7d79dc8621fa8641b3ab`, fresh `origin/main`

- [CI run 36205711697](https://github.com/wmishak404/laica/actions/runs/36205711697): typecheck/lint/build; 57 unit files / 465 tests; coverage rerun passed. All 13 E2E cases passed in 59.8 seconds, including three PostgreSQL lifecycle cases and linked-token empty-capability assertions. Neon schema creation/push/health and branch deletion succeeded. CodeQL, dependency audit and PR secret scan passed; push secret scan was skipped by event policy.
- Replit direct shell, Node 20.20.0/npm 10.8.2: isolated detached checkout of this exact source head; locked install, typecheck/UI lint and build passed. `npm run db:push -- --strict --verbose` was reviewed before execution: exactly two CREATE TABLE statements, their two foreign keys and three indexes; no existing table/data changes. The additive development schema applied and `npm run db:health` passed.
- `npm run check:action-provider` using Replit-injected credentials and `gpt-4.1-mini` / `action-proposal-v3` / `timer-intent-1`: 3/3 explicit durations correct, positive clarification 0/3, forbidden proposals 0/5. Only fixture IDs, type and bounded duration/aggregate metrics were printed. No transcript, free-form model answer, auth identity or provider payload was retained in action/eval artifacts.
- One-shot loopback probe (`node --import tsx --input-type=module`, Express `registerRoutes`, ephemeral `127.0.0.1` port): missing/invalid Bearer tokens returned 401 with `Cache-Control: private, no-store`; production-registry capability discovery returned an empty list without invoking the provider; `createPostgresActionLedger().prune()` succeeded. Probe server and pool closed. Output: `authDenials=2`, `privateResponses=2`, `productionCapabilities=0`, `retention=passed`.
- Replit primary `git status --short` remained empty and HEAD remained `896f6ef8a7389f9a12cf8c64d9914ca19d2a6fc6`. No running preview branch switch, flag activation, pilot UID enrollment, production republish or Replit Agent task.

**Evidence limits:** eight synthetic prompts are a targeted provider contract/quality canary. They are not randomized accuracy evidence, a fresh Replit Google sign-in/App Check enforcement proof, microphone/audio testing, or timer application/reload/background correctness. All real timer execution is absent by construction and belongs to Phase 2. The final evidence-doc commit requires a fresh exact-head CI and Replit rerun recorded in PR #369 before approval/merge readiness is claimed.
