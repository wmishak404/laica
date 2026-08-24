# 2026-07-08 - Dish-Identity Prompt A/B Probe Intake

**Intake id:** `dish-identity-prompt-ab-2026-07-08`
**Source:** manual live prompt comparison via `npm run eval:dish-identity` (`scripts/eval-dish-identity-ab.ts`)
**Owner / reviewer:** Wilson (failure report, review) / Claude (run)
**Raw artifact handling:** stdout summaries and aggregate `RESULT_JSON` only; no raw provider payloads committed; no `ai_interactions` rows written
**Privacy posture:** synthetic fixture-derived inputs only; the real production failure was re-expressed synthetically before use
**Related surfaces:** `chef_it_up_suggestions`, `recipe_suggestions` (Slop Bowl fixture exists but the probe drives only the shared recipe-suggestions prompt path)
**Prompt/model/evaluator versions:** baseline prompt from `origin/main` `16e52a9`; candidate prompt from `claude/dish-identity-prompt-guard` working tree (dish-name identity guideline added at `556ab4c`); model `gpt-4.1` (`MODEL_COMPLEX`); deterministic scorer `server/eval-dish-identity.ts` (no LLM judge)
**Input schema:** public dish-identity fixture `request` payloads (`ingredients[]`, `preferences`), replayed through the production user-message template
**Sample size:** canonical run: 6 scenarios x 4 runs x 2 arms = 48 generations, 144 recipes (72 per arm); plus two earlier candidate passes over 3 scenarios (33 and 36 recipes) during rule development
**Positive definition:** a recipe passes when every dish-name claim is satisfied by `pantryIngredientsUsed` under the precision-first rules (defining ingredient present; `-style`/`-inspired`/`-ish` adapted names exempt)
**Trend tags:** `dish-identity`, `optional-ingredient-contract`, `pantry-grounding`, `prompt-comparison`, `structure-contract`

## Source Summary

Wilson's 2026-07-08 production report showed Chef It Up suggesting "Spiced Sausage, Leek, and Cheese Frittata" from an egg-free pantry with eggs under "Optional if around". The probe compares the pre-fix recipe-suggestions prompt (baseline) against the dish-name identity guard candidate on trap scenarios drawn from the committed public dish-identity fixtures: the real frittata pantry, a no-rice fried-rice bait, a no-noodle ramen bait, a no-steak/no-tortilla taco bait, plus the two pre-existing Chef It Up negative-fixture pantries as regression context.

## Metrics Summary

| Metric | Value | Calibration status | Notes |
|---|---|---|---|
| Observed pass rate (baseline) | 60/72 recipes clean (12 violating; 11 under final rules) | deterministic | "Ramen-Inspired Hotpot" was flagged mid-run and exempted by the final `-inspired` rule; final-rule baseline is 11/72 violating (~15%) |
| Observed pass rate (candidate) | 67/72 recipes clean (5 violating, ~7%) | deterministic | violations: 3 fried-rice recipes in one scenario, 1 shoyu ramen, 1 no-rice donburi |
| Frittata reproduction (candidate) | 0 violations / 36 recipes across three passes | deterministic | baseline produced the exact production failure (frittata with eggs optional) in 2/12 recipes in each earlier capture |
| Definer listed as optional | baseline 13 rule hits vs candidate 5 | deterministic | the exact "Optional if around" laundering pattern from the production report |
| Human label pass rate | n/a | n/a until human labels exist | fixture labels are the Wilson-review target |
| TPR / TNR | n/a | n/a until human labels exist | deterministic rules are precision-first by design |

## Failure / Learning Clusters

| Cluster | Evidence | Criterion family | Proposed deterministic check | Proposed judge or human label | Product / prompt implication |
|---|---|---|---|---|---|
| Name anchoring | Frittata/ramen/fried-rice names with the definer parked as optional | `dish_identity`, `optional_ingredient_contract` | Shipped: `server/eval-dish-identity.ts` name/definer rules | `dish_identity` human labels on the six fixtures | Prompt guideline 7 (dish-name identity check) directly attacks this; residual risk remains |
| Disclaimer naming | "Chicken Fried Rice (No Rice Version)", "Donburi (Rice Bowl Style, No Rice)" | `dish_identity` | Covered: violates even with the disclaimer because the definer is absent | Judge should not accept parenthetical disclaimers as honesty | The model knows the definer is missing and ships the name anyway; renaming guidance matters more than warnings |
| Fried-rice residual | Candidate still produced 3 violating fried-rice recipes in one scenario | `dish_identity` | Existing check catches them post-hoc | Wilson label on fried-rice fixture | Prompt-only mitigation is not airtight; a runtime deterministic gate is the escalation option |
| Cuisine field drift | 48/48 live generations failed `recipes.0.cuisine: Required` in `recipeSuggestionsResponseSchema` | `structure_contract` | Already deterministic in the harness | n/a | The eval schema requires `cuisine` but `DEFAULT_RECIPE_SUGGESTIONS_PROMPT` never asks for it; fixtures authored with `cuisine` masked the drift. Needs a decision: add `cuisine` to the prompt output contract or relax the eval schema |

## Positive Examples Worth Preserving

| Example | Why it passed | Regression risk if over-corrected |
|---|---|---|
| "Sausage, Leek & Carrot Skillet", "Cheesy Sausage & Vegetable Bake", "Warm Sausage & Veggie Yogurt Bowl" | Honest names for the egg-free frittata pantry | Refusing to suggest anything from a pantry that lacks a tempting dish's definer |
| "Egg Foo Young with Peas and Bell Peppers" | Egg dish suggested only where eggs are in the pantry | Blanket-banning dish families instead of checking the pantry |
| "-style" / "-inspired" adapted names | Honest EFF-022-aligned labeling for adapted dishes | Flagging honest adapted names would push the model toward blander, less useful suggestions |

## Fixture Candidates

| Candidate | Source id / description | Intended criterion | Raw-data handling |
|---|---|---|---|
| `chef-it-up-suggestions-dish-identity-frittata-no-eggs` | Committed this batch (synthetic re-expression of the production failure) | `dish_identity`, `optional_ingredient_contract`, `pantry_grounding` | synthetic |
| `chef-it-up-suggestions-dish-identity-fried-rice-no-rice` | Committed this batch (from live baseline captures) | `dish_identity`, `optional_ingredient_contract` | synthetic |
| `chef-it-up-suggestions-dish-identity-ramen-no-noodles` | Committed this batch (from live baseline captures) | `dish_identity`, `optional_ingredient_contract` | synthetic |
| `chef-it-up-suggestions-dish-identity-honest-rename` | Committed this batch (positive guard from candidate captures) | `dish_identity` pass | synthetic |
| `recipe-suggestions-dish-identity-steak-tacos` | Committed this batch | `dish_identity` (two definer families) | synthetic |
| `slop-bowl-suggestions-dish-identity-ramen` | Committed this batch | `dish_identity` on the Slop Bowl surface | synthetic |

## 2026-07-08 follow-up — cuisine field fix verification

Wilson's JSON-attribute alignment pass resolved the cuisine drift inside the same branch: `DEFAULT_RECIPE_SUGGESTIONS_PROMPT` now requests `cuisine` in its output field list (the UI transform, `recipeSuggestionsResponseSchema`, and the `cuisine_fit` criterion all consume it; the Slop Bowl prompt already requested it). Verification run (`ARM=candidate RUNS=4`, 24 generations, 72 recipes): **0 shape failures** (previously 48/48 runs failed `recipes.0.cuisine: Required`), dish-identity at 6/72 violating recipes — within the variance band of the earlier 5/72 candidate run, with the frittata scenario still 0/12 (0/48 pooled across the four candidate passes today). The "Quesadilla-Style Skillet" adapted-name exemption and the pancake-rule removal both behaved as intended in this run.

## Open Questions / Deferrals

- ~~Cuisine-field drift~~ Resolved in-branch 2026-07-08: the prompt now requests `cuisine`; see the follow-up section above. `recipeSuggestionsResponseSchema` stays strict.
- Runtime enforcement: the deterministic dish-identity rules could gate `/api/recipes/*` responses (drop/regenerate/rename violating suggestions), mirroring the Live Cooking generated-steps validation pattern. Owner: Wilson product decision from the 2026-07-08 optional-ingredient principle discussion; not implemented in this slice.
- Judge recall: dishes outside the rule map (for example flatbread without flour) need the `dish_identity` human/judge lane before quality rates can be claimed broadly.
- Field-name coherence: the model still fills a field literally named `additionalIngredientsNeeded` under a never-needed contract; the `optionalEnhancements` model-facing rename (normalizer-mapped) remains an open option from the same discussion.
