# INIT-004 - AI Output Quality Evals & Prompt Improvement

**Status:** Planning
**Owner:** Wilson / Codex / Claude / Replit
**Created:** 2026-06-09
**Current phase:** Phase 1 - Surface and data audit (next)
**Active PR:** None
**Active branch:** None

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

Phase 0 merged in [PR #160](https://github.com/wmishak404/laica/pull/160) as `680e26e` on 2026-06-09. Wilson plans to continue INIT-002 implementation first, then resume INIT-004 implementation from Phase 1.

The seed inputs are:

- Wilson's 2026-06-09 direction to create a standalone INIT-004 rather than folding the work into INIT-002.
- Durable eval discipline now lives in [docs/workflows/evaluations.md](../docs/workflows/evaluations.md); seed records and practical eval artifacts live in [docs/evals/](../docs/evals/README.md), not inside this INIT.
- Good/bad examples already embedded in `server/openai.ts` prompt text from earlier open coding.
- [EFF-022](../efforts/effort-022-cross-cuisine-recommendation-prompts.md) negative cuisine-fit fixtures for Chinese, Indian, and Thai requests under constrained pantry conditions.

## Source Docs

- [AI Eval Evidence README](../docs/evals/README.md) - practical home for eval registry, intake records, fixture candidates, report references, and future harness notes after INIT closeout
- [Evaluation Workflow](../docs/workflows/evaluations.md) - canonical operating model for running, measuring, reporting, gating, and acting on evals
- [AI Eval Intake Registry](../docs/evals/registry.md) - durable index of eval runs, open-coding imports, judge runs, human review batches, and daily reports
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
| Max-time failures | Both seed records | Add deterministic max-time checks and clarify that rounding cannot exceed the user's max unless Wilson accepts an explicit product exception. |
| Judge calibration gap | Both seed records | Build a Wilson-labeled gold set and report TPR/TNR before trusting LLM-judge pass rates. |
| Food safety, proficiency, and equipment misses | Arize seed | Add rubric labels and judge checks for raw-protein safety, beginner/intermediate step fit, and unlisted equipment assumptions. |
| Cuisine/pantry tradeoff | Arize seed and [EFF-022](../efforts/effort-022-cross-cuisine-recommendation-prompts.md) | Separate pantry-first usefulness from cuisine authenticity so prompt fixes do not over-correct into shopping-list behavior. |

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
| Phase 1 - Surface and data audit | Next | TBD | Inventory generation surfaces, prompts, DB prompt overrides, eval criteria, response schemas, and legacy export mismatch |
| Phase 2 - Rubric and dataset spec | Planned | TBD | Define criterion-level rubric, label schema, fixture format, privacy posture, and first Wilson-labeled gold set |
| Phase 3 - Eval harness | Planned | TBD | Add deterministic contract checks, narrow LLM-judge checks, feature taxonomy coverage including Slop Bowl, and evidence artifacts |
| Phase 4 - Human review and calibration | Planned | TBD | Wilson-first review workflow; calculate TPR/TNR per judge; mark uncalibrated metrics clearly |
| Phase 5 - Daily reporting automation | Planned | TBD | Daily report vehicle, artifact storage, and metric summary without dashboard UX |
| Phase 6 - Prompt candidate workflow | Planned | TBD | Failure clusters generate inactive prompt candidates and regression comparisons; no automatic production activation |
| Phase 7 - Closeout | Planned | TBD | Durable metric definitions, reporting cadence, prompt workflow, validation evidence, and remaining product decisions recorded |

## PRs And Branches

| PR | Status | Branch | Validation / merge signal |
|---|---|---|---|
| [#160](https://github.com/wmishak404/laica/pull/160) | Merged as `680e26e` | `codex/init-004-output-evals` | Docs-only filing and durable eval evidence registry. Marked ready, checks passed after unit rerun; no Replit validation required. |

## Validation State

Phase 0 was docs-only. No local build, Replit preview, DB push, or runtime validation was required for the filing itself. PR #160 passed `unit` on rerun, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL before merge.

Future implementation phases that use eval results as merge evidence must follow [Testing and Acceptance Workflow](../docs/workflows/testing-and-acceptance.md). Future DB or production-sampling work must coordinate with [EFF-010](../efforts/effort-010-local-db-schema-strategy.md) and Replit as the primary runtime.

## Current Resume Point

When Wilson is ready to resume INIT-004 after the near-term INIT-002 implementation work, the next agent should start Phase 1 from fresh `origin/main`:

1. Read this INIT, the [AI Eval Intake Registry](../docs/evals/registry.md), [INIT-002](INIT-002-ai-error-telemetry.md), [EFF-022](../efforts/effort-022-cross-cuisine-recommendation-prompts.md), [PD-008](../product-decisions/pd-008-optional-context-and-local-validation-boundaries.md), and [Testing and Acceptance Workflow](../docs/workflows/testing-and-acceptance.md).
2. Audit current output generation paths and response schemas in `server/openai.ts`, `server/evaluator.ts`, `server/eval-criteria.ts`, `server/admin-routes.ts`, `shared/schema.ts`, and the relevant client request packaging.
3. Re-read the durable OpenAI Platform and Arize intake records in `docs/evals/intakes/`; consult local raw exports only if needed, and do not commit raw exports or trace-level tables without a privacy/source decision.
4. Proceed with a small Wilson-first seed set that includes both positive and negative Arize examples, EFF-022 cuisine-fit failures, and legacy OpenAI Platform export cases.
5. Produce a Phase 1 handoff that says whether Slop Bowl requires feature-type changes, whether current eval criteria match current response shapes, which deterministic checks should be implemented before LLM judges, and how Arize clusters map into the first label schema.

## Chronology

- **2026-06-09** - Wilson asked how to make quantitative evals for recipe generation, recipe recommendation, and cooking-step outputs; emphasized true positive rate, human review, bad/good examples, prompt iteration, and daily reporting/dashboards.
- **2026-06-09** - Wilson provided an OpenAI Platform eval export and clarified that examples were also added to `server/openai.ts` from earlier eval/open-coding work.
- **2026-06-09** - Wilson decided this should be filed as a standalone INIT-004 rather than folded into INIT-002. Separate ownership keeps operational error telemetry in INIT-002 and output-quality evals/prompt improvement in INIT-004.
- **2026-06-09** - Wilson provided Arize open-coding seed data. The notes added initial taxonomy signal for food safety/doneness, proficiency fit, equipment availability, cook-time adherence, cuisine/pantry tradeoff, and output extraction/format fragility.
- **2026-06-09** - Wilson clarified that eval records need a durable home beyond INIT closeout. Created [docs/evals/](../docs/evals/README.md), moved the normalized OpenAI Platform and Arize seed intake records there, and kept INIT-004 as the active hub that links to the durable registry.
- **2026-06-09** - Wilson asked to move eval discipline out of INIT-004 because the INIT should stay focused on what needs to be built. Created the durable [Evaluation Workflow](../docs/workflows/evaluations.md), kept `docs/evals/` as the practical registry/intake home, trimmed INIT-004 back to build context, and updated stale PR placeholders to PR #160.
- **2026-06-09** - PR #160 merged as `680e26e` after being marked ready and passing CI on rerun. Phase 0 is closed; Phase 1 is the next INIT-004 work, after Wilson's near-term INIT-002 implementation focus.
