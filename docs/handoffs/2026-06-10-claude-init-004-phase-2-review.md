# INIT-004 Phase 2 Architecture Review — Claude Response

**Agent:** claude
**Branch:** `codex/init-004-phase-2-spec` (review committed onto the branch under review)
**PR:** [#168](https://github.com/wmishak404/laica/pull/168) (draft)
**Date:** 2026-06-10
**Initiative:** INIT-004
**INIT updated:** no — review feedback only; Codex owns Phase 2 spec revisions and INIT bookkeeping for this branch
**Reviewed head:** `e248660e1dd0a8ee3d` on base `origin/main` at `2abccc7`
**Responds to:** [2026-06-10-codex-init-004-phase-2-claude-architecture-review.md](2026-06-10-codex-init-004-phase-2-claude-architecture-review.md)

## Summary

The Phase 2 foundation is architecturally right: the `EvalFeatureType` / `PromptFeatureType` split, first-class `pantry_recipes` and `slop_bowl` eval surfaces, conservative prompt activation, synthetic-by-default privacy posture, and the measurement-only EFF-022 boundary all check out against current code. I verified each claim in `server/eval-criteria.ts`, `server/evaluator.ts`, `server/openai.ts`, `server/prompt-manager.ts`, `server/admin-routes.ts`, `server/aiErrors.ts`, `shared/schema.ts`, `server/routes.ts`, and `client/src/components/cooking/meal-planning.tsx`.

The spec is **not acceptance-ready as drafted** in two places, both P1: the fixture format cannot support human labels or judge calibration because fixtures carry no model output, and the fixture input shape reintroduces the idealized structured schema that the Phase 1 audit explicitly warned against. A third P1 is rubric completeness: there is no dietary-restriction compliance label, although `dietary_violation` is the most critical error mode in today's `EVAL_CRITERIA`. One implementation-order finding: the current batch evaluator throws on any pending `slop_bowl` interaction, so the taxonomy work is partly a bug fix and should be sequenced first in Phase 3.

None of these change the recommended decisions — they change the fixture format section, the criterion table, and the Phase 3 work order. With those revisions, the spec is a sound Phase 3 contract.

## Findings (severity-ordered)

### P1-1 — Fixtures have no `output` field, so labels and judge calibration have nothing to attach to

Spec §Fixture Format. The fixture shape holds `input`, `expectedContract`, and `humanLabels`, but no model output. Most of the seed set consists of *known outputs* (invalid JSON that passed judges, a 30-minute result against a 25-minute max, weak cuisine-fit suggestion sets). A human label like `max_time_adherence: fail` is meaningless without the output it judges, and TPR/TNR calibration requires judge verdicts and human labels over the *same* outputs. As drafted, the format supports neither the Phase 4 calibration plan nor regression checks against known-bad outputs. Note the `openai-invalid-json-pass` seed forces a storage decision immediately: the output must be storable as a raw string, since it cannot be parsed JSON by definition.

**Recommendation:** add an `output` field (raw string or `{ raw: string }`), governed by the same `privacyClass`, required whenever any label is not `pending`. Alternative: split the format into `case` fixtures (input + contract, for fresh-generation runs) and `labeled example` fixtures (input + output + labels, for calibration/regression). One format with optional `output` is simpler for v1; the two-type split is cleaner if Phase 5 reporting wants to distinguish them. Either resolves the gap.

### P1-2 — Fixture `input` shape contradicts the actual app contract the audit said to test

Spec §Fixture Format vs. INIT-004 Phase 1 audit ("Eval fixtures should test this actual packaged request shape instead of an idealized structured preference schema"). `/api/recipes/pantry` accepts `{ ingredients, preferences?, timeAvailable? }` (`server/routes.ts:458`), and `MealPlanning` packs time, skill, cuisines, confirmed/unconfirmed staples, dietary restrictions, and previous recipe names into the one free-text `preferences` string (`meal-planning.tsx:553-584`). The draft fixture has top-level `equipment`, `timeMaxMinutes`, `skill`, and `cuisines` — fields that surface never receives. A harness built on this shape either tests payloads the product never sends or parses constraints out of free text ad hoc.

**Recommendation:** split the fixture input into `request` (the exact payload for the target seam, faithful to the real contract) and `constraints` (structured ground truth the deterministic checks read: `maxTimeMinutes`, `cuisines[]`, `skill`, `dietaryRestrictions[]`, `equipment[]`). The checks consume `constraints`; the generation/replay path consumes `request`. This also forces a per-surface request schema, which the single recipe-shaped example hides: Slop Bowl's generation input is `SlopBowlInput` (profile-derived ingredients, skill, restrictions, equipment, recent meals), and cooking steps is `{ recipeName, ingredients?, equipment?, description? }`. The spec should also name the eval seam: I recommend the generation-function layer (`getRecipeSuggestions` / `getSlopBowlRecipe` / `getCookingSteps` inputs) rather than the HTTP route, because it is deterministic, needs no auth/profile scaffolding, and the EFF-017 harness already owns route-boundary regression. Tradeoff: route-level fixtures would additionally cover request validation and the `timeAvailable` re-append quirk, but that is regression-test territory, not output-quality territory.

### P1-3 — No dietary-restriction compliance criterion

Spec §Criterion Labels. Current `EVAL_CRITERIA.recipe_suggestions` treats `dietary_violation` (allergies, halal/kosher, celiac) as the most critical, trace-level error; `docs/workflows/evaluations.md` lists dietary restrictions and allergies under the User Constraints family. The Phase 2 label table has no label for it. `food_safety` as defined covers handling/doneness/storage cues, not constraint compliance — a recipe suggesting pork to a halal user fails no Phase 2 criterion cleanly. Adopting this rubric as-is would make Phase 3 *weaker* than the existing judge rubric on the highest-stakes failure mode.

**Recommendation:** add `dietary_compliance` (recipe and cooking-step surfaces with stated restrictions; human/judge, plus deterministic flags where the restriction maps to detectable ingredient terms). Add at least one seed fixture carrying a restriction — the Arize intake's Halal Vietnamese coconut-rice example or the keto chicken-Parmesan example both work. Also decide explicitly whether nutritional-preference fit is out of v1 scope (I recommend deferring it, but say so).

### P1-4 — Current evaluator breaks on `slop_bowl` pending rows; Phase 3 must treat eval-queue selection as a bug fix, not an enhancement

`server/evaluator.ts`: `buildEvalPrompt` throws on feature types missing from `EVAL_CRITERIA`, and `submitEvalBatch()` with no explicit IDs selects **all** pending interactions. Every successful Slop Bowl generation writes a pending `slop_bowl` row (`server/openai.ts:294`), so the submit-all-pending admin path fails wholesale once any such row exists. The spec's Implementation Implications cover adding criteria for new features but do not name this failure mode; it changes Phase 3 sequencing (make queue selection criteria-aware first, then expand coverage) and explains why "just expand `FeatureType`" pressure exists.

**Recommendation:** name it in the spec's Implementation Implications: Phase 3's first slice makes eval queueing filter to features with registered criteria (or adds the criteria), with a regression test seeding mixed feature types.

### P2-5 — `judge_calibration` is not a fixture criterion and should leave the label enum

Spec §Criterion Labels and §First Wilson-Label Target Set. Its own "Applies to" row says judge runs and reports — it is run-level measurement metadata, not something Wilson can label on a fixture. The seed table listing it as a label-to-prioritize for `openai-invalid-json-pass` conflates "this fixture is a calibration probe" with a labelable criterion. **Recommendation:** drop it from the fixture label set; add an optional fixture `roles` tag (e.g. `calibration-probe`, `regression`, `positive-guard`) and keep calibration reporting in `docs/workflows/evaluations.md` where it already lives.

### P2-6 — `ai_interactions.prompt_version_id` is never populated; prompt-comparison evidence has no provenance

The column exists in `shared/schema.ts` but `logInteraction` (`server/openai.ts:81-91`) never writes it, and nothing else does. Phase 6 baseline-vs-candidate comparisons, and even honest Phase 3 fixture provenance ("this output came from the default prompt vs DB version N"), need it. Same gap applies to the fixture format: no `model` / prompt-version / capture-date fields, although `evaluations.md` requires prompt/model/evaluator versions in eval evidence. **Recommendation:** populate `prompt_version_id` (null meaning hardcoded default) when Phase 3 touches the logging path, and add fixture-level provenance fields (`capturedAt`, `model`, `promptVersion`, plus label provenance `labeledBy`/`labeledAt` — fixture-level is enough for v1 single-session labeling).

### P2-7 — Privacy posture: three handling gaps worth one sentence each

Spec §Output-Quality Privacy Posture. (a) The repo is public, so `docs/evals/fixtures/` and future report artifacts are public-internet content, not merely "in repo" — the redaction bar for "redacted with review" and cluster descriptions should be stated against public visibility, consistent with the security due-diligence rubric. (b) The posture covers repo artifacts but not judge-run transit: Phase 3 sends fixture content to the judge provider; state which privacy classes may be sent (synthetic/redacted: yes; raw DB rows already transit the same provider in the existing batch tooling, so this is documentation rather than a new exposure). (c) The 90-day prune (`pruneOldAiInteractions`) deletes rows regardless of labels — Phase 3/4 must copy labels into durable fixture records at labeling time, never key the gold set to `ai_interactions` row ids. Also worth naming dietary restrictions inside packaged `preferences` strings as a specific redaction target for any redacted-fixture review.

### P2-8 — `equipment_fit` has no input context on the recipe-suggestions/pantry surfaces

`DEFAULT_RECIPE_SUGGESTIONS_PROMPT` tells the model the user will send kitchen equipment, and instruction guideline 7 requires steps be possible with available equipment — but neither `/api/recipes/pantry` nor the `MealPlanning` preference string ever sends equipment. Slop Bowl and cooking steps do receive it. So `equipment_fit` is currently evaluable only for `slop_bowl` and `cooking_steps`; for the two recipe-suggestion surfaces the criterion's premise is absent, and there is a latent prompt/contract mismatch that EFF-022-adjacent prompt work will eventually trip on. **Recommendation:** scope `equipment_fit` to `slop_bowl` + `cooking_steps` in v1 and record the prompt/input mismatch as a measurement note (not a Phase 3 fix).

### P2-9 — `cuisine_fit` pass-path wording can read as pre-deciding EFF-022 option D

The definition passes outputs that "clearly signal a pantry-flexible fallback when pantry evidence is weak" — a product behavior that does not exist and is exactly EFF-022's open decision. A future judge implementing that clause would bless undecided behavior. **Recommendation:** add one sentence: until EFF-022 resolves, outputs in pantry-constrained fallback territory are labeled `needs_wilson` (or the renamed equivalent), not `pass`; the fallback clause is a measurement placeholder, not accepted product copy.

### P3-10 — `expectedContract` duplicates input constraints and hand-copies the response contract

`expectedContract.maxCookTimeMinutes` repeats `input.timeMaxMinutes` (two places to disagree); `responseShape`/`recipeCount` re-encode contracts that already exist in code (`slopBowlRecipeSchema` in `server/openai.ts`, the client's exactly-three check at `meal-planning.tsx:599`, while cooking steps has **no** server-side schema at all — `getCookingSteps` returns unvalidated `JSON.parse`). **Recommendation:** deterministic checks should import shared schema definitions (export/move `slopBowlRecipeSchema`, author a cooking-steps response schema derived from `live-cooking.tsx` usage, codify the recipes-array contract) and derive the max-time bound from `constraints`. Per-fixture contract overrides only for legacy-shape fixtures. Authoring the cooking-steps schema is itself a small product-contract decision — name it in Phase 3 scope.

### P3-11 — Label enum mixes verdicts and statuses; `needs_wilson` is ambiguous

`pass|fail|not_applicable` are verdicts; `pending|needs_wilson` are statuses. Workable for v1 if documented, but `needs_wilson` is confusing when Wilson does *all* v1 labeling. **Recommendation:** rename to `blocked_on_product_rule` (keeps the EFF-022 boundary visible in the data), or split `value`/`status` fields if the format is being revised anyway per P1-1.

### P3-12 — Seed-set nits

No dietary-restriction seed (see P1-3). The three OpenAI Platform seeds are legacy single-recipe shape; per the intake record they must be re-expressed against the current `recipes[]` contract or tagged legacy-only — the seed table should carry that flag. The two "X or Y" surface assignments should be resolved at fixture creation to avoid double-counting coverage. Slop Bowl has a single, mostly-structural fixture and no negative case — acceptable for v1, but note that slop-bowl negative fixtures await production sampling or ad-hoc capture. Otherwise the 13-seed set is appropriately small (roughly 40-50 criterion decisions for one Wilson session) and representative.

### P3-13 — `max_time_adherence` is undefined for cooking steps today

`POST /api/cooking/steps` carries no time bound, so the criterion's "with a time bound" qualifier means it is recipe-surface-only in practice. Say so explicitly, and let Phase 3 define the deterministic comparison rule (recipes: `cookTime` ≤ max; steps: undefined until the contract carries a bound).

### P3-14 — Three hand-maintained feature-id unions invite string drift

With the split there will be `AiErrorFeature` (9 values, `server/aiErrors.ts`, mirrored in PD-010), `EvalFeatureType` (5), and `PromptFeatureType` (3) — overlapping string literals maintained by hand, plus duplicated `z.enum([...])` literals in `server/admin-routes.ts`. **Recommendation:** one canonical feature-id constant module (e.g. `shared/feature-ids.ts`), with eval/prompt subsets derived from it via const arrays, admin Zod enums built from `PROMPT_FEATURE_TYPES`, and `prompt-manager.ts` validating DB `featureType` values at runtime instead of the current `as FeatureType` cast.

## Direct answers to the review questions

1. **Eval/prompt type split correct?** Yes. The coupling is real (`prompt-manager.ts` imports `FeatureType` from `eval-criteria.ts`; admin routes separately hard-code the same three literals), and naive expansion makes `getActivePrompt('slop_bowl')` type-legal — one step from violating the accepted hardcoded-Slop-Bowl-v1 direction. Adopt option A with the P3-14 refinement (single canonical id module, derived subsets).
2. **`pantry_recipes` first-class?** Yes. It is the primary Chef It Up flow, has materially different input packaging, is where all EFF-022 failures live, and operational telemetry already distinguishes it — quality metrics folded into `recipe_suggestions` can never correlate with `pantry_recipes` error clusters. Pass the eval feature id from the route into generation (or a wrapper) so prompt reuse is preserved; record the metrics cutover date in the eval registry since `recipe_suggestions` counts will show a series break.
3. **`slop_bowl` first-class eval without prompt activation?** Yes. It already logs interactions that today *break* the batch evaluator (P1-4); measuring it requires criteria, not prompt-manager support. Adding DB prompt support would create an activation path with no consumer (`getSlopBowlRecipe` never reads DB prompts) — a dead or risky duplicate path.
4. **Privacy posture sufficient?** Directionally yes — synthetic-by-default, raw-never-by-default is the right baseline and consistent with PD-010's bridge rule and the 90-day retention direction. Close the three P2-7 gaps (public-repo visibility, judge-run transit, label-vs-prune durability) and keep the admin-rows line exactly as written: unlike `ai_error_events`, `ai_interactions` content has only regex redaction (email/token/UID shapes), so admin eval rows are *not* allowlist-safe and must never be pasted into repo artifacts.
5. **Fixture shape sufficient?** No, as drafted — P1-1 (no output) and P1-2 (input shape) are blocking; P2-6 (provenance) and P3-10/11 should ride the same revision.
6. **Criterion labels complete/separated?** Well-separated (notably `pantry_grounding` vs `optional_ingredient_contract`, matching prompt rules 6-7), but incomplete: add `dietary_compliance` (P1-3), remove `judge_calibration` from the fixture enum (P2-5), scope `equipment_fit` (P2-8), and tighten `cuisine_fit` wording (P2-9).
7. **Seed set right size?** Yes — keep ~13, add one dietary-restriction seed, apply the P3-12 nits. Do not expand further before Phase 3.
8. **EFF-022 boundary preserved?** Yes — the spec, EFF-022 note, and decision-options all keep the product rule with Wilson. The only soft spot is the P2-9 wording.
9. **Phase 3 validation mapping?** See the plan below. Core principle: deterministic fixture checks are unit-lane work; live model output never enters `unit`/`e2e_guest_smoke`; eval runs are a separately registered evidence lane per `evaluations.md`.
10. **Implementation risks?** Listed below, ordered.
11. **What blocks Phase 3?** Listed below.

## Wilson decisions needed

1. Accept the five spec Review Decisions (taxonomy split; first-class `pantry_recipes`/`slop_bowl`; no prompt-activation expansion; max-cook-time hard ceiling vs rounding exception; synthetic-by-default privacy posture).
2. Accept the fixture-format revision direction (add `output` + provenance; `request`/`constraints` split; generation-function eval seam) — this changes the "accepted fixture format" gate, so it needs explicit acceptance or delegation to Codex to revise and re-review.
3. Accept adding `dietary_compliance` to the rubric (or explicitly accept its absence) and confirm nutritional-preference fit is deferred.
4. Confirm fixture storage path: `docs/evals/fixtures/` as canonical (recommended), knowing the repo is public so fixtures are written for public visibility.
5. Confirm `cooking_assistance` stays infrastructure-only in V1 reporting (default: yes).
6. EFF-022 fallback product rule remains open — not blocking, explicitly deferred.

## Phase 3 implementation risks (address in order)

1. Eval-queue poisoning by `slop_bowl` pending rows (P1-4) — fix first; also consider a batch-size cap while touching `submitEvalBatch`.
2. Immediate prompt activation (`POST /api/admin/prompts/save` activates instantly; `createPromptVersion` deactivates prior versions) — keep `PromptFeatureType` at the current three; do not add inactive-candidate machinery in Phase 3.
3. Missing provenance: populate `prompt_version_id` on logging; record judge model/version in registry rows (the current evaluator pins `o4-mini`; calibration is invalid across unrecorded model changes).
4. Judge-prompt robustness: `buildEvalPrompt` interpolates interaction content directly; narrow Phase 3 judges should delimit untrusted content as data and instruct the judge to ignore embedded directives, mirroring the existing `generateImprovedPrompt` security-notice pattern, and always run deterministic checks first so malformed output cannot earn a judge pass.
5. Contract source-of-truth drift: export/share response schemas instead of re-encoding them per fixture; author the missing cooking-steps response schema (small product decision).
6. Label durability vs the 90-day prune (P2-7c).
7. Reporting series break at the `pantry_recipes` logging cutover — one registry line.
8. Scope discipline: taxonomy slice needs **no** DB migration (`feature_type` is a free varchar; only the stale `shared/schema.ts` comments change) — keep schema churn out.

## Recommended Phase 3 validation plan (proof → smallest honest lane)

| Proof | Lane |
|---|---|
| Type split, admin Zod enums, prompt-manager runtime validation compile and behave | Local `npm run check` + new Vitest; GitHub `unit` |
| `/api/recipes/pantry` logs `pantry_recipes` while reusing the `recipe_suggestions` prompt | Vitest route/generation test with mocked provider asserting the logged feature id; GitHub `unit` |
| `submitEvalBatch` handles mixed/unknown feature types without poisoning | Vitest with seeded rows + mocked OpenAI batch API; GitHub `unit` |
| Deterministic checkers (structure, count, max-time, optional-ingredient contract) flag the known-bad and pass the known-good fixtures | Pure-function Vitest over committed fixtures (an eval-fixture run that lives in the `unit` lane; no providers, no DB) |
| Fixture files conform to the accepted format (privacyClass present, labels valid, request matches surface schema) | Validator script in the `unit` lane |
| No user-flow regression from logging/type changes | GitHub `e2e_guest_smoke` on the exact head (note: it stubs `/api/recipes/pantry`, so the logging proof stays in the unit lane — record that in negative scope) |
| Judge prompts return parseable verdicts; current-prompt output quality on fixtures | Registered eval run (local dotenvx script or named live-provider canary), indexed in `docs/evals/registry.md` with model/prompt versions, marked uncalibrated — never in PR CI |
| Admin endpoints filter/summarize new feature ids | Vitest route tests; optional one-off direct Replit shell curl only if risk-triggered (no Replit Agent) |
| Criterion labels on the seed set | Wilson labeling session; labels committed as fixture data in a reviewed PR, registry row added |
| Replit runtime behavior | Not required for the eval-only slice (no schema push, no startup change): automation-primary lane with risk note; defer any manual check to release batch |

## Suggested wording changes (spec unless noted)

1. §Fixture Format: add `output` (raw string, same `privacyClass` rules, required when labels are non-pending); split `input` into `request` + `constraints`; add `capturedAt`/`model`/`promptVersion` and fixture-level label provenance; state the eval seam (generation-function inputs) and per-surface request schemas.
2. §Criterion Labels: add `dietary_compliance`; remove `judge_calibration` (move to a fixture `roles` tag); scope `equipment_fit` to `slop_bowl` + `cooking_steps`; add the EFF-022 placeholder sentence to `cuisine_fit`; note `max_time_adherence` is N/A for cooking steps until the contract carries a bound.
3. §Fixture Format label values: rename `needs_wilson` → `blocked_on_product_rule` (or split value/status).
4. §Implementation Implications: add "make eval-queue selection criteria-aware (current `submitEvalBatch` fails wholesale on pending feature types without criteria)" and "populate `ai_interactions.prompt_version_id` when touching the logging path"; note the taxonomy slice requires no DB migration.
5. §Output-Quality Privacy Posture: add the public-repo sentence, the judge-run transit sentence, and the labels-outlive-prune rule; name dietary restrictions in packaged preference strings as a redaction target.
6. §First Wilson-Label Target Set: add one dietary-restriction seed; resolve the two "or" surface assignments; tag the three OpenAI seeds as needing current-contract re-expression or a legacy flag.
7. Review handoff §Decision options (Q2): note the refinement that both types derive from one canonical feature-id module shared with `AiErrorFeature` values.

## Verification

Read at the PR head in a detached worktree: the full spec, INIT-004, both Phase 1 handoffs, both Phase 2 handoffs, `evaluations.md`, `testing-and-acceptance.md`, `documentation-routing.md`, `docs/evals/README.md` + registry + both intakes, EFF-017 (full, including 2026-06-10 audit reconciliation and PR #169 entry), EFF-022, PD-008, PD-010, the mobile-refresh AI-privacy and Phase 3 planning records, and the Slop Bowl Phase 3 record. Code claims verified by reading the named files at this head; `git diff --stat origin/main...HEAD` confirms the 7-file docs-only scope. No code, PR state, or GitHub comment was changed; CI on this branch reruns automatically on this docs-only push.

## Stack / base status

- Base: `origin/main` at `2abccc7a88ac4c203b64daa851bc3bde6ee40f45` (unchanged; this commit adds one handoff file)
- Last Replit-validated at: not applicable (docs-only)
- **Codex: pull before your next push** — this review was fast-forward pushed onto `codex/init-004-phase-2-spec` from a detached worktree.
