# INIT-004 - AI Output Quality Evals & Prompt Improvement

**Status:** In Progress
**Owner:** Wilson / Codex / Claude / Replit
**Created:** 2026-06-09
**Current phase:** Phase 3 - Eval harness
**Active PR:** Pending for Phase 3 harness foundation
**Active branch:** `codex/init-004-harness-foundation`

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

The first Phase 3 harness foundation slice is in progress on `codex/init-004-harness-foundation` from fresh `origin/main` `27affa18cb535b4562be5c2535a6ad4fefc5b26b`. The slice adds canonical eval-vs-prompt feature IDs, first-class `pantry_recipes` and `slop_bowl` eval criteria, public fixture schema/loading, deterministic contract checks for recipe suggestions, Slop Bowl, and cooking steps, public-fixture privacy checks, and a source-level cross-user bleed guard. It intentionally does not run provider judges, ingest private fixtures, change prompts, add DB migrations, activate prompt versions, start daily reports, or resolve EFF-022 cuisine fallback behavior.

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


## Phase 1 Surface/Data Audit Findings

The 2026-06-10 audit inspected `server/openai.ts`, `server/evaluator.ts`, `server/eval-criteria.ts`, `server/admin-routes.ts`, `server/prompt-manager.ts`, `shared/schema.ts`, `client/src/lib/openai.ts`, `client/src/components/cooking/meal-planning.tsx`, and the current eval intake records.

### Current generation/eval surface map

| Surface | Current route / caller | Feature ids now in use | Current response shape | Audit finding |
|---|---|---|---|---|
| General recipe suggestions | `POST /api/recipes/suggestions` -> `getRecipeSuggestions`; older `client/src/pages/recipes.tsx` also calls `fetchRecipeSuggestions` | `recipe_suggestions` in `ai_interactions`, prompt versions, eval criteria, and error telemetry | JSON object normalized by `normalizeRecipeSuggestionsResponse`; expected `recipes[]` when current UI consumes it | Existing eval criteria can reach this feature id, but the old seed export used a legacy one-recipe shape. Future fixtures must validate the current `recipes[]` contract. |
| Chef It Up / pantry recipes | `MealPlanning` -> `fetchPantryRecipes` -> `POST /api/recipes/pantry` -> `getRecipeSuggestions` | Error telemetry uses `pantry_recipes`; interaction logging still stores `recipe_suggestions` because the route reuses `getRecipeSuggestions` | Client requires exactly three recipes under `recipes[]` and maps `imageUrl`/`image_url`, `pantryIngredientsUsed`, `additionalIngredientsNeeded`, `cookTime`, `difficulty`, `cuisine`, and `isFusion` | Phase 2 accepted `pantry_recipes` as a first-class eval/reporting feature while preserving prompt reuse. Phase 3 should separate eval feature identity from prompt feature identity. |
| Slop Bowl | `POST /api/recipes/slop-bowl` -> `getSlopBowlRecipe` | `slop_bowl` in interaction logging and error telemetry; no eval criteria or prompt-version admin support | Strict `slopBowlRecipeSchema`; API wraps one object under `{ recipe }` | Slop Bowl requires feature-type changes before it can enter the eval harness: `FeatureType`, `EVAL_CRITERIA`, prompt admin schemas, prompt manager typing if DB overrides are desired, and current-shape deterministic checks. |
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
| Phase 3 - Eval harness | In progress | `codex/init-004-harness-foundation` | First foundation slice adds eval-vs-prompt feature IDs, public fixture schema/loading, deterministic contract checks, privacy/leak checks, and cross-user bleed guard; excludes provider judges, private fixtures, DB migrations, prompt activation, daily reports, and EFF-022 product-rule changes |
| Phase 4 - Human review and calibration | Planned | TBD | Wilson-first review workflow; calculate TPR/TNR per judge; mark uncalibrated metrics clearly |
| Phase 5 - Daily reporting automation | Planned | TBD | Daily report vehicle, artifact storage, and metric summary without dashboard UX |
| Phase 6 - Prompt candidate workflow | Planned | TBD | Failure clusters generate inactive prompt candidates and regression comparisons; no automatic production activation |
| Phase 7 - Closeout | Planned | TBD | Durable metric definitions, reporting cadence, prompt workflow, validation evidence, and remaining product decisions recorded |

## PRs And Branches

| PR | Status | Branch | Validation / merge signal |
|---|---|---|---|
| [#160](https://github.com/wmishak404/laica/pull/160) | Merged as `680e26e` | `codex/init-004-output-evals` | Docs-only filing and durable eval evidence registry. Marked ready, checks passed after unit rerun; no Replit validation required. |
| [#166](https://github.com/wmishak404/laica/pull/166) | Merged as `3338611` | `codex/init-004-phase-1-audit` | Docs-only Phase 1 audit. Local `git diff --check`, `npm ci`, `npm run check`, and `npm run build` passed; GitHub unit, `e2e_guest_smoke`, `npm-audit`, TruffleHog PR, and CodeQL passed after the draft was marked ready; no Replit validation required. |
| [#181](https://github.com/wmishak404/laica/pull/181) | Merged as `5c410e3` | `codex/init-004-phase-2-spec` | Docs-only Phase 2 spec. GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL passed at PR head `d9a17d7`; no Replit validation required. |
| Pending | In progress | `codex/init-004-harness-foundation` | First Phase 3 harness foundation slice; local validation and GitHub exact-head checks pending before merge-readiness can be claimed. |

## Validation State

Phase 0 was docs-only. No local build, Replit preview, DB push, or runtime validation was required for the filing itself. PR #160 passed `unit` on rerun, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL before merge.

Phase 1 was docs-only. No Replit preview, DB push, eval run, or runtime validation was required because it changed only planning/audit docs. PR #166 passed local `git diff --check`, `npm ci`, `npm run check`, and `npm run build`; after the draft was marked ready, GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL passed before merge.

Phase 2 was docs-only. No runtime, schema, prompt, admin route, provider, UI, deployment, fixture-data, or eval-run behavior changed. PR #181 passed local markdown diff checks and GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL at final PR head `d9a17d7` before Wilson approved the merge. The squash merge commit is `5c410e3`.

Phase 3 first harness foundation slice is a local/offline implementation change. It adds fixture validation and feature typing but does not call OpenAI, query private fixture paths, write eval data, change DB schema, change prompts, or expose new product UI. Local validation and exact-head GitHub `unit` / `e2e_guest_smoke` / security checks are required before merge-readiness. Human Replit validation is not expected before merge because no provider, auth, schema, deployment, or user-facing runtime behavior changes.

Future implementation phases that use eval results as merge evidence must follow [Testing and Acceptance Workflow](../docs/workflows/testing-and-acceptance.md). Future DB or production-sampling work must coordinate with [EFF-010](../efforts/effort-010-local-db-schema-strategy.md) and Replit as the primary runtime.

## Current Resume Point

Complete review/validation for `codex/init-004-harness-foundation`. After this first Phase 3 foundation slice lands, the next bounded Phase 3 candidates are:

1. Add the first public synthetic fixtures from the accepted Wilson-label target set.
2. Wire deterministic fixture validation into a script or routine unit lane that can be cited by future PRs.
3. Add criteria-aware queue behavior and logging provenance work for `pantry_recipes`, while preserving prompt reuse.
4. Start narrow LLM-judge work only after fixture labels and deterministic checks exist.

Do not start live-provider judge runs, private fixture ingestion, DB migrations, prompt activation, daily reports, or EFF-022 cuisine-fallback product changes without a separate documented milestone and any required Wilson decision.

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
- **2026-06-16** - Phase 3 foundation implementation started on `codex/init-004-harness-foundation` from fresh `origin/main` `27affa18`. The slice implements the offline fixture/contract foundation and feature-id split without provider judges, private fixtures, DB migrations, prompt activation, daily reports, or EFF-022 product-rule changes.
