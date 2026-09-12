# INIT-005 - Agentic Cooking Actions

**Status:** Planning
**Owner:** Wilson / Codex / Claude / Replit
**Created:** 2026-09-11
**Current phase:** Phase 1 - Action Foundation and Guardrails

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

The accepted plan was first published through PR #356 as a future Mobile Refresh Phase 4 extension. Wilson reclassified the work as an independent initiative on 2026-09-11 because its seven phases span architecture, guardrails, action execution, persistent user facts, recipe state, voice/integration access, evals, and rollout beyond INIT-001's remaining scope.

No INIT-005 runtime implementation, API, tool, schema, storage, voice integration, or production behavior has started. Phase 1 is the next proposed implementation phase; the first user-visible mutation remains the Phase 2 direct timer-start prototype, where a clear command needs no second confirmation.

## Source Docs

- [Agentic Cooking Actions feature index](../product-decisions/features/agentic-cooking-actions/README.md)
- [Agentic Cooking Actions plan](../product-decisions/features/agentic-cooking-actions/pd-agentic-cooking-actions-plan.md)
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
| 1 - Action Foundation and Guardrails | Planned; next | Registry, ledger, capabilities, typed proposals, policy and blocking contracts without mutation | Current contracts audit |
| 2 - Timer Action Prototype | Planned | First direct `timer.start` action through `Ask a question`, without redundant confirmation | Phase 1 exit gate |
| 3 - Session Facts and Pantry/Profile Corrections | Planned | Session-only facts and confirmed linked-user corrections | Phases 1-2; INIT-003 boundaries |
| 4 - Localized Recipe Patching and Final History | Planned | Safe current/future guide patch and final patched History | Stable step/session shape; Phases 1-3 |
| 5 - Restart/Replan and Safety Escalation | Planned | Explicit safe replacement when patching is unreliable | Patch-boundary evidence |
| 6 - Voice Agent and Integration Interface | Planned | Scoped caller tools without direct executor access | Stable enabled core actions |
| 7 - Controlled Rollout and Expansion | Planned | Adversarial validation, kill controls, registry governance, and approved rollout | Prior enabled phases |

Guardrails and separate action evals are required exit evidence in every phase, not a Phase 7 hardening task.

## PRs and Branches

| Item | Status | Scope |
|---|---|---|
| [PR #356](https://github.com/wmishak404/laica/pull/356) | Merged as `d6300aa6` | Original action plan, then classified under INIT-001 Phase 4 |
| `codex/init-005-agentic-action-phases` | Active docs branch | Reclassifies the plan as INIT-005 and adds the numbered phase system |

No implementation branch or task has been started.

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

## Validation State

This reclassification is documentation only. It changes no runtime UI, API, tool, schema, storage, model/provider, auth/session, pantry/profile, recipe, History, deployment, or production behavior. Implementation validation has not started.

Before Phase 1 is ready, its branch must prove registry/schema validation, caller/session capability scoping, proposal lifecycle traceability, prompt-injection and forbidden-action rejection, cross-user isolation, redacted blocking reports, fail-closed audit behavior, and answer-only compatibility.

## Current Resume Point

Start from fresh `origin/main`, inspect open work and current Live Cooking/action-adjacent contracts, and create the Phase 1 detailed record. Phase 1 must establish the non-mutating Action Registry, Action Ledger, capability discovery, typed proposal, direct-request authorization, consequential-action confirmation, policy, and blocking-report foundation. Do not start the timer executor until Phase 1's exit gate is met.

Do not spawn implementation tasks until Wilson explicitly approves implementation and assigns the first phase. When that approval arrives, INIT-005 can proceed independently of remaining INIT-001 work unless the fresh audit finds a direct shared-surface conflict.

## Chronology

### 2026-08-20 / 2026-08-23 - Original plan published

PR #356 published the draft agentic cooking actions plan and merged as `d6300aa6`. It kept `Ask a question` as the action surface and established typed proposals, confirmations, safety and privacy gates, fail-closed blocking reports, and a separate action-eval direction. No runtime implementation started.

### 2026-09-11 - Independent INIT and numbered phases accepted

Wilson accepted the Action Registry, Action Ledger, capability discovery, integration-scoping direction, and requested a numbered phase program. He then reclassified the work from a Mobile Refresh Phase 4 extension to independent INIT-005 because INIT-001 is nearly complete and the new platform no longer depends on its remaining sequence.

Wilson also clarified the confirmation model: an explicit, unambiguous timer-start command is itself authorization and does not need a second tap, while inferred or ambiguous timer behavior stays non-mutating until the user acts or clarifies. Recipe and durable-data changes retain exact action-bound confirmation. He confirmed that the initiative remains a cooking-specific agent, not a general-purpose personal agent.
