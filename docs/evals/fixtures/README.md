# Public Eval Fixtures

This directory is the canonical repo home for public INIT-004 regression fixtures.

Commit only synthetic or reviewed redacted `.json` fixtures that pass the Phase 3 fixture schema and privacy checks. Raw real examples and Wilson private gold fixtures belong outside git under `LAICA_PRIVATE_EVAL_DIR`, not in this directory.

Committed public fixture set:

- `cooking-steps-chicken-doneness.json` - synthetic negative guard for chicken cooking steps that rely on time-only doneness guidance.
- `cooking-steps-generated-context.json` - synthetic positive guard for cooking steps generated from full recipe context.
- `cooking-steps-missing-lid-alternative.json` - synthetic negative guard for cooking steps that assume a missing lid without an alternative.
- `cooking-steps-raw-beef-doneness.json` - synthetic negative guard for raw-beef cooking steps that omit safe doneness cues.
- `openai-max-time-25-to-30.json` - synthetic current-shape recipe-suggestion boundary pass for the accepted +15 minute max-time band.
- `chef-it-up-suggestions-beginner-complexity.json` - synthetic negative guard for Chef It Up suggestions that are too technique-heavy for a beginner request.
- `chef-it-up-suggestions-dietary-halal-pork.json` - synthetic negative guard for Chef It Up suggestions that violate halal / no-pork constraints.
- `chef-it-up-suggestions-optional-extras-required.json` - synthetic negative guard for Chef It Up suggestions that make unavailable extras required instead of optional.
- `slop-bowl-suggestions-current-shape.json` - synthetic positive guard for the current Slop Bowl `{ recipe }` response contract.
- `chef-it-up-suggestions-max-time-30-to-60.json` - synthetic Chef It Up suggestions true negative where one 60-minute suggestion exceeds a 30-minute request plus the +15 minute band.
- `live-cooking-step-previews-client-rescue.json` - synthetic positive rendered-label guard that preserves bad provider labels rescued by client normalization/fallback.
- `live-cooking-step-previews-duplicate-labels.json` - synthetic judge-smoke fixture for repeated generic sibling labels across distinct milestones.
- `live-cooking-step-previews-incomplete-phrase.json` - synthetic judge-smoke fixture for incomplete preview labels that omit the needed object noun.
- `live-cooking-step-previews-measurement-fragment.json` - synthetic judge-smoke fixture for measurement-driven preview labels.
- `live-cooking-step-previews-multi-ingredient-incomplete-label.json` - synthetic judge-smoke fixture for prep labels that omit a meaningful object from a multi-ingredient step.
- `live-cooking-step-previews-rendered-fragments.json` - synthetic negative rendered-label guard for measurement-driven, incomplete, and repeated generic preview labels.
- `live-cooking-step-previews-singular-plural-agreement.json` - synthetic judge-smoke fixture for grammar agreement, such as `Prep Leek` when the step prepares multiple leeks.
- `live-cooking-step-previews-stale-final-garnish-label.json` - synthetic judge-smoke fixture for stale generic final labels, such as `Cook Vegetables` when the milestone is garnish and serve.
- `live-cooking-step-previews-wrong-milestone.json` - synthetic judge-smoke fixture for setup-only labels that miss the actual cooking milestone.
- `chef-it-up-suggestions-dish-identity-frittata-no-eggs.json` - synthetic negative guard re-expressing the real 2026-07-08 production failure: a frittata suggested from an egg-free pantry with eggs parked in additionalIngredientsNeeded.
- `chef-it-up-suggestions-dish-identity-fried-rice-no-rice.json` - synthetic negative guard for fried-rice names without rice, including the "(No Rice Version)" disclaimer pattern where the definer is not even listed as optional.
- `chef-it-up-suggestions-dish-identity-ramen-no-noodles.json` - synthetic negative guard for ramen names with the ramen noodles parked as optional.
- `chef-it-up-suggestions-dish-identity-honest-rename.json` - synthetic positive guard: the same egg-free pantry as the frittata failure, named honestly (skillet, bake, yogurt bowl) so dish-identity fixes cannot over-correct into refusing honest suggestions.
- `recipe-suggestions-dish-identity-steak-tacos.json` - synthetic negative guard on the general suggestions surface covering two defining-ingredient families at once: steak tacos without steak or tortillas.
- `slop-bowl-suggestions-dish-identity-ramen.json` - synthetic negative guard extending the dish-name identity check to the Slop Bowl surface.

Expected deterministic failures are allowed only when the matching resolved criterion label is also `fail`. Fixture schema, privacy class, privacy scan, output-required, and deterministic label expectation failures still make the artifact invalid.

When adding or materially changing fixtures, keep the fixture data readable and put the value framing in the PR, registry/intake record, or this README:

- `Value claim`: the user expectation, operator confidence, or future-agent coordination value protected.
- `Evidence`: the fixture id, label/check, and observed result that support the claim.
- `Evidence limits`: what this fixture does not prove, such as live model quality, taste, food safety, cuisine fit, or private-gold coverage.

2026-06-17 cooking-step user-expectation batch:

- `Value claim`: Cooking-step evals should protect users from instructions that are structurally valid but unsafe, over-complex for the stated skill level, or dependent on unavailable equipment.
- `Evidence`: `cooking-steps-raw-beef-doneness`, `cooking-steps-chicken-doneness`, and `cooking-steps-missing-lid-alternative` load as public synthetic fixtures and preserve resolved `food_safety`, `skill_fit`, `equipment_fit`, and `cooking_step_sequence` labels from the accepted target set.
- `Evidence limits`: The current Vitest lane validates schema, privacy posture, structure, and label preservation only. It does not prove live model behavior, judge calibration, Wilson re-labeling of these exact synthetic outputs, taste, cuisine fit, or production cooking safety.

2026-06-19 Chef It Up suggestions user-expectation batch:

- `Value claim`: Chef It Up suggestion evals should protect users from suggestions that ignore dietary restrictions, depend on unavailable shopping-list ingredients, or ask for technique beyond the user's stated skill.
- `Evidence`: `chef-it-up-suggestions-dietary-halal-pork`, `chef-it-up-suggestions-optional-extras-required`, and `chef-it-up-suggestions-beginner-complexity` load as public synthetic fixtures and preserve resolved `dietary_compliance`, `pantry_grounding`, `optional_ingredient_contract`, `skill_fit`, and `recipe_usefulness` labels from the accepted target-set direction.
- `Evidence limits`: The current validation lane proves the public artifacts are schema-valid, privacy-safe, current-shape pantry recipe fixtures with preserved labels. It does not prove live model behavior, Wilson re-labeling of these exact synthetic outputs, LLM judge calibration, taste, cuisine fit, provider behavior, or private-gold coverage.

2026-07-07 Live Cooking step-preview label batch:

- `Value claim`: Live Cooking step-preview evals should protect hands-busy cooks from small-card labels that are measurement fragments, generic duplicates, ungrammatical snippets, or labels for the wrong milestone.
- `Evidence`: `live-cooking-step-previews-client-rescue`, the seven focused judge-smoke fixtures, and `live-cooking-step-previews-rendered-fragments` load as public synthetic fixtures under `live_cooking_step_previews`; deterministic validation checks output shape, final rendered-label word/character limits, measurement-free labels, and sibling-label distinctness while preserving provider-versus-rendered quality labels. The synthetic rendering constraints mirror the PR #260 merged runtime limits of 5 words and 24 characters, and the newest fixtures mirror PR #264's prompt direction plus Wilson's 2026-07-08 calibration finding that a multi-ingredient prep step should not label only one meaningful object.
- `Evidence limits`: The current validation lane proves schema, privacy posture, deterministic rendered-label checks, label preservation, and judge-smoke report plumbing only. It does not prove live provider behavior, PR #260 runtime fallback behavior, pixel/visual card fit, Wilson re-labeling of these exact synthetic outputs, or calibrated LLM judge quality.
2026-07-08 dish-identity batch:

- `Value claim`: A recipe name is a promise. Suggestions must never name a dish whose defining ingredient is missing from `pantryIngredientsUsed` or parked in `additionalIngredientsNeeded` — no frittata without eggs, no fried rice without rice, no ramen without noodles, no steak tacos without steak or tortillas.
- `Evidence`: the six dish-identity fixtures above load as public synthetic fixtures under the new deterministic `dish_identity` check (`server/eval-dish-identity.ts`); `chef-it-up-suggestions-optional-extras-required` and `chef-it-up-suggestions-dietary-halal-pork` gained `dish_identity: fail` labels because their intentionally bad outputs also violate the new check; the honest-rename positive guard protects against over-correction.
- `Evidence limits`: rules are precision-first (named ingredients plus common dish forms, with "-style", "-inspired", and "-ish" adapted-name exemptions per the accepted EFF-022 labeling direction), so unlisted dishes escape the deterministic lane and stay with human/judge recall. Fixtures do not prove live model rates; see intake `dish-identity-prompt-ab-2026-07-08` for the live probe evidence.

Current harness commands:

```bash
npm run eval:fixtures
npm run env:run -- npm run eval:step-preview-judge-smoke -- --runs 3 --out /tmp/laica-step-preview-judge-smoke.md
npx vitest run tests/unit/eval-fixtures.test.ts
npm run env:run -- npm run eval:dish-identity   # live-provider probe; calls OpenAI, never writes eval rows
```

`npm run eval:fixtures` is the focused fixture-corpus validation lane for PR evidence. It loads committed public fixtures, applies the canonical schema/privacy/surface checks, allows only labeled expected deterministic failures, and prints a compact fixture/surface summary.

`npm run eval:step-preview-judge-smoke` is an opt-in provider judge-smoke lane for the focused `live_cooking_step_previews` fixtures. It repeats each fixture, emits an uncalibrated Markdown report, and should be treated as Wilson-review input only, not product-quality truth.

`npx vitest run tests/unit/eval-fixtures.test.ts` remains the validator behavior coverage lane. It validates the public fixture schema, deterministic structure/count/max-time checks, expected deterministic failures, public-fixture privacy guards, committed fixture loading, and the source-level guard that live generation modules do not read eval fixture stores.

These fixtures are offline regression artifacts only. They do not change prompts, activate prompt versions, ingest private fixtures, write eval rows, test PR #260 runtime fallback behavior, prove PR #264 provider quality, or represent production-quality rates. The optional judge-smoke command calls a provider only when run explicitly with local secrets.
