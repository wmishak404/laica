# INIT-004 Harness Foundation

**Agent:** codex
**Branch:** `codex/init-004-harness-foundation`
**Date:** 2026-06-16
**Initiative:** INIT-004
**INIT updated:** yes

## Summary

PR #188 starts INIT-004 Phase 3 with an offline eval foundation, not live evaluation. Laica now has a typed public fixture contract, deterministic structure/count/max-time/privacy checks, and a feature-id split that lets future eval work measure pantry recipes and Slop Bowl without expanding prompt activation or touching provider/runtime paths.

The operator value is safer AI-quality iteration: future agents can add synthetic or redacted regression fixtures and validate output contracts before sending anything to a judge model, committing private examples, or changing production prompts.

## Changes

- `server/ai-feature-types.ts`: adds canonical eval, prompt, and AI-error feature IDs; separates `EvalFeatureType` from `PromptFeatureType`.
- `server/ai-response-schemas.ts`: adds reusable response schemas for recipe suggestions, Slop Bowl, and cooking steps.
- `server/eval-fixtures.ts`: adds public fixture schema/loading, deterministic recipe/Slop Bowl/cooking-step checks, public privacy checks, and fixture feature listing.
- `server/eval-criteria.ts`: adds first-class criteria entries for `pantry_recipes` and `slop_bowl`.
- `server/admin-routes.ts` and `server/prompt-manager.ts`: restrict prompt history/generate/save paths to prompt-managed features only.
- `server/evaluator.ts`: routes batch prompts through canonical eval feature IDs and reports unsupported skipped rows instead of letting unsupported feature strings poison the queue.
- `server/openai.ts`: imports the shared Slop Bowl schema without changing provider behavior.
- `server/aiErrors.ts` and `shared/schema.ts`: align type/comment provenance with the canonical feature split.
- `tests/unit/eval-fixtures.test.ts`: covers fixture schema, malformed JSON, suggestion count, +15 max-time band, privacy failures, Slop Bowl/cooking-step contracts, fixture loading, prompt/eval feature separation, and a source-level guard that live generation modules do not read fixture stores.
- `.gitignore` and `docs/evals/fixtures/README.md`: reserve `docs/evals/private/` as an in-repo private fallback guard and document the public fixture directory.
- `docs/evals/README.md`, `initiatives/INIT-004-ai-output-quality-evals.md`, `initiatives/registry.md`, and `efforts/effort-022-cross-cuisine-recommendation-prompts.md`: record the Phase 3 slice and EFF-022 boundary.

## Impact on other agents

Use `docs/evals/fixtures/` as the canonical public fixture home. Commit only synthetic or reviewed redacted fixtures there; raw/private examples belong outside git under `LAICA_PRIVATE_EVAL_DIR`.

Do not treat `pantry_recipes` or `slop_bowl` as prompt-managed features. They are eval/reporting surfaces in this slice; prompt reuse remains conservative.

See [`EFF-022`](../../efforts/effort-022-cross-cuisine-recommendation-prompts.md) for the current cuisine-fallback product-rule status. This branch measures cuisine-fit/fallback cases later, but does not decide whether Laica should stay literal to selected cuisine, ask for staples, or explain a pantry-flexible fallback.

## Open items

- PR #188 is draft until exact-head GitHub checks run.
- No provider judge runs, private fixture ingestion, DB migrations, prompt activation, daily reports, public fixture data, or EFF-022 product-rule changes were started.
- Next Phase 3 candidates after merge: first public synthetic fixtures, a fixture-validation script lane, criteria-aware queue/logging provenance for `pantry_recipes`, or narrow LLM judges after fixture labels exist.

## Verification

Local macOS validation on the implementation branch before this PR-number handoff refresh:

- `npm ci` passed; installed lockfile dependencies and reported 0 vulnerabilities.
- `npx vitest run tests/unit/eval-fixtures.test.ts` passed: 1 file / 9 tests.
- `npm run test:unit` passed: 40 files / 265 tests.
- `npm run check` passed: `tsc` and UI ESLint.
- `npm audit --audit-level=high` passed: 0 vulnerabilities.
- `npm run build` passed with existing Browserslist/Firebase dynamic-import/chunk-size warnings.
- `git diff --check` and `git diff --cached --check` passed.

GitHub exact-head checks for PR #188 still need to run after the handoff refresh is pushed. The required merge-gate evidence is GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL on the final head.

Replit validation is not required before merge under the automation-primary risk lane because this branch changes offline eval infrastructure and docs only; it does not change auth, provider calls, DB schema, deployment config, UI, persistence, or user-facing runtime behavior.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `27affa18cb535b4562be5c2535a6ad4fefc5b26b`
- Last Replit-validated at: not required before merge
- Notes: started after PR #181/#182 closed out INIT-004 Phase 2 and after PR #184/#185 landed on `main`.
