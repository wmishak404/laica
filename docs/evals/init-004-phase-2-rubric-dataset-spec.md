# INIT-004 Phase 2 - Rubric and Dataset Spec

**Status:** Draft for Wilson review
**Initiative:** [INIT-004](../../initiatives/INIT-004-ai-output-quality-evals.md)
**Date:** 2026-06-10
**Owner:** Wilson / Codex / Claude / Replit
**Applies to:** Recipe suggestions, Chef It Up pantry recipes, Slop Bowl, and cooking-step generation

## Summary

This draft turns the Phase 1 audit into an implementation contract for the first eval harness. It is intentionally not harness code: Phase 3 remains blocked until Wilson accepts or revises the feature taxonomy, output-quality privacy posture, rubric, fixture format, and first human-label target set.

## Review Decisions

The recommended Phase 2 decisions are:

1. Split eval/reporting feature IDs from prompt-management feature IDs.
2. Treat `pantry_recipes` and `slop_bowl` as first-class eval/reporting surfaces.
3. Keep prompt activation conservative: do not add automatic or immediate DB prompt activation for `pantry_recipes` or `slop_bowl` in the Phase 3 harness slice.
4. Treat user max cook time as a hard ceiling for deterministic evals unless Wilson explicitly accepts a product exception.
5. Commit only synthetic, summarized, or redacted fixture data. Do not commit raw `ai_interactions` rows, raw admin eval rows, raw production/staged samples, raw user prompts, pantry labels from users, full model outputs from users, images, audio, transcripts, auth data, or secrets.

## Feature Taxonomy

Current code couples `FeatureType` to both eval criteria and prompt management. Phase 3 should split that into two concepts before expanding coverage:

| Type | Purpose | Phase 2 draft values |
|---|---|---|
| `EvalFeatureType` | Eval queueing, deterministic checks, criterion labels, reporting, fixture routing | `recipe_suggestions`, `pantry_recipes`, `slop_bowl`, `cooking_steps`, `cooking_assistance` |
| `PromptFeatureType` | DB-backed prompt lookup, prompt history, prompt generation/save/activation | Keep current prompt-managed set unless a later prompt-candidate phase explicitly adds more: `recipe_suggestions`, `cooking_steps`, `cooking_assistance` |

### Surface Mapping

| Product surface | Canonical eval feature | Prompt source in Phase 3 | Reporting scope |
|---|---|---|---|
| General recipe suggestions from `/api/recipes/suggestions` | `recipe_suggestions` | Existing `recipe_suggestions` prompt | V1 |
| Chef It Up pantry recipes from `/api/recipes/pantry` | `pantry_recipes` | Existing `recipe_suggestions` prompt until a later prompt split is accepted | V1 |
| Slop Bowl from `/api/recipes/slop-bowl` | `slop_bowl` | Existing hardcoded Slop Bowl prompt per accepted Slop Bowl v1 direction | V1 |
| Cooking steps from `/api/cooking/steps` | `cooking_steps` | Existing `cooking_steps` prompt | V1 |
| Cooking assistance from `/api/cooking/assistance` | `cooking_assistance` | Existing `cooking_assistance` prompt | Infrastructure only unless Wilson pulls it into V1 reporting |

### Implementation Implications For Phase 3

- Add first-class eval criteria for `pantry_recipes` and `slop_bowl`.
- Log `/api/recipes/pantry` interactions as `pantry_recipes` instead of folding them into `recipe_suggestions`, or record a separate eval surface while preserving prompt reuse.
- Keep `slop_bowl` eval/reporting support separate from prompt activation. Phase 3 can evaluate Slop Bowl output quality without adding DB prompt overrides.
- Update stale `shared/schema.ts` comments that list only the original feature IDs.
- Admin prompt endpoints should not be the source of truth for eval feature taxonomy. If they keep prompt activation, they should validate `PromptFeatureType`, not `EvalFeatureType`.

## Output-Quality Privacy Posture

INIT-004 output-quality evals use richer generated content than INIT-002 operational telemetry, so the rule is stricter for repo artifacts than for local/admin inspection.

| Source or artifact | Allowed in repo? | Handling rule |
|---|---|---|
| Legacy OpenAI Platform export | No raw export | Keep local/external. Commit only summaries, source IDs, cluster descriptions, synthetic fixtures, or redacted excerpts approved for repo use. |
| Arize open-coding notes | No raw table beyond existing summaries | Preserve normalized clusters and synthetic fixture candidates. Do not expand raw user payloads in repo docs. |
| Existing `ai_interactions.input_data` / `output_data` rows | No raw rows | Inspect locally or in Replit admin when needed. Commit only derived labels, aggregate metrics, or synthetic/redacted fixture versions. |
| Admin eval failed interaction rows | No raw rows | Treat as internal tooling output. Do not paste raw `inputData` or `outputData` into PRs, handoffs, docs, or fixtures. |
| Production/staged samples | Not by default | Daily reports may store aggregate rates, counts, cluster IDs, and synthetic examples. Raw examples require a separate accepted privacy/source decision. |
| Wilson human labels | Yes, if normalized | Commit criterion labels, rationale summaries, source references, and synthetic/redacted fixture inputs; do not require raw payloads in repo. |
| Synthetic fixtures | Yes | Preferred default for golden/regression fixtures. Synthetic data should preserve the failure shape without copying a user's exact pantry, prompt, or model output. |
| Redacted fixtures | Yes, with review | Allowed only when redaction removes user-identifying or unusually specific content and the fixture is still useful. |

Retention and logging inherit the current 90-day AI interaction direction from the mobile-refresh AI privacy rules. Durable fixtures can outlive 90 days only when they are synthetic, summarized, or explicitly approved redacted examples.

## Fixture Format

Phase 3 should introduce repo fixtures under `docs/evals/fixtures/` or an equivalent harness-readable path after this spec is accepted. Each fixture should be one current product contract, not a raw platform export.

Recommended fixture shape:

```json
{
  "id": "fixture-id",
  "surface": "pantry_recipes",
  "sourceRefs": ["eff-022-thai-request"],
  "privacyClass": "synthetic",
  "input": {
    "preferences": "summarized or synthetic current app request string",
    "ingredients": ["synthetic pantry item"],
    "equipment": ["synthetic equipment item"],
    "timeMaxMinutes": 30,
    "skill": "beginner",
    "cuisines": ["Thai"]
  },
  "expectedContract": {
    "responseShape": "recipes_array",
    "recipeCount": 3,
    "maxCookTimeMinutes": 30
  },
  "humanLabels": {
    "structure_contract": "pending",
    "max_time_adherence": "pending",
    "pantry_grounding": "pending",
    "cuisine_fit": "pending"
  },
  "notes": "short non-sensitive rationale"
}
```

Allowed label values for v1:

- `pass`
- `fail`
- `not_applicable`
- `pending`
- `needs_wilson`

`pending` means the fixture is selected but not yet human-labeled. `needs_wilson` means the output depends on an unresolved product rule, such as cuisine fallback copy.

## Criterion Labels

Phase 2 uses criterion-level labels rather than one aggregate "good/bad" label.

| Label | Applies to | Definition | First check type |
|---|---|---|---|
| `structure_contract` | All V1 surfaces | Output is valid JSON where required, matches the current route response shape, includes required fields, and can render in the app. | Deterministic |
| `suggestion_count` | `recipe_suggestions`, `pantry_recipes` | Response contains exactly three recipe suggestions. | Deterministic |
| `max_time_adherence` | Recipe and cooking-step surfaces with a time bound | Returned `cookTime` and generated steps do not exceed the user's max time. Draft recommendation: user max is a hard ceiling, not a rounding target that may be exceeded. | Deterministic first; human for ambiguous prep/cook split |
| `pantry_grounding` | Recipe surfaces | The core recipe works from pantry/confirmed-staple ingredients and does not invent required items. | Deterministic ingredient-contract checks plus human/judge |
| `optional_ingredient_contract` | Recipe surfaces | `additionalIngredientsNeeded` contains only optional enhancements, is minimal, uses bare ingredient names, and is not required by instructions. | Deterministic plus focused human/judge |
| `cuisine_fit` | Recipe surfaces with cuisine preferences | Output visibly honors selected cuisine direction or clearly signals a pantry-flexible fallback when pantry evidence is weak. | Human/judge |
| `inspired_or_fusion_labeling` | Recipe surfaces | Inspired/adapted/fusion dishes are named honestly without implying unavailable cuisine picker options or overclaiming authenticity. | Human/judge |
| `recipe_usefulness` | Recipe surfaces | Dish is coherent, practical, appropriately ranked/diverse, and worth presenting to the user. | Human/judge |
| `food_safety` | Recipe and cooking-step surfaces | Raw meat, poultry, egg, leftovers, allergen, and storage risks include safe handling and doneness cues appropriate to the context. | Human/judge plus targeted deterministic flags |
| `skill_fit` | Recipe and cooking-step surfaces | Complexity, technique, detail, and assumptions match the user's cooking proficiency. | Human/judge |
| `equipment_fit` | Cooking-step and recipe surfaces with equipment context | Required equipment is available or a safe common alternative is provided. | Deterministic equipment-term flags plus human/judge |
| `cooking_step_sequence` | `cooking_steps` | Steps are ordered logically, align with the accepted recipe, and include visual/sensory cues where judgment is required. | Human/judge with deterministic flags |
| `judge_calibration` | Judge runs and reports | Judge metrics are compared against human labels with TPR/TNR before being treated as quality estimates. | Reporting/calibration |

## First Wilson-Label Target Set

The first human-label batch should stay small and targeted. These fixtures should be synthetic or summarized unless Wilson explicitly approves a redacted source fixture.

| Seed id | Source | Surface | Why include it | Labels to prioritize |
|---|---|---|---|---|
| `openai-max-time-25-to-30` | OpenAI Platform seed | `recipe_suggestions` | Known max-time miss where a 25-minute max returned 30 minutes. | `max_time_adherence`, `structure_contract` |
| `openai-invalid-json-pass` | OpenAI Platform seed | `recipe_suggestions` | Known invalid JSON that still passed LLM judges. | `structure_contract`, `judge_calibration` |
| `openai-representative-pass` | OpenAI Platform seed | `recipe_suggestions` | Positive fixture so prompt fixes do not over-correct. | `pantry_grounding`, `recipe_usefulness` |
| `arize-beef-doneness` | Arize seed | `pantry_recipes` or `cooking_steps` | Raw beef guidance was too weak. | `food_safety`, `skill_fit` |
| `arize-chicken-doneness` | Arize seed | `pantry_recipes` or `cooking_steps` | Chicken recipe needed clearer doneness and overcooking guidance. | `food_safety`, `skill_fit`, `cooking_step_sequence` |
| `arize-equipment-lid` | Arize seed | `cooking_steps` | Recipe assumed an unavailable lid without alternative. | `equipment_fit`, `cooking_step_sequence` |
| `arize-beginner-complexity` | Arize seed | `pantry_recipes` or `cooking_steps` | Beginner recipe was too complex. | `skill_fit`, `recipe_usefulness` |
| `eff022-chinese-weak-fit` | EFF-022 | `pantry_recipes` | Selected Chinese preference produced mostly off-cuisine suggestions. | `cuisine_fit`, `pantry_grounding` |
| `eff022-indian-weak-fit` | EFF-022 | `pantry_recipes` | Selected Indian preference produced only one weakly Indian-ish option. | `cuisine_fit`, `inspired_or_fusion_labeling` |
| `eff022-thai-korean-broth-anchor` | EFF-022 | `pantry_recipes` | Strong Korean-labeled pantry item overrode selected Thai preference. | `cuisine_fit`, `pantry_grounding`, `inspired_or_fusion_labeling` |
| `eff022-loco-moco-style-positive` | EFF-022 | `pantry_recipes` | Positive cross-cuisine/adapted pantry transformation candidate. | `inspired_or_fusion_labeling`, `recipe_usefulness`, `pantry_grounding` |
| `slop-bowl-current-shape` | Phase 1 audit | `slop_bowl` | Slop Bowl needs one `{ recipe }` contract fixture before judge work. | `structure_contract`, `pantry_grounding`, `recipe_usefulness` |
| `cooking-steps-generated-context` | Phase 1 audit / PR #144 context | `cooking_steps` | Cooking steps must be evaluated using generated recipe context, not only recipe names. | `structure_contract`, `equipment_fit`, `food_safety`, `cooking_step_sequence` |

## Phase 3 Readiness Gate

Do not start Phase 3 harness code until this Phase 2 draft is accepted or revised with:

- accepted eval feature taxonomy and prompt-feature boundary,
- accepted privacy/source posture,
- accepted fixture format and storage path,
- accepted criterion labels,
- accepted first Wilson-label target set,
- explicit decision on max cook time as hard ceiling vs allowed rounding exception,
- explicit note that EFF-022 product fallback behavior remains unresolved unless Wilson resolves it in review.

## Negative Scope

This spec does not:

- implement deterministic checks,
- change prompts,
- change `ai_interactions` logging behavior,
- change admin APIs,
- add DB schema or migrations,
- commit fixture data,
- run evals,
- resolve EFF-022 cuisine fallback product behavior,
- activate prompt candidates.
