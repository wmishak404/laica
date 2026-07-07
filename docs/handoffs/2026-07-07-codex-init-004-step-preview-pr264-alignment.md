# INIT-004 Step Preview PR #264 Alignment

**Agent:** codex
**Branch:** `codex/init-004-step-preview-evals`
**Date:** 2026-07-07
**Initiative:** INIT-004
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary

PR #263 now mirrors the latest INIT-001 Phase 4 prompt direction from PR #264 head `a180b3258a82dd81b912ffb9872eb6bb8aeb2e6b` without changing runtime code. The `live_cooking_step_previews` eval lane already covered the `Prep Leek` / `Prep Leeks` grammar-agreement case; this pass adds the second new Replit review failure mode: a final off-heat green-onion/herb serving step must not render the stale generic label `Cook Vegetables`.

The new fixture keeps this as a semantic/milestone failure rather than a duplicate-label failure. Its sibling list contains only one `Cook Vegetables` label, so deterministic distinctness passes while `step_preview_milestone_fit` and rendered quality fail.

## Changes

- `docs/evals/fixtures/live-cooking-step-previews-stale-final-garnish-label.json`
  Adds a synthetic single-failure fixture for an instruction like "Turn off the heat, stir in sliced green onions, and serve hot in ceramic bowls" whose final rendered label is incorrectly `Cook Vegetables`. Expected quick-recall wording is `Garnish` or `Garnish & Serve`.
- `server/eval-criteria.ts`
  Expands `wrong_milestone_label` to cover stale generic labels on final garnish, serving, and plating actions.
- `server/eval-judge-smoke.ts`, `tests/unit/eval-judge-smoke.test.ts`
  Include the new stale-final-garnish fixture in the default smoke set.
- `tests/unit/eval-fixtures.test.ts`
  Verifies the eighth committed `live_cooking_step_previews` fixture and its milestone-fit failure label.
- `docs/evals/README.md`, `docs/evals/fixtures/README.md`, `docs/evals/registry.md`, `docs/evals/init-004-phase-2-rubric-dataset-spec.md`, `docs/evals/intakes/live-cooking-step-preview-label-seed-2026-07-07.md`
  Record PR #264 as prompt provenance, update the public fixture count to eight, and preserve the no-raw-screenshot/no-private-trace posture.
- `docs/evals/reports/2026-07-07-live-cooking-step-preview-fixture-validation.md`, `docs/evals/reports/README.md`
  Add a static aggregate Markdown report for the PR #263 synthetic fixture-validation run, aligned with the PR #246 report-export planning shape: redacted, evidence-based, calibration-aware, explicit that real usage sample size is 0, and usable in PR/handoff review.
- `initiatives/INIT-004-ai-output-quality-evals.md`, `initiatives/registry.md`
  Update the current INIT-004 resume point and registry signal.

## Impact on other agents

The fixture aligns to PR #264 prompt intent only. It does not prove that the provider follows the updated prompt, and it does not test PR #264 runtime fallback behavior. Keep runtime prompt/fallback changes in the INIT-001 Phase 4 lane unless Wilson explicitly redirects.

The static report aligns with the PR #246 report-export planning thread by keeping the artifact aggregate/redacted, Markdown-first, explicit about calibration status, explicit that the run is synthetic fixture validation rather than real usage, and free of raw request/response payloads. It is not the future admin-generated JSON/Markdown report endpoint; it is a public-safe committed report artifact for this fixture run.

The fixture-level distinction to preserve:

- `duplicate_distinct_milestone_label`: same rendered label repeats for different milestones.
- `wrong_milestone_label`: rendered label is unique but semantically stale or names the wrong milestone, such as `Cook Vegetables` for a final garnish/serve step.

## Open items

- After PR #264 merges, rebase PR #263 onto fresh `origin/main` and confirm no doc conflicts with the INIT-001 closeout.
- Wilson can still run the optional judge smoke after the prompt lane settles:

```bash
npm run env:run -- npm run eval:step-preview-judge-smoke -- --runs 3 --out /tmp/laica-step-preview-judge-smoke.md
```

- Judge-smoke output remains uncalibrated until Wilson-labeled examples and TPR/TNR exist.

## Verification

- `npx vitest run tests/unit/eval-fixtures.test.ts tests/unit/evaluator.test.ts tests/unit/eval-judge-smoke.test.ts` passed: 3 files, 23 tests.
- `npm run eval:fixtures` passed with the known narrow `tsx` IPC sandbox escalation: 18 public fixtures validated; `live_cooking_step_previews=8`.
- `git diff --check` passed.
- `npm run check` passed.
- `npm run test:unit` passed: 46 files, 352 tests.
- `npm run build` passed. Vite reported existing Browserslist staleness, Firebase dynamic/static import, and large chunk warnings.
- `npm audit --audit-level=high` passed: 0 vulnerabilities.

No Replit validation is required for this offline eval-harness branch. It changes no runtime provider path, user-facing UI, deployment config, DB schema, production prompt activation, private fixture storage, raw screenshot/trace storage, or PR #264 branch state.

## Stack / base status

- Base refreshed: yes for branch remote fetch
- Current base: `origin/main` at `3d33239`
- Last Replit-validated at: not applicable for offline eval-harness work
- Notes: PR #264 is still a separate INIT-001 runtime/prompt branch at `a180b3258a82dd81b912ffb9872eb6bb8aeb2e6b`; this PR #263 branch is not stacked on it.
