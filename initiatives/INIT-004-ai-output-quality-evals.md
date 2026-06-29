# INIT-004 - AI Output Quality Evals & Prompt Improvement

**Status:** In Progress
**Owner:** Wilson / Codex / Claude / Replit
**Created:** 2026-06-09
**Current phase:** Phase 3 - Eval harness

## Overview

INIT-004 owns quantitative evaluation of successful or partially successful AI product outputs: recipe recommendations, pantry/Slop Bowl recipes, and cooking-step generation. The goal is to tell whether Laica's responses actually meet the user's stated constraints and expectations, then turn the bad and good examples into a disciplined prompt-improvement loop.

This is separate from [INIT-002](INIT-002-ai-error-telemetry.md). INIT-002 owns operational failures: provider errors, route failures, redacted error clusters, and admin error summaries. INIT-004 owns output quality when the model returns something: correctness, constraint fit, usefulness, safety, structure, and prompt regression behavior.

## Boundary With INIT-002

The relationship is **parallel-safe with a soft data link**:

- INIT-004 can proceed before INIT-002 finishes because it can use existing `ai_interactions`, seeded fixtures, Wilson-labeled examples, and legacy OpenAI Platform eval exports.
- INIT-002 clusters can later feed INIT-004 when a recurring operational failure suggests a missing eval case, but INIT-004 must not wait for those clusters.
- INIT-002 redaction rules still matter. Any output-quality eval artifact used as merge-readiness evidence must state the dataset, evaluator version, prompt/model version when relevant, metrics, sample size, failure examples or cluster summaries, privacy/redaction posture, artifact location, and negative scope per [Testing and Acceptance Workflow](../docs/workflows/testing-and-acceptance.md).
- AI interaction/eval logging stays non-critical and must not block user flows, per [PD-008](../product-decisions/pd-008-optional-context-and-local-validation-boundaries.md).

## Current Status

Phase 0 merged in [PR #160](https://github.com/wmishak404/laica/pull/160) as `680e26e` on 2026-06-09.

Phase 1 audit merged in [PR #166](https://github.com/wmishak404/laica/pull/166) as `3338611` on 2026-06-10. The audit completed from fresh `origin/main` at `c62ad54` after INIT-002 Phase 1 merged and moved to its Replit observation week. This audit is documentation/architecture work only: it maps current generation surfaces, eval storage, prompt overrides, response shapes, seed intakes, and first rubric implications. It does not change runtime prompts, eval execution, schema, admin APIs, or provider behavior.

Phase 2 merged in [PR #181](https://github.com/wmishak404/laica/pull/181) as `5c410e3` on 2026-06-13 after Wilson approved the spec and GitHub checks passed at PR head `d9a17d7`. The accepted Phase 2 contract is [docs/evals/init-004-phase-2-rubric-dataset-spec.md](../docs/evals/init-004-phase-2-rubric-dataset-spec.md). Phase 3 eval harness work may now start from fresh `origin/main`, using that spec as the implementation contract.

The first Phase 3 harness foundation slice merged in [PR #188](https://github.com/wmishak404/laica/pull/188) as `2e1c693` on 2026-06-16 after Wilson approved the merge and exact-head checks passed at PR head `b865864`. The slice adds canonical eval-vs-prompt feature IDs, first-class `pantry_recipes` and `slop_bowl` eval criteria, public fixture schema/loading, deterministic contract checks for recipe suggestions, Slop Bowl, and cooking steps, public-fixture privacy checks, and a source-level cross-user bleed guard. It intentionally does not run provider judges, ingest private fixtures, change prompts, add DB migrations, activate prompt versions, start daily reports, or resolve EFF-022 cuisine fallback behavior.

The first public synthetic fixture slice merged in [PR #190](https://github.com/wmishak404/laica/pull/190) as `0027908` on 2026-06-17 after Wilson approved the merge and exact-head checks passed at PR head `e086691`. It adds four CI-visible synthetic fixtures across V1 surfaces: a recipe-suggestions max-time boundary pass, a pantry-recipes max-time true negative, a Slop Bowl shape guard, and a cooking-steps generated-context guard. The slice also teaches the loader to accept expected deterministic failures only when the resolved criterion label says `fail`; privacy/schema failures and label mismatches still invalidate the artifact.

The cooking-step user-expectation fixture slice merged in [PR #198](https://github.com/wmishak404/laica/pull/198) as `9588459` on 2026-06-18 after Wilson approved merge and exact-head local/GitHub checks passed at PR head `7271094`. It adds three public synthetic fixtures from the accepted Arize/Wilson-label target set: raw beef doneness, chicken doneness, and missing-lid alternative. This protects the fixture corpus against structurally valid but unsafe, too-complex, or equipment-dependent cooking steps without changing prompts, provider calls, DB schema, runtime generation, private fixture ingestion, daily reports, or EFF-022 cuisine fallback behavior.

The focused public-fixture validation script slice merged in [PR #200](https://github.com/wmishak404/laica/pull/200) as `bb5604f` on 2026-06-18 after Wilson approved merge and exact-head local/GitHub checks passed at PR head `da12f44`. It wires the existing public fixture validation into `npm run eval:fixtures` so future PRs can cite fixture-corpus validity directly instead of relying only on the broader unit suite. This is an offline harness usability slice; it does not add fixtures, change labels, run provider judges, ingest private fixtures, change prompts, write eval data, change DB schema, expose runtime behavior, or resolve EFF-022 cuisine fallback behavior.

The pantry recipe user-expectation fixture slice merged in [PR #205](https://github.com/wmishak404/laica/pull/205) as `762488e` on 2026-06-20T01:21:23Z after [PR #191](https://github.com/wmishak404/laica/pull/191) merged first. It adds three public synthetic `pantry_recipes` calibration probes for halal/no-pork dietary compliance, required shopping-list extras, and beginner skill fit. This slice changed offline fixture data, focused fixture tests, and documentation only; it did not change prompts, run providers, ingest private fixtures, write eval data, change DB schema, expose runtime behavior, or resolve EFF-022 cuisine fallback behavior.

The eval-provenance Phase 3 harness slice merged in [PR #219](https://github.com/wmishak404/laica/pull/219) as `68985f1` on 2026-06-22 after Wilson approved the merge and exact-head local/GitHub checks passed at PR head `fbb01d5`. The implementation keeps Chef It Up pantry generation on the existing `recipe_suggestions` prompt path, but logs `/api/recipes/pantry` outputs under the `pantry_recipes` eval surface, records the active `recipe_suggestions` prompt version id when one exists, and keeps unsupported/non-criteria feature rows out of eval batches. This is measurement plumbing only; it does not change prompts, run providers beyond the existing user request path, ingest private fixtures, write eval results, change schema, expose UI, start LLM judges, or decide EFF-022 cuisine fallback behavior.

The image-quality calibration placement merged in [PR #228](https://github.com/wmishak404/laica/pull/228) as `7c24fef` on 2026-06-22 after Wilson approved the merge and exact-head GitHub checks passed at PR head `28d0e04`. It records generated recipe-image quality calibration as future Phase 7 of INIT-004, not a separate INIT and not current Phase 3 scope. This is coordination/eval workflow documentation only; it does not create the human review queue, start image eval automation, run provider judges, change schema, change runtime image generation, or treat `recipe_image_cache.accuracy_result` as calibrated product truth.

The eval-summary Phase 3 harness slice merged in [PR #232](https://github.com/wmishak404/laica/pull/232) as `5b8e7ed` on 2026-06-29 after Wilson approved the merge and exact-head local/GitHub checks passed at PR head `2c78813`. It builds on PR #219's Chef It Up eval-surface and prompt-version provenance by making `/api/admin/eval/pending` report eligible versus skipped pending rows, making `/api/admin/eval/summary` include feature-level and prompt-version-level aggregates, and renaming the active recipe-generation eval surfaces to `chef_it_up_suggestions` and `slop_bowl_suggestions` with legacy alias support. This is admin/reporting plumbing only; it does not submit provider judge batches, process new eval results, change prompts, ingest private fixtures, change schema, expose user UI, activate daily reports, or decide EFF-022 cuisine fallback behavior.

Wilson's 2026-06-23 taxonomy clarification renames the canonical recipe-generation eval surfaces before daily reports launch: `/api/recipes/pantry` now reports as `chef_it_up_suggestions`, and `/api/recipes/slop-bowl` now reports as `slop_bowl_suggestions`. The code keeps `pantry_recipes` and `slop_bowl` as legacy aliases for existing rows and older fixture artifacts, so no DB migration is required.

Wilson's 2026-06-16 verification direction is now part of INIT-004's evaluation philosophy: every future fixture, judge, report, or prompt comparison should name the user expectation it protects. Structure and schema checks are still required because broken output cannot help a user, but they should be presented as foundation checks unless they also prove time fit, dietary safety, pantry usefulness, skill fit, equipment fit, cuisine fit, cooking-step clarity, food safety, privacy, or another explicit user-facing promise.

Wilson's 2026-06-17 test-case direction keeps this lightweight: future enhancements should use `Value claim`, `Evidence`, and `Evidence limits` rather than a large taxonomy. New or materially touched tests should map to one value claim, one supporting evidence path, and one stated limit; existing tests do not need churn just to add wording.

The seed inputs are:

- Wilson's 2026-06-09 direction to create a standalone INIT-004 rather than folding the work into INIT-002.
- Durable eval discipline now lives in [docs/workflows/evaluations.md](../docs/workflows/evaluations.md); seed records and practical eval artifacts live in [docs/evals/](../docs/evals/README.md), not inside this INIT.
- Good/bad examples already embedded in `server/openai.ts` prompt text from earlier open coding.
- [EFF-022](../efforts/effort-022-cross-cuisine-recommendation-prompts.md) negative cuisine-fit fixtures for Chinese, Indian, and Thai requests under constrained pantry conditions.

## Source Docs

- [AI Eval Evidence README](../docs/evals/README.md) - practical home for eval registry, intake records, fixture candidates, report references, and future harness notes after INIT closeout
- [Evaluation Workflow](../docs/workflows/evaluations.md) - canonical operating model for running, measuring, reporting, gating, and acting on evals
- [AI Eval Intake Registry](../docs/evals/registry.md) - durable index of eval runs, open-coding imports, judge runs, human review batches, and daily reports
- [INIT-004 Phase 2 Rubric and Dataset Spec](../docs/evals/init-004-phase-2-rubric-dataset-spec.md) - revised taxonomy, privacy posture, rubric, fixture format, and Wilson-label target set
- [EFF-022 - Cross-cuisine recommendation prompts](../efforts/effort-022-cross-cuisine-recommendation-prompts.md) - active prompt/eval follow-up for cuisine-fit and pantry-grounded cross-cuisine behavior
- [INIT-002 - AI Error Telemetry & Eval Monitoring](INIT-002-ai-error-telemetry.md) - operational error telemetry and later safe cluster handoff
- [Testing and Acceptance Workflow](../docs/workflows/testing-and-acceptance.md) - evidence reports required before eval results can be used as merge-readiness signal
- [PD-008 - Optional context and local validation boundaries](../product-decisions/pd-008-optional-context-and-local-validation-boundaries.md) - observability/eval writes must not block user-facing AI flows
- [PD-010 - AI error telemetry allowlist](../product-decisions/pd-010-ai-error-telemetry-allowlist.md) - privacy baseline for operational error data; INIT-004 may need its own output-quality eval privacy policy if richer redacted content is retained
- [Mobile Refresh AI privacy rules](../product-decisions/features/mobile-refresh/pd-cross-phase-ai-privacy.md) - 90-day AI interaction retention, redaction guidance, prompt-injection guidance
- [Phase 3 Planning](../product-decisions/features/mobile-refresh/pd-phase-03-planning.md) - pantry-first recipe contract, optional-enhancement interpretation of `additionalIngredientsNeeded`, and cuisine-staple validation lessons
- [Slop Bowl Phase 3 Simplified Bowl](../product-decisions/features/slop-bowl/pd-phase-03-simplified-bowl.md) - Slop Bowl prompt and simplified bowl constraints

## Code Entry Points To Audit In Phase 1

- [`server/openai.ts`](../server/openai.ts) - recipe suggestions, pantry suggestions, Slop Bowl generation, cooking steps, default prompts, embedded examples, interaction logging
- [`server/evaluator.ts`](../server/evaluator.ts) - current batch eval submission and result aggregation
- [`server/eval-criteria.ts`](../server/eval-criteria.ts) - current LLM-judge criteria and feature taxonomy
- [`server/admin-routes.ts`](../server/admin-routes.ts) - admin eval and prompt endpoints
- [`shared/schema.ts`](../shared/schema.ts) - `ai_interactions`, `prompt_versions`, and related eval fields
- [`client/src/components/cooking/meal-planning.tsx`](../client/src/components/cooking/meal-planning.tsx) - cuisine/time/preference packaging for recipe generation

Known Phase 1 audit questions:

- Current eval criteria only name `recipe_suggestions`, `cooking_assistance`, and `cooking_steps`; Slop Bowl is logged as `slop_bowl` in code paths and needs first-class eval coverage.
- The legacy OpenAI Platform export returned one recipe object, while current product surfaces commonly return three suggestions under `recipes[]` or one Slop Bowl recipe under `recipe`. The harness must score current product contracts rather than only the legacy shape.
- Deterministic contract checks should sit beside LLM-as-judge checks. The legacy export included at least one invalid JSON output that still passed all LLM criteria, so parse/schema checks cannot be delegated to a judge model.

## Durable Eval System

INIT-004 builds on the durable eval system but does not own it permanently. The canonical operating discipline lives in [`docs/workflows/evaluations.md`](../docs/workflows/evaluations.md). Complete normalized intake records and practical artifact indexes live in [`docs/evals/`](../docs/evals/README.md) so they remain discoverable after INIT-004 closes.

- Workflow: [docs/workflows/evaluations.md](../docs/workflows/evaluations.md)
- Durable registry: [docs/evals/registry.md](../docs/evals/registry.md)
- Intake template: [docs/evals/intakes/TEMPLATE.md](../docs/evals/intakes/TEMPLATE.md)
- OpenAI Platform seed record: [openai-platform-evalrun-685361470e9c819195a768074ef126cd](../docs/evals/intakes/openai-platform-evalrun-685361470e9c819195a768074ef126cd.md)
- Arize seed record: [arize-open-coding-2025-11-07](../docs/evals/intakes/arize-open-coding-2025-11-07.md)

## Current Build Signals

The seed records point to the first implementation priorities for INIT-004:

| Signal | Source | Build implication |
|---|---|---|---|
| Structure/contract fragility | [OpenAI Platform seed](../docs/evals/intakes/openai-platform-evalrun-685361470e9c819195a768074ef126cd.md), [Arize seed](../docs/evals/intakes/arize-open-coding-2025-11-07.md) | Add deterministic JSON/schema/current-response-shape checks before any LLM judge. |
| Max-time failures | Both seed records | Add deterministic max-time band checks using Wilson's accepted rule: `cookTime <= selectedMax + 15`; true negative examples now need synthetic fixtures. |
| Judge calibration gap | Both seed records | Build a Wilson-labeled gold set and report TPR/TNR before trusting LLM-judge pass rates. |
| Food safety, proficiency, and equipment misses | Arize seed | Add rubric labels and judge checks for raw-protein safety, beginner/intermediate step fit, and unlisted equipment assumptions. |
| Cuisine/pantry tradeoff | Arize seed and [EFF-022](../efforts/effort-022-cross-cuisine-recommendation-prompts.md) | Separate pantry-first usefulness from cuisine authenticity so prompt fixes do not over-correct into shopping-list behavior. |
| User-expectation fit | Wilson 2026-06-16 direction | Each eval must identify the user promise being protected; contract-only fixtures remain useful foundation work but should not be treated as broad user-quality proof. |


## Phase 1 Surface/Data Audit Findings

The 2026-06-10 audit inspected `server/openai.ts`, `server/evaluator.ts`, `server/eval-criteria.ts`, `server/admin-routes.ts`, `server/prompt-manager.ts`, `shared/schema.ts`, `client/src/lib/openai.ts`, `client/src/components/cooking/meal-planning.tsx`, and the current eval intake records.

### Current generation/eval surface map

| Surface | Current route / caller | Feature ids now in use | Current response shape | Audit finding |
|---|---|---|---|---|
| General recipe suggestions | `POST /api/recipes/suggestions` -> `getRecipeSuggestions`; older `client/src/pages/recipes.tsx` also calls `fetchRecipeSuggestions` | `recipe_suggestions` in `ai_interactions`, prompt versions, eval criteria, and error telemetry | JSON object normalized by `normalizeRecipeSuggestionsResponse`; expected `recipes[]` when current UI consumes it | Existing eval criteria can reach this feature id, but the old seed export used a legacy one-recipe shape. Future fixtures must validate the current `recipes[]` contract. |
| Chef It Up / pantry recipes | `MealPlanning` -> `fetchPantryRecipes` -> `POST /api/recipes/pantry` -> `getRecipeSuggestions` | `chef_it_up_suggestions` for eval/error reporting; legacy `pantry_recipes` normalizes into this id; prompt provenance remains `recipe_suggestions` because the route reuses that prompt path | Client requires exactly three recipes under `recipes[]` and maps `imageUrl`/`image_url`, `pantryIngredientsUsed`, `additionalIngredientsNeeded`, `cookTime`, `difficulty`, `cuisine`, and `isFusion` | Phase 3 preserves Chef It Up as a distinct product surface while giving it a clearer recipe-suggestion id. |
| Slop Bowl | `POST /api/recipes/slop-bowl` -> `getSlopBowlRecipe` | `slop_bowl_suggestions` for eval/error reporting; legacy `slop_bowl` normalizes into this id; no DB prompt-version admin support | Strict `slopBowlRecipeSchema`; API wraps one object under `{ recipe }` | Slop Bowl remains a distinct recipe-suggestion surface because it has one-bowl shape, recent-meal, feedback, equipment, and pantry-match constraints. |
| Cooking steps | `LiveCooking` -> `fetchCookingSteps` -> `POST /api/cooking/steps` -> `getCookingSteps` | `cooking_steps` across logging, prompt versions, eval criteria, and error telemetry | JSON object with `recipe`, `steps[]`, and optional `variations`; route accepts descriptive generated recipe context after PR #144 fixes | Existing eval criteria name this surface, but there is no deterministic response schema check before the broad judge prompt. Fixture work should include generated-context payloads from Chef It Up and Slop Bowl, not only short pantry item strings. |
| Cooking assistance | `POST /api/cooking/assistance` -> `getCookingAssistance` | `cooking_assistance` across logging, prompt versions, eval criteria, and error telemetry | Plain text | Existing eval criteria cover it, but INIT-004 V1 build scope is recipe recommendations, Slop Bowl, and cooking-step generation. Keep assistance as existing infrastructure unless Wilson pulls it into V1 quality reporting. |
| Vision, speech synthesis, voices, transcription | Provider routes under `/api/vision/*` and `/api/speech/*` | Operational telemetry ids exist (`ingredient_detection`, `tts`, `tts_voices`, `transcription`) | Provider-specific JSON/audio/text | These stay outside INIT-004 V1 output-quality evals per build scope. INIT-002 owns operational failure telemetry for these routes. |

### Contract and taxonomy gaps to resolve before harness work

- `server/eval-criteria.ts` defines `FeatureType` as only `recipe_suggestions`, `cooking_assistance`, and `cooking_steps`; admin prompt generation/saving and `prompt-manager.ts` inherit that set. This blocks first-class Slop Bowl evals and any separate `pantry_recipes` reporting.
- `shared/schema.ts` comments still describe `ai_interactions.feature_type` and `prompt_versions.feature_type` as the three original feature ids, while runtime already writes `slop_bowl` interactions. The eventual schema/comment cleanup should happen with the feature-taxonomy implementation branch, not in this audit-only branch.
- The batch evaluator builds one broad LLM-judge prompt per feature and stores the verdict directly. It does not first run deterministic JSON/schema/suggestion-count/max-time checks, so it can reproduce the seed-run failure mode where invalid structure still passes judge criteria.
- Current `ai_interactions.input_data` and `output_data` can contain user preferences, pantry labels, generated recipe text, and cooking steps. `sanitizePromptInput` strips prompt markers but does not implement the redaction/allowlist posture used for INIT-002 operational telemetry. Phase 2 must define an output-quality eval privacy policy before production/staged samples, admin summaries, or durable reports preserve raw examples.
- Admin eval summaries return failed interactions with raw `inputData` and `outputData`. This is acceptable as existing internal tooling, but INIT-004 report artifacts should not copy those raw rows into public markdown without a privacy/source decision.
- `MealPlanning` packages time, cooking skill, optional-ingredient rules, selected cuisines, confirmed staples, unconfirmed staples, dietary restrictions, and previous recipe names into one free-text `preferences` string; `/api/recipes/pantry` can append `ready in <timeAvailable>` again. Eval fixtures should test this actual packaged request shape instead of an idealized structured preference schema.
- `DEFAULT_RECIPE_SUGGESTIONS_PROMPT` currently says `cookTime` should be rounded up in 15-minute intervals. Phase 2 accepted a deterministic +15-minute eval band, so 25-minute max returning 30 minutes is a boundary pass rather than a failure; a true negative max-time fixture should be synthetic.
- The prompt and client currently encode the pantry/cuisine tradeoff as a quiet range (`pantry-strict`, `pantry-flexible`, `cuisine-leaning`) without showing those tiers to the user. EFF-022 remains the product home for deciding when cuisine mismatch needs an explicit fallback story; INIT-004 should measure this separately from pantry grounding.

### First deterministic checks to build after Phase 2

1. Parseability and schema conformity for each current surface: `recipes[]` length 3 for `recipe_suggestions`/Chef It Up, one `{ recipe }` object for Slop Bowl, and `recipe` plus `steps[]` for cooking steps.
2. Required-field checks for recipe names, descriptions, cook time, difficulty, pantry ingredient arrays, optional ingredient arrays, instructions/overview, cuisine, and `isFusion` where the UI or downstream route consumes them.
3. Max-time adherence using the accepted Phase 2 +15-minute band.
4. Optional-ingredient contract checks: 0-3 optional extras after normalization, no universal staples, no optional-marker words, and no instructions that require an item listed only in `additionalIngredientsNeeded` when this can be checked deterministically or with a focused judge.
5. Suggestion-count and shape checks before any LLM judge so malformed output cannot receive a quality pass.
6. Cooking-step equipment and safety flags for obvious missing equipment terms, raw protein/egg doneness cues, visual/sensory cues on judgment steps, and step order issues that need human/judge labels.

### First label schema direction

Phase 2 should draft criterion-level labels rather than a single pass/fail label:

- `structure_contract`
- `max_time_adherence`
- `dietary_compliance`
- `pantry_grounding`
- `optional_ingredient_contract`
- `cuisine_fit`
- `inspired_or_fusion_labeling`
- `recipe_usefulness`
- `food_safety`
- `skill_fit`
- `equipment_fit`
- `cooking_step_sequence`

Arize clusters map naturally into `food_safety`, `skill_fit`, `equipment_fit`, `max_time_adherence`, `cuisine_fit`, and `structure_contract`. EFF-022's Chinese, Indian, Thai, and Loco Moco-style cases should seed `cuisine_fit`, `pantry_grounding`, and `inspired_or_fusion_labeling` fixtures without resolving the product rule inside the eval harness.
Judge calibration remains a run/reporting concern measured against Wilson labels with TPR/TNR; it is not a fixture label.

### Phase 1 decisions

- Do not build the eval harness before Phase 2 locks the feature taxonomy, fixture schema, privacy posture, and first Wilson-label target set.
- Treat Slop Bowl as requiring first-class feature-type/eval criteria changes before it can be measured honestly.
- Treat `pantry_recipes` as an explicit Phase 2 taxonomy decision because current operational telemetry distinguishes it while `ai_interactions` and prompt versions do not.
- Keep raw seed exports and raw admin eval rows out of repo. Phase 2 may create summarized or synthetic fixtures, or commit redacted fixtures only after a privacy/source decision.
- Do not activate prompt changes from this audit. Prompt-candidate generation remains inactive until Wilson reviews baseline/candidate comparison evidence.

## Build Scope

V1 covers these output surfaces:

- Chef It Up / Pantry recipe recommendations
- General recipe suggestions from meal-planning preferences
- Slop Bowl recipe generation
- Cooking-step generation for accepted recipes

V1 does not cover:

- Provider outage handling or route failures, except when INIT-002 turns an operational cluster into a future eval fixture
- Image generation quality
- Speech transcription or synthesis quality
- Full dashboard UX
- Automated prompt activation without Wilson review

### Phase 7 image-quality calibration lane

Wilson accepted generated recipe-image quality as a later INIT-004 phase, not a separate INIT and not a loose follow-up. Start it only after INIT-004 has the core human-review queue, judge-calibration reports, daily/reporting loop, and action-routing machinery needed to make human labels useful.

The future lane should:

- sample `recipe_image_cache` rows for blind human review, especially near-threshold approvals/rejections, repeated failure clusters, provider/model/style-version comparisons, and policy/safety failures;
- hide the model judge result until Wilson labels the image as acceptable, not acceptable, or needing a product decision;
- record structured human failure labels so model-judge disagreements become actionable instead of only "right/wrong";
- compare multiple judge models/prompts/thresholds against a frozen human-labeled image set before changing production gating;
- report false approvals, false rejections, agreement near threshold, common clusters, latency, and cost;
- route findings into concrete fixes: generator prompt, judge prompt, threshold, provider/model/style, recipe fingerprint/core-ingredient extraction, product decision, or fixture/gold-set addition.

This lane is Phase 7 in INIT-004 so it stays part of the first eval-system buildout instead of getting lost after recipe-text evals. Until Phase 7 starts, `recipe_image_cache.accuracy_result` remains runtime quality telemetry and should not be treated as calibrated product truth.

### Speech interaction eval boundary

Wilson's 2026-06-17 Live Cooking speech questions are registered as [speech-interaction-acceptance-seed-2026-06-17](../docs/evals/intakes/speech-interaction-acceptance-seed-2026-06-17.md) so the goal/value acceptance criteria survive outside chat. This is **not** current INIT-004 Phase 3 harness scope. The seed belongs to INIT-001 Phase 4 until Wilson explicitly opens a later speech/transcription/synthesis eval phase.

Future speech eval work should start from deterministic interaction checks before provider-quality claims: transcript-to-synthesis payload fidelity, speech request arbitration, mute persistence, late-response invalidation, stop-before-recording behavior, and only then real-device/provider pronunciation or audio-quality smoke. Do not mix those checks into recipe/Slop Bowl/cooking-step output-quality pass rates.

## INIT-004 Build Outputs

INIT-004 should produce or coordinate:

- a current-surface audit of recipe suggestions, pantry recipes, Slop Bowl, and cooking-step generation;
- first-class eval coverage for Slop Bowl, which current criteria do not name;
- deterministic contract checks for schema, shape, max time, required fields, suggestion count, and other machine-checkable constraints;
- a first Wilson-labeled gold set mapped to the durable seed records and EFF-022 cuisine-fit fixtures;
- narrow LLM judges with calibration status, not broad uncalibrated aggregate scores;
- daily report automation that indexes reports through `docs/evals/registry.md`;
- inactive prompt-candidate workflow and comparison evidence, with Wilson approval before production activation.

## Phase Progress

| Phase | Status | PR / branch | Current signal |
|---|---|---|---|
| Phase 0 - INIT filing | Merged | [#160](https://github.com/wmishak404/laica/pull/160) / `codex/init-004-output-evals` | Merged as `680e26e`; created focused INIT hub, durable eval workflow/evidence docs, active-list links, INIT-002 boundary note, EFF-022 link, and handoff |
| Phase 1 - Surface and data audit | Merged | [#166](https://github.com/wmishak404/laica/pull/166) / `codex/init-004-phase-1-audit` | Merged as `3338611`; audited current generation routes, prompt/eval feature ids, response shapes, admin eval storage, seed intakes, deterministic-check gaps, Slop Bowl first-class feature need, and EFF-022 cuisine-fit mapping |
| Phase 2 - Rubric and dataset spec | Merged | [#181](https://github.com/wmishak404/laica/pull/181) / `codex/init-004-phase-2-spec` | Merged as `5c410e3`; accepted eval-vs-prompt taxonomy split, first-class `pantry_recipes` and `slop_bowl` eval surfaces, +15 max-time band, output-attached fixtures, two-tier public/private fixture storage, cross-user bleed prevention, dietary-compliance labeling, cooking-assistance V1 exclusion, and the first Wilson-label target set |
| Phase 3 - Eval harness | In progress | [#188](https://github.com/wmishak404/laica/pull/188) merged / [#190](https://github.com/wmishak404/laica/pull/190) merged / [#198](https://github.com/wmishak404/laica/pull/198) merged / [#200](https://github.com/wmishak404/laica/pull/200) merged / [#205](https://github.com/wmishak404/laica/pull/205) merged / [#219](https://github.com/wmishak404/laica/pull/219) merged / [#232](https://github.com/wmishak404/laica/pull/232) merged | Latest slice adds eval queue/reporting summaries over separated eval surfaces and prompt-version provenance, with canonical `chef_it_up_suggestions` / `slop_bowl_suggestions` reporting; provider judges, private fixtures, DB migrations, prompt activation, daily reports, and EFF-022 product-rule changes remain out of scope |
| Phase 4 - Human review and calibration | Planned | TBD | Wilson-first review workflow; calculate TPR/TNR per judge; mark uncalibrated metrics clearly |
| Phase 5 - Daily reporting automation | Planned | TBD | Daily report vehicle, artifact storage, and metric summary without dashboard UX |
| Phase 6 - Prompt candidate workflow | Planned | TBD | Failure clusters generate inactive prompt candidates and regression comparisons; no automatic production activation |
| Phase 7 - Image quality calibration | Planned | TBD | Blind human review of `recipe_image_cache`, judge-model/prompt/threshold comparison, frozen image gold set, calibration reports, and action routing |
| Phase 8 - Closeout | Planned | TBD | Durable metric definitions, reporting cadence, prompt workflow, image-calibration status, validation evidence, and remaining product decisions recorded |

## PRs And Branches

| PR | Status | Branch | Validation / merge signal |
|---|---|---|---|
| [#160](https://github.com/wmishak404/laica/pull/160) | Merged as `680e26e` | `codex/init-004-output-evals` | Docs-only filing and durable eval evidence registry. Marked ready, checks passed after unit rerun; no Replit validation required. |
| [#166](https://github.com/wmishak404/laica/pull/166) | Merged as `3338611` | `codex/init-004-phase-1-audit` | Docs-only Phase 1 audit. Local `git diff --check`, `npm ci`, `npm run check`, and `npm run build` passed; GitHub unit, `e2e_guest_smoke`, `npm-audit`, TruffleHog PR, and CodeQL passed after the draft was marked ready; no Replit validation required. |
| [#181](https://github.com/wmishak404/laica/pull/181) | Merged as `5c410e3` | `codex/init-004-phase-2-spec` | Docs-only Phase 2 spec. GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL passed at PR head `d9a17d7`; no Replit validation required. |
| [#188](https://github.com/wmishak404/laica/pull/188) | Merged as `2e1c693` | `codex/init-004-harness-foundation` | First Phase 3 harness foundation slice. Local `npm ci`, fixture Vitest, full unit suite, `npm run check`, `npm audit --audit-level=high`, `npm run build`, and whitespace checks passed; GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL passed at final PR head `b865864`; no Replit validation required. |
| [#190](https://github.com/wmishak404/laica/pull/190) | Merged as `0027908` | `codex/init-004-public-fixtures` | First public synthetic fixture slice. Final-head local validation passed; GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL passed at final PR head `e086691`; no Replit validation required. |
| [#198](https://github.com/wmishak404/laica/pull/198) | Merged as `9588459` | `codex/init-004-phase-3-user-expectation-fixtures` | Cooking-step user-expectation fixture slice. Local focused fixture Vitest, full unit suite, `npm run check`, `npm audit --audit-level=high`, `npm run build`, and whitespace checks passed at final PR head `7271094`; GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL passed before Wilson approved merge; no Replit validation required. |
| [#200](https://github.com/wmishak404/laica/pull/200) | Merged as `bb5604f` | `codex/init-004-fixture-validation-script` | Focused public fixture validation script. Final head `da12f44` passed local `npm run eval:fixtures`, focused fixture Vitest, full unit suite, `npm run check`, `npm audit --audit-level=high`, `npm run build`, whitespace checks, and GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL; no Replit validation required. |
| [#205](https://github.com/wmishak404/laica/pull/205) | Merged as `762488e` | `codex/init-004-pantry-expectation-fixtures` | Pantry recipe user-expectation fixture slice. Final PR head `b64486a` passed local `npm run eval:fixtures`, focused fixture Vitest, full unit suite, `npm run check`, `npm audit --audit-level=high`, `npm run build`, whitespace checks, and GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL before Wilson's merge instruction was applied after PR #191 merged; no Replit validation required. |
| [#219](https://github.com/wmishak404/laica/pull/219) | Merged as `68985f1` | `codex/init-004-eval-provenance` | Criteria-aware queue selection plus `pantry_recipes` eval-surface and prompt-version provenance. After unrelated PR #218 merged, PR #219 was rebased onto `origin/main` at `659b361` and final PR head `fbb01d5` passed local `npm run eval:fixtures`, full `npm run test:unit`, `npm run check`, `npm audit --audit-level=high`, `npm run build`, whitespace checks, and GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL before Wilson's merge instruction was applied; no Replit validation required. |
| [#228](https://github.com/wmishak404/laica/pull/228) | Merged as `7c24fef` | `codex/image-eval-calibration-lane` | Docs-only placement for future Phase 7 image-quality calibration. Final PR head `28d0e04` passed GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, CodeQL, and CodeQL language analysis checks before Wilson's merge instruction was applied; no Replit validation required. |
| [#232](https://github.com/wmishak404/laica/pull/232) | Merged as `5b8e7ed` | `codex/init-004-eval-summary` | Eval pending/summary admin reporting and taxonomy clarity slice. After `origin/main` moved to `11b1847`, PR #232 was rebased and final head `2c78813` passed local focused eval Vitest, `npm run eval:fixtures`, full unit suite, `npm run check`, `npm audit --audit-level=high`, `npm run build`, whitespace checks, and GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL before Wilson's merge instruction was applied; no Replit validation required. |

## Validation State

Phase 0 was docs-only. No local build, Replit preview, DB push, or runtime validation was required for the filing itself. PR #160 passed `unit` on rerun, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL before merge.

Phase 1 was docs-only. No Replit preview, DB push, eval run, or runtime validation was required because it changed only planning/audit docs. PR #166 passed local `git diff --check`, `npm ci`, `npm run check`, and `npm run build`; after the draft was marked ready, GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL passed before merge.

Phase 2 was docs-only. No runtime, schema, prompt, admin route, provider, UI, deployment, fixture-data, or eval-run behavior changed. PR #181 passed local markdown diff checks and GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL at final PR head `d9a17d7` before Wilson approved the merge. The squash merge commit is `5c410e3`.

Phase 3 first harness foundation slice is a local/offline implementation change. It adds fixture validation and feature typing but does not call OpenAI, query private fixture paths, write eval data, change DB schema, change prompts, or expose new product UI. PR #188 passed local `npm ci`, focused fixture Vitest, full unit suite, `npm run check`, `npm audit --audit-level=high`, `npm run build`, whitespace checks, and GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL at final PR head `b865864` before Wilson approved the merge. Human Replit validation was not required because no provider, auth, schema, deployment, or user-facing runtime behavior changed. The squash merge commit is `2e1c693`.

Phase 3 public synthetic fixture slice is a local/offline implementation change. It adds public synthetic fixtures, expected deterministic failure semantics, and the lightweight value/evidence/limits verification standard but does not call providers, ingest private fixture paths, write eval data, change DB schema, change prompts, or expose new product UI. PR #190 passed local `npm ci`, focused fixture Vitest, full unit suite, `npm run check`, `npm audit --audit-level=high`, `npm run build`, whitespace checks, and GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL at final PR head `e086691` before Wilson approved the merge. Human Replit validation was not required because no provider, auth, schema, deployment, or user-facing runtime behavior changed. The squash merge commit is `0027908`.

Phase 3 cooking-step user-expectation fixture slice is a local/offline fixture-corpus change merged in PR #198. It adds public synthetic negative guards for food-safety, skill-fit, equipment-fit, and cooking-step-sequence labels. It does not call providers, ingest private fixture paths, write eval data, change DB schema, change prompts, or expose new product UI. PR #198 passed local focused fixture Vitest, full unit suite, `npm run check`, `npm audit --audit-level=high`, `npm run build`, whitespace checks, and GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL at final PR head `7271094` before Wilson approved merge. Human Replit validation was not required because no provider, auth, schema, deployment, or user-facing runtime behavior changed. The squash merge commit is `9588459`.

Phase 3 fixture-validation script slice is a local/offline harness usability change merged in PR #200. It makes the existing public fixture corpus directly callable with `npm run eval:fixtures` but does not add fixtures, run providers, ingest private fixture paths, write eval data, change DB schema, change prompts, or expose new product UI. PR #200 passed local focused fixture validation, focused fixture Vitest, full unit suite, `npm run check`, `npm audit --audit-level=high`, `npm run build`, whitespace checks, and GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL at final PR head `da12f44` before Wilson approved merge. Human Replit validation was not required because no provider, auth, schema, deployment, or user-facing runtime behavior changed. The squash merge commit is `bb5604f`.

Phase 3 pantry recipe user-expectation fixture slice is a local/offline fixture-corpus change merged in PR #205. It adds public synthetic `pantry_recipes` negative guards for dietary-compliance, pantry-grounding / optional-ingredient-contract, and beginner skill-fit labels. It does not call providers, ingest private fixture paths, write eval data, change DB schema, change prompts, or expose new product UI. PR #205 was rebased onto fresh `origin/main` after PR #191 merged, then passed local `npm run eval:fixtures`, focused fixture Vitest, full unit suite, `npm run check`, `npm audit --audit-level=high`, `npm run build`, whitespace checks, and GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL at final PR head `b64486a` before Wilson's merge instruction was applied. Human Replit validation was not required because no provider, auth, schema, deployment, or user-facing runtime behavior changed. The squash merge commit is `762488e`.

Phase 3 eval-provenance slice is local/offline measurement plumbing merged in PR #219. It lets future eval batches distinguish Chef It Up pantry rows from general recipe suggestions while retaining the reused recipe prompt-version provenance, and it prevents unsupported/non-criteria feature rows from entering eval batches. PR #219 was rebased onto fresh `origin/main` after PR #218 merged, then passed local `npm run eval:fixtures`, full unit suite, `npm run check`, `npm audit --audit-level=high`, `npm run build`, whitespace checks, and GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL at final PR head `fbb01d5` before Wilson's merge instruction was applied. Human Replit validation was not required because no prompt, provider, auth, schema, deployment, UI, private fixture, DB persistence contract, or user-facing runtime generation behavior changed. The squash merge commit is `68985f1`.

Future Phase 7 image-quality calibration placement is docs-only coordination work merged in PR #228. It records Wilson's accepted direction that generated recipe-image quality belongs inside INIT-004 as a later phase with blind human review, judge-model comparison, calibration reporting, and action routing. PR #228 passed whitespace checks locally and GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, CodeQL, and CodeQL language analysis checks at final PR head `28d0e04` before Wilson's merge instruction was applied. Human Replit validation was not required because no runtime, schema, UI, provider, prompt, automation, fixture-data, deployment, or eval-run behavior changed. The squash merge commit is `7c24fef`.

The eval-summary Phase 3 slice is local/offline admin/reporting plumbing merged in PR #232. It makes pending eval queue eligibility visible before batch submission, groups completed eval results by eval surface and prompt version, and renames the active recipe-generation surfaces to `chef_it_up_suggestions` and `slop_bowl_suggestions` while preserving legacy aliases. After `origin/main` moved to `11b1847`, PR #232 was rebased and final head `2c78813` passed local focused eval Vitest, `npm run eval:fixtures` after narrow escalation for the known `tsx` IPC sandbox issue, full `npm run test:unit`, `npm run check`, `npm audit --audit-level=high`, `npm run build`, whitespace checks, and GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, CodeQL action/javascript analyses, and CodeQL summary before Wilson's merge instruction was applied. It does not call providers, start judge batches, process new eval results, write schema, change prompts, ingest private fixtures, expose user UI, activate daily reports, or decide EFF-022 cuisine fallback behavior. The squash merge commit is `5b8e7ed`.

Future implementation phases that use eval results as merge evidence must follow [Testing and Acceptance Workflow](../docs/workflows/testing-and-acceptance.md). Future DB or production-sampling work must follow ADR-0001, the testing/local-sandbox workflows, and Replit as the primary runtime.

## Current Resume Point

The latest merged Phase 3 slice was [PR #232](https://github.com/wmishak404/laica/pull/232), merged as `5b8e7ed`. It added pending queue eligibility summaries, completed eval feature/prompt-version aggregates, removed weak top-level aggregate quality rates, and made the active recipe-generation eval taxonomy clearer with `chef_it_up_suggestions` and `slop_bowl_suggestions` canonical report keys plus legacy alias normalization.

The next bounded Phase 3 candidates are:

1. Start narrow LLM-judge work only after fixture labels and deterministic checks exist.
2. Add more fixtures only when they cover a new accepted label gap rather than duplicating dietary/pantry/skill probes.
3. Add a small report artifact/export path using the new summary fields, still without running live providers or changing prompts.

Cuisine-fit fixtures remain deferred unless they can be labeled without deciding the unresolved EFF-022 product fallback rule. Do not start live-provider judge runs, private fixture ingestion, DB migrations, prompt activation, daily reports, or EFF-022 cuisine-fallback product changes without a separate documented milestone and any required Wilson decision.

Future image-quality calibration was recorded in [PR #228](https://github.com/wmishak404/laica/pull/228) as INIT-004 Phase 7, not current Phase 3 scope. Do not start the recurring human image-eval automation until the human-review queue and calibration-report workflow exist; when Phase 7 starts, it should sample `recipe_image_cache`, use blind Wilson labels, compare judge models against a frozen human-labeled image set, and route disagreement clusters to concrete generator/judge/provider/product fixes.

## Chronology

- **2026-06-09** - Wilson asked how to make quantitative evals for recipe generation, recipe recommendation, and cooking-step outputs; emphasized true positive rate, human review, bad/good examples, prompt iteration, and daily reporting/dashboards.
- **2026-06-09** - Wilson provided an OpenAI Platform eval export and clarified that examples were also added to `server/openai.ts` from earlier eval/open-coding work.
- **2026-06-09** - Wilson decided this should be filed as a standalone INIT-004 rather than folded into INIT-002. Separate ownership keeps operational error telemetry in INIT-002 and output-quality evals/prompt improvement in INIT-004.
- **2026-06-09** - Wilson provided Arize open-coding seed data. The notes added initial taxonomy signal for food safety/doneness, proficiency fit, equipment availability, cook-time adherence, cuisine/pantry tradeoff, and output extraction/format fragility.
- **2026-06-09** - Wilson clarified that eval records need a durable home beyond INIT closeout. Created [docs/evals/](../docs/evals/README.md), moved the normalized OpenAI Platform and Arize seed intake records there, and kept INIT-004 as the active hub that links to the durable registry.
- **2026-06-09** - Wilson asked to move eval discipline out of INIT-004 because the INIT should stay focused on what needs to be built. Created the durable [Evaluation Workflow](../docs/workflows/evaluations.md), kept `docs/evals/` as the practical registry/intake home, trimmed INIT-004 back to build context, and updated stale PR placeholders to PR #160.
- **2026-06-09** - PR #160 merged as `680e26e` after being marked ready and passing CI on rerun. Phase 0 is closed; Phase 1 is the next INIT-004 work, after Wilson's near-term INIT-002 implementation focus.
- **2026-06-10** - Phase 1 audit completed from fresh `origin/main` at `c62ad54` after INIT-002 Phase 1 merged and moved to Replit observation. The audit found first-class Slop Bowl feature-type work is required, `pantry_recipes` needs a Phase 2 taxonomy decision, current eval criteria do not match all current response shapes, deterministic checks must precede LLM judges, raw eval interaction rows need a dedicated output-quality privacy posture before becoming artifacts, and EFF-022 cuisine-fit examples should seed rubric labels without resolving the product rule inside the eval harness.
- **2026-06-10** - PR #166 merged as `3338611` after Wilson approval, local docs/build validation, and GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, TruffleHog PR, and CodeQL checks passed. Phase 2 is now the next INIT-004 work from fresh `origin/main`.
- **2026-06-10** - Phase 2 drafting started on `codex/init-004-phase-2-spec`. The draft spec recommends separating eval/reporting feature IDs from prompt-management IDs, making `pantry_recipes` and `slop_bowl` first-class eval surfaces, keeping raw output-quality artifacts out of repo, defining criterion-level labels, and selecting a small Wilson-first seed set before harness code.
- **2026-06-13** - Wilson accepted the Phase 2 architecture decisions captured in Claude's decision handoff: +15-minute max-time band, output-attached request/constraints fixture format, `dietary_compliance`, nutrition exclusion, two-tier public/private fixture storage with `LAICA_PRIVATE_EVAL_DIR`, cross-user bleed prevention, `cooking_assistance` infrastructure-only V1 status, and the Phase 3 implementation-risk checklist. Codex revised the Phase 2 spec from that handoff. PR #168 closed unmerged and stopped tracking the branch head, so PR #181 was opened as the clean review surface and marked ready for review.
- **2026-06-13** - PR #181 merged as `5c410e3` after Wilson approved the accepted Phase 2 spec and GitHub checks passed at final PR head `d9a17d7`. Phase 3 eval harness work is now unblocked from the merged spec, with EFF-022 cuisine fallback still open as a product decision and no runtime/eval execution changes shipped in Phase 2.
- **2026-06-16** - Phase 3 foundation implementation opened as PR #188 on `codex/init-004-harness-foundation` from fresh `origin/main` `27affa18`. The slice implements the offline fixture/contract foundation and feature-id split without provider judges, private fixtures, DB migrations, prompt activation, daily reports, or EFF-022 product-rule changes.
- **2026-06-16** - PR #188 merged as `2e1c693` after Wilson approved the merge and exact-head GitHub checks passed at PR head `b865864`. Phase 3 continues from this merged harness foundation toward the next bounded slice.
- **2026-06-16** - Started the first public synthetic fixture slice on `codex/init-004-public-fixtures` from fresh `origin/main` `34f3613`. The slice adds four synthetic public fixtures and expected deterministic failure handling without provider judges, private fixture ingestion, prompt changes, DB writes, or product-rule changes.
- **2026-06-17** - PR #190 merged as `0027908` after Wilson approved the merge and the required approving-review branch-protection gate was removed because Wilson's merge instruction in the working thread is the accepted review authority for this workflow. Strict required status checks remain on `main`. The merged slice adds public synthetic fixtures, expected deterministic failure handling, and the lightweight `Value claim` / `Evidence` / `Evidence limits` verification standard.
- **2026-06-17** - Opened draft PR #198 on `codex/init-004-phase-3-user-expectation-fixtures` from fresh `origin/main` `3fac3c0`. The bounded milestone adds three public synthetic cooking-step user-expectation fixtures from the accepted Arize/Wilson-label target set and defers cuisine-fit fixtures because the EFF-022 fallback rule remains unresolved.
- **2026-06-17** - Rebased PR #198 onto current `origin/main` `7250016` after PR #197 merged, preserving the same bounded fixture scope.
- **2026-06-18** - PR #198 merged as `9588459` after Wilson approved merge and exact-head local/GitHub checks passed at PR head `7271094`. The merged Phase 3 milestone protects the public eval corpus against cooking-step outputs that are structurally valid but unsafe for raw proteins, mismatched to skill, dependent on unlisted equipment, or missing practical sequence guidance; it leaves providers, prompts, DB/schema, private fixture ingestion, daily reports, and EFF-022 cuisine fallback unchanged.
- **2026-06-18** - Started `codex/init-004-fixture-validation-script` from fresh `origin/main` `0462db2`. The bounded milestone adds a dedicated public fixture validation script so future PRs can cite `npm run eval:fixtures` as fixture-corpus evidence without starting provider judges, private fixture ingestion, prompt changes, DB/schema work, daily reports, or EFF-022 cuisine fallback decisions.
- **2026-06-18** - PR #200 merged as `bb5604f` after Wilson approved merge and exact-head local/GitHub checks passed at PR head `da12f44`. The merged Phase 3 milestone adds the dedicated public fixture validation script and keeps providers, prompts, DB/schema, private fixture ingestion, daily reports, and EFF-022 cuisine fallback unchanged.
- **2026-06-19** - Started [PR #205](https://github.com/wmishak404/laica/pull/205) on `codex/init-004-pantry-expectation-fixtures` from fresh `origin/main` `7274a62`. The bounded milestone adds public synthetic pantry-recipe user-expectation fixtures for dietary compliance, pantry grounding / optional extras, and beginner skill fit without changing prompts, providers, schema, private fixtures, daily reports, or EFF-022 cuisine fallback behavior.
- **2026-06-19** - After Wilson instructed that [PR #191](https://github.com/wmishak404/laica/pull/191) merge first, PR #191 merged as `104ee0c`, PR #205 was rebased onto that updated `origin/main`, and PR #205 merged as `762488e` at 2026-06-20T01:21:23Z. The merged slice kept the same offline fixture/docs/test scope and left providers, prompts, DB/schema, private fixture ingestion, daily reports, and EFF-022 cuisine fallback unchanged.
- **2026-06-22** - Started `codex/init-004-eval-provenance` from fresh `origin/main` `ecf1cdb` after triage found no active INIT-004 PR. The bounded milestone implements criteria-aware eval queue selection and logs `/api/recipes/pantry` outputs as `pantry_recipes` while preserving the reused `recipe_suggestions` prompt source and prompt-version provenance. Cuisine-fit fixtures and fallback behavior remain deferred to EFF-022/product-rule decisions.
- **2026-06-22** - After unrelated PR #218 merged, PR #219 was rebased onto fresh `origin/main` `659b361` before Wilson's merge instruction could be applied. This preserved the same eval-provenance scope and avoided merging a stale `BEHIND` head.
- **2026-06-22** - PR #219 merged as `68985f1` after Wilson approved the merge and exact-head local/GitHub checks passed at final PR head `fbb01d5`. Phase 3 continues from this merged eval-provenance slice toward the next bounded harness milestone.
- **2026-06-22** - PR #228 merged as `7c24fef` after Wilson approved the merge and exact-head GitHub checks passed at final PR head `28d0e04`. The docs-only slice records generated recipe-image quality calibration as future Phase 7 inside INIT-004, while keeping current Phase 3 focused on recipe-text eval harness work until the human-review queue and calibration-report workflow exist.
- **2026-06-23** - Opened [PR #232](https://github.com/wmishak404/laica/pull/232) from `codex/init-004-eval-summary` after triage found open PR #220 was active Effort work and no active INIT-004 PR existed. The bounded milestone adds pending queue eligibility summaries and completed eval feature/prompt-version aggregates without provider judges, private fixtures, prompt changes, DB/schema changes, user-facing UI, daily reports, or EFF-022 cuisine fallback decisions.
- **2026-06-29** - After `origin/main` moved to `11b1847`, PR #232 was rebased to final head `2c78813`, exact-head local/GitHub checks passed, and Wilson approved merge. PR #232 merged as `5b8e7ed`, making eval queue/reporting summaries and the clearer `chef_it_up_suggestions` / `slop_bowl_suggestions` taxonomy available on `main` without changing prompts, provider behavior, schema, user-facing UI, daily reports, or EFF-022 cuisine fallback decisions.
