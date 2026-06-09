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
- Wilson-provided evaluation methodology notes PDF, read locally and summarized below.
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
| Wilson evaluation methodology notes PDF | Local artifact, not committed | Industry-standard workflow: Analyze -> Measure -> Improve; start with real-trace open coding; build a failure taxonomy; use narrow binary judges; calibrate judges against human labels using true positive and true negative rates; report uncertainty |
| OpenAI Platform JSONL export | Local artifact, not committed | 25 eval items from `evalrun_685361470e9c819195a768074ef126cd`; generated model `gpt-4.1-2025-04-14`; grader model `o3-mini-2025-01-31`; 149/150 grader passes; one max-time failure; at least one invalid JSON output still passed judge checks |
| Arize open-coding data | Provided in Wilson chat on 2026-06-09, not committed raw | Historical prompt asked for pantry-first Markdown recipe suggestions from pantry/cuisine/proficiency/time/diet/nutrition/equipment fields; notes include 18 coding rows across 16 unique examples from 2025-11-07 |
| `server/openai.ts` examples | In repo | Existing prompt examples came from earlier eval/open-coding work and need a cleaner source-of-truth link |
| EFF-022 fixtures | In repo | Negative examples where explicit Chinese/Indian/Thai cuisine requests were weakly honored under constrained pantry conditions |

Do not commit raw local exports or methodology-note files without a separate privacy/source decision. The INIT should carry only summarized findings, fixture identities, and paths in handoffs when needed for same-machine agent continuity.

## Eval Intake Index

This table is the durable index of eval runs, open-coding imports, and other quality-evidence intakes known to INIT-004. Future eval data should add one row here and then use the [Eval Intake Record Structure](#eval-intake-record-structure) for details when the intake changes rubric, fixtures, metrics, reporting, or prompt workflow.

| Intake id | Source | Source date | Provided / imported | Surface | Sample size | Trend tags | Raw artifact handling | Current status | Next action |
|---|---|---|---|---|---|---|---|---|---|
| `openai-platform-evalrun-685361470e9c819195a768074ef126cd` | OpenAI Platform eval export | File timestamp 2026-06-04; user remembered June 4, 2025 | 2026-06-09 | Legacy recipe suggestion eval | 25 items; 150 criterion checks | `structure-contract`, `max-time`, `judge-calibration-gap`, `legacy-contract-drift` | Local JSONL only; summarized in INIT/handoff; not committed | Seed run indexed; 149/150 grader passes; one max-time failure; one invalid JSON case still passed LLM judges | Phase 1 should extract fixture candidates and deterministic contract checks |
| `arize-open-coding-2025-11-07` | Arize open-coding notes | 2025-11-07 note timestamps | 2026-06-09 | Legacy pantry-first recipe suggestions | 18 notes across 16 unique examples | `food-safety`, `proficiency-fit`, `equipment-fit`, `max-time`, `cuisine-pantry-tradeoff`, `structure-contract` | Raw prompt/table provided in chat; summarized in INIT/handoff; not committed | Seed intake indexed; clusters identified for food safety, proficiency fit, equipment, time, cuisine/pantry tradeoff, and format fragility | Phase 1 should map clusters into label schema and fixture candidates |

## Seed Intake Records

These records normalize the initial eval sources into the same format so future judges, deterministic checks, and human-label work can compare trend strength rather than treating each export as a one-off artifact. Values marked uncalibrated are useful for triage only until human gold labels produce judge TPR/TNR.

### 2026-06-09 - OpenAI Platform Eval Intake

**Intake id:** `openai-platform-evalrun-685361470e9c819195a768074ef126cd`
**Source:** OpenAI Platform eval export
**Owner / reviewer:** Wilson run; OpenAI Platform graders; Codex summary
**Raw artifact handling:** Local JSONL only; not committed
**Privacy posture:** Summarized metadata and failure trends only
**Related surfaces:** Legacy recipe suggestion eval
**Prompt/model/evaluator versions:** generated model `gpt-4.1-2025-04-14`; grader model `o3-mini-2025-01-31`; run id `evalrun_685361470e9c819195a768074ef126cd`
**Input schema:** Legacy export fields; Phase 1 must extract exact fixture schema
**Sample size:** 25 items; 150 criterion-level checks across 6 grader criteria
**Positive definition:** Automated grader criterion pass; not yet calibrated against human labels
**Trend tags:** `structure-contract`, `max-time`, `judge-calibration-gap`, `legacy-contract-drift`

#### Source Summary

Legacy OpenAI Platform run over recipe suggestion outputs. The export appears to use an older response shape with one recipe object, while current app surfaces commonly return three suggestions under `recipes[]` or one Slop Bowl recipe under `recipe`. Use this run for trend discovery and fixture candidates, not as proof that the current app contract is covered.

#### Metrics Summary

| Metric | Value | Calibration status | Notes |
|---|---|---|---|
| Observed pass rate | 149/150 criterion checks, 99.3% | Uncalibrated LLM-judge result | Useful triage signal only; no human gold labels yet |
| Item-level pass rate | 24/25 items fully passed, 96.0% | Uncalibrated LLM-judge result | One item failed max-time adherence |
| Human label pass rate | n/a | Not measured | Phase 2 should add Wilson labels for selected examples |
| TPR | n/a | Requires human labels | Needed before judge pass rate can be treated as true quality |
| TNR | n/a | Requires human labels | Especially important because at least one structure issue passed LLM judging |
| Corrected pass rate | n/a | Requires valid TPR/TNR | Do not report as product-quality truth yet |
| Confidence interval | n/a | Not computed | Add bootstrap interval once sample and labels are sufficient |

#### Failure / Learning Clusters

| Cluster | Evidence | Criterion family | Proposed deterministic check | Proposed judge or human label | Product / prompt implication |
|---|---|---|---|---|---|
| Max-time adherence | One item had max 25 minutes and recipe cook time 30 minutes | User constraints | Compare returned `cookTime` against user max; define whether rounding rules may ever exceed the max | Human label: pass only if output stays within user max or an explicit accepted exception exists | Prompt and schema should avoid interval rounding that violates user constraints |
| Structure/contract fragility | At least one invalid JSON output still passed all LLM judges | Structure and contract | Parse JSON and validate schema before judge scoring | Human label: fail any response the UI cannot parse/render | Deterministic contract checks must precede LLM-as-judge checks |
| Legacy contract drift | Export uses older single-recipe shape | Structure and contract | Fixture loader must map source shape to current route contract or mark legacy-only | Human label current-app applicability separately from old-output quality | Phase 1 should not reuse old metrics without response-shape migration |
| Judge calibration gap | 149/150 pass rate has no TPR/TNR | Measurement validity | n/a | Human gold labels needed for pass/fail calibration | Reports must mark this run uncalibrated |

#### Positive Examples Worth Preserving

| Example | Why it passed | Regression risk if over-corrected |
|---|---|---|
| 25/25 ingredient-relevancy grader passes | Legacy judge saw strong pantry relevance | Over-correcting from a few failures could create unnecessary shopping-list recipes |
| 25/25 dietary, nutrition, skill, and food-safety grader passes | Automated criteria did not detect broad safety/diet failures in this run | Treating this as definitive would hide calibration gaps and human-review blind spots |

#### Fixture Candidates

| Candidate | Source id / description | Intended criterion | Raw-data handling |
|---|---|---|---|
| Max-time failure | Item where max 25 returned cookTime 30 | User constraints / deterministic max-time check | Extract sanitized fixture in Phase 1 |
| Invalid JSON pass-through | Item with invalid JSON that LLM judges still passed | Structure and contract / deterministic parser check | Extract sanitized fixture in Phase 1 |
| Representative all-pass cases | One or more examples that passed all six criteria | Positive regression set | Summarize or synthesize fixture after privacy review |

#### Open Questions / Deferrals

- Phase 1 must identify exact input/output fields from the JSONL before creating durable fixtures.
- Phase 2 must decide how many old-platform examples should receive Wilson human labels for judge calibration.
- Current app response-shape coverage remains unproven by this run.

### 2026-06-09 - Arize Open-Coding Intake

**Intake id:** `arize-open-coding-2025-11-07`
**Source:** Arize open-coding notes
**Owner / reviewer:** Wilson labels; Codex summary
**Raw artifact handling:** Raw prompt/table provided in chat; not committed
**Privacy posture:** Summarized field names, cluster evidence, and recipe titles only
**Related surfaces:** Legacy pantry-first recipe suggestions
**Prompt/model/evaluator versions:** Historical pantry-first Markdown prompt; model/evaluator version not provided in chat
**Input schema:** `Pantry_Ingredients`, `Cuisine_Preferences`, `Proficiency`, `Max_Cook_Time`, `Dietary_Restrictions`, `Nutritional_Preferences`, `Kitchen_Equipment`
**Sample size:** 18 notes across 16 unique examples
**Positive definition:** Wilson note of "No issues" or equivalent positive review; criterion-level labels still need normalization
**Trend tags:** `food-safety`, `proficiency-fit`, `equipment-fit`, `max-time`, `cuisine-pantry-tradeoff`, `structure-contract`

#### Source Summary

Historical open-coding review of a pantry-first Markdown prompt. The prompt asked for recipe fields including `name`, `description`, `difficulty`, `cookTime`, `pantryIngredientsUsed`, `additionalIngredientsNeeded`, `overview`, `instructions`, and `isFusion`. It differs from the current app because current route contracts often require structured JSON, so use this intake for failure taxonomy and positive-example discovery, then revalidate against current response contracts.

#### Metrics Summary

| Metric | Value | Calibration status | Notes |
|---|---|---|---|
| Observed positive-note rate | 9/18 notes, 50.0% | Human open-coding signal, not item-normalized | Multiple notes can attach to one example; do not treat as item-level pass rate |
| Unique examples with notes | 16 | Human open-coding signal | Phase 2 should normalize to example-level criterion labels |
| Human label pass rate | n/a | Requires criterion-level normalization | "No issues" notes are useful positives but not yet a rubric-complete label set |
| TPR | n/a | No automated judge evaluated this intake | Future LLM judges should be calibrated against normalized Wilson labels |
| TNR | n/a | No automated judge evaluated this intake | Negative clusters are useful candidates for specificity testing |
| Corrected pass rate | n/a | Requires judge observations plus TPR/TNR | Do not report until judge + human labels exist |
| Confidence interval | n/a | Not computed | Add only after item-level labels and sufficient sample size |

#### Failure / Learning Clusters

| Cluster | Evidence | Criterion family | Proposed deterministic check | Proposed judge or human label | Product / prompt implication |
|---|---|---|---|---|---|
| Food safety and doneness | Beef instructions said "heated through" rather than cooked until safe; chicken instructions relied on time/medium heat rather than checking doneness; beginner chicken prep needed more raw-handling guidance | Food safety / cooking steps | Flag raw meat/poultry/egg recipes for required doneness and handling cues | Human label: pass only when safety cues fit ingredient risk and user proficiency | Prompt should require explicit safety cues for raw proteins, especially for beginners |
| Technique quality by proficiency | Intermediate chicken recipe should warn against overcooking breast; beginner Vietnamese fried rice steps may be too complex | Cooking steps / skill fit | Check returned difficulty and step count/complexity against user proficiency where practical | Human label: steps are appropriate for the stated proficiency | Prompt should adapt detail and technique nuance to proficiency |
| Equipment availability | Recipe referenced a saucepan lid even though equipment did not list one; reviewer suggested a plate or similar cover alternative | Equipment fit / cooking steps | Detect unlisted equipment terms or require safe common alternatives | Human label: all required equipment is listed or a safe alternative is provided | Steps must not assume missing tools without fallback |
| Max cook time | One vegan Vietnamese/Mexican example returned 30 minutes when user max was 25 minutes | User constraints | Compare returned `cookTime` against user max | Human label: fail outputs over max unless product explicitly accepts a rounding exception | Prompt and formatter should round without violating max-time constraints |
| Cuisine and pantry tradeoff | Korean/Japanese preference used olive oil because only olive oil was in pantry; reviewer noted sesame oil would be more typical but accepted pantry-first beginner constraint | Cuisine fit / pantry grounding | n/a for authenticity; deterministic checks can detect missing selected-cuisine anchors | Human label should distinguish acceptable pantry-first adaptation from cuisine mismatch | Prompt should be honest about adaptation and avoid unnecessary shopping-list correction |
| Output structure/extraction | Some recipe-title extraction appeared as ```markdown because the historical prompt asked Markdown | Structure and contract | Current harness should parse/validate JSON, not scrape Markdown | Human label: fail if current UI cannot parse/render output | Move current evals away from Markdown extraction |

#### Positive Examples Worth Preserving

| Example | Why it passed | Regression risk if over-corrected |
|---|---|---|
| Mediterranean smoked salmon bagel under limited ingredients | Reviewer said limited ingredients made the good suggestion reasonable | Over-correcting could reject practical simple dishes for lacking elaborate cuisine markers |
| Vegan Vietnamese-inspired chickpea stir-fry | Reviewer recorded no issues under vegan/fiber-rich constraints | Prompt changes should preserve dietary fit while improving safety/structure checks |
| Ethiopian-inspired chickpea stew and lentil stew examples | Reviewer recorded no issues across multi-cuisine, vegan/vegetarian, high-fiber/high-protein contexts | Cuisine-fit tuning should not remove useful inspired dishes when pantry evidence supports them |

#### Fixture Candidates

| Candidate | Source id / description | Intended criterion | Raw-data handling |
|---|---|---|---|
| Korean beef stir-fry safety/adaptation | Beginner Japanese/Korean protein-heavy example using olive oil and weak beef doneness language | Food safety; cuisine/pantry adaptation | Summarize or synthesize fixture from notes |
| Chicken Parmesan with zoodles | Intermediate Italian/French keto example needing chicken doneness and overcooking guidance | Food safety; technique fit | Summarize or synthesize fixture from notes |
| Vietnamese coconut rice equipment issue | Beginner Mexican/Vietnamese Halal/no-spicy example requiring a lid not listed | Equipment fit | Summarize or synthesize fixture from notes |
| Vegan Vietnamese/Mexican cook-time miss | Max 25 minutes but output took 30 | Max-time adherence | Summarize or synthesize fixture from notes |
| Beginner Vietnamese fried rice complexity | Beginner example flagged as too complicated | Proficiency fit | Summarize or synthesize fixture from notes |

#### Open Questions / Deferrals

- Phase 2 must normalize note-level observations into example-level criterion labels.
- Future judge prompts should be tested against these clusters after deterministic checks handle schema/time/equipment where possible.
- The product needs a clear rule for pantry-first authenticity: when an adaptation is acceptable, when to suggest optional cuisine anchors, and when to explain a pantry-constrained fallback.

## Cross-Intake Trend Comparison

| Trend | OpenAI Platform seed | Arize seed | First-rubric implication |
|---|---|---|---|
| Structure/contract fragility | Invalid JSON passed LLM judging | Markdown extraction produced fragile recipe-title values | Deterministic parse/schema checks must run before any judge score |
| Max-time adherence | One 25-minute max returned 30 minutes | One 25-minute max returned 30 minutes | Add deterministic max-time check and clarify rounding cannot exceed max unless Wilson accepts an explicit exception |
| Judge calibration gap | Automated judge pass rates lack human TPR/TNR | Human notes lack automated judge observations | Build Wilson-labeled gold set, then report TPR/TNR before trusting LLM judges |
| Food safety and doneness | Automated food-safety grader passed all items | Human notes found raw beef/chicken safety gaps | Food-safety judge needs human calibration and likely stricter raw-protein criteria |
| Proficiency and equipment fit | Automated required-skill grader passed all items | Human notes found beginner complexity and missing-equipment assumptions | Add criterion-level human labels for skill/equipment fit; deterministic equipment term checks where practical |
| Cuisine/pantry tradeoff | No strong cuisine-failure signal from this run; legacy ingredient relevance passed | Human notes accepted some pantry-first adaptation but flagged authenticity nuance | Rubric should separate pantry-first usefulness from cuisine authenticity rather than treating either as absolute |

These trends reinforce that the first rubric should include both positive examples and failure examples. A useful pass set is not only "no issues"; it should preserve why constrained-pantry examples were acceptable so future prompts do not over-correct into unnecessary shopping lists.

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
**Trend tags:** <shared tags such as structure-contract, max-time, food-safety, proficiency-fit, equipment-fit, cuisine-pantry-tradeoff, judge-calibration-gap>

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

The seed intake records above are the first entries normalized into this structure. They keep source summaries, input schemas, sample sizes, positive/negative evidence, failure clusters, trend tags, and rubric implications visible while avoiding raw trace-table persistence.

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

Use industry-standard eval methodology as the measurement standard:

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
