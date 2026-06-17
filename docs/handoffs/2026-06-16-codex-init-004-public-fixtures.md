# INIT-004 Public Synthetic Fixtures

**Agent:** codex
**Branch:** `codex/init-004-public-fixtures`
**Date:** 2026-06-16
**Initiative:** INIT-004
**INIT updated:** yes
**PR:** [#190](https://github.com/wmishak404/laica/pull/190)

## Summary

This branch turns the INIT-004 harness from an empty structure into a first CI-visible fixture set. Laica now has public synthetic regression examples for recipe suggestions, pantry recipes, Slop Bowl, and cooking-step generation, plus loader semantics that allow intentionally bad deterministic outputs only when their criterion label expects the failure.

The operator value is safer AI-quality iteration: future prompt/eval work can prove that known boundaries and current response shapes remain covered before adding provider judges, private fixtures, prompt changes, or reporting automation.

Wilson clarified during review that the long-term value target is not "valid fixture data" by itself; evals must dig into how Laica's responses relate to the user. This branch now records that philosophy in the eval/testing docs: each future fixture, judge, report, and prompt comparison should name the user expectation it protects, while contract-only checks should be described as foundation work rather than broad output-quality proof.

Wilson then clarified the smallest useful test-case rule for future enhancements: no claim without evidence, no evidence without a claim, and always name the limit. The workflow/PR template now use `Value claim`, `Evidence`, and `Evidence limits` so user-facing, docs-only, cleanup, system, and agent-coordination work can all describe value honestly without inventing a customer story.

## Changes

- `docs/evals/fixtures/openai-max-time-25-to-30.json`: current-shape recipe-suggestions boundary pass for the accepted +15 minute max-time band.
- `docs/evals/fixtures/synthetic-max-time-30-to-60.json`: pantry-recipes true negative where one 60-minute suggestion exceeds a 30-minute request plus the +15 minute band.
- `docs/evals/fixtures/slop-bowl-current-shape.json`: positive guard for the current Slop Bowl `{ recipe }` response contract.
- `docs/evals/fixtures/cooking-steps-generated-context.json`: positive guard for cooking steps generated with recipe context.
- `server/eval-fixtures.ts`: adds deterministic label-expectation checks and public artifact validity semantics so expected failures can load while privacy/schema/label mismatches still fail.
- `tests/unit/eval-fixtures.test.ts`: covers committed fixture loading, expected deterministic failures, and mismatched label rejection.
- `docs/evals/README.md`, `docs/evals/fixtures/README.md`, and `docs/evals/registry.md`: index the public fixture set and command.
- `docs/workflows/evaluations.md`, `docs/workflows/testing-and-acceptance.md`, and `docs/evals/README.md`: add the user-expectation verification rule so future evals connect back to user promises, not only data shape.
- `.github/PULL_REQUEST_TEMPLATE.md`: collapses validation evidence around `Value claim`, `Evidence`, and `Evidence limits`.
- `initiatives/INIT-004-ai-output-quality-evals.md` and `initiatives/registry.md`: mark the public fixture slice as active.

## Fixture Boundary

All committed fixtures are synthetic. This branch does not commit raw real rows, Wilson private gold fixtures, provider outputs, user ids, request ids, exact private timestamps, secrets, auth data, or private pantry payloads.

Expected deterministic failures are allowed only when the matching resolved label is also `fail`. For example, `synthetic-max-time-30-to-60` has `max_time_adherence: "fail"` and loads as a valid artifact even though the deterministic max-time check fails. A fixture that labels malformed JSON as `structure_contract: "pass"` is rejected.

## Validation

Local macOS validation on branch `codex/init-004-public-fixtures`:

- `npm ci` passed with existing deprecation warnings and 0 vulnerabilities.
- `npx vitest run tests/unit/eval-fixtures.test.ts` passed: 1 file / 11 tests.
- After the user-expectation docs refresh, `npx vitest run tests/unit/eval-fixtures.test.ts` passed again: 1 file / 11 tests.
- `npm run test:unit` passed: 40 files / 267 tests.
- After the user-expectation docs refresh, `npm run check` passed: `tsc` and UI ESLint.
- After the user-expectation docs refresh, `npm audit --audit-level=high` passed: 0 vulnerabilities.
- After the user-expectation docs refresh, `npm run build` passed with existing Browserslist/Firebase dynamic-import/chunk-size warnings.
- `git diff --check` passed before and after the user-expectation docs refresh.
- After the future-test value rule update, `git diff --check`, `npx vitest run tests/unit/eval-fixtures.test.ts`, `npm run check`, `npm audit --audit-level=high`, and `npm run build` passed. Build warnings remained the existing Browserslist/Firebase dynamic-import/chunk-size warnings.

## Replit Validation

Human Replit validation is not required before merge under the automation-primary lane. This branch changes offline eval fixture artifacts, local validation semantics, and docs only. It does not change auth, provider calls, DB schema, deployment config, UI, persistence, secrets, prompt activation, or live user-facing runtime behavior.

## Open Items

- PR #190 is ready for review.
- Initial draft-gated GitHub `unit`, `e2e_guest_smoke`, and TruffleHog checks skipped and are not merge evidence.
- Exact-head GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL checks must pass after a non-draft push before merge readiness can be claimed.
- Next bounded Phase 3 candidates after this slice: fixture-validation script/routine command, another small target-set fixture batch, `pantry_recipes` queue/logging provenance, or later narrow LLM judges after fixture labels exist.
- Highest-value next fixture batch: Arize/EFF-022-derived user-expectation cases, especially food safety, skill fit, equipment fit, dietary compliance, pantry grounding, cuisine fit, and cooking-step sequence.

Do not start live-provider judge runs, private fixture ingestion, DB migrations, prompt activation, daily reports, or EFF-022 cuisine-fallback product changes without a separate documented milestone and any required Wilson decision.

## Stack / Base Status

- Base refreshed: yes
- Current base: `origin/main` at `34f361342d7793e21a187290b7df575bc6f5a1b8`
- Last Replit-validated at: not required before merge
- Notes: started after PR #188 and PR #189 landed on `main`.
