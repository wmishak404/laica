# Mobile Refresh Phase 4 - Agentic Cooking Actions

**Status:** Draft plan
**Document kind:** Feature Phase Record
**Phase owner:** Wilson
**Date:** 2026-08-20
**Initiative:** [INIT-001 - Mobile Refresh](../../../initiatives/INIT-001-mobile-refresh.md)
**Related docs:** [Phase 4 cooking guidance](pd-phase-04-cooking.md), [AI privacy, prompt-injection, and abuse rules](pd-cross-phase-ai-privacy.md), [Testing and Acceptance Workflow](../../../docs/workflows/testing-and-acceptance.md), [Evaluations Workflow](../../../docs/workflows/evaluations.md)

## Goal

Evolve Live Cooking's existing `Ask a question` flow into the action surface for agent-assisted cooking changes, without making the UI feel heavier. A cook should still ask naturally, but Laica may answer with a proposed action when the safest next step is to start a timer, correct pantry/profile facts, patch the current guide, or restart/replan.

The near-term engineering goal is a typed, guardrail-first action interface that the current tap-to-talk assistant and a future voice agent can both use. The model may propose actions; deterministic server/client code must validate, confirm, execute, audit, and fail closed.

## Current Baseline

- Live Cooking already has Ready Check, warm compact cockpit, sticky current step, action-forward step previews, opt-in captions, bottom `Repeat` / `Ask a question` / audio controls, explicit-start timers, wake lock, and separate assistance-failure status.
- `/api/cooking/assistance` currently returns plain text only. A successful answer does not mutate timers, pantry/profile, recipe steps, sessions, or History.
- Timer state is client-owned today. It can start, pause/reset, complete visibly, and clear on step navigation, but no assistant route controls it.
- Linked profile pantry/equipment facts already live in the user profile; guest cooking does not have durable profile mutation rights.
- Linked cooking History stores the recipe/session snapshot after completion. Current behavior does not store an action log or patched recipe history.
- Open/adjacent work may matter before recipe patching starts: PR #281 normalizes cooking-step schema preservation, and EFF-034 / PR #334 touches timer reset semantics.

## Product Decisions

- Keep `Ask a question` as the user-facing action surface. Do not add a second command mode or heavier voice-agent label for v1.
- Every user-visible action must stay within the active cooking task. The assistant must not discuss internal app systems, secrets, Wilson's operating details, other users, payments, third-party app data, repository internals, or broad security/admin/deployment topics.
- Guardrails are equal priority with action functionality. A slice is not done if it can act but cannot prove context limits, confirmation, authorization, auditability, and fail-closed behavior.
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

## Confirmation Model

Tap confirmation means the user presses a visible, action-bound control such as `Start timer`, `Update recipe`, `Remove from pantry`, or `Restart recipe`. Voice confirmation means the user says yes/no to a visible or spoken proposal. V1 should default to tap confirmation because it is more reliable, replay-resistant, and easy to bind to the exact action.

Balance usefulness and annoyance with risk tiers:

| Tier | Examples | Confirmation rule |
|---|---|---|
| `none` | Cooking explanation, substitution advice with no state change | No confirmation; answer only |
| `light` | Start/pause/reset/cancel an in-session timer | One compact proposal card; one tap executes; future voice confirmation may be allowed after action-bound replay protection |
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
| `timer.start` | Current session only | Use parsed explicit duration or current step duration. Never auto-start without confirmation from an Ask proposal |
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

## Proposed API Shape

The future voice agent and current Live Cooking client should use the same action interface:

1. `POST /api/cooking/actions/propose`
   - Input: cooking session reference, current client state checksum, user utterance/transcript, optional selected action intent from the client.
   - Output: answer text, zero or one action proposal, risk tier, confirmation requirement, safe user-facing summary, redacted blocking report if blocked.
2. `POST /api/cooking/actions/confirm`
   - Input: proposal id, action-bound confirmation token, current session state checksum, idempotency key.
   - Server re-runs policy and authorization, then executes deterministic adapters.
3. Executor adapters
   - Timer adapter owned by Live Cooking state.
   - Session-fact adapter owned by cooking session state.
   - Pantry/profile adapter owned by authenticated profile storage.
   - Recipe-patch adapter owned by cooking-session snapshot and current guide state.
   - History adapter runs only through the existing completion boundary.

The API should make the voice agent boring: it can ask for a proposal, present the proposal, and confirm it. It must not need separate privileged tools.

## Smallest Prototype Slice

Start with `Ask a question` -> `timer.start` proposal.

Why this slice:

- It proves the propose/confirm/execute/audit pattern without durable pantry/profile writes.
- It uses the current UI surface and current timer control.
- It can be tested deterministically from a typed/voice transcript such as `Start a timer for five minutes` or `Can you start the timer for this step?`.
- It creates the confirmation-card pattern that later pantry and recipe patches can reuse.

Prototype acceptance:

- The assistant can still answer non-action cooking questions with no proposal.
- A timer action proposal is shown only when a duration exists or the user provides a valid duration.
- The timer never starts from the model response alone.
- Confirmation is one tap in v1 and is bound to the exact duration/action.
- Failed schema, policy, confirmation, timer-state, or audit checks create a redacted blocking report and do not start the timer.
- Existing Repeat/audio/caption/speech arbitration remains intact.

## Execution Plan

1. Planning and branch hygiene
   - Keep this plan draft local until Wilson approves promotion.
   - Before implementation, fetch fresh `origin/main`, check open PRs touching Live Cooking/timer/schema, and decide whether PR #281 or PR #334 must merge, rebase, or be superseded.
2. Action schema and policy contract
   - Add shared Zod schemas for proposal, confirmation, risk tier, context pack, action kinds, blocking report, and policy version.
   - Add tests for invalid actions, forbidden categories, prompt-injection attempts, and fail-closed behavior.
3. Proposal route without execution
   - Add the propose route, context builder, model prompt, structured output validation, and redacted action/audit logging.
   - Return answer-only behavior for non-action questions.
4. Timer prototype execution
   - Add confirmation path for `timer.start` and current-session timer control.
   - Add client proposal card under the existing `Ask a question` response/status area.
   - Validate with focused Live Cooking tests, route tests, check/build, and no Replit Agent.
5. Pantry/profile correction
   - Add linked-only pantry/profile correction proposals with exact item matching, user-stated provenance, confirmation, undo where product-safe, and guest boundary copy.
   - Include examples for `out of soy sauce`, `chicken is old`, and equipment corrections.
6. Recipe patching
   - Resolve durable step schema shape first, especially action labels and final patched snapshot.
   - Add recipe patch proposals for localized substitutions, safety removals, cue/timer changes, and current/future step patches.
   - Store final patched recipe for History on linked completion and keep original/diff internal.
7. Restart/replan
   - Add restart/replan proposals when patching is unsafe or too broad.
   - Make the transition explicit so the user understands the current guide is being replaced.
8. Evals and security regression
   - Create a separate `cooking_action_proposal` eval lane with fixtures for timer, pantry correction, substitutions, safety, prompt injection, forbidden requests, and blocking-report quality.

## Proposed Work Threads After Approval

- Thread A - Action contract and guardrails: shared schemas, risk tiers, context packs, forbidden categories, blocking-report shape, and policy tests.
- Thread B - Proposal API and audit plumbing: propose route, structured model output, redacted logging, and answer-only compatibility.
- Thread C - Timer action prototype: confirmation card, timer executor, component tests, and Live Cooking regression coverage.
- Thread D - Pantry/profile correction actions: linked profile executor, guest boundary, item matching, undo/recovery, and profile tests.
- Thread E - Recipe patching and History snapshot: session patch format, step/state reconciliation, original-vs-final audit storage, and History display contract.
- Thread F - Action eval lane: `cooking_action_proposal` fixtures, adversarial/security cases, failure/blocking reports, and recurring eval report shape.

Do not spawn these threads until Wilson approves the plan and chooses the first implementation slice.

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

- Whether voice confirmation is allowed in v1 for light timer actions, or kept behind tap confirmation until a later voice-agent slice has replay protection and confidence thresholds.
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
