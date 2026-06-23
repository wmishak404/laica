# INIT-004 Eval Summary Reporting

**Agent:** codex
**Branch:** `codex/init-004-eval-summary`
**Date:** 2026-06-23
**Initiative:** INIT-004
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary

This slice makes the eval admin/reporting layer clearer before Laica starts relying on judge runs or daily eval reports. Pending eval rows now show which feature rows are actually eligible for current criteria, and completed eval summaries can separate results by eval surface and prompt-version provenance, so future `pantry_recipes` reporting does not get blurred into generic `recipe_suggestions` just because the prompt path is reused.

## Architecture Triage

- INIT-001 current start point: Phase 3.1 follow-up / Phase 4 planning after the Prep Tray image-fill and Live Cooking speech arbitration merges. Smallest candidates are Gemini/OpenAI benchmark comparison, ingredient chip unification, visual closeout review, or broader Phase 4 work. Dependency/risk: provider benchmarks and UI review need Replit/product judgment; Phase 4 is larger than one safe automation milestone.
- INIT-002 current start point: Phase 2 Replit observation week. Dependency/risk: Phase 3 DB persistence is explicitly blocked until Replit observation records classifier gaps and field-nullability decisions.
- INIT-003 current start point: Phase 5 / later promotion follow-up planning. Dependency/risk: later guest cook/History import waits for INIT-001 Phase 5 semantics.
- INIT-004 current start point: Phase 3 eval harness. Dependency/risk: no active INIT-004 PR was open; the current INIT explicitly listed queue/reporting summaries using separated eval surface and prompt-version provenance as a bounded candidate.

Decision: selected INIT-004 because it was the clearest unowned, already-planned, architecture-leverage milestone. Open PR #220 is active Effort work and was left untouched.

## Changes

- `server/evaluator.ts`: adds pure pending queue and completed eval report summary builders; `getEvalSummary()` now returns feature-level and prompt-version-level aggregates while preserving the existing raw failed interaction list; `getPendingQueueSummary()` exposes eligible/skipped pending counts.
- `server/admin-routes.ts`: updates `GET /api/admin/eval/pending` to return the richer queue summary instead of only total/by-feature counts.
- `tests/unit/evaluator.test.ts`: proves pending eligibility/skipped counts and completed eval surface/prompt-version aggregation.
- `tests/unit/admin-cache-headers.test.ts`: updates the admin-route mock for the richer pending summary.
- `docs/evals/README.md`: documents current admin summary surfaces and their negative scope.
- `initiatives/INIT-004-ai-output-quality-evals.md` and `initiatives/registry.md`: record this active Phase 3 slice and next resume point.

## Impact on other agents

Future INIT-004 reporting work can use `featureReports` and `promptVersionReports` from `/api/admin/eval/summary` to separate eval-surface behavior from prompt-source provenance. In particular, pantry recipe rows can report as `pantry_recipes` while retaining the active `recipe_suggestions` prompt version id from PR #219.

This branch does not start LLM judges, submit batches, process new eval results, add private fixtures, change prompts, alter schema, add user-facing UI, activate daily reports, or decide EFF-022 cuisine fallback behavior.

## Open items

- Open the PR, add `codex` and `codex-automation` labels, and refresh this handoff/INIT PR placeholders with the PR number.
- Run the full local validation lane and exact-head GitHub checks after the PR is pushed.
- Wilson still owns the explicit merge decision because this is code/infrastructure work.

## Verification

Completed so far:

- `npm ci` passed after the fresh worktree lacked installed dependencies.
- `npx vitest run tests/unit/evaluator.test.ts tests/unit/admin-cache-headers.test.ts` passed: 2 files / 4 tests.

Pending before review:

- `npm run eval:fixtures`
- `npm run test:unit`
- `npm run check`
- `npm audit --audit-level=high`
- `npm run build`
- `git diff --check origin/main...HEAD`
- GitHub exact-head `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL checks after PR open.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `89ce14ff169ff9a2a721a615b42cd46c28fc1bf0`
- Last Replit-validated at: not required before merge for this admin/reporting summary slice
- Notes: branch started from fresh `origin/main`; no lower INIT-004 PR is open. Replit validation is not expected because this changes local/admin eval summarization only and does not touch providers, prompts, DB schema, deployment, UI, private fixtures, or user-facing runtime behavior.
