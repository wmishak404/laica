# INIT-004 Phase 2 - Rubric and Dataset Spec

**Status:** Draft revised from Wilson decisions
**Initiative:** [INIT-004](../../initiatives/INIT-004-ai-output-quality-evals.md)
**Date:** 2026-06-10
**Last updated:** 2026-07-07
**Owner:** Wilson / Codex / Claude / Replit
**Applies to:** Recipe suggestions, Chef It Up pantry recipes, Slop Bowl, cooking-step generation, and Live Cooking step-preview labels

## Summary

This spec turns the Phase 1 audit and Wilson's architecture decisions into the implementation contract for the first eval harness. Phase 3 should build from this contract after the revised spec is reviewed and merged.

The core architecture rule is separation of concerns: fixtures preserve the exact request and exact output being evaluated, constraints preserve the structured truth used by deterministic checks, labels preserve Wilson or judge decisions, and provenance records which model/prompt/labeling context produced the evidence. That separation keeps evals replayable and calibratable instead of becoming folklore.

## Review Decisions

Accepted Phase 2 decisions:

1. Split eval/reporting feature IDs from prompt-management feature IDs.
2. Treat `chef_it_up_suggestions` and `slop_bowl_suggestions` as first-class eval/reporting surfaces.
3. Keep prompt activation conservative: do not add automatic or immediate DB prompt activation for `chef_it_up_suggestions` or `slop_bowl_suggestions` in the Phase 3 harness slice.
4. Use a deterministic max-time band, not a hard ceiling: `max_time_adherence` passes when `cookTime <= selectedMax + 15` minutes. "Got all the time" has no bound.
5. Add `dietary_compliance`; dietary restrictions override preferences when labels conflict.
6. Drop nutrition-preference fit from the rubric because nutrition is not a current product input.
7. Use a two-tier fixture storage model: public synthetic/redacted derivatives in repo; raw real durable gold fixtures only in a gitignored private local directory outside worktrees.
8. Keep `cooking_assistance` in the taxonomy and current criteria, but outside V1 reporting and the first Wilson labeling budget unless a later trigger pulls it in.
9. Keep EFF-022 cuisine fallback behavior explicitly open. The eval harness measures pantry grounding, cuisine fit, and inspired/fusion labeling; it does not decide the product fallback rule.
10. Treat eval artifacts as offline evidence only. Real user input/output may teach a pattern, but must never become live runtime memory, production prompt material, another user's context, user-facing records, or GitHub-visible fixture content.

2026-06-23 taxonomy clarification: Wilson accepted renaming the recipe-generation eval surfaces before daily reports launch. The canonical eval/reporting ids are now `chef_it_up_suggestions` for `/api/recipes/pantry` and `slop_bowl_suggestions` for `/api/recipes/slop-bowl`. Legacy rows or fixtures with `pantry_recipes` and `slop_bowl` must normalize into those canonical ids so historical eval data remains readable without a DB migration.

2026-06-30 EFF-022 fallback direction: Wilson accepted transparent pantry fallback as the preferred behavior when a selected cuisine is weakly supported by the user's pantry. Laica may ask about a few missing staples first, but if the user does not add them, the product should explain the pantry limitation and continue with honest pantry-first suggestions instead of silently replacing the selected cuisine or defaulting to `No preference`. The exact activation threshold and copy remain EFF-022 implementation work, deferred until after higher-priority INIT-001 work.

2026-07-07 Phase 3 extension: Phase 4 peer review accepted `live_cooking_step_previews` as a distinct eval family for the small Live Cooking preview/action-label artifact. This surface stays separate from recipe-generation metrics and broad `cooking_steps` safety/sequence metrics. V1 fixtures are synthetic/redacted only and capture both provider and final rendered behavior so future reports can distinguish model label failures from client fallback rescues. After PR #260 merged, the synthetic rendering constraints were aligned to the merged runtime limits of 5 words and 24 characters.

## Feature Taxonomy

Current code couples `FeatureType` to both eval criteria and prompt management. Phase 3 should split that into two concepts before expanding coverage:

| Type | Purpose | Phase 2 values |
|---|---|---|
| `EvalFeatureType` | Eval queueing, deterministic checks, criterion labels, reporting, fixture routing | `recipe_suggestions`, `chef_it_up_suggestions`, `slop_bowl_suggestions`, `cooking_steps`, `live_cooking_step_previews`, `cooking_assistance` |
| `PromptFeatureType` | DB-backed prompt lookup, prompt history, prompt generation/save/activation | Keep current prompt-managed set unless a later prompt-candidate phase explicitly adds more: `recipe_suggestions`, `cooking_steps`, `cooking_assistance` |

Phase 3 should derive `AiErrorFeature`, `EvalFeatureType`, and `PromptFeatureType` from a canonical feature-id module instead of copying hand-written literal arrays into admin Zod schemas, evaluator code, and prompt-management code.

### Surface Mapping

| Product surface | Canonical eval feature | Prompt source in Phase 3 | Reporting scope |
|---|---|---|---|
| General recipe suggestions from `/api/recipes/suggestions` | `recipe_suggestions` | Existing `recipe_suggestions` prompt | V1 |
| Chef It Up pantry recipes from `/api/recipes/pantry` | `chef_it_up_suggestions` | Existing `recipe_suggestions` prompt until a later prompt split is accepted | V1 |
| Slop Bowl from `/api/recipes/slop-bowl` | `slop_bowl_suggestions` | Existing hardcoded Slop Bowl prompt per accepted Slop Bowl v1 direction | V1 |
| Cooking steps from `/api/cooking/steps` | `cooking_steps` | Existing `cooking_steps` prompt | V1 |
| Live Cooking step-preview/action labels | `live_cooking_step_previews` | Existing `cooking_steps` prompt or client fallback source; prompt activation still belongs to the prompt-managed `cooking_steps` path unless a later prompt-candidate phase splits it | V1 fixture lane; judge criteria uncalibrated |
| Cooking assistance from `/api/cooking/assistance` | `cooking_assistance` | Existing `cooking_assistance` prompt | Infrastructure only in V1 |

`cooking_assistance` keeps logging and existing `EVAL_CRITERIA`, but V1 reporting and Wilson labeling exclude it because the seed data has no assistance failures, the output is free text with no deterministic response contract, and the safety-critical content mostly originates in `cooking_steps`. Pull it into reporting if INIT-002 clusters, user feedback, or calibrated recipe-surface judges show assistance failures.

### Eval Seam

The first executable harness should evaluate at the generation-function layer, not the HTTP route layer:

- `getRecipeSuggestions`
- `getSlopBowlRecipe`
- `getCookingSteps`

This seam avoids auth/profile scaffolding, focuses on the model contract, and leaves route-boundary regression to EFF-017. Route tests can still cover logging, queue insertion, auth, and request validation separately.

## Output-Quality Privacy Posture

INIT-004 output-quality evals use richer generated content than INIT-002 operational telemetry. Public repo artifacts must therefore be stricter than local/admin inspection.

Three artifact classes have different homes:

| Artifact class | Contains | Home | Visibility |
|---|---|---|---|
| Raw real interaction row | Customer recipe, pantry/preference input, generated output | Replit/admin `ai_interactions`, redacted at write where current logging supports it and pruned by policy | Internal only; never committed |
| Durable private gold fixture | Real or staged output plus Wilson labels, retained for calibration past normal interaction retention | Gitignored local directory outside any worktree, referenced by `LAICA_PRIVATE_EVAL_DIR` | Internal only; never committed |
| Public regression fixture | Synthetic or reviewed redacted derivative plus labels/metrics safe for repo | `docs/evals/fixtures/` and linked reports | Public repo |

Public repo handling rules:

| Source or artifact | Allowed in repo? | Handling rule |
|---|---|---|
| Legacy OpenAI Platform export | No raw export | Keep local/external. Commit only summaries, source IDs, cluster descriptions, synthetic fixtures, or reviewed redacted excerpts. |
| Arize open-coding notes | No raw table beyond existing summaries | Preserve normalized clusters and synthetic fixture candidates. Do not expand raw user payloads in repo docs. |
| Existing `ai_interactions.input_data` / `output_data` rows | No raw rows | Inspect locally or in Replit/admin when needed. Commit only derived labels, aggregate metrics, or synthetic/redacted fixture versions. |
| Admin eval failed interaction rows | No raw rows | Treat as internal tooling output. Do not paste raw `inputData` or `outputData` into PRs, handoffs, docs, or public fixtures. |
| Production/staged samples | Not by default | Daily reports may store aggregate rates, counts, cluster IDs, and synthetic examples. Raw examples require a separate accepted privacy/source decision. |
| Wilson human labels | Yes, when normalized | Commit criterion labels, rationale summaries, source references, and synthetic/redacted fixture inputs. Raw payloads belong only in the private fixture directory. |
| Synthetic fixtures | Yes | Preferred default for public golden/regression fixtures. Preserve the failure shape without copying a user's exact pantry, prompt, or model output. |
| Redacted fixtures | Yes, with review | Allowed only when redaction removes user-identifying or unusually specific content and the fixture is still useful. |
| Raw private fixtures | No | Must live under `LAICA_PRIVATE_EVAL_DIR`; public fixtures may link to them only by a non-sensitive `derivedFrom` id. |

Private fixture rules:

- `LAICA_PRIVATE_EVAL_DIR` points to a gitignored local directory outside any git worktree, similar in spirit to `.env.keys` handling. This prevents worktree cleanup from deleting the private gold set.
- Private fixtures use the same schema as public fixtures, with `privacyClass: "raw_private"`.
- Public synthetic/redacted twins should carry `derivedFrom: "<private-id>"` so the public regression case can be traced to the private failure without exposing it.
- Durable private gold fixtures intentionally retain already identity-redacted real outputs past the 90-day interaction-retention window. This is a narrow exception for a small, access-controlled calibration set; do not broaden it without a privacy decision.
- Wilson accepted the tradeoff that private labels are local, not CI-visible, and depend on the local directory being backed up or synced. Public synthetic fixtures remain the CI-visible regression set.

Leak guards required in Phase 3:

1. Add `.gitignore` coverage for the in-repo fallback private fixture path name as defense in depth.
2. Add a CI/local fixture-privacy check that fails if any committed fixture has `privacyClass: "raw_private"` or if committed `output` text fails a redaction scan.

Judge and provider runs may send fixture content to providers only in a named eval lane with model/prompt/evaluator provenance and negative scope recorded per [Testing and Acceptance Workflow](../workflows/testing-and-acceptance.md) and [Evaluation Workflow](../workflows/evaluations.md).

### Cross-User Bleed Prevention

The eval system must not become an accidental cross-user memory path. A real user's input/output may teach Laica a pattern, but it must not be retrievable by live generation or exposed to another user.

Hard rules:

- Eval fixtures, labels, reports, and private gold examples are offline evidence. They are not runtime memory, retrieval context, or user-facing content.
- The live app must not query `docs/evals/fixtures/`, `LAICA_PRIVATE_EVAL_DIR`, eval reports, private gold fixtures, or admin eval rows while generating a user's response.
- Raw or redacted private examples must not be embedded directly into production prompts or prompt candidates. Prompt candidates may use generalized lessons or synthetic examples only.
- Eval runs must not write fixture outputs into user-facing tables such as pantry, profile, recipe history, cooking sessions, feedback, or saved recipes.
- Eval runners should be stateless per fixture: no shared browser state, localStorage, sessionStorage, user cache, model thread, or chat context may carry one fixture's request/output into the next fixture.
- Private eval tooling must not print raw private fixture content to CI logs, PR comments, handoffs, public reports, or terminal output likely to be copied into GitHub.
- Public fixture identifiers must avoid real database ids, request ids, user ids, feedback ids, emails, exact private timestamps, or other values that link a public case back to a specific user row.
- Reports should publish aggregate rates, fixture ids, and synthetic examples. Private real examples can be cited only through non-sensitive private ids.

Safe flow:

```text
real user row -> private inspection -> private gold fixture when needed
private gold fixture -> synthetic/redacted public twin -> CI regression fixture
```

Forbidden flow:

```text
real user row -> GitHub fixture/report -> production prompt/runtime memory -> another user
```

## Fixture Format

Phase 3 should introduce canonical public fixtures under `docs/evals/fixtures/`. The harness and tests should read from that one repo path; do not create a second canonical copy under `tests/`.

A fixture is one saved scenario: exact input, exact output, structured constraints, labels, and provenance. Labels attach to a specific `output`; an output-free scenario may exist only while it is unlabeled.

Recommended fixture shape:

```jsonc
{
  "id": "eff022-thai-korean-broth-anchor",
  "surface": "chef_it_up_suggestions",
  "privacyClass": "synthetic",
  "roles": ["regression", "calibration-probe"],
  "sourceRefs": ["eff-022-thai-request"],
  "derivedFrom": "priv-2026-06-xx-001",
  "request": {
    "preferences": "Time available: 30 minutes or less. Cooking skill: intermediate. Preferred cuisines: Thai. Dietary restrictions: gluten-free. ...",
    "ingredients": ["korean beef bone broth", "raw sausages", "leeks", "fish sauce", "butter"]
  },
  "constraints": {
    "maxTimeMinutes": 30,
    "cuisines": ["Thai"],
    "skill": "intermediate",
    "dietaryRestrictions": ["gluten-free"],
    "equipment": []
  },
  "output": "{\"recipes\":[{\"recipeName\":\"Hearty Korean-Style Sausage & Leek Stew\"}]}",
  "outputProvenance": {
    "kind": "synthetic",
    "model": "gpt-4.1",
    "promptVersion": "default",
    "capturedAt": "2026-06-13"
  },
  "labels": {
    "structure_contract": "pass",
    "max_time_adherence": "pass",
    "cuisine_fit": "fail",
    "inspired_or_fusion_labeling": "blocked_on_product_rule"
  },
  "labelProvenance": {
    "labeledBy": "wilson",
    "labeledAt": "pending"
  },
  "notes": "Strong Korean-labeled pantry item overrode the selected Thai preference."
}
```

Required fixture semantics:

- `output` is a raw string governed by `privacyClass`, required once any label is not `pending`. Raw string is necessary because malformed JSON must remain malformed for `structure_contract` checks.
- `request` is byte-faithful to what the generation surface receives. For pantry recipes, the real route receives `ingredients` and packed free-text `preferences`; skill, cuisines, dietary restrictions, and time are embedded in that string.
- `constraints` is structured ground truth for deterministic checks. It may duplicate facts from the packed request because the checker needs stable data without re-parsing prose.
- Per-surface request schemas differ:
  - `recipe_suggestions` / `chef_it_up_suggestions`: packed `preferences` plus `ingredients`.
  - `slop_bowl_suggestions`: `SlopBowlInput`.
  - `cooking_steps`: `{ recipeName, ingredients?, equipment?, description? }`.
  - `live_cooking_step_previews`: accepted recipe context plus rendered preview output containing step instruction, step index, raw provider `actionLabel`, client-normalized provider label when applicable, client fallback-derived label, final rendered preview/headline label, sibling labels before/after rendering, and first-pass card constraints such as word/character limits.
- `outputProvenance.kind` should distinguish `captured`, `synthetic`, `redacted`, or `authored-regression` so future reviewers do not confuse synthetic examples with real captured model evidence.
- `roles` may include `regression`, `calibration-probe`, and `positive-guard`. Calibration status belongs to eval reports, not to a criterion label.
- `derivedFrom` is optional and non-sensitive; use it to link a public synthetic/redacted fixture to a private fixture id.

Allowed label values for v1:

- `pass`
- `fail`
- `not_applicable`
- `pending`
- `blocked_on_product_rule`

`pending` means the fixture is selected but not yet labeled. `blocked_on_product_rule` means the output depends on an unresolved product rule, such as EFF-022 cuisine fallback behavior.

Deterministic checks should import shared schemas instead of re-encoding contracts per fixture. Phase 3 should export/move `slopBowlRecipeSchema`, codify the `recipes[]` contract for recipe surfaces, and author a cooking-steps response schema because `getCookingSteps` currently parses JSON without a matching shared response schema.

## Criterion Labels

Phase 2 uses criterion-level labels rather than one aggregate "good/bad" label.

| Label | Applies to | Definition | First check type |
|---|---|---|---|
| `structure_contract` | All V1 surfaces | Output is valid JSON where required, matches the current response shape, includes required fields, and can render in the app. | Deterministic |
| `suggestion_count` | `recipe_suggestions`, `chef_it_up_suggestions` | Response contains exactly three recipe suggestions. | Deterministic |
| `max_time_adherence` | Recipe surfaces with a time bound | Returned `cookTime` is less than or equal to `constraints.maxTimeMinutes + 15`. "Got all the time" is unbounded. Cooking steps are `not_applicable` unless a later contract carries a time bound. | Deterministic |
| `dietary_compliance` | Recipe and cooking-step surfaces with a stated restriction | Output does not violate stated dietary restrictions. Dietary violations fail even if other preference labels pass. | Human/judge plus deterministic flags for detectable terms |
| `pantry_grounding` | Recipe surfaces | The core recipe works from pantry/confirmed-staple ingredients and does not invent required items. | Deterministic ingredient-contract checks plus human/judge |
| `optional_ingredient_contract` | Recipe surfaces | `additionalIngredientsNeeded` contains only optional enhancements, is minimal, uses bare ingredient names, and is not required by instructions. | Deterministic plus focused human/judge |
| `cuisine_fit` | Recipe surfaces with cuisine preferences | Output visibly honors selected cuisine direction. Transparent pantry fallback can satisfy the product direction only when the fallback is explicit; use `blocked_on_product_rule` for cases whose verdict depends on the still-deferred activation threshold or copy. | Human/judge |
| `inspired_or_fusion_labeling` | Recipe surfaces | Inspired/adapted/fusion dishes are named honestly without implying unavailable cuisine picker options or overclaiming authenticity. | Human/judge |
| `recipe_usefulness` | Recipe surfaces | Dish is coherent, practical, appropriately ranked/diverse, and worth presenting to the user. | Human/judge |
| `food_safety` | Recipe and cooking-step surfaces | Raw meat, poultry, egg, leftovers, allergen, and storage risks include safe handling and doneness cues appropriate to the context. | Human/judge plus targeted deterministic flags |
| `skill_fit` | Recipe and cooking-step surfaces | Complexity, technique, detail, and assumptions match the user's cooking proficiency. | Human/judge |
| `equipment_fit` | `slop_bowl_suggestions`, `cooking_steps` | Required equipment is available or a safe common alternative is provided. V1 does not score equipment fit for pantry/generic recipe suggestions because those surfaces do not currently receive structured equipment context. | Deterministic equipment-term flags plus human/judge |
| `cooking_step_sequence` | `cooking_steps` | Steps are ordered logically, align with the accepted recipe, and include visual/sensory cues where judgment is required. | Human/judge with deterministic flags |
| `step_preview_word_count` | `live_cooking_step_previews` | Final rendered preview/headline labels fit first-pass small-card text constraints: usually 2-4 words, 5 max only when needed, with optional character limits. | Deterministic |
| `step_preview_measurement_free` | `live_cooking_step_previews` | Final rendered preview/headline labels avoid measurements, quantities, and numeric fragments. | Deterministic |
| `step_preview_distinctness` | `live_cooking_step_previews` | Final rendered sibling labels do not repeat for distinct recipe milestones. | Deterministic for exact duplicates; human/judge for near-duplicates |
| `step_preview_plain_english` | `live_cooking_step_previews` | Labels read as idiomatic plain English and include needed nouns, prepositions, or adverbs. | Human/judge |
| `step_preview_milestone_fit` | `live_cooking_step_previews` | Labels name the actual cooking milestone rather than incidental setup text or clipped instruction fragments. | Human/judge |
| `step_preview_provider_label_quality` | `live_cooking_step_previews` | The raw provider `actionLabel` is independently usable before client rescue. | Human/judge plus deterministic flags where practical |
| `step_preview_rendered_label_quality` | `live_cooking_step_previews` | The final rendered label is usable as a hands-busy recall card after client normalization/fallback. | Human/judge plus deterministic checks |

Nutrition-preference fit is excluded, not deferred. Current client UI, routes, and `shared/schema.ts` have no nutrition field. The stale `DEFAULT_RECIPE_SUGGESTIONS_PROMPT` line claiming a nutritional preference, plus stale equipment language for surfaces that do not send equipment, are Phase 6 / EFF-022 prompt-cleanup notes rather than Phase 3 harness fixes.

Judge calibration is a run/reporting concern. Phase 4 should compare judge verdicts to Wilson labels with TPR/TNR, but `judge_calibration` is not a fixture label.

## First Wilson-Label Target Set

The first human-label batch should stay small and targeted. Public fixtures should be synthetic or reviewed redacted derivatives unless Wilson explicitly approves a private fixture for local-only labeling.

| Seed id | Source | Surface | Why include it | Labels to prioritize | Fixture note |
|---|---|---|---|---|---|
| `openai-max-time-25-to-30` | OpenAI Platform seed | `recipe_suggestions` | Former max-time miss; now a boundary-pass guard under the +15 band. | `max_time_adherence`, `structure_contract` | Re-express in current `recipes[]` shape or mark legacy-only. |
| `openai-invalid-json-pass` | OpenAI Platform seed | `recipe_suggestions` | Known invalid JSON that still passed LLM judges. | `structure_contract` | Keep raw malformed `output` string. Re-express or tag legacy-only. |
| `openai-representative-pass` | OpenAI Platform seed | `recipe_suggestions` | Positive fixture so prompt fixes do not over-correct. | `pantry_grounding`, `recipe_usefulness` | Re-express in current `recipes[]` shape or mark legacy-only. |
| `chef-it-up-suggestions-max-time-30-to-60` | Synthetic | `chef_it_up_suggestions` | True negative under the +15 band: a 30-minute selection returns a 60-minute recipe. | `max_time_adherence`, `structure_contract` | Synthetic required because the 25->30 seeds now pass. |
| `arize-beef-doneness` | Arize seed | `cooking_steps` | Raw beef guidance was too weak. | `food_safety`, `skill_fit`, `cooking_step_sequence` | Use generated recipe context, not only a recipe name. |
| `arize-chicken-doneness` | Arize seed | `cooking_steps` | Chicken recipe needed clearer doneness and overcooking guidance. | `food_safety`, `skill_fit`, `cooking_step_sequence` | Use generated recipe context. |
| `arize-equipment-lid` | Arize seed | `cooking_steps` | Recipe assumed an unavailable lid without alternative. | `equipment_fit`, `cooking_step_sequence` | Cooking-step surface only in V1. |
| `arize-beginner-complexity` | Arize seed | `cooking_steps` | Beginner instructions were too complex. | `skill_fit`, `recipe_usefulness`, `cooking_step_sequence` | Resolve as cooking-step complexity, not recipe-surface ranking. |
| `arize-dietary-halal-or-keto` | Arize seed | `chef_it_up_suggestions` | Adds dietary-compliance coverage with the dietary-overrides-preferences rule. | `dietary_compliance`, `recipe_usefulness`, `pantry_grounding` | Use one current-shape synthetic/redacted seed. |
| `eff022-chinese-weak-fit` | EFF-022 | `chef_it_up_suggestions` | Selected Chinese preference produced mostly off-cuisine suggestions. | `cuisine_fit`, `pantry_grounding` | Fallback direction accepted; activation threshold and copy deferred. |
| `eff022-indian-weak-fit` | EFF-022 | `chef_it_up_suggestions` | Selected Indian preference produced only one weakly Indian-ish option. | `cuisine_fit`, `inspired_or_fusion_labeling` | Fallback direction accepted; activation threshold and copy deferred. |
| `eff022-thai-korean-broth-anchor` | EFF-022 | `chef_it_up_suggestions` | Strong Korean-labeled pantry item overrode selected Thai preference. | `cuisine_fit`, `pantry_grounding`, `inspired_or_fusion_labeling` | Fallback direction accepted; good calibration probe for request/constraints/output split. |
| `eff022-loco-moco-style-positive` | EFF-022 | `chef_it_up_suggestions` | Positive cross-cuisine/adapted pantry transformation candidate. | `inspired_or_fusion_labeling`, `recipe_usefulness`, `pantry_grounding` | Positive guard. |
| `slop-bowl-suggestions-current-shape` | Phase 1 audit | `slop_bowl_suggestions` | Slop Bowl needs one `{ recipe }` contract fixture before judge work. | `structure_contract`, `pantry_grounding`, `recipe_usefulness` | Await capture or synthetic authoring. |
| `synthetic-negative-slop-bowl-shape` | Synthetic | `slop_bowl_suggestions` | Negative contract fixture for malformed Slop Bowl shape. | `structure_contract` | Synthetic. |
| `cooking-steps-generated-context` | Phase 1 audit / PR #144 context | `cooking_steps` | Cooking steps must be evaluated using generated recipe context, not only recipe names. | `structure_contract`, `equipment_fit`, `food_safety`, `cooking_step_sequence` | Requires authored cooking-steps response schema. |

## Implementation Implications For Phase 3

- Add first-class eval criteria for `chef_it_up_suggestions` and `slop_bowl_suggestions`.
- Log `/api/recipes/pantry` interactions as `chef_it_up_suggestions` instead of folding them into `recipe_suggestions`, or record a separate eval surface while preserving prompt reuse.
- Populate `ai_interactions.prompt_version_id` when touching the logging path so eval evidence can connect outputs to prompt provenance.
- Keep `slop_bowl_suggestions` eval/reporting support separate from prompt activation. Phase 3 can evaluate Slop Bowl output quality without adding DB prompt overrides.
- Feature taxonomy work needs no DB migration because `feature_type` is a free `varchar`; update stale `shared/schema.ts` comments and TypeScript unions instead.
- Admin prompt endpoints should validate `PromptFeatureType`, not `EvalFeatureType`, so expanding eval coverage does not accidentally expand immediate prompt activation.
- Make eval-queue selection criteria-aware. The current submit-all-pending path can be poisoned by any pending feature row without criteria, because `buildEvalPrompt` throws for unsupported feature types. Phase 3 should select only rows whose feature has criteria or route unsupported rows to a clear skipped state.
- Keep eval storage and live product memory separated. Phase 3 fixture loaders, private gold-set readers, and eval reports must be unreachable from normal user-generation paths, and tests should assert that fixture data is not used as runtime retrieval context.
- Make fixture execution isolated per case. Phase 3 should reset any evaluator/model/browser context between fixtures so one fixture's output cannot influence the next fixture's score or generated response.
- Deterministic fixture validation belongs in unit/script lanes. App-regression proof should still use required GitHub `unit` and `e2e_guest_smoke`, but provider-quality and Wilson-labeling evidence are separate eval lanes.

## Phase 3 Readiness Gate

Do not start Phase 3 harness code until this revised Phase 2 spec is accepted and merged with:

- accepted eval feature taxonomy and prompt-feature boundary;
- accepted two-tier privacy/source posture;
- accepted cross-user bleed prevention rule;
- accepted fixture format and storage paths;
- accepted criterion labels;
- accepted first Wilson-label target set;
- accepted +15-minute max-time band;
- explicit note that EFF-022 fallback direction is accepted but the activation threshold and copy remain deferred unless a separate EFF-022 milestone resolves them.

Recommended Phase 3 validation plan:

- Unit/script: fixture schema validation, deterministic contract checks, max-time band check, privacy/leak guard, cross-user bleed guard, feature-id union tests, evaluator queue selection behavior, admin prompt enum separation, and logging provenance.
- GitHub required checks: `unit`, `e2e_guest_smoke`, security/audit/static checks for exact-head app regression evidence. The E2E lane is provider-light and should not be treated as live output-quality proof.
- Eval run lane: Wilson-labeled fixture scoring, judge calibration, TPR/TNR reporting, prompt/model/evaluator provenance, and registry updates.
- Live-provider canary or Replit/local dotenvx eval lane: only for named model-output or provider-quality claims; never silently fold this into routine PR CI.
- Wilson labeling lane: reviewed fixture PR or private gold-set update with registry/handoff evidence.

## Negative Scope

This spec does not:

- implement deterministic checks;
- change prompts;
- change `ai_interactions` logging behavior;
- change admin APIs;
- add DB schema or migrations;
- commit fixture data;
- run evals;
- implement the accepted EFF-022 fallback direction, activation threshold, or user-facing copy;
- activate prompt candidates.
