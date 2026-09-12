# Agentic Cooking Actions Plan

**Status:** Accepted phased plan; implementation not started
**Document kind:** Feature initiative plan
**Owner:** Wilson
**Date:** 2026-08-20
**Last revised:** 2026-09-11
**Initiative:** [INIT-005 - Agentic Cooking Actions](../../../initiatives/INIT-005-agentic-cooking-actions.md)
**Related initiatives:** [INIT-001 - Mobile Refresh](../../../initiatives/INIT-001-mobile-refresh.md), [INIT-003 - Anonymous Trial and Account Upgrade](../../../initiatives/INIT-003-anonymous-trial-and-account-upgrade.md), [INIT-004 - AI Output Quality Evals and Prompt Improvement](../../../initiatives/INIT-004-ai-output-quality-evals.md)
**Related docs:** [Live Cooking baseline](../mobile-refresh/pd-phase-04-cooking.md), [AI privacy, prompt-injection, and abuse rules](../mobile-refresh/pd-cross-phase-ai-privacy.md), [Testing and Acceptance Workflow](../../../docs/workflows/testing-and-acceptance.md), [Evaluations Workflow](../../../docs/workflows/evaluations.md)

## Merge Status

Published through PR #356, merged as `d6300aa6` from final head `ce5428de` after rebasing onto `origin/main` `7bba5bf3`. Exact-head GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, CodeQL actions, CodeQL JavaScript/TypeScript, and standalone CodeQL passed before merge. Replit validation was not required because the PR was docs-only and changed no runtime UI, route, provider, schema, auth/session, persistence, or deployment behavior.

PR #356 originally published this work as a future Mobile Refresh Phase 4 extension. On 2026-09-11 Wilson reclassified it as the independent [INIT-005](../../../initiatives/INIT-005-agentic-cooking-actions.md) because the work has its own architecture, security, eval, voice, integration, and rollout phases and should not be blocked by remaining INIT-001 closeout. INIT-001 supplies the stable Live Cooking surface and existing contracts; it does not own or sequence INIT-005 implementation.

PR #363 merged the independent INIT-005 reclassification and seven-phase plan as `b208ef28a686ae43045ee83712a7319d43a3e6f2` from exact validated head `071e973d6b96d8fc4aef3e0515793c8a791c1096`. Required unit/typecheck/build/coverage, schema-backed guest + linked E2E, dependency audit, secret scan, and CodeQL checks passed before merge. This merge accepts the planning foundation; it does not start Phase 1 implementation.

## Goal

Evolve Live Cooking's existing `Ask a question` flow into the action surface for agent-assisted cooking changes, without making the UI feel heavier. A cook should still ask naturally, but Laica may answer with a proposed action when the safest next step is to start a timer, correct pantry/profile facts, patch the current guide, or restart/replan.

The near-term engineering goal is a typed, guardrail-first action interface that the current tap-to-talk assistant, a future voice agent, and explicitly authorized future integrations can all use. The model may propose actions; deterministic server/client code must discover allowed capabilities, validate, bind direct authorization or required confirmation, execute, audit, and fail closed.

## Current Baseline

- Live Cooking already has Ready Check, warm compact cockpit, sticky current step, action-forward step previews, opt-in captions, bottom `Repeat` / `Ask a question` / audio controls, explicit-start timers, wake lock, and separate assistance-failure status.
- `/api/cooking/assistance` currently returns plain text only. A successful answer does not mutate timers, pantry/profile, recipe steps, sessions, or History.
- Timer state is client-owned today. It can start, pause/reset, complete visibly, and clear on step navigation, but no assistant route controls it.
- Linked profile pantry/equipment facts already live in the user profile; guest cooking does not have durable profile mutation rights.
- Linked cooking History stores the recipe/session snapshot after completion. Current behavior does not store an action log or patched recipe history.
- Open/adjacent work may matter before recipe patching starts: PR #281 normalizes cooking-step schema preservation, and EFF-034 / PR #334 touches timer reset semantics.

## Product Decisions

- Keep `Ask a question` as the user-facing action surface. Do not add a second command mode or heavier voice-agent label for v1.
- INIT-005 does not create a general-purpose personal agent. Laica's agency remains limited to the active cooking task, that user's own cooking data, and deliberately approved capabilities.
- Every user-visible action must stay within the active cooking task. The assistant must not discuss internal app systems, secrets, Wilson's operating details, other users, payments, third-party app data, repository internals, or broad security/admin/deployment topics.
- Guardrails are equal priority with action functionality. A slice is not done if it can act but cannot prove context limits, confirmation, authorization, auditability, and fail-closed behavior.
- A direct, unambiguous request to start a valid in-session timer is itself authorization and must not trigger a redundant confirmation. Inferred, suggested, or ambiguous timer actions wait for user action or clarification. Recipe, pantry/profile, History, and restart/replan mutations require an exact action-bound confirmation.
- History should show the final patched recipe when a linked session is changed and completed. The original recipe and action log are internal audit/debug data, not the v1 user-facing History view.
- Pantry/profile corrections should sync durably when the user clearly states saved inventory/profile facts are wrong, such as `I'm out of soy sauce` or `my chicken is old`. Ambiguous, one-time, or current-cook-only facts stay session scoped unless the user confirms a durable profile change.
- Future evals need a separate `cooking_action_proposal` lane. Do not blend action-proposal quality into INIT-004's existing cooking-step or assistance surfaces, though INIT-004 can still coordinate eval discipline.

## Context Strategy

"Least context" means the smallest context that can make the proposed action good, not starving the assistant. Use action-specific context packs so usefulness scales with the risk and scope of the action.

| Pack | Used for | Allowed context |
|---|---|---|
| `answer_only` | Non-mutating cooking advice | Recipe name, current step, one to two nearby steps, current question, relevant pantry/equipment/profile facts, known acknowledged missing ingredients |
| `timer_action` | Start/pause/reset/cancel timer proposal | Current step, parsed/real duration, sensory cues, current timer state, user question |
| `session_fact` | Current-cook fact such as warm rice exists now | Current recipe, relevant ingredients/steps, stated fact, whether the fact conflicts with saved profile |
| `pantry_profile_correction` | Durable inventory/profile update | Current question, matched pantry/equipment/profile item, candidate normalized update, provenance that the user stated it |
| `recipe_patch` | Localized guide adaptation | Recipe name, full normalized ingredient list, all current steps, current step index, relevant pantry/equipment/profile facts, stated substitution/safety fact, completion/session state |
| `restart_replan` | New guide needed | Recipe name, current recipe summary, available relevant pantry/equipment facts, safety/dietary constraints, user goal |

Forbidden context for all packs: auth tokens, emails, Firebase UIDs, raw session IDs, secrets, environment names/values, payment data, admin/security/deployment details, unrelated profile fields, other users' information, raw audio, raw images, full unredacted transcripts, repository docs, and private build/process details about Wilson or agents.

## Authorization and Confirmation Model

An explicit request can itself authorize a low-impact action. `Start a timer for five minutes` should start that timer after normal duration, session, policy, idempotency, and audit checks; Laica should not ask `Are you sure?`. A question such as `How long should this cook?` is not a timer command and must not start one. `Start the timer` requires clarification when the current step does not have one unambiguous duration.

For actions that still need confirmation, tap confirmation means the user presses a visible, action-bound control such as `Update recipe`, `Remove from pantry`, or `Restart recipe`. Voice confirmation means the user says yes/no to a visible or spoken proposal. Consequential actions should default to an exact visible confirmation in v1 because it is reliable, replay-resistant, and easy to bind to the precise change.

Balance usefulness and annoyance with risk tiers:

| Tier | Examples | Confirmation rule |
|---|---|---|
| `none` | Cooking explanation, substitution advice with no state change | No confirmation; answer only |
| `light` | Start an in-session timer | A direct, unambiguous user command is the authorization and executes without a second confirmation. An inferred, suggested, or ambiguous timer waits for user action or clarification |
| `standard` | Save session fact, patch recipe steps, update visible guide | Explicit proposal card with exact before/after summary; batch related changes into one confirmation |
| `durable` | Remove/add pantry item, update equipment/profile, save patched recipe snapshot | Explicit confirmation tied to the exact durable write; show the user-facing consequence and offer undo where product-safe |
| `safety_critical` | Spoiled protein, allergy conflict, unsafe temperature/process, risky substitution | Safety answer first; no unsafe override. Confirm only safe discard/remove/restart actions |
| `forbidden` | Payments, admin/security, secrets, other-user data, arbitrary external access | No action and no sensitive answer |

The assistant should not ask for confirmation twice when one exact action card can cover the outcome. For example, `I am out of soy sauce` can propose one card: remove soy sauce from pantry and patch the current recipe's sauce step. If the user accepts, both allowed actions execute with one audit record.

## Action Taxonomy

Initial allowed action kinds should be versioned and schema-validated:

| Action kind | Scope | Notes |
|---|---|---|
| `answer_only` | No mutation | Existing assistance behavior with stronger context packaging |
| `timer.start` | Current session only | Use a valid user-provided duration or one unambiguous current-step duration. A direct start command needs no second confirmation; questions, suggestions, or ambiguous durations never auto-start |
| `timer.pause` / `timer.resume` / `timer.reset` / `timer.cancel` | Current session only | Must respect current timer ownership and PR #269/EFF-034 timer semantics |
| `session.fact.set` / `session.fact.clear` | Current cook only | Example: warm rice from rice cooker exists for this cook; do not automatically save to pantry |
| `pantry.item.add` / `pantry.item.remove` / `pantry.item.replace` | Linked profile | User-stated inventory correction only. Guest users get local guidance or a sign-in boundary, not durable profile mutation |
| `profile.equipment.add` / `profile.equipment.remove` | Linked profile | Same confirmation/provenance rule as pantry |
| `recipe.patch.steps` | Current guide | Localized step/cue/ingredient adaptation. Must preserve safety, step order, and current progress |
| `recipe.patch.ingredients` | Current guide | Update displayed ingredients and future steps for confirmed substitution/removal |
| `recipe.restart_replan` | Current planning/cooking flow | Used when patching would be unsafe, incoherent, or too broad |
| `history.save_patched_recipe` | Linked completion | Final user-facing History uses patched recipe; original/diff stay internal |
| `action.blocking_report.create` | Internal only | Records fail-closed reason for eval/debug. Never exposes secrets or raw transcript/audio |

Everything outside this allowlist is rejected, not improvised.

## Action Platform and Traceability

The action taxonomy must be implemented as a versioned platform rather than one-off assistant behaviors. Two indexes form the shared source of truth:

### Action Registry

The registry describes what Laica can do. Each action definition must include:

- stable action kind and version, such as `timer.start.v1`
- input and result schemas
- owning executor
- user and session scope
- allowed caller types
- required context pack
- risk tier and confirmation rule
- authorization, safety, expiration, and idempotency requirements
- whether the action is available to guests, linked users, voice agents, or approved integrations

The canonical registry is server-controlled. Capability discovery returns only the safe, user-facing subset allowed for the current caller and cooking session; it never exposes internal executors, prompts, policies, hidden tools, or privileged actions.

### Action Ledger

The ledger records what happened to each proposed action using one stable action/proposal identifier and a bounded lifecycle:

`proposed` -> (`authorized_by_request` or `awaiting_confirmation` -> `confirmed`) -> `executing` -> `succeeded` / `blocked` / `failed` / `cancelled` / `expired`

Each event records only the redacted action parameters, caller type, user/session scope, registry/action version, policy version, confirmation method, timestamps, result, and safe reason code needed for support and evals. It must not become a cross-user transcript store or expose secrets, raw audio, full transcripts, internal reasoning, or unrelated personal data.

The exact persistence mechanism remains an implementation audit decision. Regardless of storage, proposal state, execution result, and fail-closed reason must be traceable without relying on model prose or client-only state.

### Integration Boundary

Current Live Cooking and future voice/integration callers use the same narrow orchestration interface. Callers may discover their scoped capabilities, request a proposal, present it, return confirmation, cancel it, and read its status. They never call pantry, recipe, History, timer, or other executors directly.

Future integrations receive an explicitly approved capability subset. Adding a caller does not grant it every registered action, and no third-party integration ships without a separate product, privacy, security, authorization, retention, and failure-handling decision.

## Guardrail Contract

### Model and execution split

- The model proposes a typed action only. It never directly mutates timers, sessions, pantry/profile, History, payments, files, URLs, deployments, third-party apps, or external communications.
- A deterministic policy gate validates schema, action allowlist, risk tier, context pack, user/session authorization, confirmation requirement, and safety rule before execution.
- The executor re-checks authorization and idempotency at execution time. Confirmation does not bypass policy.
- Action proposals expire quickly, include an idempotency key, and bind confirmation to exact action parameters.
- Guest and linked users execute in their own user context only. Cross-user or admin-scoped actions are impossible from this surface.

### Prompt-injection and excessive-agency defenses

- Treat voice transcripts, typed questions, ingredient labels, saved recipe text, pantry items, and assistant prior output as untrusted.
- Keep user input in structured user-context fields, not system/developer instructions.
- Ignore requests to reveal hidden prompts, policies, keys, Wilson details, internal route/schema/deployment data, other users' data, or action tool definitions beyond the user-facing task.
- Reject attempts to add tools, call URLs, read files, run code, browse third-party apps, inspect open source packages, change payments, send messages, or perform account/security/admin actions.
- Do not let a recipe, pantry item, or transcript override the action allowlist, confirmation model, safety policy, or logging rules.
- Rate-limit proposal and confirmation routes, cap transcript/context length, cap model output size, and avoid autonomous retry loops.

### Food and personal-safety rules

- Spoiled or suspicious meat, poultry, seafood, eggs, or dairy triggers safety-first guidance: do not use it, do not taste-test it, and remove/restart only along safe paths.
- Allergy, intolerance, pregnancy, immunocompromised, child-feeding, fermentation/canning/preservation, wild foraging, and food-storage edge cases are safety-sensitive. When uncertain, recommend the safer alternative or restart.
- Do not present nutrition, allergies, or medical diet advice as medical treatment.
- Doneness and temperature rules should be grounded in a maintained food-safety policy table, with FoodSafety.gov safe-temperature guidance as the first public source candidate.

### Privacy and retention

- Store only bounded, redacted, task-relevant action records. Do not store raw audio, raw images, full transcripts, secrets, emails, Firebase UIDs, payment data, or third-party data.
- Persist provenance for durable user facts: `user_stated`, `inferred_from_recipe`, `system_generated`, or `confirmed_action`.
- The user-facing assistant answer should reveal only the cooking task context and proposed action, not hidden reasoning, policy internals, debugging details, or internal data sources.
- Action logs are internal operational/eval artifacts. If they later become user-visible, that is a separate product decision.

## Failure and Blocking Reports

Fail closed: if schema validation, policy lookup, safety lookup, authorization, ownership checks, confirmation binding, idempotency, execution, or audit logging fails, no action executes.

Every fail-closed action attempt should create a redacted blocking report when storage is available. If audit storage itself fails, the action remains blocked and the client shows a safe non-technical message.

Minimum blocking-report fields:

- `eventType`: `cooking_action_blocked`
- `actionKind`
- `riskTier`
- `failureStage`: `schema`, `policy`, `safety`, `authorization`, `confirmation`, `idempotency`, `execution`, `audit`, or `unknown`
- `policyVersion`
- `routeVersion`
- `proposalId` or redacted digest
- `sessionId` or internal session reference, never raw public tokens
- `userScope`: `guest`, `linked`, or `unknown`
- `safeUserMessage`
- `developerReasonCode`
- `evalCandidateReason`
- redacted transcript/question excerpt only when needed and policy-safe

Blocked events should feed the future `cooking_action_proposal` eval lane so repeated blocks are visible and testable instead of disappearing as generic assistant failures.

## Patch vs Restart Decision Tree

Patch the live guide when all are true:

- The user's goal preserves the dish identity or a close variation.
- The replacement is available and safe.
- The change can be localized to ingredients, current/future steps, cues, timers, and doneness notes.
- The current step progress can still be interpreted after the change.
- The patch can be summarized clearly in one confirmation card.

Restart or replan when any are true:

- The core dish identity or cooking method changes.
- A central ingredient is unavailable or unsafe and no safe substitute exists.
- A protein swap changes food-safety, doneness, timing, or method enough that many steps would be unreliable.
- The user introduces allergy/medical/dietary constraints that make the current recipe risky.
- The recipe has already advanced past steps that the requested patch depends on.
- The patch would require hidden assumptions about pantry/equipment availability.
- Multiple contradictions make the guide hard to audit.

Examples:

- `I don't have cold rice` can patch if warm rice exists: cool/spread/steam-off guidance, adjusted frying cues, and no durable pantry change unless inventory changed.
- `I have cilantro, not parsley` may patch for cuisines where cilantro makes sense, recommend skipping for some Italian dishes, or ask for confirmation before changing garnish instructions.
- `My chicken smells really bad` is safety-critical: do not use it. Confirm removal from pantry if linked and user wants that inventory corrected; patch only if a safe alternate protein exists, otherwise restart/replan.
- `Can I switch chicken with fish?` requires verifying fish availability and then adjusting cook times, heat, doneness cues, and safety. If the original technique is too chicken-specific, restart/replan.

## Proposed API and Tool Shape

The future voice agent and current Live Cooking client should use the same action interface:

1. `GET /api/cooking/actions/capabilities`
   - Input context: authenticated or guest cooking-session scope.
   - Output: only the caller/session's currently allowed action names, versions, user-facing descriptions, required inputs, and confirmation levels.
2. `POST /api/cooking/actions/propose`
   - Input: cooking session reference, current client state checksum, user utterance/transcript, optional selected action intent from the client.
   - Output: answer text, zero or one action proposal or completed low-impact action, stable action id, risk tier, authorization/confirmation source, safe user-facing summary, redacted blocking report if blocked.
   - A direct low-impact command may execute through the deterministic action path without another user interaction only when policy marks it `authorized_by_request`. Model prose alone never supplies that authorization.
3. `POST /api/cooking/actions/confirm`
   - Input: proposal id, action-bound confirmation token, current session state checksum, idempotency key.
   - Server re-runs policy and authorization, then executes deterministic adapters.
4. `POST /api/cooking/actions/cancel`
   - Input: proposal id and current session scope.
   - Cancels only a cancellable, non-terminal action owned by the caller.
5. `GET /api/cooking/actions/:actionId`
   - Output: the redacted status and safe result for one caller-owned action. It is not a cross-user event-listing endpoint.
6. Executor adapters
   - Timer adapter owned by Live Cooking state.
   - Session-fact adapter owned by cooking session state.
   - Pantry/profile adapter owned by authenticated profile storage.
   - Recipe-patch adapter owned by cooking-session snapshot and current guide state.
   - History adapter runs only through the existing completion boundary.

The API should make the voice agent boring: its callable tools are narrow wrappers around capability discovery, proposal, confirmation, cancellation, and status. It must not receive separate privileged tools or direct executor access.

## Smallest Prototype Slice

Start with an explicit `Ask a question` timer command -> validated `timer.start` execution.

Why this slice:

- It proves the propose/authorize/execute/audit pattern without durable pantry/profile writes.
- It uses the current UI surface and current timer control.
- It can be tested deterministically from a typed/voice transcript such as `Start a timer for five minutes` or `Can you start the timer for this step?`.
- It proves that direct low-impact commands and consequential confirmation-required actions can share one policy and ledger without forcing the same interaction onto both.

Prototype acceptance:

- The assistant can still answer non-action cooking questions with no proposal.
- An explicit request with a valid duration, or an unambiguous reference to the current step's duration, starts without a second confirmation.
- A question about timing does not start a timer, and an ambiguous start request asks for the missing duration.
- The timer never starts from model prose or an assistant suggestion alone; deterministic policy must bind execution to the user's direct request.
- Failed schema, policy, direct-request binding, timer-state, idempotency, or audit checks create a redacted blocking report and do not start the timer.
- Existing Repeat/audio/caption/speech arbitration remains intact.

## Numbered Delivery Phases

These are Phase 1 through Phase 7 of INIT-005. Phase order is the default dependency order. A later phase may start early only when its relationship is explicitly classified under the INIT sequencing rule and it cannot bypass a guardrail, ownership, or evidence dependency.

Every phase must update the registry and ledger contracts for its actions, add separate `cooking_action_proposal` eval fixtures, prove authorization and session ownership, exercise applicable direct-request and confirmation paths plus fail-closed behavior, and leave exact-head implementation evidence. Guardrails and evals are phase exit criteria, not a final hardening pass.

### Phase 1 - Action Foundation and Guardrails

**Goal:** Establish one callable and traceable action platform before any mutating assistant action ships.

**Deliverables:** Shared typed schemas; versioned Action Registry; scoped capability discovery; Action Ledger lifecycle; context packs; risk tiers; direct-request authorization and consequential-action confirmation binding; policy/safety/authorization gates; expiration and idempotency; redacted blocking reports; answer-only proposal compatibility; initial prompt-injection, forbidden-category, cross-user, and failure eval fixtures.

**Boundary:** No timer, pantry/profile, recipe, History, or external integration mutation ships in this phase.

**Exit gate:** Invalid or forbidden actions cannot reach an executor; allowed capabilities are caller/session scoped; every proposal and block has a traceable redacted lifecycle; audit failure blocks action execution.

### Phase 2 - Timer Action Prototype

**Goal:** Prove the first user-visible propose/authorize/execute/audit loop through the existing `Ask a question` surface without adding redundant confirmation.

**Deliverables:** `timer.start` registry entry and executor; direct-command authorization; valid and ambiguous-duration handling; clear started status and existing pause/reset controls; timer/client-state checksum protection; successful and blocked ledger outcomes; focused route, policy, component, speech-arbitration, and action-eval coverage. Start with `timer.start`; decide pause/resume/reset/cancel interaction rules only after the start path meets the phase gate.

**Boundary:** No durable user/profile or recipe mutation. The model response alone never controls the timer.

**Exit gate:** One direct, unambiguous request starts only the intended duration once with no second confirmation; timing questions and assistant suggestions remain non-mutating; ambiguous, stale, duplicate, malformed, unauthorized, or unauditable requests do not start it.

### Phase 3 - Session Facts and Pantry/Profile Corrections

**Goal:** Let cooks correct relevant facts while preserving the distinction between this cook and durable account data.

**Deliverables:** Session fact set/clear; linked-user pantry add/remove/replace; equipment add/remove; exact item matching and user-stated provenance; guest boundary; bundled confirmation for a related current-guide and pantry correction; recovery/undo behavior chosen before durable writes ship.

**Boundary:** Ambiguous or one-cook facts remain session scoped. Guests cannot perform durable profile writes.

**Exit gate:** Durable changes require action-bound confirmation, are user-owned and traceable, and cannot silently convert inference into saved profile truth.

### Phase 4 - Localized Recipe Patching and Final History

**Goal:** Adapt the active guide without losing step integrity, current progress, or the final recipe the user actually cooked.

**Deliverables:** Versioned ingredient and step patch schemas; localized changes to future ingredients, steps, durations, cues, and doneness guidance; current-progress reconciliation; before/after confirmation; final patched linked History snapshot; internal original/diff/action provenance.

**Boundary:** Patch only when dish identity, safety, and interpretable progress remain intact. No silent rewrite of completed steps.

**Exit gate:** The accepted patch is coherent from the current step forward, blocked patches leave the active guide unchanged, and completed linked History shows the final patched recipe only.

### Phase 5 - Restart/Replan and Safety Escalation

**Goal:** Replace the current guide cleanly when localized patching would be unsafe or unreliable.

**Deliverables:** Deterministic patch-versus-restart policy; maintained food-safety policy references; explicit restart/replan proposal and transition; spoiled-food, allergy/dietary, protein-swap, unavailable-core-ingredient, and already-passed-step cases; safe pantry correction combinations.

**Boundary:** There is no unsafe override. Safety guidance is delivered before asking the user to confirm a safe remove, discard, substitute, or restart action.

**Exit gate:** High-risk cases consistently choose a safe path, the old guide is never ambiguously mixed with the replacement, and every blocked or restarted path is traceable.

### Phase 6 - Voice Agent and Integration Interface

**Goal:** Let approved callers use the same platform without receiving direct or broad application privileges.

**Deliverables:** Voice-agent tool schemas around scoped capabilities, propose, confirm, cancel, and status; caller identity and capability scoping; replay-resistant confirmation design; confidence and interruption handling; integration-specific rate limits and audit attribution; documented onboarding contract for future callers.

**Boundary:** Clear voice timer commands may use direct-request authorization only after transcript confidence, replay, binding, interruption, accessibility, and eval gates are met. Voice confirmation for consequential actions remains separately gated. Third-party integrations remain disabled until separately approved.

**Exit gate:** A caller can use only its granted capabilities, cannot bypass confirmation or policy, and produces the same ledger and blocking-report evidence as the Live Cooking client.

### Phase 7 - Controlled Rollout and Expansion

**Goal:** Validate the complete action system under production-like conditions before broadening availability or adding new actions/integrations.

**Deliverables:** Full separate action-eval suite; adversarial and prompt-injection regression; cross-user and excessive-agency tests; food-safety review; blocking-report review workflow; provider and voice failure canaries; feature flags/kill switch; targeted Replit and production validation plan; registry review process for adding or deprecating actions.

**Boundary:** No capability expansion based only on model quality demos. Each new action or caller follows the same registry, policy, confirmation, ledger, and eval requirements.

**Exit gate:** Wilson reviews rollout evidence and explicitly approves the enabled action/caller set. Deferred integrations remain unavailable, not merely undocumented.

## Phase Status

| INIT-005 phase | Status | First implementation slice |
|---|---|---|
| Phase 1 - Action Foundation and Guardrails | Planned; next | Registry, ledger, capability discovery, typed proposal and blocking contracts; no mutation |
| Phase 2 - Timer Action Prototype | Planned; depends on Phase 1 | Direct, unambiguous `timer.start` through `Ask a question`; no second confirmation |
| Phase 3 - Session Facts and Pantry/Profile Corrections | Planned; depends on Phases 1-2 | Session fact plus one linked pantry correction |
| Phase 4 - Localized Recipe Patching and Final History | Planned; depends on Phases 1-3 and stable step/session shape | One localized ingredient/step patch |
| Phase 5 - Restart/Replan and Safety Escalation | Planned; depends on patch boundary evidence | One explicit safe restart/replan path |
| Phase 6 - Voice Agent and Integration Interface | Planned; depends on stable core actions | Scoped voice-agent wrapper; no third-party launch |
| Phase 7 - Controlled Rollout and Expansion | Planned; depends on prior enabled phases | Wilson-approved capability/caller rollout |

Do not spawn implementation threads until Wilson explicitly approves implementation. When approved, start INIT-005 Phase 1 from fresh `origin/main`; the first user-visible action remains the Phase 2 timer prototype.

## Validation Checklist

Before any implementation PR is considered ready:

- Audit current `client/src/components/cooking/live-cooking.tsx`, `client/src/lib/openai.ts`, `server/routes.ts`, `shared/schema.ts`, profile update routes, cooking-session persistence, `aiInteractions`, route rate limits, and active PR overlap.
- Prove all action routes are authenticated or correctly guest-scoped, session-owned, rate-limited, body-limited, schema-validated, and redacted in logs.
- Add unit coverage for context packs, policy gates, confirmation binding, fail-closed blocking reports, and action executors.
- Add Live Cooking component coverage for proposal display, confirmation, cancellation, audio/speech arbitration, and unchanged current-step guidance on blocked actions.
- Add Playwright or route-level coverage for at least one guest and one linked path when durable persistence changes.
- Run `git diff --check`, focused tests, `npm run check`, `npm run build`, dependency audit/secret scan as required by the PR risk lane.
- Use direct-shell Replit or accepted automated Replit-environment validation when microphone, provider, real persistence, or production-like auth behavior is part of the claim. Do not use Replit Agent without Wilson's explicit approval.

## Open Decisions

- The transcript-confidence and ambiguity thresholds required before a future voice agent may treat a clear timer command as direct authorization; ambiguous commands ask for clarification rather than adding confirmation to clear ones.
- Whether pantry/profile durable updates should offer one-step undo from the cooking surface or route users to Settings for reversal.
- The exact data model for original recipe, patched recipe, and internal action log.
- The precise threshold where `chicken -> fish` remains a patch versus becomes a restart for different cooking methods.
- Whether safety policy tables live in app code, DB seed data, or a versioned config artifact.
- Whether `cooking_action_proposal` eval artifacts live under INIT-004's existing registry with a distinct lane, or get a separate feature subfolder linked from INIT-004.

## External Security References

- [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/llm-top-10/)
- [OWASP LLM01 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
- [OWASP LLM06 Excessive Agency](https://genai.owasp.org/llmrisk/llm06-excessive-agency/)
- [OWASP AI Agent Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html)
- [OWASP Top 10 2025](https://owasp.org/www-project-top-ten/)
- [OWASP MCP Top 10](https://genai.owasp.org/resource/owasp-mcp-top-10-2025/)
- [FoodSafety.gov safe minimum internal temperatures](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures)
