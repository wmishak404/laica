# INIT-005 - Agentic Cooking Actions

**Status:** In Progress
**Owner:** Wilson / Codex / Claude / Replit
**Created:** 2026-09-11
**Current phase:** Phase 1 merged; dependency remediation and #371 closeout precede Phase 2 private timer implementation
**Planning foundation:** PR #363 merged as `b208ef28a686ae43045ee83712a7319d43a3e6f2`; execution authorized 2026-09-24; foundation branch started 2026-09-25

## Overview

Agentic Cooking Actions evolves Live Cooking's existing `Ask a question` flow into a guarded action surface. A cook can ask naturally, receive an explanation, directly start a valid in-session timer without redundant confirmation, and when appropriate confirm a consequential current-cook fact, pantry/profile correction, recipe patch, or restart/replan action. The same versioned interface should later support a voice agent and explicitly approved integrations without granting them direct access to application executors.

The initiative owns the Action Registry, Action Ledger, capability discovery, proposal and authorization/confirmation APIs, deterministic execution gates, action-specific privacy and security boundaries, food-safety policy integration, a separate action-eval lane, and controlled rollout.

INIT-005 does not create a general-purpose personal agent. Laica's agency is limited to the active cooking task, that user's own cooking data, and deliberately approved capabilities.

## Relationship to Other Initiatives

### INIT-001 - Independent with a stable-surface dependency

[INIT-001](INIT-001-mobile-refresh.md) supplies the current Live Cooking UI, `Ask a question`, timer behavior, cooking sessions, pantry/profile surfaces, and History boundary. INIT-005 is no longer a Phase 4 sub-plan and does not wait for remaining INIT-001 cosmetic, provider-comparison, Phase 4 closeout, or Phase 5 work.

Before each INIT-005 implementation phase, audit current Live Cooking and open PR ownership. A direct shared-surface or contract conflict is a scoped implementation dependency, not a reason to place the initiative back under INIT-001.

### INIT-003 - Hard boundary for guest and linked persistence

[INIT-003](INIT-003-anonymous-trial-and-account-upgrade.md) remains authoritative for guest versus linked identity, account upgrade, cooking-session ownership, and which facts may persist. INIT-005 actions must conform to those boundaries.

### INIT-004 - Parallel-safe with shared eval discipline

[INIT-004](INIT-004-ai-output-quality-evals.md) owns the broader AI output-quality eval system. INIT-005 owns its separate `cooking_action_proposal` action lane and action-specific fixtures, blocking outcomes, confirmation tests, and excessive-agency cases. It may reuse INIT-004 workflows and harness conventions without blending action quality into existing cooking-step or assistance surfaces.

## Current Status

The accepted plan was first published through PR #356 as a future Mobile Refresh Phase 4 extension. Wilson reclassified the work as an independent initiative on 2026-09-11 because its seven phases span architecture, guardrails, action execution, persistent user facts, recipe state, voice/integration access, evals, and rollout beyond INIT-001's remaining scope. PR #363 merged that reclassification and numbered plan as `b208ef28a686ae43045ee83712a7319d43a3e6f2`.

Wilson selected a private production pilot using existing tap-to-talk on 2026-09-23, and authorized starting INIT-005 on 2026-09-24. PR #367 merged the reviewed plan and [Phase 1 specification](../product-decisions/features/agentic-cooking-actions/pd-phase-01-action-foundation.md) as `16b47bcc069d6ad2559a44a8a65236850762590b` on 2026-09-25 (Pacific). Phase 1 foundation is implemented on `codex/init-005-action-foundation`, based on merged closeout PR #368 (`45bd7e79`). No INIT-005 production behavior has shipped; the production registry has no executor. The first user-visible action remains Phase 2 direct timer start without a second confirmation.

## Dependency prerequisite — 2026-10-08

Phase 1 PR #369 is already merged as `96ec567a6f55639473d3209376fa180b2dd1f924`; the pending #371 documentation closeout owns its detailed merged status and handoffs. The compatible remediation candidate #372 (`codex/init-005-audit-remediation`) remains unmerged. Wilson selected preparation of a separate Tailwind 4 migration after that compatible slice left the audit gate blocked. The accepted browser floor is Safari 16.4+, Chrome 111+, and Firefox 128+, with mobile/WebKit visual comparison and exact-head automated regression required. Wilson subsequently directed that Replit validation wait until full regression/release validation; it is not a prerequisite for preparing or reviewing this migration. No audit exception is authorized.

`codex/tailwind-4-audit-remediation` is stacked on #372 so the combined remediation is testable while the migration diff stays separate. Code/dependency merges, publication, pilot activation, and Replit Agent use still require explicit approval. After approved remediation reaches main, refresh and check #371 for the authorized mechanical closeout; then start Phase 2 from fresh main and repeat the #334/#281 ownership audit. The dated Phase 1 review checkpoints below are historical; #371 owns the detailed merged validation record and closeout handoffs.

## Source Docs

- [Agentic Cooking Actions feature index](../product-decisions/features/agentic-cooking-actions/README.md)
- [Agentic Cooking Actions plan](../product-decisions/features/agentic-cooking-actions/pd-agentic-cooking-actions-plan.md)
- [Phase 1 foundation specification](../product-decisions/features/agentic-cooking-actions/pd-phase-01-action-foundation.md)
- [Mobile Refresh Phase 4 Live Cooking baseline](../product-decisions/features/mobile-refresh/pd-phase-04-cooking.md)
- [AI privacy, prompt-injection, and abuse rules](../product-decisions/features/mobile-refresh/pd-cross-phase-ai-privacy.md)
- [Testing and Acceptance Workflow](../docs/workflows/testing-and-acceptance.md)
- [Evaluations Workflow](../docs/workflows/evaluations.md)
- [Documentation Routing](../docs/workflows/documentation-routing.md)

## Assets

No dedicated INIT-005 assets exist yet. Reuse current Live Cooking screenshots only as baseline evidence until a phase introduces an approved UI change.

## Phase Progress

| Phase | Status | Goal | Dependency |
|---|---|---|---|
| 1 - Action Foundation and Guardrails | Merged as `96ec567a`; mechanical closeout #371 blocked on audit remediation | Registry, transactional ledger, scoped capabilities, proposal/receipt contracts, privacy, and rollout controls; no cooking mutation | Runtime implementation and foundation evidence |
| 2 - Timer Action Prototype | Planned | First direct `timer.start` action through `Ask a question`, without redundant confirmation | Phase 1 exit gate |
| 3 - Session Facts and Pantry/Profile Corrections | Planned | Session-only facts and confirmed linked-user corrections | Phases 1-2; INIT-003 boundaries |
| 4 - Localized Recipe Patching and Final History | Planned | Safe current/future guide patch and final patched History | Stable step/session shape; Phases 1-3 |
| 5 - Restart/Replan and Safety Escalation | Planned | Explicit safe replacement when patching is unreliable | Patch-boundary evidence |
| 6 - Voice Agent and Integration Interface | Planned | Scoped caller tools without direct executor access | Stable enabled core actions |
| 7 - Controlled Rollout and Expansion | Planned | Broader action/caller validation, registry governance, and rollout expansion | Prior enabled phases; Phase 1 supplies initial kill controls |

Guardrails and separate action evals are required exit evidence in every phase, not a Phase 7 hardening task.

## PRs and Branches

| Item | Status | Scope |
|---|---|---|
| [PR #356](https://github.com/wmishak404/laica/pull/356) | Merged as `d6300aa6` | Original action plan, then classified under INIT-001 Phase 4 |
| [PR #363](https://github.com/wmishak404/laica/pull/363) | Merged as `b208ef28` | Reclassifies the plan as INIT-005 and adds the numbered phase system |

[PR #367](https://github.com/wmishak404/laica/pull/367) merged as `16b47bcc` from head `994a6c06`; specification task complete. PR #368 merged the specification closeout as `45bd7e79`. Foundation [PR #369](https://github.com/wmishak404/laica/pull/369) merged as `96ec567a6f55639473d3209376fa180b2dd1f924`. Detailed closeout [PR #371](https://github.com/wmishak404/laica/pull/371), branch `codex/init-005-phase1-merge-closeout`, remains blocked on dependency remediation. Compatible remediation [#372](https://github.com/wmishak404/laica/pull/372) is the base of the separate Tailwind 4 migration candidate.

## Efforts and Governance

- Do not create a standalone Effort for work already owned by this INIT or one of its phase records.
- Follow PD-005 and `design_guidelines.md` before any user-facing UI change.
- Durable navigation changes are out of scope unless Wilson separately approves them. `Ask a question` remains the action surface.
- No Replit Agent use without Wilson's explicit approval.
- Runtime behavior changes require exact-head E2E evidence, the applicable Replit validation lane, and a production-validation registry breadcrumb.

## Changes Added After Initial Plan

- 2026-09-11: Wilson accepted Action Registry, Action Ledger, scoped capability discovery, integration scoping, and a one-through-seven phase structure.
- 2026-09-11: Wilson moved ownership from INIT-001 Phase 4 to independent INIT-005 because INIT-001 is nearly complete and should not sequence this broader platform initiative.
- 2026-09-11: Wilson decided that a direct, unambiguous timer-start request is itself authorization and should not receive a second confirmation; consequential recipe and durable-data changes still require exact confirmation.
- 2026-09-11: Wilson confirmed that INIT-005 is not a general-purpose personal agent and remains limited to the active cooking task, that user's own data, and approved capabilities.
- 2026-09-23/24: Wilson selected a private production pilot and existing tap-to-talk, then authorized execution. The reviewed first release moves rollout controls to Phase 1, adds browser receipts/unknown outcomes and a dedicated ledger, aligns confirmation rules, and moves bundled pantry/guide changes to Phase 4. Engineering details live in the phase record.

## Validation State

The September 11 reclassification was documentation only. It changes no runtime UI, API, tool, schema, storage, model/provider, auth/session, pantry/profile, recipe, History, deployment, or production behavior. PR #363 exact head `071e973d6b96d8fc4aef3e0515793c8a791c1096` passed unit/typecheck/build/coverage, schema-backed guest + linked E2E with disposable Neon cleanup, dependency audit, secret scan, and all CodeQL analyses before merge. Foundation validation is now tracked separately below.

The September 24 specification task is also docs-only; it does not inherit runtime/action validation from PR #363. Before Phase 1 is ready, its runtime branch must prove the [foundation acceptance matrix](../product-decisions/features/agentic-cooking-actions/pd-phase-01-action-foundation.md#acceptance-and-evidence), including scoped capabilities, transactional pre-dispatch audit, receipt reconciliation, privacy/retention, disabled rollout controls, and answer-only compatibility.

## Current Resume Point

Resolve the dependency prerequisite, then refresh and mechanically complete [#371](https://github.com/wmishak404/laica/pull/371). Phase 1 [#369](https://github.com/wmishak404/laica/pull/369) is already merged as `96ec567a6f55639473d3209376fa180b2dd1f924`; do not recreate it. The compatible remediation [#372](https://github.com/wmishak404/laica/pull/372) passed functional CI but still fails the high/critical audit gate. Wilson selected preparation of a separate Tailwind 4 migration with Safari 16.4+, Chrome 111+ and Firefox 128+ support; the combined candidate passes that unchanged audit gate locally. See the [migration handoff](../docs/handoffs/2026-10-08-codex-tailwind-4-audit-remediation.md) and its PR for final-head evidence and approval status. Code/dependency merges still require explicit Wilson approval.

After approved remediation and #371 closeout, start the accepted Phase 2 timer plan from fresh main in an isolated branch, rechecking open #334/#281 ownership before overlapping edits. Replit shell/browser validation waits until full/release regression under Wilson's 2026-10-08 harness update; required full automated exact-head CI/E2E remains independent. Pilot activation and publishing remain separately approval-gated.

The first deployment target is a private production pilot after Phase 2 and Replit validation, not a Replit-only prototype or an all-user launch. Initial eligibility is explicitly allowlisted linked accounts; actual enrollment happens privately at activation. PR #334/EFF-034 and PR #281 are shared-surface/contract coordination points before timer work, not hard prerequisites for the Phase 1 foundation.

## Chronology

### 2026-08-20 / 2026-08-23 - Original plan published

PR #356 published the draft agentic cooking actions plan and merged as `d6300aa6`. It kept `Ask a question` as the action surface and established typed proposals, confirmations, safety and privacy gates, fail-closed blocking reports, and a separate action-eval direction. No runtime implementation started.

### 2026-09-11 - Independent INIT and numbered phases accepted

Wilson accepted the Action Registry, Action Ledger, capability discovery, integration-scoping direction, and requested a numbered phase program. He then reclassified the work from a Mobile Refresh Phase 4 extension to independent INIT-005 because INIT-001 is nearly complete and the new platform no longer depends on its remaining sequence.

Wilson also clarified the confirmation model: an explicit, unambiguous timer-start command is itself authorization and does not need a second tap, while inferred or ambiguous timer behavior stays non-mutating until the user acts or clarifies. Recipe and durable-data changes retain exact action-bound confirmation. He confirmed that the initiative remains a cooking-specific agent, not a general-purpose personal agent.

### 2026-09-11 - Independent INIT plan merged

PR #363 merged as `b208ef28a686ae43045ee83712a7319d43a3e6f2` from exact validated head `071e973d6b96d8fc4aef3e0515793c8a791c1096` after the separate dependency gate remediation and closeout merged to `main`. The initiative remains in `Planning`: Phase 1 is the documented next phase, but Wilson has not yet authorized implementation tasks or runtime work.

### 2026-09-24 - Execution starts with first-release specification

After the September 23 review, Wilson authorized starting INIT-005. Codex began the first specification task in an isolated worktree from main `895df818`, preserving the seven-phase roadmap and recording a Phase 1 foundation -> Phase 2 private tap-to-talk timer pilot. The phase record separates observed source gaps from engineering defaults and future validation. No runtime work or production activation is claimed by this docs task.

### 2026-09-25 - First-release specification merged

Wilson authorized the annotated next step to merge the specification and begin Phase 1 here. PR #367 merged as `16b47bcc069d6ad2559a44a8a65236850762590b` from exact head `994a6c065d836467c17519a609d0fc1aae3f0eb3`. CI run `36071505540` passed typecheck/lint/build, 411 unit tests, and 10 schema-backed guest/linked E2E tests with Neon cleanup. Dependency audit, secret scan, and CodeQL passed. These are unchanged-baseline checks for a docs-only PR, not action implementation evidence. Replit validation was not required. See the merge-closeout handoff for provenance; runtime work is next after this fact-only closeout.

### 2026-09-25 - Foundation implementation prepared

Codex reused the isolated worktree on fresh `codex/init-005-action-foundation` from main `45bd7e79` after merging #368. The phase record now documents implementation defaults and failure/replay semantics. The branch adds no real executor or UI. Local deterministic validation passes; exact-head CI, Replit service proof, and human code review remain before merge. [Foundation handoff](../docs/handoffs/2026-09-25-codex-init-005-action-foundation.md).

### 2026-09-25 - Foundation reaches review checkpoint

PR #369 source head `1f71b03e` passed 465 unit tests, 13 E2E cases with disposable Neon cleanup, and security checks. Isolated Replit validation passed compile/build, additive schema health, live provider canary (3/3 correct positive commands, no proposals in five negative cases), auth rejection/private headers, empty production registry, and retention. Prompt learning and evidence limits are in the phase record/handoff. Replit development contains the two new tables; primary publication history and preview are preserved. Final evidence-only documentation triggers fresh CI/Replit checks recorded in the PR. Wilson's code/schema merge decision is the next gate; no real executor, enrollment or production publish has occurred.
