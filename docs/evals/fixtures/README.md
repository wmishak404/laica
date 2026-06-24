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

Current harness commands:

```bash
npm run eval:fixtures
npx vitest run tests/unit/eval-fixtures.test.ts
```

`npm run eval:fixtures` is the focused fixture-corpus validation lane for PR evidence. It loads committed public fixtures, applies the canonical schema/privacy/surface checks, allows only labeled expected deterministic failures, and prints a compact fixture/surface summary.

`npx vitest run tests/unit/eval-fixtures.test.ts` remains the validator behavior coverage lane. It validates the public fixture schema, deterministic structure/count/max-time checks, expected deterministic failures, public-fixture privacy guards, committed fixture loading, and the source-level guard that live generation modules do not read eval fixture stores.

These fixtures are offline regression artifacts only. They do not run provider judges, change prompts, activate prompt versions, ingest private fixtures, write eval rows, or represent production-quality rates.
