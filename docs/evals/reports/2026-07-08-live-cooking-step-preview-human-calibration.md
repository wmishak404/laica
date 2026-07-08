# Live Cooking Step Preview Human Calibration - 2026-07-08

**Report id:** `live-cooking-step-preview-human-calibration-2026-07-08`
**Surface:** `live_cooking_step_previews`
**Run type:** provider-backed judge smoke plus Wilson human review import
**Source class:** mixed sentinel/synthetic controls and provider-generated Arize-derived samples
**Branch/head at reviewed run:** `codex/init-004-step-preview-evals` at `2d4f05e` before the calibration follow-up edits
**Prompt/runtime version in CSV:** `server/openai.ts@local-HEAD recipe+live-cooking-step-prompts` for provider samples; `balanced-*-control-v1` for controls
**Calibration status:** initial Wilson-labeled calibration; judge remains uncalibrated

## Value Claim

This report checks whether the `live_cooking_step_previews` judge and fixtures are aligned with Wilson's review of small Live Cooking preview/action labels. It does not claim the current Live Cooking provider output is passing. The user-facing promise under review is: a hands-busy cook should see compact, grammatical, non-repetitive labels that name the actual step milestone.

## Source Inventory

| Population | Items | Judge runs | Score use |
|---|---:|---:|---|
| Sentinel/synthetic controls | 6 | 18 | Control agreement only |
| Provider-generated Arize-derived samples | 6 | 18 | Human calibration candidate |
| Total mixed report | 12 | 36 | Diagnostic only; do not use as product-quality rate |

The reviewed CSV and fixture sidecar remain local review artifacts and are not committed. This Markdown report summarizes the human labels, judge behavior, and action routing without raw provider payloads, screenshots, request ids, user ids, or private traces.

## Human Labels

Provider-generated sample rows after Wilson's Ethiopian-row correction:

| Human verdict | Count | Notes |
|---|---:|---|
| PASS | 1 | Acceptable provider sample; one judge run still raised a false concern. |
| BORDERLINE | 3 | Mostly acceptable, but overdescribed or likely too long for the preview card. Excluded from binary TPR/TNR. |
| FAIL | 2 | Hard issues: grammar/word form, overlong final label, and measurement/time fragment. |

Control rows:

| Control outcome | Count | Notes |
|---|---:|---|
| Wilson PASS | 2 | Positive controls that Wilson accepted. |
| Wilson FAIL | 1 | The intended positive `Prep Leeks` control omitted carrots from a multi-ingredient prep step. |
| Unlabeled intentional negative controls | 3 | Kept as expected-failure controls, not human pass-rate rows. |

## Judge Metrics

Binary alignment is computed only on provider-generated rows with Wilson `PASS` or `FAIL`. The three `BORDERLINE` rows are excluded because they represent rubric-threshold tuning, not settled acceptance.

| Metric | Result | Interpretation |
|---|---:|---|
| Provider binary rows | 3 items / 9 judge runs | 1 PASS item, 2 FAIL items |
| Defect TPR, run-level | 3 / 6 = 50.0% | Judge caught the Ethiopian fail but missed the Mediterranean fail in every run. |
| Acceptable-label TNR, run-level | 2 / 3 = 66.7% | Judge preserved the Wilson PASS in two of three runs, with one false alarm. |
| Strict item agreement by majority verdict | 2 / 3 = 66.7% | PASS preserved for one item, FAIL caught for one item, one FAIL missed. |
| Borderline disposition | 3 items excluded | Use for rubric tuning and severity thresholds, not TPR/TNR. |

Control agreement should remain separate. The original control expectations produced useful smoke evidence, but Wilson's review showed that one intended positive control should be revised or split because `Prep Leeks` is incomplete when the step also dices carrots. This branch now adds a synthetic regression fixture for that exact incomplete multi-ingredient prep label.

## Provider Rows

| Data item | Human verdict | Confidence | Normalized issue | Preferred direction | Judge behavior |
|---|---|---|---|---|---|
| Korean-inspired beef and veggie rice bowl | BORDERLINE | MEDIUM | Overdescribed or too long: `Julienne Carrots Evenly`; step 6 also likely exceeds preview-card fit. `Evenly` is table-stakes here, not a meaningful descriptor. | Drop table-stakes modifier: `Julienne Carrots`; shorten long add-carrots/onion label. | Judge passed all runs; sometimes noted `too_long_for_preview_card`. |
| Garlic chicken and zucchini skillet | BORDERLINE | MEDIUM | Overdescribed table-stakes modifier: `Slice Zucchini Evenly`. | `Slice Zucchini`; keep meaningful object-shape labels such as chicken cubes or zucchini rounds. | Judge passed all runs with no modes. |
| Vietnamese-inspired coconut chickpea soup | BORDERLINE | MEDIUM | Overdescribed table-stakes modifier: `Drain Chickpeas Thoroughly`. | `Drain Chickpeas`. | Judge passed all runs with no modes. |
| Vietnamese-inspired chickpea and rice bowl | PASS | HIGH | Wilson accepted the labels. | No fixture/rubric change from this row. | Judge was unstable: pass/fail across runs due one `ungrammatical_or_incomplete_label` concern. |
| Mediterranean bagel bites | FAIL | HIGH | Grammar and card fit: `Slice Cucumber Thin`; `Arrange & Serve Bagel Bites`. | `Slice Cucumber Thinly` or `Slice Cucumber`; `Serve Bagel Bites` or `Arrange and Serve`. | Judge missed the hard fail; all runs passed, sometimes with low-severity `too_long_for_preview_card`. |
| Ethiopian-inspired chickpea-lentil vegetable stir-up | FAIL | HIGH | Measurement/time fragment: `Simmer 15 Minutes`; grammar nuance around chopped onion label. | Replace time fragment with the actual milestone, such as simmering lentils/stew; preserve meaningful modifiers like `Finely` when rough/fine matters. | Judge caught the fail in all runs with `measurement_or_quantity_label`. |

## Calibration Findings

- The judge is useful for clear measurement/time failures (`Bring 4 Cups`, `Simmer 15 Minutes`) but currently weak on grammar and compactness failures that look superficially plausible.
- Wilson treats `BORDERLINE` as real review signal. These rows should shape prompt/judge wording, but they should not overinflate or underinflate binary scores.
- Adjectives and modifiers are not automatically wrong. The issue is table-stakes modifiers: labels such as `Evenly` or `Thoroughly` can be too verbose for a preview card when they are already implied by the action and do not change the milestone.
- Meaningful modifiers are acceptable when they distinguish the task or object shape, such as `Chicken Cubes`, `Zucchini Rounds`, `Shred Carrots`, or `Chop Onion Finely`.
- The actual step instruction is required evidence. A preview label list alone cannot establish whether the label names the right milestone.

## Product-Learning Candidates

These are promoted learnings from the reviewed evidence, not automatic runtime changes.

| Candidate | Evidence class | Promotion strength | Product-learning direction |
|---|---|---|---|
| Replace time fragments with the actual cooking milestone | Provider sample, `FAIL` / `HIGH` | Strong prompt/runtime candidate | `Simmer 15 Minutes` should become a milestone label such as `Simmer Lentils` or `Simmer Stew`. |
| Preserve grammar at preview-card scale | Provider sample, `FAIL` / `HIGH` | Strong prompt/runtime candidate | `Slice Cucumber Thin` should become `Slice Cucumber Thinly` or compact to `Slice Cucumber`. |
| Keep final serving labels compact | Provider sample, `FAIL` / `HIGH` | Strong prompt/runtime candidate | `Arrange & Serve Bagel Bites` should become `Serve Bagel Bites` or `Arrange and Serve`. |
| Include all meaningful objects in prep labels | Synthetic control, Wilson `FAIL` / `MEDIUM` with clear failure mode | Strong fixture candidate; prompt/runtime candidate if repeated or accepted by product owner | `Prep Leeks` is incomplete when the step also dices carrots; a compact direction is `Prep Leeks and Carrots`. |
| Treat table-stakes modifiers as trend signal, not adjective ban | Provider samples, `BORDERLINE` / `MEDIUM` | Trend signal; aggregate across runs | `Evenly` / `Thoroughly` can bloat previews when implied by the action, but meaningful descriptors such as `Finely`, `Rounds`, `Cubes`, and `Shredded` can be acceptable. |
| Do not product-fix judge false alarms | Provider sample, `PASS` / `HIGH` with one judge false alarm | Judge calibration lane | Wilson accepted the Vietnamese chickpea-rice labels; the judge's one false concern should tune judge criteria, not product behavior. |

## Action Routing

| Lane | Action |
|---|---|
| Fixture lane | Add a binary synthetic fixture for the multi-ingredient incomplete label case: `Prep Leeks` fails when the step prepares leeks and carrots. Keep borderline table-stakes-modifier rows in calibration reports until a binary policy exists. |
| Judge criteria | Tighten `live_cooking_step_previews` criteria for time fragments, adjective/adverb grammar, incomplete multi-object labels, and table-stakes modifiers while preserving meaningful descriptors. |
| Report structure | Keep `Judge Metrics` before provider inventory in future reports; always separate controls, provider samples, and diagnostic mixed totals. |
| Prompt/runtime lane | Do not change runtime prompts from INIT-004. Route promoted candidates to the Live Cooking prompt owner: avoid time/measurement labels, avoid table-stakes modifiers in previews, preserve meaningful shape/action modifiers, include meaningful prep objects, and keep final serving labels compact. |
| Next calibration | Rerun the judge against the same saved Wilson-labeled rows after judge criteria changes; this does not require new human labels because the outputs and Wilson verdicts are unchanged. A new generated/diverse provider sample does require Wilson review before it becomes calibration evidence. |

## Evidence Limits

This is a small calibration report, not a production-quality score. It uses six provider-generated synthetic/Arize-derived samples, six controls, and three judge repeats per row. The provider examples are directionally useful but not diverse enough to represent the surface broadly; the next product-learning sample should intentionally vary cuisines, recipe formats, ingredients, and step structures beyond similar rice/bowl/bagel-style cases. This report does not include real app traffic, pixel-fit checks, private gold fixtures, production defect rates, or PR #260/PR #264 runtime fallback proof.
