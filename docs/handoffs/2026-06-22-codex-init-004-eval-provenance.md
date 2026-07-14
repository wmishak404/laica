# INIT-004 Eval Provenance

**Agent:** codex
**Branch:** `codex/init-004-eval-provenance`
**Date:** 2026-06-22
**Initiative:** INIT-004
**INIT updated:** yes
**PR:** [#219](https://github.com/wmishak404/laica/pull/219)

## Summary

This slice makes future pantry recipe evals more reliable without changing what users see or what prompt generates recipes. Chef It Up `/api/recipes/pantry` outputs now log under the `pantry_recipes` eval surface while preserving the existing `recipe_suggestions` prompt source and prompt-version provenance, so later Wilson labels or judges can distinguish pantry-recipe behavior from generic recipe suggestions.

## Architecture Triage

- INIT-001 current start point: Phase 3.1 follow-up / Phase 4 follow-up after PR #208 and PR #191. Remaining slices include provider benchmark comparison, ingredient chip unification, closeout visual review, and later full Phase 4. Dependency/risk: UI/provider/Replit judgment risk is higher, and Phase 4 product scope is larger than a one-run automation milestone. 2026-07-13 note: later PR #234 shipped ingredient-chip consistency; current remaining Phase 3.1 scope lives in the phase record and INIT.
- INIT-002 current start point: Phase 2 Replit observation week after Phase 1 logger merge. Dependency/risk: Phase 3 DB persistence is explicitly blocked until Replit observation records classifier gaps and field nullability.
- INIT-003 current start point: Phase 5 / later promotion follow-up planning. Dependency/risk: waits on INIT-001 Phase 5 semantics for History, cleanup, taste memory, pending cleanup, and next-meal retention.
- INIT-004 current start point: Phase 3 eval harness after PR #205. Dependency/risk: no active INIT-004 PR was open; the queue/provenance slice is documented, offline, and does not require product/security/privacy/secrets/Replit/deployment judgment.

Decision: selected INIT-004 because it was the clearest unowned, already-planned, architecture-leverage milestone. It tightens the eval data model before LLM judges or prompt work.

## Changes

- `server/openai.ts`: adds recipe suggestion eval-log options; `/api/recipes/pantry` can classify logs as `pantry_recipes` while still using the `recipe_suggestions` prompt and provider path.
- `server/prompt-manager.ts`: adds `getActivePromptVersion()` so callers can retain active prompt id provenance while preserving the existing `getActivePrompt()` API.
- `server/routes.ts`: passes the `pantry_recipes` eval surface for pantry recipe generation.
- `server/evaluator.ts`: adds criteria-aware eval-batch selection helpers and uses them before batch submission.
- `tests/unit/recipe-eval-logging.test.ts`: proves pantry recipe logs use `pantry_recipes` plus active recipe prompt-version provenance with provider/DB mocked.
- `tests/unit/evaluator.test.ts`: proves unsupported operational or future feature rows are skipped by the eval queue helper.
- `tests/unit/phase0-security-routes.test.ts` and `tests/unit/anonymous-production-gates-route.test.ts`: update pantry route expectations.
- `initiatives/INIT-004-ai-output-quality-evals.md`, `initiatives/registry.md`, `docs/evals/README.md`, and `efforts/effort-022-cross-cuisine-recommendation-prompts.md`: record the active slice and clarify that EFF-022 product-rule work remains open.

## Impact on other agents

Future INIT-004 work can now query or batch pantry recipe interactions separately from general recipe suggestions. If a DB prompt version is active for `recipe_suggestions`, eval rows will carry that prompt id even when the eval surface is `pantry_recipes`, preserving the accepted prompt-reuse boundary.

EFF-022 remains open. This branch does not decide selected-cuisine fallback behavior, add cuisine-fit fixtures, change prompts, or alter recipe cards.

## Open Items

- Wait for GitHub `unit`, `e2e_guest_smoke`, audit/security, and CodeQL checks on the pushed head.
- Wilson still owns the explicit merge decision because this is code/infrastructure work.

## Verification

- `npm ci` passed after dependencies were missing in this worktree.
- `npm run eval:fixtures` initially failed before executing because local sandboxing blocked the `tsx` IPC pipe with `listen EPERM`; the same command passed after narrow escalation. It validated 10 public fixtures across `cooking_steps`, `pantry_recipes`, `recipe_suggestions`, and `slop_bowl`.
- `npx vitest run tests/unit/evaluator.test.ts tests/unit/recipe-eval-logging.test.ts tests/unit/eval-fixtures.test.ts tests/unit/phase0-security-routes.test.ts tests/unit/anonymous-production-gates-route.test.ts` passed: 5 files / 34 tests.
- `npm run test:unit` passed: 44 files / 315 tests.
- `npm run check` passed.
- `npm audit --audit-level=high` passed with 0 vulnerabilities.
- `npm run build` passed with existing Browserslist/Firebase dynamic-import/chunk-size warnings.
- `git diff --check` passed.

GitHub exact-head checks are pending until the PR is opened.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `659b361b9985fc072e9a17d216e18626f889fda6`
- Last Replit-validated at: not yet validated; not expected for this offline eval/logging metadata slice
- Notes: no lower INIT-004 PR was open. PR #219 was rebased onto current `origin/main` after unrelated PR #218 merged.
