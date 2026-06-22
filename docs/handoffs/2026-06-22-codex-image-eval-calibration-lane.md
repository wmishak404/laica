# Image eval calibration lane

**Agent:** codex
**Branch:** codex/image-eval-calibration-lane
**Date:** 2026-06-22
**Initiative:** INIT-004
**INIT updated:** yes

## Summary

Wilson accepted the architecture direction for generated recipe-image judge calibration: model-only judging is not enough, so the eventual image-quality lane must use blind human review, judge-model comparison, frozen human-labeled image sets, calibration reports, and action routing. This branch records that as INIT-004 Phase 7 without making it current INIT-004 Phase 3 work.

## Changes

- `docs/workflows/evaluations.md`
  Adds the future INIT-004 image-quality calibration phase with blind review, structured labels, judge reveal after save, judge-candidate comparison, calibration metrics, and action routing.
- `initiatives/INIT-004-ai-output-quality-evals.md`
  Records the accepted future lane, keeps it outside current recipe-text V1 scope, and adds the current-resume warning not to start recurring human image-eval automation until the human-review/reporting workflow exists.
- `docs/evals/README.md`
  Notes that future generated-image review batches can use the eval registry while staying separate from recipe-text pass rates.
- `initiatives/registry.md`
  Refreshes INIT-004's last signal with the PR #219 baseline and the accepted Phase 7 image-quality calibration lane.
- `docs/handoffs/2026-06-22-codex-image-eval-calibration-lane.md`
  Captures this coordination decision.

## Impact on other agents

Do not treat `recipe_image_cache.accuracy_result` as calibrated product truth by itself. It is runtime quality telemetry until Wilson labels sampled examples and judge models/prompts/thresholds are compared against that human-labeled set.

Future implementation should start with a review queue, not a dashboard:

- sample near-threshold approvals/rejections, repeated clusters, provider/model/style comparisons, and policy/safety failures;
- hide judge results until Wilson labels accept/reject/needs-product-decision;
- record structured failure labels;
- then reveal and compare judge outputs;
- route repeated disagreements into generator prompt, judge prompt, threshold, provider/style, fingerprinting, product-rule, or fixture/gold-set work.

## Open items

- Build the core INIT-004 human-review queue and calibration reporting first.
- Treat image quality as INIT-004 Phase 7 after the current text-output eval foundation phases.
- Do not start recurring image-eval automation until the queue/report workflow exists.

## Verification

Local verification:

- `git diff --check` passed.

No runtime, schema, provider, fixture-data, prompt, UI, or deployment behavior changed.
