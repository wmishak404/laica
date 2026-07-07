# INIT-004 Step Preview Fixture Expansion And Judge Smoke

**Agent:** codex
**Branch:** `codex/init-004-step-preview-evals`
**Date:** 2026-07-07
**Initiative:** INIT-004
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary

PR #263 now carries the first practical validation lane for `live_cooking_step_previews`: seven public synthetic fixtures, deterministic fixture checks, and an opt-in uncalibrated judge-smoke runner that can be repeated three to five times for Wilson review. This keeps the small Live Cooking preview/action-label card as its own metric lane under INIT-004, separate from PR #260 runtime work, recipe-generation evals, and broad cooking-step safety/sequence evals.

Wilson's Replit observation that `Prep Leek` should be `Prep Leeks` for a multi-leek prep step is captured as a synthetic grammar-agreement fixture. The raw screenshot and private runtime trace are intentionally not committed.

## Changes

- `docs/evals/fixtures/live-cooking-step-previews-measurement-fragment.json`
  Focused failure fixture for labels such as `Bring 4 Cups`.
- `docs/evals/fixtures/live-cooking-step-previews-wrong-milestone.json`
  Focused failure fixture for setup-only labels such as `Heat Oil Butter` when the actual milestone is cooking vegetables.
- `docs/evals/fixtures/live-cooking-step-previews-incomplete-phrase.json`
  Focused failure fixture for incomplete labels such as `Add Cold Cooked`.
- `docs/evals/fixtures/live-cooking-step-previews-duplicate-labels.json`
  Focused failure fixture for repeated generic labels across distinct milestones.
- `docs/evals/fixtures/live-cooking-step-previews-singular-plural-agreement.json`
  Focused failure fixture derived from Wilson's Replit observation: `Prep Leek` fails when the step prepares multiple leeks and the expected wording is `Prep Leeks`.
- `docs/evals/fixtures/live-cooking-step-previews-client-rescue.json`
  Now includes judge expectations for a pass-with-provider-rescue case.
- `server/eval-judge-smoke.ts`, `scripts/run-step-preview-judge-smoke.ts`, `tests/unit/eval-judge-smoke.test.ts`
  Add prompt construction, strict JSON verdict parsing, repeated mocked judge-run summary/report formatting, and the explicit provider-backed smoke command.
- `server/eval-criteria.ts`
  Expands the plain-English failure mode to include singular/plural agreement.
- `tests/unit/eval-fixtures.test.ts`
  Verifies the expanded fixture inventory and deterministic labels.
- `docs/evals/README.md`, `docs/evals/fixtures/README.md`, `docs/evals/registry.md`, `docs/evals/init-004-phase-2-rubric-dataset-spec.md`, `docs/evals/intakes/live-cooking-step-preview-label-seed-2026-07-07.md`
  Record the fixture batch, optional smoke command, uncalibrated judge posture, and grammar-agreement error mode.
- `initiatives/INIT-004-ai-output-quality-evals.md`, `initiatives/registry.md`
  Update the current INIT-004 resume point and registry signal.

## Impact on other agents

The Phase 4 runtime mapping remains unchanged:

- raw provider label: provider `actionLabel`
- normalized provider label: `normalizeStepActionLabel(...)`
- fallback label: `deriveStepActionLabel(...)`
- final rendered rail label: `buildStepPreviewLabels(...)`
- current-step headline label: `getStepHeadline(...)`
- sibling labels before rendering: raw or normalized provider labels before rendering
- sibling labels after rendering: `buildStepPreviewLabels(...)` output

Runtime prompt/fallback work still belongs to the INIT-001/Phase 4 lane or a separate coordinated branch. INIT-004 only owns the eval fixtures, criteria, validation, and smoke-reporting discipline.

## Open items

- Wilson can run the optional judge smoke with local secrets and review the report:

```bash
npm run env:run -- npm run eval:step-preview-judge-smoke -- --runs 3 --out /tmp/laica-step-preview-judge-smoke.md
```

- The judge-smoke output is uncalibrated and should be treated as review material only until Wilson-labeled examples exist and TPR/TNR are measured.
- Pixel/visual fit remains future scope; this branch checks first-pass word and character limits only.
- PR #260 runtime fallback behavior is not validated here.

## Verification

- `npx vitest run tests/unit/eval-fixtures.test.ts tests/unit/evaluator.test.ts tests/unit/eval-judge-smoke.test.ts` passed: 3 files, 23 tests.
- `npm run eval:fixtures` passed with the known narrow `tsx` IPC sandbox escalation: 17 public fixtures validated; `live_cooking_step_previews=7`.
- `npm run check` passed.
- `npm run test:unit` passed: 46 files, 352 tests.
- `npm run build` passed. Vite reported existing browserslist staleness, Firebase dynamic/static import, and large chunk warnings.
- `git diff --check` passed before this handoff was written; rerun before commit/push.

No Replit validation is required for this offline eval-harness branch. It changes no runtime provider path, user-facing UI, deployment config, DB schema, production prompt activation, private fixture storage, or PR #260 branch state.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `3d33239`
- Last Replit-validated at: not applicable for offline eval-harness work
- Notes: PR #260 has merged and this branch was later rebased onto the PR #262 closeout baseline. This remains an independent INIT-004 branch, not a stack on PR #260.
