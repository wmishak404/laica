# 2026-07-07 - Live Cooking Step Preview Label Seed Intake

**Intake id:** `live-cooking-step-preview-label-seed-2026-07-07`
**Source:** Wilson manual PR #260 QA feedback plus Phase 4 Codex handoff
**Owner / reviewer:** Wilson / INIT-001 Phase 4 Codex thread / INIT-004 Codex
**Raw artifact handling:** Screenshots and raw QA context are not committed; this record keeps only the redacted summary and synthetic-safe label examples from the pushed Phase 4 handoff.
**Privacy posture:** Redacted summary; no raw real pantry, user, request id, auth, screenshot, or production trace data committed.
**Related surfaces:** Proposed distinct eval family `live_cooking_step_previews`; adjacent to but separate from `cooking_steps`.
**Prompt/model/evaluator versions:** No provider or evaluator run in this intake; source behavior was observed during PR #260 Live Cooking QA.
**Input schema:** Proposed future fixture shape should include accepted recipe context, generated step instruction, provider `actionLabel` when present, client-rendered fallback label when relevant, step index, sibling label list, and preview-card fit constraints.
**Sample size:** 11 redacted label examples or patterns: 6 preferred labels, 4 concrete failed labels, and 1 duplicate-label pattern.
**Positive definition:** A label passes when it works as a small Live Cooking preview card for a hands-busy cook: usually 2-4 words, 5 only when needed for meaning, no measurements, plain English, semantically tied to the cooking milestone, visually fit for the preview card, and not repeated for distinct recipe milestones.
**Trend tags:** `step-preview-label`, `hands-busy-guidance`, `plain-english`, `measurement-free-label`, `duplicate-label`, `milestone-fit`

## Source Summary

Wilson's PR #260 Live Cooking QA found that some generated step-preview/action labels looked like clipped prompt fragments instead of useful recall cards. The failures are not recipe-suggestion quality failures and are narrower than broad cooking-step safety, sequencing, equipment, or sensory-cue quality. The artifact being evaluated is the small preview/action label shown to a cook in Live Cooking.

The proposed eval family should be distinct from recipe-generation metrics and from the existing broad `cooking_steps` surface. Preferred surface/family name: `live_cooking_step_previews`. `cooking_step_previews` is a plausible shorter alternative, but the preferred name keeps the Live Cooking UI context visible because preview-card fit, sibling-label duplication, and hands-busy recall are part of the quality claim.

This intake does not add fixture schema, public fixtures, judge criteria, provider runs, prompt changes, or production code. It exists so the INIT-001 Phase 4 PR #260 thread can review the boundary before INIT-004 locks a schema or corpus.

## Metrics Summary

| Metric | Value | Calibration status | Notes |
|---|---|---|---|
| Observed pass rate | Not measured | n/a | QA examples are seed evidence, not a scored run. |
| Item-level pass rate | Not measured | n/a | No fixture corpus exists yet. |
| Human label pass rate | Not measured | n/a until human labels exist | Wilson supplied accepted and rejected examples, but no full labeled dataset. |
| TPR | Not measured | n/a until human labels exist | No judge exists for this surface. |
| TNR | Not measured | n/a until human labels exist | No judge exists for this surface. |
| Corrected pass rate | Not measured | n/a until TPR/TNR valid | Not applicable to this seed. |
| Confidence interval | Not measured | n/a | Not applicable to this seed. |

## Failure / Learning Clusters

| Cluster | Evidence | Criterion family | Proposed deterministic check | Proposed judge or human label | Product / prompt implication |
|---|---|---|---|---|---|
| Measurement or fragment-first labels | Bad examples: `Bring 4 Cups`, `Add Cold Cooked` | Step-preview label clarity | Flag digits, common measurement units, and labels missing an object noun after adjectives like `cold` or `cooked`. | Human or narrow judge label for whether the phrase reads as a complete plain-English recall card. | Label generation should summarize the action, not copy the first tokens of the instruction. |
| Ungrammatical or missing connective words | Bad example: `Push Vegetables Side` | Plain-English label quality | Limited deterministic detection for known preposition/adverb omissions such as `aside`; otherwise use human labels. | Human or narrow judge label for grammatical plain English. | The label should include needed nouns, prepositions, or adverbs even within a tight word budget. |
| Wrong cooking milestone | Bad example: `Heat Oil Butter` when the useful milestone was cooking vegetables | Milestone fit | No reliable deterministic check beyond comparing source step ingredients/action terms. | Human or narrow judge label for whether the label names the user's real mid-step milestone. | Prompt examples should prefer the cook's next meaningful action/result over incidental setup words. |
| Repeated generic labels for distinct steps | Bad pattern: multiple `Cook Vegetables` cards for different fried-rice milestones | Sibling-label distinction | Deterministically flag exact repeated labels in the same recipe unless fixture marks the repeated action as intentionally identical. | Human label for whether near-duplicates are acceptable in context. | Fixtures should include sibling label lists, not only isolated labels. |
| Preview-card length and fit | Bad labels tend to be clipped or low-information; acceptance direction is usually 2-4 words, 5 only if needed | Preview-card fit | Count words and flag labels over 5 words or with likely truncation risk; pair with UI/card constraints later if measurable. | Human label for whether the phrase is concise without losing meaning. | Eval should protect the small-card UI affordance, not only semantic correctness. |

## Positive Examples Worth Preserving

| Example | Why it passed | Regression risk if over-corrected |
|---|---|---|
| `Boil Water` | Short, complete, action-oriented, and removes the distracting quantity from the failed `Bring 4 Cups` label. | Overzealous ingredient naming could make simple actions longer than useful. |
| `Cook Leek & Spinach` | Names the actual cooking milestone and the key ingredients. | A no-ingredient rule would erase useful recall detail. |
| `Push Vegetables Aside` | Complete plain-English phrase with the needed adverb. | A strict word-count-only check might accept the broken shorter phrase. |
| `Add Cold Rice` | Keeps the necessary noun while staying compact. | A measurement/descriptor filter must not remove useful descriptors like `cold` when they complete meaning. |
| `Season Fried Rice` | Distinguishes a later milestone from generic cooking. | Generic deduping without semantic review could miss useful stage-specific labels. |
| `Serve Fried Rice` | Clear completion action and distinct final milestone. | A label generator focused only on cooking actions might under-label serving/plating steps. |

## Fixture Candidates

| Candidate | Source id / description | Intended criterion | Raw-data handling |
|---|---|---|---|
| `live-cooking-step-preview-boil-water` | Synthetic boiling-water step with failed `Bring 4 Cups` and expected `Boil Water` | Measurement-free concise action label | Public synthetic fixture only. |
| `live-cooking-step-preview-leek-spinach` | Synthetic vegetable-cooking step with failed `Heat Oil Butter` and expected `Cook Leek & Spinach` | Milestone fit | Public synthetic fixture only. |
| `live-cooking-step-preview-push-aside` | Synthetic fried-rice step with failed `Push Vegetables Side` and expected `Push Vegetables Aside` | Plain-English label quality | Public synthetic fixture only. |
| `live-cooking-step-preview-add-rice` | Synthetic fried-rice step with failed `Add Cold Cooked` and expected `Add Cold Rice` or `Add Rice` | Complete noun phrase | Public synthetic fixture only. |
| `live-cooking-step-preview-sibling-dedup` | Synthetic multi-step fried-rice label list with repeated `Cook Vegetables` for distinct milestones | Sibling-label distinction | Public synthetic fixture only. |

## Open Questions / Deferrals

- Wilson should route this plan back to the INIT-001 Phase 4 PR #260 Codex thread for peer review before INIT-004 locks the eval schema, fixture corpus, or exact surface id.
- Confirm whether the canonical eval family should be `live_cooking_step_previews` or `cooking_step_previews`; this intake recommends `live_cooking_step_previews`.
- Confirm whether the first implementation should be deterministic regression fixtures only, a Wilson-labeled calibration set, a narrow LLM judge criterion, or a combination. This intake recommends a combination: deterministic checks for length/measurements/duplicates plus human labels for milestone fit and plain-English quality, with any LLM judge marked uncalibrated until TPR/TNR exist.
- Confirm the exact fixture fields after PR #260 settles the runtime source of truth for provider `actionLabel` versus client fallback labels.
- Do not update production prompts beyond PR #260 examples or mix this lane into recipe-generation quality metrics without explicit Wilson approval.
