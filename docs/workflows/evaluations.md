# Evaluation Workflow

This is the canonical operating model for Laica AI output-quality evaluations. It is intentionally outside any INIT so the discipline can evolve after individual initiatives close. The same registry/intake discipline can also hold explicitly scoped interaction-eval seeds, such as Live Cooking speech arbitration, when Wilson identifies a user-facing acceptance matrix before a formal harness exists.

Use this workflow for recipe suggestions, pantry recipes, Slop Bowl outputs, cooking-step generation, future judge runs, human review batches, daily reports, prompt-candidate comparisons, and any other AI output-quality eval evidence. For non-AI interaction seeds, keep the surface and owning INIT explicit so the record does not silently expand an active eval phase.

## User-Expectation Rule

Every eval should start from the user's request, constraints, and likely expectation, then explain how the observed output does or does not satisfy that user. Structure, schema, privacy, and deterministic contract checks are necessary because they make outputs measurable and usable, but they are foundation checks, not the whole quality claim.

An eval result that only says "valid JSON," "three recipes," or "judge passed" is incomplete unless it also identifies the user-facing promise it protects: time fit, dietary safety, pantry usefulness, skill fit, equipment fit, cuisine fit, cooking-step clarity, food safety, or another explicit expectation. When a fixture cannot yet evaluate user value, mark that as negative scope and name the smallest next fixture or label that would close the gap.

Use the same minimal evidence shape for eval artifacts and reports:

- **Value claim:** what user expectation or operator/agent confidence the eval protects.
- **Evidence:** the fixture, judge, human label, deterministic check, sample, and observed result that support the claim.
- **Evidence limits:** what the eval does not prove, such as live model quality, provider behavior, private gold coverage, taste, cuisine fit, or safety criteria not included in the fixture.

## Relationship To docs/evals

`docs/workflows/evaluations.md` owns the repo-wide discipline: when evals are required, what evidence is acceptable, how calibration is reported, and what may gate merge or prompt activation.

`docs/evals/` owns the practical eval system ledger: intake records, result indexes, fixture references, report references, and future harness instructions. INITs can link to those records while active, but eval evidence should not depend on an INIT remaining open.

## Operating Loop

1. **Register the evidence.** Every eval run, open-coding import, human review batch, judge run, daily report, or production/staged sample gets a stable row in [docs/evals/registry.md](../evals/registry.md). If it affects rubric, fixtures, metrics, reporting, or prompts, it also gets a normalized record under [docs/evals/intakes/](../evals/intakes/) using [docs/evals/intakes/TEMPLATE.md](../evals/intakes/TEMPLATE.md).
2. **Normalize before interpreting.** Each intake record captures source summary, input schema, prompt/model/evaluator versions, sample size, positive definition, trend tags, raw artifact handling, privacy posture, metrics, failure clusters, positive examples worth preserving, fixture candidates, and open questions. Raw exports stay local/external unless a privacy/source decision explicitly allows committing them.
3. **Start with user goal and value.** Name the user's goal, the value protected, the bad experience being prevented, and the smallest observable behavior that would prove the value is met. Do this before naming implementation hooks, mocks, or metric labels.
4. **Start with human-readable failure taxonomy.** Use Wilson-labeled examples, open-coding clusters, platform eval exports, active Effort fixtures, and current app traces to name failure modes before writing broad metrics.
5. **Name the protected user expectation.** For each fixture, judge, report row, or interaction seed, state the user promise being tested and the criterion that represents it. Examples: "a 30-minute request should not produce a 60-minute recipe," "beginner steps should not assume advanced technique," "halal/keto restrictions override cuisine preference," or "the cook hears only the currently visible step after pressing Next." If the fixture is only a contract guard, say so and do not present it as output-quality proof.
6. **Implement deterministic checks first.** Schema/JSON validity, current response-shape fit, max-time adherence, required field presence, suggestion count, transcript/payload fidelity, action-state arbitration, and obvious equipment/ingredient contract checks should run before any LLM judge or subjective quality claim.
7. **Create criterion-level human labels.** Wilson-first labels are acceptable for v1, but labels must be per criterion rather than only "good" or "bad." Labels should connect back to the user expectation, including positive examples worth preserving so fixes do not over-correct useful pantry-first behavior into unnecessary shopping-list behavior.
8. **Use narrow LLM judges only after rubric shape is clear.** Each judge should evaluate one criterion or tightly related criterion family. Broad aggregate judge scores are triage at best and should not become product-quality truth.
9. **Calibrate judges against human labels.** Report observed judge pass rate, human label pass rate when available, TPR, TNR, corrected pass rate when the denominator is valid, confidence interval, sample size, prompt/model/evaluator versions, and negative scope. Until TPR/TNR exist, mark LLM-judge metrics as uncalibrated.
10. **Run two evidence lanes.** Golden/regression fixtures protect known contracts in CI or scheduled automation. Production/staged sampling estimates real output quality only after privacy handling, source fields, and raw artifact policy are explicit.
11. **Report compactly and routinely.** V1 reporting should be daily automation, not an admin dashboard. Reports should include criterion rates, calibration status, sample size, trend deltas, top clusters, fixture/report ids, privacy posture, and negative scope, and should be indexed through [docs/evals/registry.md](../evals/registry.md).
12. **Turn failures into controlled prompt work.** Failure clusters generate inactive prompt candidates or product fallback decisions. Compare candidates against baseline using deterministic checks, human labels, LLM judges with calibration status, positive examples worth preserving, and known negative fixtures. Do not auto-activate prompt changes without Wilson approval.

## V1 Surfaces

- Chef It Up / Pantry recipe recommendations
- General recipe suggestions from meal-planning preferences
- Slop Bowl recipe generation
- Cooking-step generation for accepted recipes
- Live Cooking step-preview/action labels through `live_cooking_step_previews`, kept separate from broad `cooking_steps` safety/sequence quality

V1 does not cover provider outage handling, image generation quality, speech transcription/synthesis quality, dashboard UX, or automatic prompt activation.

Speech or other interaction-eval records may still be registered outside INIT-004 V1 when they protect a concrete product acceptance boundary. Those records must name the owning INIT/phase and must not be treated as active INIT-004 harness scope unless Wilson explicitly opens that phase.

## Future INIT-004 Image Quality Calibration Phase

Generated recipe images are accepted as a later INIT-004 phase once the core INIT-004 human-review, judge-calibration, reporting, and action-routing machinery exists. Do not fold image quality into the recipe-text V1 pass rates early: image generation has different artifacts, privacy handling, provider/style variables, and human-review needs.

The first image-quality lane should be a blind human-review queue over `recipe_image_cache` samples, not another model-only dashboard. It should:

- sample recent image rows with emphasis on near-threshold approvals/rejections, repeated rejection clusters, provider/style-version comparisons, and policy/safety failures;
- show Wilson the generated image and recipe facts before revealing the model judge verdict;
- collect a human verdict: acceptable, not acceptable, or needs product decision;
- collect structured failure labels such as wrong main ingredient, wrong dish form, missing key ingredient, optional ingredient dominates, dietary/safety contradiction, visible text/logos/people/packaging, low visual quality, unclear recipe input, judge too strict, or judge too lenient;
- reveal the judge result only after the human label is saved, including approval state, score, reasons, observed ingredients, observed dish form, provider/model, and style version;
- compare judge candidates against frozen human labels before changing the production judge model, prompt, or threshold;
- report false approvals, false rejections, agreement near threshold, common failure clusters, latency, and cost by provider/model/style version;
- route clusters to concrete actions: generator prompt fix, judge prompt fix, threshold change, provider/model/style comparison, recipe fingerprint/core-ingredient extraction fix, product-rule decision, or fixture/gold-set addition.

Human labels are the source of truth for this lane. Model judges are triage until their TPR/TNR against human labels is known, and a stronger or cheaper judge model should only replace the current production judge after it improves the frozen calibration set with acceptable cost/latency tradeoffs.

## Core Criteria Families

| Criterion family | What to measure | First check type |
|---|---|---|
| Structure and contract | Valid JSON, schema conformity, required fields, expected number of suggestions, parseable cooking-step arrays | Deterministic |
| User constraints | Cuisine, max cook time, skill level, dietary restrictions, allergies, nutrition preferences, meal type | Deterministic where possible; human/judge for semantic fit |
| Pantry grounding | Uses available pantry items, treats optional extras as optional, avoids invented required ingredients, explains constrained fallbacks | Human/judge plus ingredient-contract checks |
| Cuisine fit | Honors selected cuisine or transparently states a pantry-flexible fallback when pantry evidence is weak | Human/judge |
| Recipe usefulness | Coherent dish, clear name, practical preparation, ranking/diversity, appropriate substitutions | Human/judge |
| Cooking steps | Steps align with accepted recipe, equipment, ingredients, skill, time, and safe sequencing | Deterministic where possible; human/judge for sequence quality |
| Live Cooking step previews | Small-card labels fit hands-busy recall: concise, measurement-free, distinct across sibling steps, plain English, and tied to the actual milestone | Deterministic for shape/length/measurements/exact duplicates; human/judge for milestone and language quality |
| Food safety | Safe handling/cook guidance for meat, eggs, leftovers, allergens, and storage where relevant | Human/judge plus targeted deterministic flags |

## Measurement Rules

- Treat uncalibrated LLM-judge results as triage, not truth.
- Positive means a human-labeled pass for a criterion.
- True positive rate means the judge marks a human-pass item as pass.
- True negative rate means the judge marks a human-fail item as fail.
- Only use corrected pass-rate estimates after enough calibration labels exist. For a binary judge, estimate true pass rate from observed judge pass rate with `(observed_pass_rate + TNR - 1) / (TPR + TNR - 1)` when the denominator is valid.
- Report uncertainty instead of false precision. Use bootstrap confidence intervals or another documented uncertainty method once the sample is large enough.
- Treat CI/golden evals as regression checks, not representative production quality estimates.

## Privacy And Raw Artifacts

Do not commit raw trace exports, raw prompts containing user-identifying data, images, audio, secrets, auth data, or full production payloads without a durable privacy/source decision.

When raw artifacts remain local or external, preserve enough summary evidence in the registry/intake record for future agents to act:

- stable intake id,
- source and source date,
- sample size,
- input/output schema,
- prompt/model/evaluator versions when known,
- metrics and calibration status,
- failure/learning clusters,
- positive examples worth preserving,
- fixture candidates,
- raw artifact handling,
- privacy posture,
- open questions and next actions.

## Prompt Improvement Rule

Eval failures can recommend prompt improvements, but prompt changes should be inactive candidates until Wilson approves activation. Candidate comparisons must show the baseline, changed prompt/source, fixture set, deterministic check results, human-label outcomes when available, judge results with calibration status, preserved positive examples, remaining failures, and negative scope.
