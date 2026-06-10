# INIT-004 Phase 2 Rubric and Dataset Spec

**Agent:** codex
**Branch:** `codex/init-004-phase-2-spec`
**PR:** [#168](https://github.com/wmishak404/laica/pull/168) (draft)
**Date:** 2026-06-10
**Initiative:** INIT-004
**INIT updated:** yes

## Summary

This branch starts INIT-004 Phase 2 with a reviewable spec instead of harness code. It proposes the eval taxonomy, output-quality privacy/source posture, fixture format, criterion labels, and first Wilson-label target set that must be accepted or revised before Phase 3 implementation begins.

No runtime behavior, prompt activation, schema, admin API behavior, provider calls, UI, deployment, or Replit behavior changed.

## Changes

- `docs/evals/init-004-phase-2-rubric-dataset-spec.md`
  - Adds the Phase 2 draft spec for taxonomy, privacy/source posture, fixture format, criterion labels, and seed label targets.
- `docs/evals/README.md`
  - Lists the Phase 2 spec as a practical eval-system artifact.
- `initiatives/INIT-004-ai-output-quality-evals.md`
  - Moves Phase 2 into drafting, records the active branch, links the spec, and updates the Phase 3 gate.
- `initiatives/registry.md`
  - Refreshes INIT-004's current phase and active branch.
- `efforts/effort-022-cross-cuisine-recommendation-prompts.md`
  - Records that Phase 2 uses EFF-022 examples as label-target candidates without resolving the product rule.
- `docs/handoffs/2026-06-10-codex-init-004-phase-2-spec.md`
  - This handoff.

## Impact on other agents

Do not begin Phase 3 harness code until Wilson accepts or revises the Phase 2 draft decisions:

- eval/reporting feature taxonomy vs prompt-management feature taxonomy;
- first-class `pantry_recipes` and `slop_bowl` eval surfaces;
- privacy/source posture for raw rows, production/staged samples, redacted fixtures, synthetic fixtures, and daily reports;
- criterion-level labels;
- first Wilson-label target set;
- whether max cook time is a hard eval ceiling or can be rounded above the user's selected max.

The draft intentionally keeps EFF-022 product behavior unresolved. It only says how cuisine-fit examples should be measured.

## Open items

- Wilson needs to review the Phase 2 decisions before this can become the accepted Phase 2 spec.
- Phase 3 harness code, schema/comment cleanup, judge prompts, daily reports, fixture files, and prompt-candidate automation are deferred.

## Verification

Completed on branch `codex/init-004-phase-2-spec`:

- `git diff --check` - passed before opening PR.

No E2E, DB health, Replit validation, eval run, or provider smoke is required for this docs-only draft because it does not change runtime code, schema, prompts, admin routes, provider calls, or UI.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `2abccc7a88ac4c203b64daa851bc3bde6ee40f45`
- Last Replit-validated at: not applicable for docs-only draft
- Notes: follows merged PR #166 and closeout PR #167; rebased after PR #165 and PR #169 merged; not stacked on another active branch.
