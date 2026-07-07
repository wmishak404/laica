# INIT-004 Live Cooking Step Preview Eval Implementation

**Agent:** codex
**Branch:** `codex/init-004-step-preview-evals`
**Date:** 2026-07-07
**Initiative:** INIT-004
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary

The first auditable `live_cooking_step_previews` eval lane is implemented after INIT-001 Phase 4 PR #260 peer review confirmed the family name and boundary. This remains INIT-004 eval infrastructure: it adds first-class feature/criteria support, deterministic fixture validation, two public synthetic fixtures, and durable registry/docs updates without touching PR #260 runtime code, prompts, or branch ownership.

This lane intentionally separates the small Live Cooking preview/action-label card from broad `cooking_steps` safety/sequence quality and from recipe-generation metrics. It can now preserve both provider-label failures and final rendered-label outcomes, so future reports can tell whether the model failed, the client rescued the label, or the final card still failed.

## Changes

- `server/ai-feature-types.ts`
  Adds `live_cooking_step_previews` as a canonical eval/reporting feature id while keeping prompt-managed ids unchanged.
- `server/eval-criteria.ts`
  Adds a narrow uncalibrated criteria entry for future `live_cooking_step_previews` judge batches. The criteria distinguish measurement fragments, wrong milestones, ungrammatical/incomplete labels, duplicate labels, preview-card length, and provider labels that need client rescue.
- `server/eval-fixtures.ts`
  Adds the fixture-only output schema and deterministic checks for `live_cooking_step_previews`: required recipe/source-label/rendered-label/sibling-list/card-constraint shape, final rendered-label word/character limits, measurement/quantity avoidance, and exact sibling-label duplicates.
- `docs/evals/fixtures/live-cooking-step-previews-client-rescue.json`
  Synthetic positive rendered-label guard. It preserves bad provider labels like `Bring 4 Cups`, `Heat Oil Butter`, `Push Vegetables Side`, and `Add Cold Cooked` while final rendered labels become `Boil Water`, `Cook Leek & Spinach`, `Push Vegetables Aside`, and `Add Cold Rice`.
- `docs/evals/fixtures/live-cooking-step-previews-rendered-fragments.json`
  Synthetic negative rendered-label guard. It keeps failed final labels such as `Bring 4 Cups`, duplicate `Cook Vegetables`, and `Add Cold Cooked`.
- `tests/unit/eval-fixtures.test.ts`
  Covers the new feature id, prompt-management separation, positive client-rescue fixture shape, negative deterministic measurement/duplicate failures, and committed fixture loading.
- `tests/unit/evaluator.test.ts`
  Confirms `live_cooking_step_previews` is eligible for eval criteria and appears in pending queue summaries.
- `shared/schema.ts`
  Updates the `ai_interactions.feature_type` comment for the new eval feature id.
- `docs/evals/README.md`, `docs/evals/fixtures/README.md`, `docs/evals/registry.md`, `docs/evals/init-004-phase-2-rubric-dataset-spec.md`, `docs/evals/intakes/live-cooking-step-preview-label-seed-2026-07-07.md`, `docs/workflows/evaluations.md`
  Record the implemented surface, fixture batch, value/evidence/limits, uncalibrated judge posture, and separation from recipe-generation / broad cooking-step metrics.
- `initiatives/INIT-004-ai-output-quality-evals.md`, `initiatives/registry.md`
  Update INIT-004 phase status, validation posture, resume point, chronology, and registry signal.

## Fixture Shape

Each `live_cooking_step_previews` fixture output is a raw JSON string with:

- accepted recipe context,
- `renderingConstraints` such as `maxWords`, `preferredMaxWords`, and `maxCharacters`,
- `siblingLabelsBeforeRendering`,
- `siblingLabelsAfterRendering`,
- one or more `previews`, each with `stepIndex`, `instruction`, raw `providerActionLabel`, optional `clientNormalizedProviderLabel`, optional `clientFallbackLabel`, and final `renderedPreviewLabel`.

V1 deterministic checks judge the final rendered labels for structure, word/character limits, measurements, and exact duplicate sibling labels. Human/judge labels are preserved for provider-label quality, final rendered-label quality, plain-English quality, and milestone fit.

## Examples Captured

Preserved good direction:

- `Boil Water`
- `Cook Leek & Spinach`
- `Push Vegetables Aside`
- `Add Cold Rice`
- `Season Fried Rice`
- `Serve Fried Rice`

Preserved bad examples/patterns:

- `Bring 4 Cups`
- `Heat Oil Butter`
- `Push Vegetables Side`
- `Add Cold Cooked`
- repeated `Cook Vegetables` labels for distinct milestones

## Impact on Phase 4 / PR #260

No PR #260 runtime code or prompt text was changed here. The eval lane confirms the prompt constraints Phase 4 already accepted: action/result over measurement fragments, actual milestone over setup words, idiomatic phrases, required object nouns, and distinct labels for distinct milestones.

Potential Phase 4 review checks before PR #260 merges:

- Confirm PR #260's runtime object names map cleanly to the fixture fields: raw provider `actionLabel`, normalized provider label if any, fallback label, final rendered label, and sibling lists.
- If PR #260 enforces a different hard character limit than the synthetic `28` used here, INIT-004 can update `renderingConstraints` in a follow-up without changing the surface boundary.
- Pixel/visual preview-card fit is still future scope; this branch only validates word and character limits.

## Open items

- Future Wilson-labeled calibration should measure TPR/TNR before any `live_cooking_step_previews` judge output becomes product-quality truth.
- Future fixtures can add near-duplicate labels and visual/pixel card-fit cases after PR #260 runtime behavior stabilizes.
- Runtime prompt or fallback changes still belong in the Phase 4 PR thread or a later INIT-001/INIT-004 coordinated branch, not in this eval-harness branch.

## Verification

- `npx vitest run tests/unit/eval-fixtures.test.ts tests/unit/evaluator.test.ts` passed: 2 files, 18 tests.
- `npm run eval:fixtures` passed after sandbox escalation for the known `tsx` IPC pipe issue: 12 public fixtures validated; `live_cooking_step_previews=2`.
- `npm run check` passed.
- `npm run build` passed. Vite reported the existing browserslist staleness and large chunk warnings.
- `npm run test:unit` passed: 45 files, 343 tests.
- `git diff --check` passed before this handoff was written; rerun before commit/push.

No Replit validation is required for this offline eval-harness branch. It changes no runtime provider path, user-facing UI, deployment config, DB schema, production prompt activation, private fixture storage, or PR #260 branch state.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `263eec5fc14e0923807e2a040d46125846fd1152`
- Last Replit-validated at: not applicable for offline eval-harness work
- Notes: not stacked on PR #260. The Phase 4 peer review came through thread `019f3962-127d-7910-8d99-b6d21357b680`; this branch should be pushed back to that thread for awareness before PR #260 prompt finalization/merge.
