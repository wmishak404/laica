# INIT-004 - AI Output Quality Evals & Prompt Improvement

**Status:** Planning
**Owner:** Wilson / Codex / Claude / Replit
**Created:** 2026-06-09
**Current phase:** Phase 0 - Source-of-truth filing and seed-data routing
**Active PR:** None
**Active branch:** `codex/init-004-output-evals`

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

Phase 0 is a docs-only filing step. Wilson will provide Arize open-coding data later. Until then, the seed inputs are:

- Wilson's 2026-06-09 direction to create a standalone INIT-004 rather than folding the work into INIT-002.
- Wilson-provided eval course notes PDF, read locally and summarized below.
- Wilson-provided OpenAI Platform eval export from a prior run. The user described the run as June 4, 2025; the file name and run export timestamp indicate 2026-06-04, so future work should preserve exact dates instead of relying on the remembered year.
- Good/bad examples already embedded in `server/openai.ts` prompt text from earlier open coding.
- [EFF-022](../efforts/effort-022-cross-cuisine-recommendation-prompts.md) negative cuisine-fit fixtures for Chinese, Indian, and Thai requests under constrained pantry conditions.

## Source Docs

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

## Assets And Seed Data

| Asset | Status | Phase 0 signal |
|---|---|---|
| Wilson eval course notes PDF | Local artifact, not committed | Key workflow: Analyze -> Measure -> Improve; start with real-trace open coding; build a failure taxonomy; use narrow binary judges; calibrate judges against human labels using true positive and true negative rates; report uncertainty |
| OpenAI Platform JSONL export | Local artifact, not committed | 25 eval items from `evalrun_685361470e9c819195a768074ef126cd`; generated model `gpt-4.1-2025-04-14`; grader model `o3-mini-2025-01-31`; 149/150 grader passes; one max-time failure; at least one invalid JSON output still passed judge checks |
| Arize open-coding data | Pending Wilson | Should seed taxonomy/rubric once provided |
| `server/openai.ts` examples | In repo | Existing prompt examples came from earlier eval/open-coding work and need a cleaner source-of-truth link |
| EFF-022 fixtures | In repo | Negative examples where explicit Chinese/Indian/Thai cuisine requests were weakly honored under constrained pantry conditions |

Do not commit raw local exports or course-note files without a separate privacy/source decision. The INIT should carry only summarized findings, fixture identities, and paths in handoffs when needed for same-machine agent continuity.

## Eval Scope

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

## Initial Quality Criteria

The first rubric should be built from real traces and human review, then split into binary checks that can be measured independently. Initial criteria:

| Criterion family | What to measure | Example pass/fail shape |
|---|---|---|
| Structure and contract | Valid JSON, schema conformity, required fields, exactly the expected number of suggestions, parseable cooking-step arrays | Fail if JSON has comments, missing `recipes[]`, malformed step fields, or a response shape the UI cannot render |
| User constraints | Cuisine, max cook time, skill level, dietary restrictions, allergies, nutrition preferences, meal type | Fail if max time is exceeded, dietary restriction conflicts, or chosen cuisine is silently ignored |
| Pantry grounding | Uses available pantry items, treats optional extras as optional, avoids invented required ingredients, explains constrained fallbacks when needed | Fail if the recipe cannot be cooked without non-pantry required ingredients |
| Cuisine fit | Returned options visibly honor selected cuisine, or transparently state a pantry-flexible fallback when pantry evidence is too weak | Fail if only one of three options weakly acknowledges the selected cuisine without explaining the constraint |
| Recipe usefulness | Coherent dish, clear name, practical preparation, good ranking/diversity across suggestions, appropriate substitutions | Fail if suggestions are generic, duplicated, incoherent, or culturally overclaim authenticity |
| Cooking steps | Steps align with the accepted recipe, equipment, ingredients, skill, time, and safe sequencing | Fail if steps introduce unavailable ingredients/equipment or omit key safety/cooking actions |
| Food safety | Safe handling/cook guidance for meat, eggs, leftovers, allergens, and storage where relevant | Fail if raw sausage/meat guidance is unsafe or allergen conflicts are ignored |

Each family can have deterministic checks, human labels, and LLM-as-judge checks. Use deterministic checks first where possible.

## Measurement Policy

Use the course workflow as the measurement standard:

1. Analyze real outputs first through open coding. Name failure modes before writing metrics.
2. Create human-labeled gold examples. Wilson-first seed labels are acceptable for v1; add more reviewers only when the rubric stabilizes.
3. Turn each failure mode into a narrow binary criterion. Avoid broad single-score judges.
4. Calibrate each automated judge against human labels:
   - Positive means a human-labeled pass for that criterion.
   - True positive rate means the judge marks a human-pass item as pass.
   - True negative rate means the judge marks a human-fail item as fail.
5. Only use corrected pass-rate estimates after enough calibration labels exist. For a binary judge, estimate true pass rate from observed judge pass rate with `(observed_pass_rate + TNR - 1) / (TPR + TNR - 1)` when the denominator is valid, and report uncertainty rather than a false exact number.
6. Use bootstrap confidence intervals or another documented uncertainty method for reported rates once the sample is large enough.
7. Treat CI/golden evals as regression checks, not representative production quality estimates.

Uncalibrated judge results may be useful for triage, but must be labeled as uncalibrated and not used as product-quality truth.

## Human Review Loop

V1 review flow:

1. Seed the rubric with Wilson-labeled examples from:
   - the OpenAI Platform export,
   - examples already embedded in prompts,
   - EFF-022 cuisine-fit failures,
   - a small current production or staged sample once privacy handling is explicit.
2. Label each example at criterion level, not only "good" or "bad."
3. Record why failures happened: prompt ambiguity, missing deterministic validation, stale DB prompt, pantry too constrained, response shape drift, model over-anchoring, unsafe recipe, or product copy/fallback gap.
4. Use failure clusters to create eval fixtures and prompt-candidate briefs.
5. Keep unresolved examples visible until each has either a prompt fix, product fallback decision, deterministic guard, or accepted limitation.

Arize open-coding data should be imported as taxonomy evidence when Wilson provides it. Do not overwrite the initial taxonomy silently; append a dated section or handoff that explains what changed.

## Reporting Vehicle

V1 reporting should be a daily automation, not an admin dashboard:

- Run a small stable golden/regression suite daily.
- Sample recent eligible production/staged `ai_interactions` separately for monitoring when privacy handling is approved.
- Produce a compact Markdown or JSON report with criterion pass rates, calibrated/uncalibrated label, sample size, confidence interval when available, top failure modes, exemplar ids, prompt/model versions, and negative scope.
- Keep raw prompts/user-identifying data out of the report unless a later privacy decision explicitly permits a redacted field.
- Dashboard work is deferred until the metric definitions are stable enough that a UI would not create false confidence.

The exact scheduler is a Phase 4 decision. Replit is the primary runtime and deployment environment; a GitHub Action may be acceptable for repo-only golden fixtures, but any production DB sampling must respect Replit/secret ownership and EFF-010 database workflow.

## Prompt Improvement Policy

INIT-004 can recommend prompt improvements, but must not auto-activate them in production without Wilson approval.

Prompt improvement loop:

1. Cluster bad examples by criterion/failure mode.
2. Create a prompt-candidate brief with source examples, intended fix, expected risks, and affected surfaces.
3. Run the candidate against the gold set, current regression fixtures, and relevant fresh examples.
4. Compare to baseline using criterion-level metrics and failure examples, not only aggregate score.
5. Write inactive prompt versions or prompt diffs for review.
6. Activate only after Wilson approval and any required Replit prompt-version update.

This policy is especially important because active database-backed prompts may override code fallback prompts.

## Phase Progress

| Phase | Status | PR / branch | Current signal |
|---|---|---|---|
| Phase 0 - INIT filing | In progress | `codex/init-004-output-evals` | Create INIT hub, registry/active-list links, INIT-002 boundary note, EFF-022 link, and handoff |
| Phase 1 - Surface and data audit | Planned | TBD | Inventory generation surfaces, prompts, DB prompt overrides, eval criteria, response schemas, and legacy export mismatch |
| Phase 2 - Rubric and dataset spec | Planned | TBD | Define criterion-level rubric, label schema, fixture format, privacy posture, and first Wilson-labeled gold set |
| Phase 3 - Eval harness | Planned | TBD | Add deterministic contract checks, narrow LLM-judge checks, feature taxonomy coverage including Slop Bowl, and evidence artifacts |
| Phase 4 - Human review and calibration | Planned | TBD | Wilson-first review workflow; calculate TPR/TNR per judge; mark uncalibrated metrics clearly |
| Phase 5 - Daily reporting automation | Planned | TBD | Daily report vehicle, artifact storage, and metric summary without dashboard UX |
| Phase 6 - Prompt candidate workflow | Planned | TBD | Failure clusters generate inactive prompt candidates and regression comparisons; no automatic production activation |
| Phase 7 - Closeout | Planned | TBD | Durable metric definitions, reporting cadence, prompt workflow, validation evidence, and remaining product decisions recorded |

## PRs And Branches

| PR | Status | Branch | Validation / merge signal |
|---|---|---|---|
| TBD | Local docs branch | `codex/init-004-output-evals` | Docs-only filing. No Replit validation required unless implementation is added. |

## Validation State

Phase 0 is docs-only. No local build, Replit preview, DB push, or runtime validation is required for the filing itself.

Future implementation phases that use eval results as merge evidence must follow [Testing and Acceptance Workflow](../docs/workflows/testing-and-acceptance.md). Future DB or production-sampling work must coordinate with [EFF-010](../efforts/effort-010-local-db-schema-strategy.md) and Replit as the primary runtime.

## Current Resume Point

After Phase 0 merges, the next agent should start Phase 1 from fresh `origin/main`:

1. Read this INIT, [INIT-002](INIT-002-ai-error-telemetry.md), [EFF-022](../efforts/effort-022-cross-cuisine-recommendation-prompts.md), [PD-008](../product-decisions/pd-008-optional-context-and-local-validation-boundaries.md), and [Testing and Acceptance Workflow](../docs/workflows/testing-and-acceptance.md).
2. Audit current output generation paths and response schemas in `server/openai.ts`, `server/evaluator.ts`, `server/eval-criteria.ts`, `server/admin-routes.ts`, `shared/schema.ts`, and the relevant client request packaging.
3. Re-read the local OpenAI Platform export and summarize fixture candidates without committing the raw file.
4. Wait for Wilson's Arize open-coding data if Phase 2 taxonomy work depends on it; otherwise proceed with a small Wilson-first seed set and record the data gap.
5. Produce a Phase 1 handoff that says whether Slop Bowl requires feature-type changes, whether current eval criteria match current response shapes, and which deterministic checks should be implemented before LLM judges.

## Chronology

- **2026-06-09** - Wilson asked how to make quantitative evals for recipe generation, recipe recommendation, and cooking-step outputs; emphasized true positive rate, human review, bad/good examples, prompt iteration, and daily reporting/dashboards.
- **2026-06-09** - Wilson provided an OpenAI Platform eval export and clarified that examples were also added to `server/openai.ts` from earlier eval/open-coding work. Arize open-coding data is pending.
- **2026-06-09** - Wilson decided this should be filed as a standalone INIT-004 rather than folded into INIT-002. Separate ownership keeps operational error telemetry in INIT-002 and output-quality evals/prompt improvement in INIT-004.
