# 2026-06-09 - OpenAI Platform Eval Intake

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

## Source Summary

Legacy OpenAI Platform run over recipe suggestion outputs. The export appears to use an older response shape with one recipe object, while current app surfaces commonly return three suggestions under `recipes[]` or one Slop Bowl recipe under `recipe`. Use this run for trend discovery and fixture candidates, not as proof that the current app contract is covered.

## Metrics Summary

| Metric | Value | Calibration status | Notes |
|---|---|---|---|
| Observed pass rate | 149/150 criterion checks, 99.3% | Uncalibrated LLM-judge result | Useful triage signal only; no human gold labels yet |
| Item-level pass rate | 24/25 items fully passed, 96.0% | Uncalibrated LLM-judge result | One item failed max-time adherence |
| Human label pass rate | n/a | Not measured | Phase 2 should add Wilson labels for selected examples |
| TPR | n/a | Requires human labels | Needed before judge pass rate can be treated as true quality |
| TNR | n/a | Requires human labels | Especially important because at least one structure issue passed LLM judging |
| Corrected pass rate | n/a | Requires valid TPR/TNR | Do not report as product-quality truth yet |
| Confidence interval | n/a | Not computed | Add bootstrap interval once sample and labels are sufficient |

## Failure / Learning Clusters

| Cluster | Evidence | Criterion family | Proposed deterministic check | Proposed judge or human label | Product / prompt implication |
|---|---|---|---|---|---|
| Max-time adherence | One item had max 25 minutes and recipe cook time 30 minutes | User constraints | Compare returned `cookTime` against user max; define whether rounding rules may ever exceed the max | Human label: pass only if output stays within user max or an explicit accepted exception exists | Prompt and schema should avoid interval rounding that violates user constraints |
| Structure/contract fragility | At least one invalid JSON output still passed all LLM judges | Structure and contract | Parse JSON and validate schema before judge scoring | Human label: fail any response the UI cannot parse/render | Deterministic contract checks must precede LLM-as-judge checks |
| Legacy contract drift | Export uses older single-recipe shape | Structure and contract | Fixture loader must map source shape to current route contract or mark legacy-only | Human label current-app applicability separately from old-output quality | Phase 1 should not reuse old metrics without response-shape migration |
| Judge calibration gap | 149/150 pass rate has no TPR/TNR | Measurement validity | n/a | Human gold labels needed for pass/fail calibration | Reports must mark this run uncalibrated |

## Positive Examples Worth Preserving

| Example | Why it passed | Regression risk if over-corrected |
|---|---|---|
| 25/25 ingredient-relevancy grader passes | Legacy judge saw strong pantry relevance | Over-correcting from a few failures could create unnecessary shopping-list recipes |
| 25/25 dietary, nutrition, skill, and food-safety grader passes | Automated criteria did not detect broad safety/diet failures in this run | Treating this as definitive would hide calibration gaps and human-review blind spots |

## Fixture Candidates

| Candidate | Source id / description | Intended criterion | Raw-data handling |
|---|---|---|---|
| Max-time failure | Item where max 25 returned cookTime 30 | User constraints / deterministic max-time check | Extract sanitized fixture in Phase 1 |
| Invalid JSON pass-through | Item with invalid JSON that LLM judges still passed | Structure and contract / deterministic parser check | Extract sanitized fixture in Phase 1 |
| Representative all-pass cases | One or more examples that passed all six criteria | Positive regression set | Summarize or synthesize fixture after privacy review |

## Open Questions / Deferrals

- Phase 1 must identify exact input/output fields from the JSONL before creating durable fixtures.
- Phase 2 must decide how many old-platform examples should receive Wilson human labels for judge calibration.
- Current app response-shape coverage remains unproven by this run.
