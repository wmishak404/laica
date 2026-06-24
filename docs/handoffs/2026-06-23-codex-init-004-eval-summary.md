# INIT-004 Eval Summary Reporting

**Agent:** codex
**Branch:** `codex/init-004-eval-summary`
**Date:** 2026-06-23
**Initiative:** INIT-004
**INIT updated:** yes
**Resolves blocked handoff:** none
**PR:** [#232](https://github.com/wmishak404/laica/pull/232)

## Summary

This slice makes the eval admin/reporting layer clearer before Laica starts relying on judge runs or daily eval reports. Pending eval rows now show which feature rows are actually eligible for current criteria, completed eval summaries separate results by eval surface and prompt-version provenance, and the recipe-generation eval surface names now match the product surfaces: `chef_it_up_suggestions` and `slop_bowl_suggestions`. Legacy `pantry_recipes` and `slop_bowl` rows normalize into those canonical ids so existing eval data remains readable without a DB migration.

## Architecture Triage

- INIT-001 current start point: Phase 3.1 follow-up / Phase 4 planning after the Prep Tray image-fill and Live Cooking speech arbitration merges. Smallest candidates are Gemini/OpenAI benchmark comparison, ingredient chip unification, visual closeout review, or broader Phase 4 work. Dependency/risk: provider benchmarks and UI review need Replit/product judgment; Phase 4 is larger than one safe automation milestone.
- INIT-002 current start point: Phase 2 Replit observation week. Dependency/risk: Phase 3 DB persistence is explicitly blocked until Replit observation records classifier gaps and field-nullability decisions.
- INIT-003 current start point: Phase 5 / later promotion follow-up planning. Dependency/risk: later guest cook/History import waits for INIT-001 Phase 5 semantics.
- INIT-004 current start point: Phase 3 eval harness. Dependency/risk: no active INIT-004 PR was open; the current INIT explicitly listed queue/reporting summaries using separated eval surface and prompt-version provenance as a bounded candidate.

Decision: selected INIT-004 because it was the clearest unowned, already-planned, architecture-leverage milestone. Open PR #220 is active Effort work and was left untouched.

## Changes

- `server/ai-feature-types.ts`: renames canonical recipe-generation eval ids to `chef_it_up_suggestions` and `slop_bowl_suggestions`, with legacy aliases for `pantry_recipes` and `slop_bowl`.
- `server/evaluator.ts`: adds pure pending queue and completed eval report summary builders; `getEvalSummary()` now returns feature-level and prompt-version-level aggregates while preserving the existing raw failed interaction list; `getPendingQueueSummary()` exposes eligible/skipped pending counts; legacy feature ids normalize into canonical report keys.
- `server/admin-routes.ts`: updates `GET /api/admin/eval/pending` to return the richer queue summary instead of only total/by-feature counts.
- `server/routes.ts` and `server/openai.ts`: write future Chef It Up and Slop Bowl eval/error rows under the clearer canonical ids.
- `server/eval-criteria.ts`, `server/eval-fixtures.ts`, `shared/schema.ts`, and public fixtures: move the active eval taxonomy and fixture corpus to the canonical ids while accepting legacy fixture surface ids.
- `tests/unit/evaluator.test.ts`: proves pending eligibility/skipped counts, completed eval surface/prompt-version aggregation, and legacy-id normalization.
- `tests/unit/admin-cache-headers.test.ts`: updates the admin-route mock for the richer pending summary.
- `docs/evals/README.md`, `docs/evals/init-004-phase-2-rubric-dataset-spec.md`, PD-010, EFF-022, and the INIT records: document current admin summary surfaces, taxonomy rename, compatibility behavior, and negative scope.
- `initiatives/INIT-004-ai-output-quality-evals.md` and `initiatives/registry.md`: record this active Phase 3 slice and next resume point.

## Impact on other agents

Future INIT-004 reporting work can use `featureReports` and `promptVersionReports` from `/api/admin/eval/summary` to separate eval-surface behavior from prompt-source provenance. In particular, Chef It Up rows report as `chef_it_up_suggestions` while retaining the active `recipe_suggestions` prompt version id from PR #219. Older `pantry_recipes` rows normalize into the same report key.

This branch does not start LLM judges, submit batches, process new eval results, add private fixtures, change prompts, alter schema, add user-facing UI, activate daily reports, or decide EFF-022 cuisine fallback behavior.

## Open items

- Mark PR #232 ready for review and wait for exact-head GitHub checks.
- Wilson still owns the explicit merge decision because this is code/infrastructure work.

## Verification

Completed so far:

- `npm ci` passed after the fresh worktree lacked installed dependencies.
- `npx vitest run tests/unit/evaluator.test.ts tests/unit/admin-cache-headers.test.ts` passed: 2 files / 4 tests.
- `npx vitest run tests/unit/evaluator.test.ts tests/unit/eval-fixtures.test.ts tests/unit/recipe-eval-logging.test.ts tests/unit/ai-errors.test.ts tests/unit/phase0-security-routes.test.ts tests/unit/anonymous-production-gates-route.test.ts tests/unit/admin-cache-headers.test.ts` passed after updating the sorted fixture-id expectation: 7 files / 42 tests.
- `npm run eval:fixtures` initially failed before script execution because local sandboxing blocked the `tsx` IPC pipe with `listen EPERM`; the same command passed after narrow escalation and validated 10 public fixtures across `chef_it_up_suggestions=4`, `cooking_steps=4`, `recipe_suggestions=1`, and `slop_bowl_suggestions=1`.
- `npm run test:unit` passed: 44 files / 320 tests.
- `npm run check` passed.
- `npm audit --audit-level=high` passed with 0 vulnerabilities.
- `npm run build` passed with existing Browserslist/Firebase dynamic-import/chunk-size warnings.
- `git diff --check` passed.
- `git diff --check origin/main...HEAD` passed after the post-fetch rebase check.

Pending before review:

- GitHub exact-head `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL checks after PR open.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `0c94f76ab69ded678fd4cfff067f97e458bd80ac`
- Current head: see PR #232 head after push.
- Last Replit-validated at: not required before merge for this admin/reporting summary slice
- Notes: branch started from fresh `origin/main`; after Wilson's later merges, `git fetch origin` showed current `origin/main` at `0c94f76ab69ded678fd4cfff067f97e458bd80ac`, and `git rebase origin/main` reported the branch was already up to date. No lower INIT-004 PR is open. Replit validation is not expected because this changes local/admin eval summarization only and does not touch providers, prompts, DB schema, deployment, UI, private fixtures, or user-facing runtime behavior.
