# 2026-07-07 - INIT-004 Step Preview Eval PR #260 Alignment

## Summary

PR #260 merged to `main` as `72df55749b8c9a83ad6e5d5123a64592eb40dbfb` from validated head `0040f9f43d78634b0341a20a16a43c3c5a06109d`. The INIT-004 branch `codex/init-004-step-preview-evals` has been rebased onto that merged baseline and keeps `live_cooking_step_previews` as a distinct eval family for the small Live Cooking preview/action-label card.

This follow-up does not change PR #260 runtime code or prompts. It only aligns the synthetic eval fixtures and durable docs with the merged runtime limits and Phase 4's field mapping.

## Alignment Applied

- `renderingConstraints.maxCharacters` in both public synthetic `live_cooking_step_previews` fixtures now uses `24`, matching PR #260's `STEP_ACTION_LABEL_MAX_CHARS`.
- Test helper fixtures now use the same `24` character limit.
- Durable eval docs now record PR #260's merged baseline, validated head, runtime limit, and field mapping.
- The original implementation handoff now marks the pre-merge Phase 4 checks as resolved.

## Runtime Mapping From Phase 4

- Raw provider label: provider `actionLabel`.
- Normalized provider label: `normalizeStepActionLabel(...)` result when the provider label is accepted or rescued.
- Fallback label: `deriveStepActionLabel(...)`.
- Final rendered rail label: `buildStepPreviewLabels(...)`.
- Current-step headline label: `getStepHeadline(...)`.
- Sibling labels before rendering: raw or normalized provider label list before `buildStepPreviewLabels(...)`.
- Sibling labels after rendering: `buildStepPreviewLabels(...)` output.

The V1 fixture field names remain intentionally eval-focused: `providerActionLabel`, `clientNormalizedProviderLabel`, `clientFallbackLabel`, `renderedPreviewLabel`, `siblingLabelsBeforeRendering`, and `siblingLabelsAfterRendering`.

## Examples Preserved

Good labels preserved in the positive rendered fixture:

- `Boil Water`
- `Cook Leek & Spinach`
- `Push Vegetables Aside`
- `Add Cold Rice`
- `Season Fried Rice`
- `Serve Fried Rice`

Failure patterns preserved in provider or negative rendered fixtures:

- `Bring 4 Cups`
- `Heat Oil Butter`
- `Push Vegetables Side`
- `Add Cold Cooked`
- repeated `Cook Vegetables` labels for distinct milestones

## Validation

- `npx vitest run tests/unit/eval-fixtures.test.ts tests/unit/evaluator.test.ts` passed: 2 files, 18 tests.
- `git diff --check` passed.
- `npm run check` passed.
- `npm run eval:fixtures` initially hit the known sandbox `tsx` IPC pipe denial, then passed with sandbox escalation: 12 public fixtures validated; `live_cooking_step_previews=2`.
- `npm run test:unit` passed: 45 files, 347 tests.
- `npm run build` passed. Vite reported existing browserslist staleness, Firebase dynamic/static import, and large chunk warnings.

No Replit validation is required for this offline eval-harness branch. The branch changes no runtime provider path, user-facing UI, deployment config, DB schema, production prompt activation, private fixture storage, or PR #260 branch state.

## Open Questions

- Pixel/visual card-fit checks remain future scope.
- Judge criteria remain uncalibrated until Wilson labels enough examples to measure TPR/TNR.
- Runtime fallback behavior can be validated by a future INIT-001/INIT-004 coordinated check, but this branch deliberately stays synthetic/offline.
