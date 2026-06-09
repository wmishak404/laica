# Evaluation Workflow

This is the canonical operating model for Laica AI output-quality evaluations. It is intentionally outside any INIT so the discipline can evolve after individual initiatives close.

Use this workflow for recipe suggestions, pantry recipes, Slop Bowl outputs, cooking-step generation, future judge runs, human review batches, daily reports, prompt-candidate comparisons, and any other AI output-quality eval evidence.

## Relationship To docs/evals

`docs/workflows/evaluations.md` owns the repo-wide discipline: when evals are required, what evidence is acceptable, how calibration is reported, and what may gate merge or prompt activation.

`docs/evals/` owns the practical eval system ledger: intake records, result indexes, fixture references, report references, and future harness instructions. INITs can link to those records while active, but eval evidence should not depend on an INIT remaining open.

## Operating Loop

1. **Register the evidence.** Every eval run, open-coding import, human review batch, judge run, daily report, or production/staged sample gets a stable row in [docs/evals/registry.md](../evals/registry.md). If it affects rubric, fixtures, metrics, reporting, or prompts, it also gets a normalized record under [docs/evals/intakes/](../evals/intakes/) using [docs/evals/intakes/TEMPLATE.md](../evals/intakes/TEMPLATE.md).
2. **Normalize before interpreting.** Each intake record captures source summary, input schema, prompt/model/evaluator versions, sample size, positive definition, trend tags, raw artifact handling, privacy posture, metrics, failure clusters, positive examples worth preserving, fixture candidates, and open questions. Raw exports stay local/external unless a privacy/source decision explicitly allows committing them.
3. **Start with human-readable failure taxonomy.** Use Wilson-labeled examples, open-coding clusters, platform eval exports, active Effort fixtures, and current app traces to name failure modes before writing broad metrics.
4. **Implement deterministic checks first.** Schema/JSON validity, current response-shape fit, max-time adherence, required field presence, suggestion count, and obvious equipment/ingredient contract checks should run before any LLM judge.
5. **Create criterion-level human labels.** Wilson-first labels are acceptable for v1, but labels must be per criterion rather than only "good" or "bad." Positive examples stay in the dataset so fixes do not over-correct useful pantry-first behavior into unnecessary shopping-list behavior.
6. **Use narrow LLM judges only after rubric shape is clear.** Each judge should evaluate one criterion or tightly related criterion family. Broad aggregate judge scores are triage at best and should not become product-quality truth.
7. **Calibrate judges against human labels.** Report observed judge pass rate, human label pass rate when available, TPR, TNR, corrected pass rate when the denominator is valid, confidence interval, sample size, prompt/model/evaluator versions, and negative scope. Until TPR/TNR exist, mark LLM-judge metrics as uncalibrated.
8. **Run two evidence lanes.** Golden/regression fixtures protect known contracts in CI or scheduled automation. Production/staged sampling estimates real output quality only after privacy handling, source fields, and raw artifact policy are explicit.
9. **Report compactly and routinely.** V1 reporting should be daily automation, not an admin dashboard. Reports should include criterion rates, calibration status, sample size, trend deltas, top clusters, fixture/report ids, privacy posture, and negative scope, and should be indexed through [docs/evals/registry.md](../evals/registry.md).
10. **Turn failures into controlled prompt work.** Failure clusters generate inactive prompt candidates or product fallback decisions. Compare candidates against baseline using deterministic checks, human labels, LLM judges with calibration status, positive examples worth preserving, and known negative fixtures. Do not auto-activate prompt changes without Wilson approval.

## V1 Surfaces

- Chef It Up / Pantry recipe recommendations
- General recipe suggestions from meal-planning preferences
- Slop Bowl recipe generation
- Cooking-step generation for accepted recipes

V1 does not cover provider outage handling, image generation quality, speech transcription/synthesis quality, dashboard UX, or automatic prompt activation.

## Core Criteria Families

| Criterion family | What to measure | First check type |
|---|---|---|
| Structure and contract | Valid JSON, schema conformity, required fields, expected number of suggestions, parseable cooking-step arrays | Deterministic |
| User constraints | Cuisine, max cook time, skill level, dietary restrictions, allergies, nutrition preferences, meal type | Deterministic where possible; human/judge for semantic fit |
| Pantry grounding | Uses available pantry items, treats optional extras as optional, avoids invented required ingredients, explains constrained fallbacks | Human/judge plus ingredient-contract checks |
| Cuisine fit | Honors selected cuisine or transparently states a pantry-flexible fallback when pantry evidence is weak | Human/judge |
| Recipe usefulness | Coherent dish, clear name, practical preparation, ranking/diversity, appropriate substitutions | Human/judge |
| Cooking steps | Steps align with accepted recipe, equipment, ingredients, skill, time, and safe sequencing | Deterministic where possible; human/judge for sequence quality |
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
