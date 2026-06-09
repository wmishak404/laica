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

Phase 0 is a docs-only filing step. Wilson provided Arize open-coding data after the initial filing. The seed inputs are:

- Wilson's 2026-06-09 direction to create a standalone INIT-004 rather than folding the work into INIT-002.
- Wilson-provided eval course notes PDF, read locally and summarized below.
- Wilson-provided OpenAI Platform eval export from a prior run. The user described the run as June 4, 2025; the file name and run export timestamp indicate 2026-06-04, so future work should preserve exact dates instead of relying on the remembered year.
- Wilson-provided Arize prompt, prompt template, dataset input field list, and open-coding notes from 2025-11-07.
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
| Arize open-coding data | Provided in Wilson chat on 2026-06-09, not committed raw | Historical prompt asked for pantry-first Markdown recipe suggestions from pantry/cuisine/proficiency/time/diet/nutrition/equipment fields; notes include 18 coding rows across 16 unique examples from 2025-11-07 |
| `server/openai.ts` examples | In repo | Existing prompt examples came from earlier eval/open-coding work and need a cleaner source-of-truth link |
| EFF-022 fixtures | In repo | Negative examples where explicit Chinese/Indian/Thai cuisine requests were weakly honored under constrained pantry conditions |

Do not commit raw local exports or course-note files without a separate privacy/source decision. The INIT should carry only summarized findings, fixture identities, and paths in handoffs when needed for same-machine agent continuity.

## Eval Intake Index

This table is the durable index of eval runs, open-coding imports, and other quality-evidence intakes known to INIT-004. Future eval data should add one row here and then use the [Eval Intake Record Structure](#eval-intake-record-structure) for details when the intake changes rubric, fixtures, metrics, reporting, or prompt workflow.

| Intake id | Source | Source date | Provided / imported | Surface | Sample size | Raw artifact handling | Current status | Next action |
|---|---|---|---|---|---|---|---|---|
| `openai-platform-evalrun-685361470e9c819195a768074ef126cd` | OpenAI Platform eval export | File timestamp 2026-06-04; user remembered June 4, 2025 | 2026-06-09 | Legacy recipe suggestion eval | 25 items; 150 criterion checks | Local JSONL only; summarized in INIT/handoff; not committed | Seed run indexed; 149/150 grader passes; one max-time failure; one invalid JSON case still passed LLM judges | Phase 1 should extract fixture candidates and deterministic contract checks |
| `arize-open-coding-2025-11-07` | Arize open-coding notes | 2025-11-07 note timestamps | 2026-06-09 | Legacy pantry-first recipe suggestions | 18 notes across 16 unique examples | Raw prompt/table provided in chat; summarized in INIT/handoff; not committed | Seed intake indexed; clusters identified for food safety, proficiency fit, equipment, time, cuisine/pantry tradeoff, and format fragility | Phase 1 should map clusters into label schema and fixture candidates |

## Arize Open-Coding Seed Findings

Wilson's Arize notes should seed the first taxonomy, not be treated as the final rubric. The historical prompt differs from the current app in at least one important way: it asked for Markdown output with recipe fields, while current routes often require structured JSON. Use the Arize data for quality/failure-mode discovery and revalidate against current response contracts during Phase 1.

Arize dataset inputs:

- `Pantry_Ingredients`
- `Cuisine_Preferences`
- `Proficiency`
- `Max_Cook_Time`
- `Dietary_Restrictions`
- `Nutritional_Preferences`
- `Kitchen_Equipment`

Arize open-coding notes summary:

- 18 notes across 16 unique dataset examples.
- 9 notes were explicit "No issues" or equivalent positive labels.
- Issue notes clustered around food safety/doneness, proficiency fit, equipment availability, cook-time adherence, cuisine/pantry tradeoff, and output extraction/format fragility.

| Cluster | Arize evidence | INIT-004 rubric implication |
|---|---|---|
| Food safety and doneness | Beef instructions said "heated through" rather than cooked until safe; chicken instructions relied on time/medium heat rather than checking doneness; beginner chicken prep needed more raw-handling guidance | Add explicit safety checks for raw meat/poultry/eggs, doneness cues, cross-contamination handling, and beginner-appropriate safety detail |
| Technique quality by proficiency | Intermediate chicken recipe should warn against overcooking breast; beginner Vietnamese fried rice steps may be too complex | Score whether steps match proficiency, including how much explanation, sequencing, and technique nuance the user needs |
| Equipment availability | Recipe referenced a saucepan lid even though the equipment list did not include one; reviewer suggested a plate or similar cover alternative | Add deterministic/eval checks that steps only require listed equipment or give safe common alternatives |
| Max cook time | One vegan Vietnamese/Mexican example returned 30 minutes when user max was 25 minutes | Define how max-time adherence works when prompts ask for 15-minute interval rounding; absent an explicit product exception, fail outputs over the user's maximum |
| Cuisine and pantry tradeoff | Korean/Japanese preference used olive oil because the pantry only had olive oil; reviewer noted sesame oil would be more typical but understood the beginner/pantry constraint | Rubric should distinguish acceptable pantry-first adaptation from cuisine mismatch, and should prefer honest adaptation language when pantry limits authenticity |
| Output structure/extraction | Some recipe-title extraction appeared as ```markdown because the historical prompt asked Markdown | Current harness should include parse/schema checks and not rely on Markdown extraction as the product contract |

These findings reinforce that the first rubric should include both positive examples and failure examples. A useful pass set is not only "no issues"; it should preserve why constrained-pantry examples were acceptable so future prompts do not over-correct into unnecessary shopping lists.

## Eval Intake Record Structure

Future eval imports, open-coding notes, judge runs, or daily reports should use the same durable shape so agents can compare evidence without replaying chat or reverse-engineering spreadsheets.

Where to file:

- Add every future run/import as a row in the [Eval Intake Index](#eval-intake-index), even when the detailed intake record lives in a handoff or later phase file.
- Dated source/rubric learnings that affect INIT-004 should be appended to this INIT or to a phase-specific INIT-004 handoff, then linked from this INIT.
- Point-in-time command output, raw run ids, local artifact paths, and PR branch status belong in PR descriptions or `docs/handoffs/`.
- Cuisine-fit product decisions still need [EFF-022](../efforts/effort-022-cross-cuisine-recommendation-prompts.md) when they change cross-cuisine behavior, with INIT-004 linked as the measurement home.
- Do not create a standalone Effort for eval evidence unless the follow-up is outside INIT-004 and not owned by a feature phase, PD, ADR, or workflow doc.
- Do not commit raw trace tables, prompts containing user-identifying data, images, audio, secrets, or full local exports without a durable privacy/source decision.

Use this template for future eval intake:

```markdown
## YYYY-MM-DD - <source/run name> eval intake

**Source:** Arize / OpenAI Platform / production sample / staged sample / golden suite / manual review
**Owner / reviewer:** <human or agent>
**Raw artifact handling:** <not committed / committed fixture path / external dashboard link / local path in handoff>
**Privacy posture:** <redacted summary / synthetic fixture / production sample with approved fields / pending decision>
**Related surfaces:** recipe suggestions / pantry recipes / Slop Bowl / cooking steps / other
**Prompt/model/evaluator versions:** <prompt id or source, model, judge prompt/model, app commit when relevant>
**Input schema:** <field list or fixture schema>
**Sample size:** <items, examples, labels, criteria>
**Positive definition:** <what counts as a human pass for this intake>

### Source Summary

<Short description of what was run, what the prompt asked for, and how this differs from current product contracts.>

### Metrics Summary

| Metric | Value | Calibration status | Notes |
|---|---|---|---|
| Observed pass rate |  | calibrated / uncalibrated / deterministic |  |
| TPR |  | n/a until human labels exist |  |
| TNR |  | n/a until human labels exist |  |
| Corrected pass rate |  | n/a until TPR/TNR valid |  |
| Confidence interval |  | n/a / bootstrap / other |  |

### Failure / Learning Clusters

| Cluster | Evidence | Criterion family | Proposed deterministic check | Proposed judge or human label | Product / prompt implication |
|---|---|---|---|---|---|
|  |  |  |  |  |  |

### Positive Examples Worth Preserving

| Example | Why it passed | Regression risk if over-corrected |
|---|---|---|
|  |  |  |

### Fixture Candidates

| Candidate | Source id / description | Intended criterion | Raw-data handling |
|---|---|---|---|
|  |  |  |  |

### Open Questions / Deferrals

- <Question or deferred decision, owner, and smallest next action>
```

The Arize section above is the first intake summarized into this structure. It keeps source summary, input schema, sample size, positive/negative evidence, failure clusters, and rubric implications visible while avoiding raw trace-table persistence.

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
| Pantry grounding | Uses available pantry items, treats optional extras as optional, avoids invented required ingredients, explains constrained fallbacks when needed | Fail if the recipe cannot be cooked without non-pantry required ingredients or if it over-corrects a pantry-first request into a shopping-list recipe |
| Cuisine fit | Returned options visibly honor selected cuisine, or transparently state a pantry-flexible fallback when pantry evidence is too weak | Fail if only one of three options weakly acknowledges the selected cuisine without explaining the constraint |
| Recipe usefulness | Coherent dish, clear name, practical preparation, good ranking/diversity across suggestions, appropriate substitutions | Fail if suggestions are generic, duplicated, incoherent, or culturally overclaim authenticity |
| Cooking steps | Steps align with the accepted recipe, equipment, ingredients, skill, time, and safe sequencing | Fail if steps introduce unavailable ingredients/equipment, omit safe alternatives, exceed user proficiency, or omit key safety/cooking actions |
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
   - Wilson's Arize open-coding notes,
   - examples already embedded in prompts,
   - EFF-022 cuisine-fit failures,
   - a small current production or staged sample once privacy handling is explicit.
2. Label each example at criterion level, not only "good" or "bad."
3. Record why failures happened: prompt ambiguity, missing deterministic validation, stale DB prompt, pantry too constrained, response shape drift, model over-anchoring, unsafe recipe, or product copy/fallback gap.
4. Use failure clusters to create eval fixtures and prompt-candidate briefs.
5. Keep unresolved examples visible until each has either a prompt fix, product fallback decision, deterministic guard, or accepted limitation.

Arize open-coding data has been imported into this INIT as summarized taxonomy evidence. Future additions should append dated sections or handoffs that explain what changed rather than silently replacing these seed clusters.

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
3. Re-read the local OpenAI Platform export and the Wilson-provided Arize notes, then summarize fixture candidates without committing raw exports or trace-level tables.
4. Proceed with a small Wilson-first seed set that includes both positive and negative Arize examples, EFF-022 cuisine-fit failures, and legacy OpenAI Platform export cases.
5. Produce a Phase 1 handoff that says whether Slop Bowl requires feature-type changes, whether current eval criteria match current response shapes, which deterministic checks should be implemented before LLM judges, and how Arize clusters map into the first label schema.

## Chronology

- **2026-06-09** - Wilson asked how to make quantitative evals for recipe generation, recipe recommendation, and cooking-step outputs; emphasized true positive rate, human review, bad/good examples, prompt iteration, and daily reporting/dashboards.
- **2026-06-09** - Wilson provided an OpenAI Platform eval export and clarified that examples were also added to `server/openai.ts` from earlier eval/open-coding work.
- **2026-06-09** - Wilson decided this should be filed as a standalone INIT-004 rather than folded into INIT-002. Separate ownership keeps operational error telemetry in INIT-002 and output-quality evals/prompt improvement in INIT-004.
- **2026-06-09** - Wilson provided Arize open-coding seed data. The notes added initial taxonomy signal for food safety/doneness, proficiency fit, equipment availability, cook-time adherence, cuisine/pantry tradeoff, and output extraction/format fragility.
