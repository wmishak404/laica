# INIT-004 Phase 2 spec revision from Wilson decisions

**Agent:** codex
**Branch:** `codex/init-004-phase-2-spec`
**Date:** 2026-06-13
**Initiative:** INIT-004
**INIT updated:** yes
**Source handoff:** [2026-06-13-claude-init-004-phase-2-wilson-decisions.md](2026-06-13-claude-init-004-phase-2-wilson-decisions.md)

## Summary

Wilson accepted the architecture decisions for INIT-004 Phase 2, and this pass revised the Phase 2 spec from Claude's consolidated handoff so Phase 3 does not inherit chat-only decisions. The main architectural change is making fixtures independently evaluable and calibratable: each fixture now separates the byte-faithful request, structured constraints, raw model output, labels, and provenance.

This is still docs-only. No runtime code, schema, admin route, prompt, provider call, UI, fixture data, or eval run changed.

## Changes

- `docs/evals/init-004-phase-2-rubric-dataset-spec.md`
  - Rewrites the draft around Wilson's accepted decisions:
    - eval feature IDs stay separate from prompt feature IDs;
    - `pantry_recipes` and `slop_bowl` are first-class eval/reporting surfaces;
    - max-time adherence uses `cookTime <= selectedMax + 15`;
    - fixtures store raw `output`, split byte-faithful `request` from structured `constraints`, and record output/label provenance;
    - label values use `blocked_on_product_rule` instead of `needs_wilson`;
    - `dietary_compliance` is added and nutrition is excluded;
    - public synthetic/redacted fixtures live under `docs/evals/fixtures/`, while private raw gold fixtures live under `LAICA_PRIVATE_EVAL_DIR`;
    - eval artifacts are offline evidence only and must not become runtime memory, production prompt material, another user's context, or user-facing content;
    - `cooking_assistance` remains infrastructure-only in V1;
    - Phase 3 implementation implications now include eval-queue selection, prompt-version provenance, no DB migration for feature IDs, and canonical feature-id typing.
- `docs/evals/README.md`
  - Records the public fixture path and private `LAICA_PRIVATE_EVAL_DIR` distinction.
- `initiatives/INIT-004-ai-output-quality-evals.md`
  - Updates Phase 2 status, current resume point, build signal, and chronology from Wilson's decisions.
- `initiatives/registry.md`
  - Updates INIT-004's phase and PR-state signal.
- `docs/handoffs/2026-06-10-codex-init-004-phase-2-spec.md`
  - Marks the original handoff as superseded by the 2026-06-13 decision/revision pass.

## PR / branch state

`gh pr view 168` reported PR #168 as closed/unmerged on 2026-06-13, while `origin/codex/init-004-phase-2-spec` still exists and contains Claude's decision handoff. This revision was made from a detached clean worktree at `origin/codex/init-004-phase-2-spec` to avoid pulling unrelated local divergent history into the branch.

PR state was restored by opening [PR #181](https://github.com/wmishak404/laica/pull/181) from `codex/init-004-phase-2-spec` after GitHub continued to report #168 at stale head `4d3ebdd`. PR #181 started from rebased branch head `cf57966c23e22af918e47fb6c840c98e5629a23a` and is now ready for review.

## Validation

Local docs validation:

- `git diff --check` - passed.

No Replit validation is required for this docs-only revision. Required GitHub checks should run when the branch is attached to an open/ready PR.

## Remaining work

- Review the revised spec in PR #181 for faithful incorporation of Wilson's decisions.
- Run required checks for the current head and merge the accepted spec after Wilson approval.
- Merge the accepted Phase 2 spec before starting Phase 3 harness code.

Phase 3 harness code remains blocked until the revised spec is merged.
