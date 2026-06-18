# INIT-004 Cooking-Step User-Expectation Fixtures

**Agent:** codex
**Branch:** `codex/init-004-phase-3-user-expectation-fixtures`
**Date:** 2026-06-17
**Initiative:** INIT-004
**INIT updated:** yes
**PR:** [#198](https://github.com/wmishak404/laica/pull/198) (draft)

## Summary

Draft PR #198 continues INIT-004 Phase 3 with one bounded fixture-corpus milestone: three public synthetic cooking-step cases from the accepted Wilson-label target set. The protected user expectation is that Laica should not hand a cook structurally valid instructions that are unsafe for raw proteins, mismatched to stated skill, or dependent on equipment the cook did not list.

This slice intentionally stays offline. It adds no provider judges, private fixture ingestion, prompt changes, DB/schema changes, runtime generation behavior, prompt activation, daily reports, or EFF-022 cuisine fallback decisions.

## Changes

- `docs/evals/fixtures/cooking-steps-raw-beef-doneness.json`: synthetic negative guard for raw beef steps that say only "heated through" without a safe doneness cue.
- `docs/evals/fixtures/cooking-steps-chicken-doneness.json`: synthetic negative guard for chicken steps that rely on elapsed time and slice/toss before any doneness confirmation.
- `docs/evals/fixtures/cooking-steps-missing-lid-alternative.json`: synthetic negative guard for a recipe that assumes a missing lid without a safe common alternative.
- `tests/unit/eval-fixtures.test.ts`: extends the committed fixture set assertion and verifies key preserved labels.
- `docs/evals/fixtures/README.md` and `docs/evals/registry.md`: record `Value claim`, `Evidence`, `Evidence limits`, privacy posture, and registry provenance.
- `initiatives/INIT-004-ai-output-quality-evals.md` and `initiatives/registry.md`: record draft PR #198 as the active Phase 3 slice and defer cuisine-fit fixtures because EFF-022 fallback behavior remains unresolved.

## Value / Evidence / Limits

Value claim: Cooking-step evals should protect users from instructions that can look valid to the app but fail the cook: unsafe raw beef or chicken guidance, steps too thin for a beginner/intermediate user, and missing-equipment assumptions.

Evidence: The three new public synthetic fixtures load through the existing fixture schema, preserve resolved `food_safety`, `skill_fit`, `equipment_fit`, and `cooking_step_sequence` labels, and are indexed in the public fixture README/registry. The focused fixture test validates schema, privacy posture, structure, deterministic label expectations, committed fixture loading, and key label preservation.

Evidence limits: This does not prove live model quality, Wilson re-labeling of these exact synthetic outputs, LLM-judge calibration, production cooking safety, taste, cuisine fit, provider behavior, private-gold coverage, or Replit runtime behavior. The semantic labels are calibration targets for future review/judge lanes; current automation only proves the public artifacts are safe, structured, and preserved.

## Impact On Other Agents

Use these fixtures as the next cooking-step calibration targets before writing narrow `food_safety`, `skill_fit`, `equipment_fit`, or `cooking_step_sequence` judges. Do not treat their current Vitest pass as proof that Laica generates safe cooking steps; it proves the fixtures are in the corpus and ready for future semantic evaluation.

Cuisine-fit fixtures were not added. EFF-022 still owns the product rule for selected-cuisine fallback behavior, and this branch avoids forcing that decision.

## Open Items

- Draft PR #198 needs final review and any required ready-for-review/CI transition before merge readiness.
- GitHub required checks may remain pending or skipped while the PR is draft; those draft skips are not merge evidence.
- Future INIT-004 work still needs fixture-validation script/routine lane, Wilson review/judge calibration, private fixture workflow, daily reports, and prompt-candidate comparison before prompt activation.

## Verification

Final local validation on this branch:

- `npm ci` passed with existing deprecation warnings and 0 vulnerabilities.
- Initial `npx vitest run tests/unit/eval-fixtures.test.ts` failed before fixture execution because dependencies were not installed in the fresh worktree.
- After `npm ci`, `npx vitest run tests/unit/eval-fixtures.test.ts` passed: 1 file / 11 tests.
- Final exact-head `npx vitest run tests/unit/eval-fixtures.test.ts` passed: 1 file / 11 tests.
- Final exact-head `npm run test:unit` passed: 42 files / 292 tests.
- Final exact-head `npm run check` passed: TypeScript and UI ESLint.
- Final exact-head `npm audit --audit-level=high` passed with 0 vulnerabilities.
- Final exact-head `npm run build` passed with existing Browserslist age, Firebase dynamic-import, and chunk-size warnings.
- Final exact-head `git diff --check` and `git diff --cached --check` passed.
- Merge-readiness review found the original PR head was stale after PR #197 merged. The branch was rebased onto `origin/main` `7250016b762401476871b0f13b579a44905b90cd`.
- Post-rebase local validation passed: `npx vitest run tests/unit/eval-fixtures.test.ts` (1 file / 11 tests), `npm run test:unit` (42 files / 292 tests), `npm run check`, `npm audit --audit-level=high` (0 vulnerabilities), and `npm run build` with the same existing Browserslist/Firebase/chunk warnings.

Human Replit validation is not required before merge. This branch changes public offline fixture data, docs, and unit coverage only; it does not change auth, provider calls, DB schema, deployment config, UI, persistence, secrets, prompts, runtime generation behavior, private fixture ingestion, or daily reporting.

## Stack / Base Status

- Base refreshed: yes
- Current base: `origin/main` at `7250016b762401476871b0f13b579a44905b90cd`
- Last Replit-validated at: not required before merge
- Notes: started from fresh `origin/main` after PR #190 had merged, then rebased onto current `origin/main` after PR #197 merged.
