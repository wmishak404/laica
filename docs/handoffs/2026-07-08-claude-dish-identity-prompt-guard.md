# Dish-name identity guard: prompts, eval label, dataset, and live probe

**Agent:** claude
**Branch:** `claude/dish-identity-prompt-guard`
**Date:** 2026-07-08
**Initiative:** INIT-004
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary

A production Chef It Up run suggested "Spiced Sausage, Leek, and Cheese Frittata" from an egg-free pantry with eggs under "Optional if around" — a dish named after something the pantry cannot make, with the defining ingredient laundered into the optional list. Wilson directed a prompt fix generalized beyond eggs (steak without beef, fried rice without rice, ramen without noodles) plus INIT-004 eval coverage with a diverse dataset.

The system change this branch lands: dish-name identity is now an explicit, named contract across all three layers — the generation prompts (operational check with the real bad example), the deterministic eval lane (a `dish_identity` criterion label and precision-first name/definer rules), and the judge criteria (`dish_identity_mismatch` error modes). A committed live probe (`npm run eval:dish-identity`) replays the public dish-identity fixtures against real `gpt-4.1` and showed the baseline prompt violating dish identity on ~15% of recipes (including exact frittata reproductions) versus ~7% for the guarded prompt, with 0/36 on the frittata scenario.

The discipline added for future work: prompt rules that models ignore need a concrete named failure plus a deterministic measurement lane, not more abstract wording; and precision-first deterministic rules must exempt honest adapted names (`-style`, `-inspired`, `-ish`) so eval pressure cannot push the model toward blander suggestions.

## Changes

- `server/openai.ts` — dish-name identity check (guideline 7) with the real frittata failure and supporting-vs-defining contrast in `DEFAULT_RECIPE_SUGGESTIONS_PROMPT`; matching rule 16 in `DEFAULT_SLOP_BOWL_PROMPT` (pantryMatch renumbered 17); both user-message reinforcement lines now require the dish to still be its named dish without optional items; both default prompts exported for tooling.
- `server/eval-dish-identity.ts` — new shared module: precision-first dish-name identity rules (dish forms implying definers plus named-ingredient rules), adapted-name exemptions, `checkDishIdentity` / `formatDishIdentityViolations`.
- `server/eval-fixtures.ts` — `dish_identity` criterion label; deterministic dish-identity check wired into recipe and Slop Bowl surface validation.
- `server/eval-criteria.ts` — `dish_identity_mismatch` judge error mode for `recipe_suggestions`, `chef_it_up_suggestions`, and `slop_bowl_suggestions`.
- `docs/evals/fixtures/` — six new public synthetic fixtures (frittata-no-eggs, fried-rice-no-rice, ramen-no-noodles, honest-rename positive guard, steak-tacos on the general surface, Slop Bowl ramen); `dish_identity: fail` labels added to the two existing intentionally-bad Chef It Up fixtures whose outputs also violate the new check; README batch note.
- `scripts/eval-dish-identity-ab.ts` + `npm run eval:dish-identity` — dataset-driven live probe (fixture requests -> `gpt-4.1` -> deterministic scoring; `ARM=both` compares working tree vs `BASE_REF`; direct provider calls, never writes `ai_interactions`).
- `docs/evals/intakes/dish-identity-prompt-ab-2026-07-08.md` + two `docs/evals/registry.md` rows — canonical run record with metrics, clusters, positive examples, and open questions.
- `docs/evals/init-004-phase-2-rubric-dataset-spec.md` — dated addendum adding `dish_identity` to the accepted criterion-label taxonomy.
- `initiatives/INIT-004-ai-output-quality-evals.md`, `docs/evals/README.md`, `tests/unit/eval-fixtures.test.ts`, `tests/unit/evaluator.test.ts`, `package.json` — status/chronology, fixture list + command docs, and test expectations for the new label, check, fixtures, and error mode.

## Impact on other agents

- The public fixture corpus now runs a `dish_identity` deterministic check on every recipe/Slop Bowl fixture. New fixtures whose outputs violate it must carry `dish_identity: "fail"` or the corpus fails `npm run eval:fixtures`.
- `EVAL_CRITERIA` gained `dish_identity_mismatch` for the three recipe surfaces; future judge batches will include it, and report artifacts list it in `criteria` / `criterionAggregate`.
- EFF-022: read before this change per its checklist. The change conforms — it adds a dish-identity constraint orthogonal to cuisine fit, encodes the accepted "-style/-inspired" honest-labeling direction as an exemption, and decides nothing about the deferred pantry-fallback activation threshold. Future EFF-022 prompt work should preserve recipe-choice guideline 7.
- The optional-ingredient principle discussion (defining vs supporting ingredients; availability vs necessity; `additionalIngredientsNeeded` -> `missingIngredients` -> "Optional if around" naming drift; ready-check laundering; `optionalEnhancements` rename and runtime-gate options) currently lives in the 2026-07-08 Claude thread and INIT-004 chronology. It needs a PD if Wilson accepts a direction.

## Open items

1. **Production prompt-version check (Replit, before or at release):** confirm `GET /api/admin/prompts` shows no active `recipe_suggestions` row; an active DB prompt would override the tightened code default. Evidence it is likely inactive: prompt versions are created only via manual admin endpoints and INIT-004 records prompt activation as never started. The Slop Bowl prompt has no DB override path.
2. **Cuisine field drift (new finding):** all 48 live generations failed `recipeSuggestionsResponseSchema` on `recipes.0.cuisine: Required` — the prompt never requests `cuisine`, the schema requires it, and authored fixtures masked the drift. Needs a one-line prompt or schema decision in a follow-up slice.
3. **Runtime dish-identity gate (option, not implemented):** the deterministic rules could validate `/api/recipes/*` responses like the Live Cooking step validation pattern. Wilson product call.
4. **Wilson labels:** the six new fixtures are synthetic-labeled; they are Wilson-review targets before judge calibration claims anything.
5. **Deferred manual Replit smoke (release batch):** one egg-free-pantry Chef It Up run post-deploy.

## Verification

- `npm run eval:fixtures` — 16 public fixtures validate; expected failures only via resolved `fail` labels.
- `npm run test:unit` — 355 passing (new dish-identity validator tests; updated fixture-id pin and report-artifact criteria expectations).
- `npm run check` (tsc + eslint) and `npm run build` — pass; `git diff --check` clean.
- `ARM=both RUNS=4 npm run env:run -- npm run eval:dish-identity` — canonical run in intake `dish-identity-prompt-ab-2026-07-08`: baseline 12/72 violating recipes (11/72 under final rules) vs candidate 5/72; frittata reproduction 0/36 candidate vs 2/12 baseline per earlier capture; 13 vs 5 definer-listed-as-optional hits; no eval rows written.
- Local-only DB note: the dotenvx `DATABASE_URL` points to a stale dev database without `prompt_versions`/`ai_interactions`, so production prompt-version state could not be verified locally (open item 1).

## Stack / base status

- Base refreshed: yes — branched from `origin/main` at `16e52a9`
- Current base: `origin/main` at `16e52a9`
- Last Replit-validated at: not yet validated / deferred to release-batch validation with the targeted checks in Open items
- Notes: not stacked on any open PR
