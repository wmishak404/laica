# INIT-004 Phase 2 Claude Architecture Review Request

**Agent:** codex
**Branch:** `codex/init-004-phase-2-spec`
**PR:** [#168](https://github.com/wmishak404/laica/pull/168) (draft)
**Date:** 2026-06-10
**Initiative:** INIT-004
**INIT updated:** no

## Purpose

Wilson asked Codex to prepare a full architecture-review prompt for Claude and a separate set of Wilson decision questions for INIT-004 Phase 2. PR #168 is intentionally draft because it proposes product/privacy/architecture decisions that should be reviewed before Phase 3 eval harness work starts.

This handoff was updated after PR #169 merged so a future Claude/orchestrator review can assume the current EFF-017 testing harness is available for exact-head validation, while still respecting its negative scope.

No code changes are requested in this review handoff.

## Claude Prompt

Claude, please review the architecture of INIT-004 Phase 2 in draft PR #168:

- PR: https://github.com/wmishak404/laica/pull/168
- Branch: `codex/init-004-phase-2-spec`
- Current head: see PR #168; the branch was rebased after PR #169 merged.
- Base: `origin/main` at `2abccc7a88ac4c203b64daa851bc3bde6ee40f45`
- Primary spec: `docs/evals/init-004-phase-2-rubric-dataset-spec.md`
- Scope: docs-only Phase 2 draft; no runtime code, prompts, schema, admin APIs, provider calls, UI, deployment config, Replit behavior, fixture files, or eval runs changed.

### Review Objective

Review whether the Phase 2 architecture is the right foundation before Phase 3 harness work. Focus on taxonomy, privacy/source handling, fixture format, rubric labels, seed set selection, and implementation implications. Treat this as an architecture review, not a copy edit.

Assume the current EFF-017 harness can be used for Phase 3 implementation validation on same-repo PRs: protected GitHub checks now include `unit` and `e2e_guest_smoke`, the GitHub E2E lane provisions a disposable non-production Neon branch, applies schema, runs `db:health`, runs Playwright, and cleans up. Do not overclaim that lane: it is deterministic and provider-light by design. It does not prove live OpenAI output quality, live provider response-contract drift when routes are stubbed, ElevenLabs audio quality, full Google popup completion/linking, production deployment behavior, or Wilson product acceptance of generated outputs.

Also assume the testing audit in Codex session `019eaf17-527e-7b21-b634-01a73aca49b7` has been incorporated into EFF-017 and the current testing workflow. If the session is available to you, read it for audit detail; if not, rely on the durable repo sources listed below.

### Source Docs To Read

Read these before giving architectural feedback:

- `AGENTS.md` for LAICA workflow and INIT/Effort rules.
- `initiatives/INIT-004-ai-output-quality-evals.md` for current phase, Phase 1 audit findings, Phase 2 gate, and source docs.
- `docs/evals/init-004-phase-2-rubric-dataset-spec.md` for the actual draft under review.
- `docs/handoffs/2026-06-10-codex-init-004-phase-1-audit.md` and `docs/handoffs/2026-06-10-codex-init-004-phase-1-merge-closeout.md` for Phase 1 provenance.
- `docs/workflows/evaluations.md` for durable eval discipline.
- `docs/workflows/testing-and-acceptance.md` for exact-head E2E, evidence requirements, current CI harness semantics, and future eval gates.
- `docs/workflows/documentation-routing.md` for source-of-truth routing.
- `docs/evals/README.md`, `docs/evals/registry.md`, and both current intake records under `docs/evals/intakes/`.
- `efforts/effort-017-environment-parity-and-ci-confidence.md` for the active automation/evidence lane, especially the 2026-06-10 audit reconciliation, PR #165 testing-gate fixes, and PR #169 cleanup/history-coverage update.
- `docs/handoffs/2026-06-10-codex-eff-017-followup-cleanup-coverage.md` for PR #169 evidence and remaining EFF-017 follow-up.
- `efforts/effort-022-cross-cuisine-recommendation-prompts.md` for the cuisine-fit product boundary.
- `product-decisions/pd-008-optional-context-and-local-validation-boundaries.md`.
- `product-decisions/pd-010-ai-error-telemetry-allowlist.md`.
- `product-decisions/features/mobile-refresh/pd-cross-phase-ai-privacy.md`.
- `product-decisions/features/mobile-refresh/pd-phase-03-planning.md`.
- `product-decisions/features/slop-bowl/pd-phase-03-simplified-bowl.md`.

Check current code contracts where relevant:

- `server/eval-criteria.ts`
- `server/evaluator.ts`
- `server/openai.ts`
- `server/prompt-manager.ts`
- `server/admin-routes.ts`
- `shared/schema.ts`
- `server/aiErrors.ts`
- `client/src/components/cooking/meal-planning.tsx`

### Questions To Answer

Please answer these directly:

1. Is the proposed split between `EvalFeatureType` and `PromptFeatureType` architecturally correct, given current code couples `FeatureType` to eval criteria and prompt management?
2. Should `pantry_recipes` become a first-class eval/reporting feature in Phase 3, or should it remain a subtype of `recipe_suggestions`?
3. Should `slop_bowl` get first-class eval/reporting support while keeping prompt activation out of Phase 3?
4. Does the proposed output-quality privacy posture sufficiently protect raw `ai_interactions`, admin eval rows, production/staged samples, pantry labels, model outputs, images, audio, transcripts, auth data, and secrets?
5. Is the recommended fixture shape sufficient for deterministic checks, human labels, and later judge calibration?
6. Are the criterion labels complete and well separated, or are any labels missing, overlapping, too vague, or too hard to operationalize?
7. Is the first Wilson-label target set appropriately small and representative across recipe suggestions, Chef It Up pantry recipes, Slop Bowl, and cooking steps?
8. Does the spec preserve the EFF-022 boundary, or does it accidentally decide cuisine fallback product behavior that should remain Wilson-owned?
9. Given the EFF-017 harness is now available, what should Phase 3 validate through deterministic local/unit checks, the required GitHub `unit` and `e2e_guest_smoke` gates, future eval-specific scripts, live provider canaries, Replit/manual checks, and Wilson labeling?
10. What implementation risks should Phase 3 address first, especially around admin prompt endpoints, immediate prompt activation, `ai_interactions` logging, stale schema comments, evaluator prompt design, fixture privacy, and exact-head evidence reporting?
11. What should block Phase 3 until Wilson decides?

### Expected Output

Please produce a review with:

- Findings first, ordered by severity (`P0`, `P1`, `P2`, or `P3`), with file/section references.
- Explicit architectural recommendations, including alternatives and tradeoffs.
- A short "Wilson decisions needed" list.
- A short "Phase 3 implementation risks" list.
- A short "Recommended Phase 3 validation plan" that maps each required proof to the smallest honest lane: local unit/script, GitHub required checks, eval fixture run, live-provider canary, Replit direct shell/browser validation, or Wilson labeling.
- Any suggested wording changes that should be applied to the spec or handoff.

Do not implement code. Do not post GitHub comments. Do not mark the PR ready. Do not merge. Return review feedback through a handoff or through the orchestrator/chat path. If you think the spec is acceptable as-is, say that clearly and still identify residual risks.

## Wilson Architecture Decision Questions

These are the questions Wilson should decide or explicitly delegate before Phase 3 harness work starts.

### 1. Should `pantry_recipes` be a first-class eval/reporting feature?

**Recommended answer:** yes.

**Reasoning:** Phase 1 found `/api/recipes/pantry` is the primary Chef It Up flow and has different input packaging, product expectations, and EFF-022 risk than generic recipe suggestions. Current runtime logs it as `recipe_suggestions`, while INIT-002 operational telemetry already names `pantry_recipes`. Keeping it folded into `recipe_suggestions` would blur the exact surface most affected by pantry/cuisine tradeoffs.

**Provenance:** INIT-004 Phase 1 surface map; `server/routes.ts` uses `feature: "pantry_recipes"` for operational errors; `server/openai.ts` logs pantry output through `logInteraction('recipe_suggestions', ...)`; EFF-022 is specifically about Chef It Up pantry recommendation quality.

**Decision options:**

- A. First-class `pantry_recipes` eval feature. Better reporting and fixture routing; requires Phase 3 type/logging updates.
- B. Keep as `recipe_suggestions` subtype. Less code churn; weaker metrics and harder diagnosis.
- C. Keep logging as `recipe_suggestions` but add metadata subtype. More flexible but requires schema or fixture conventions that do not exist yet.

### 2. Should eval feature IDs be split from prompt-management feature IDs?

**Recommended answer:** yes.

**Reasoning:** Current `FeatureType` is used for both `EVAL_CRITERIA` and prompt management. Expanding it naively would make admin prompt endpoints appear to support prompt generation/save/activation for every eval feature. That is risky because prompt save currently activates immediately, while INIT-004 says prompt-candidate workflow should stay inactive until Wilson review.

**Provenance:** `server/eval-criteria.ts` exports `FeatureType`; `server/prompt-manager.ts` imports that type for active prompts; `server/admin-routes.ts` Zod enums gate prompt generation/save; INIT-004 Phase 6 says no automatic production activation.

**Decision options:**

- A. Split `EvalFeatureType` and `PromptFeatureType`. More explicit and safer; requires a small type refactor.
- B. Expand current `FeatureType` and let prompt management follow. Faster but risks accidental prompt activation paths for `slop_bowl` and `pantry_recipes`.
- C. Keep current type and special-case new eval features. Lowest initial churn but preserves the coupling problem.

### 3. Should Slop Bowl get eval coverage before DB prompt activation?

**Recommended answer:** yes.

**Reasoning:** Slop Bowl already logs `slop_bowl` interactions and is in INIT-004 V1 scope, but the accepted Slop Bowl v1 direction kept its prompt hardcoded. Eval coverage is needed to measure current behavior; DB prompt activation is a separate prompt-candidate concern.

**Provenance:** `server/openai.ts` logs `slop_bowl`; Slop Bowl phase record says hardcoded prompt for v1; INIT-004 V1 includes Slop Bowl; current `EVAL_CRITERIA` omits `slop_bowl`.

**Decision options:**

- A. Add `slop_bowl` eval/reporting only in Phase 3. Recommended.
- B. Add `slop_bowl` prompt manager support now. More flexible; risks activating prompt changes before prompt workflow is safe.
- C. Defer Slop Bowl entirely. Simpler; conflicts with INIT-004 V1 scope.

### 4. Is max cook time a hard ceiling?

**Recommended answer:** yes, unless Wilson explicitly wants a product exception.

**Reasoning:** Both seed intakes have 25-minute max failures returning 30 minutes. Current prompt says round up in 15-minute intervals, which can violate a user constraint. Deterministic checks need a crisp rule. If the app says the user has 25 minutes, an eval should fail a 30-minute result unless product copy changes the meaning of the selection.

**Provenance:** OpenAI Platform intake max-time failure; Arize intake max-time failure; INIT-004 Phase 1 audit notes prompt round-up conflict; `pd-phase-03-planning.md` describes time as a per-planning-session bound.

**Decision options:**

- A. Hard ceiling. Clear and user-respecting; may require prompt/output cleanup.
- B. Allow rounding above max if within one interval. Easier with current prompt; weakens user trust and tests.
- C. Treat time as approximate and make eval judge semantic. Flexible but hard to automate.

### 5. What output-quality data may enter the repo?

**Recommended answer:** synthetic by default; redacted only with review; raw never by default.

**Reasoning:** Output-quality rows contain user preferences, pantry labels, generated recipes, and cooking steps. That is richer than INIT-002 operational telemetry and cannot use the same allowlist-only safety guarantee. The repo should hold durable labels and synthetic/redacted fixtures, not raw admin rows or raw production samples.

**Provenance:** INIT-004 Phase 1 privacy finding; `docs/workflows/evaluations.md`; `docs/evals/README.md`; PD-010 raw-data denylist for operational telemetry; mobile-refresh AI privacy rules on AI interaction retention/redaction.

**Decision options:**

- A. Synthetic fixtures by default, redacted only after review. Recommended.
- B. Redacted real examples by default. Higher fidelity; higher leakage/reidentification risk.
- C. Commit raw examples under admin-only assumptions. Not recommended; repo artifacts are durable and shareable.

### 6. Where should fixtures live?

**Recommended answer:** define canonical fixtures under `docs/evals/fixtures/`, then let Phase 3 harness read or transform them.

**Reasoning:** `docs/evals/` is already the durable eval ledger and survives INIT closeout. Keeping fixture definitions there makes the privacy/source posture and human labels reviewable. If tests need faster imports later, generated or mirrored test fixtures can be created deliberately.

**Provenance:** `docs/evals/README.md` already names future `fixtures/`; `docs/workflows/evaluations.md` routes durable eval artifacts through `docs/evals/`.

**Decision options:**

- A. `docs/evals/fixtures/` as canonical. Best provenance and reviewability.
- B. `tests/fixtures/evals/` as canonical. Easier test imports; weaker durable eval ledger.
- C. Store only in code fixtures. Fastest harness; poorer product/privacy review.

### 7. Is the first label target set the right size and coverage?

**Recommended answer:** start with the current 13 proposed seeds, then trim only if Wilson wants a shorter first review session.

**Reasoning:** The set covers positive and negative examples, structure, max time, food safety, equipment, skill, cuisine fit, Slop Bowl shape, and cooking-step generated context. It is small enough for Wilson-first review and broad enough to expose rubric ambiguity before code.

**Provenance:** OpenAI Platform intake, Arize intake, EFF-022, INIT-004 Phase 1 audit.

**Decision options:**

- A. Keep 13 seeds. Better architecture coverage.
- B. Trim to 6-8 seeds. Faster Wilson session; less coverage.
- C. Expand before Phase 3. More complete; delays harness foundation.

### 8. How strict should selected cuisine matching be?

**Recommended answer:** keep the product rule in EFF-022 for Wilson, and measure separate labels now.

**Reasoning:** The eval harness can label `pantry_grounding`, `cuisine_fit`, and `inspired_or_fusion_labeling` separately without deciding whether the product should require literal cuisine alignment, ask for missing staples, or show pantry-flexible fallback copy. Deciding that policy inside the eval harness would overstep.

**Provenance:** EFF-022 explicitly owns cuisine fallback behavior; INIT-004 Phase 1 says the eval harness should measure, not resolve, the product rule.

**Decision options:**

- A. Separate measurement now; product rule later. Recommended.
- B. Require all selected-cuisine outputs to visibly align. Strong user promise; may overcorrect against pantry-first value.
- C. Allow off-cuisine pantry fit silently. Preserves pantry usefulness; repeats current user-facing ambiguity.
- D. Require explicit fallback copy when pantry evidence is weak. Likely product-good, but needs UI/prompt design.

### 9. Should prompt save keep activating immediately?

**Recommended answer:** do not expand the immediate-activation path in Phase 3.

**Reasoning:** Existing admin prompt save activates immediately. INIT-004's prompt-candidate workflow says failures should generate inactive candidates and require Wilson review before activation. Phase 3 should avoid making more surfaces eligible for immediate activation until a safer candidate/activation model is designed.

**Provenance:** `server/admin-routes.ts` prompt save endpoint; `server/prompt-manager.ts` `createPromptVersion` deactivates prior active prompts and inserts active prompt; INIT-004 Phase 6 no automatic activation.

**Decision options:**

- A. Keep Phase 3 eval-only; no prompt activation expansion. Recommended.
- B. Add inactive prompt version support now. Useful but expands Phase 2/3 scope.
- C. Use current save/activate path for new features. Risky.

### 10. What makes Phase 2 accepted?

**Recommended answer:** Wilson approves or edits PR #168's review decisions, then the PR is marked ready, required checks run, and the accepted spec merges. Only then Phase 3 starts.

**Reasoning:** Phase 2 contains product/privacy/architecture decisions. A draft PR with passing docs checks is not acceptance. The durable acceptance signal should be explicit review plus merge.

**Provenance:** AGENTS documentation foundation rule; INIT-004 Phase 2 gate; testing-and-acceptance evidence requirements; PR #168 is intentionally draft.

**Decision options:**

- A. Approval/edits on PR #168 plus merge. Recommended.
- B. Chat approval only. Faster but harder for future agents to trace.
- C. Claude review approval only. Helpful but Wilson still owns product/privacy calls.

### 11. How should Phase 3 use the new testing harness?

**Recommended answer:** use the current EFF-017 harness as required exact-head regression evidence, then add eval-specific deterministic fixture evidence separately. Keep live provider/model-quality proof in a named canary/eval lane rather than folding it into the provider-light `e2e_guest_smoke` gate.

**Reasoning:** PR #165 and the testing workflow now make `unit` and `e2e_guest_smoke` required protected-merge checks, and the GitHub E2E lane provisions a disposable non-production Neon branch before running Playwright. PR #169 further cleaned obsolete test paths and added Cooking History coverage, so the routine harness is no longer just planned. But the existing E2E lane is intentionally provider-light and does not score real generated recipes, cuisine fit, cooking-step quality, or Slop Bowl output quality. Phase 3 should therefore treat the harness as app-regression evidence while creating a separate eval-run evidence path for fixture scoring, labels, judge prompts, provider canaries, and Wilson review.

**Provenance:** `docs/workflows/testing-and-acceptance.md` exact-head E2E gate; EFF-017 2026-06-10 audit reconciliation, testing-gate fixes, and root-runner cleanup entries; PR #169 merged as `2abccc7`; `docs/handoffs/2026-06-10-codex-eff-017-followup-cleanup-coverage.md`; Codex audit session `019eaf17-527e-7b21-b634-01a73aca49b7`.

**Decision options:**

- A. Required app harness plus separate eval fixture/judge lane. Recommended; strongest evidence without overclaiming provider-light E2E.
- B. Put eval proof directly into `e2e_guest_smoke`. Simpler dashboard, but risks making routine CI expensive, flaky, provider-dependent, or privacy-sensitive.
- C. Keep Phase 3 eval proof local-only. Faster to prototype, but weaker merge-readiness evidence and contrary to exact-head automation discipline.
- D. Require manual Replit/Wilson validation for every eval harness PR. High confidence for product judgment, but reintroduces the manual bottleneck the harness was built to reduce.
