# INIT-004 Live Cooking Step Preview Eval Planning

**Agent:** codex
**Branch:** `codex/init-004-step-preview-evals`
**Date:** 2026-07-07
**Initiative:** INIT-004
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary

This branch creates the auditable starting point for a formal Live Cooking step-preview/action-label eval lane without touching PR #260 runtime work. The proposed family is `live_cooking_step_previews`, separate from recipe-generation quality and separate from broad `cooking_steps` safety/sequence evals, because the artifact being judged is the small recall card/action label a cook scans mid-step.

Before INIT-004 locks any schema, fixtures, or judge criteria, Wilson should route this plan back to the INIT-001 Phase 4 PR #260 Codex thread for peer review against the user-facing behavior.

## Changes

- `docs/evals/intakes/live-cooking-step-preview-label-seed-2026-07-07.md`
  Registers Wilson's PR #260 QA examples as a redacted eval intake seed. It records the preferred `live_cooking_step_previews` surface name, accepted/rejected label examples, proposed future fixture shape, likely deterministic checks, human-label needs, and open questions.
- `docs/evals/registry.md`
  Adds the intake row so the seed is discoverable from the durable eval ledger.
- `docs/evals/README.md`
  Clarifies that narrow Live Cooking output-artifact seeds can be registered before fixture schema exists when ownership and peer-review dependency are explicit.
- `initiatives/INIT-004-ai-output-quality-evals.md`
  Records the new seed, boundary, source docs link, validation posture, current resume point, and chronology entry.
- `initiatives/registry.md`
  Updates INIT-004's index row to point to this branch as the latest Phase 3 coordination signal.

## Proposed Eval Surface

Recommended canonical family: `live_cooking_step_previews`.

Reasoning:

- The artifact is a Live Cooking UI/action-label artifact, not the accepted recipe output.
- The quality claim depends on small-card fit, sibling-label duplication, and hands-busy recall.
- The same generated cooking step can be safe and well ordered while still producing a bad preview label.
- Folding this into `cooking_steps` would blur label clarity with food safety, equipment fit, step sequence, and sensory-cue criteria.

`cooking_step_previews` remains a plausible shorter alternative, but this branch recommends keeping `live_cooking` in the name so future agents do not mistake the lane for generic generated-step content.

## Examples Captured

Good direction from Wilson's PR #260 QA:

- `Boil Water`
- `Cook Leek & Spinach`
- `Push Vegetables Aside`
- `Add Cold Rice`
- `Season Fried Rice`
- `Serve Fried Rice`

Bad examples or patterns:

- `Bring 4 Cups`
- `Heat Oil Butter`
- `Push Vegetables Side`
- `Add Cold Cooked`
- repeated generic labels such as multiple `Cook Vegetables` cards for distinct fried-rice milestones

Acceptance direction preserved in the intake:

- Usually 2-4 words; stretch to 5 only when needed for meaning.
- Avoid measurements and quantities.
- Fit the small preview card.
- Avoid repeats in the same recipe unless the repeated action is truly the same milestone.
- Read as plain English, including needed nouns/prepositions/adverbs.
- Work as quick recall cards for a cook mid-step.

## Impact on other agents

The INIT-001 Phase 4 PR #260 thread should review this branch before INIT-004 implements fixture schema or judge criteria. In particular, peer review should confirm whether the runtime source of truth is provider `actionLabel`, client fallback label, or both, and whether the proposed fixture input needs rendered-card dimensions or only text constraints at first.

Do not change production prompts beyond PR #260's current examples from this branch. Do not combine this lane with recipe-generation quality metrics. Do not modify the active PR #260 branch from this worktree.

## Open items

- Wilson: route this handoff/branch back to the INIT-001 Phase 4 PR #260 Codex thread for peer review.
- Phase 4 thread: confirm `live_cooking_step_previews` versus `cooking_step_previews`.
- Phase 4 thread: confirm fixture fields after PR #260 settles provider label versus fallback label behavior.
- INIT-004 follow-up: after peer review, decide whether v1 is deterministic fixtures only, Wilson-labeled calibration, a narrow LLM judge, or a combination. This branch recommends a combination: deterministic checks for length/measurements/exact duplicates plus human labels for milestone fit and plain-English usefulness.
- INIT-004 follow-up: only after review, add synthetic/redacted public fixtures and update fixture schema/tests. No raw screenshots or real user payloads should be committed.

## Verification

- `npm ci` passed to install missing local dependencies.
- Initial `npm run eval:fixtures` failed before `npm ci` because `tsx` was not installed in this worktree.
- `npm run eval:fixtures` then failed inside the sandbox with the known `tsx` IPC pipe `EPERM` issue.
- Escalated `npm run eval:fixtures` passed: 10 public fixtures validated across `chef_it_up_suggestions=4`, `cooking_steps=4`, `recipe_suggestions=1`, and `slop_bowl_suggestions=1`.
- `git diff --check` passed.

No Replit validation is required for this docs-only planning branch. It changes no runtime code, prompts, fixture schema, committed fixtures, provider calls, DB/schema, user-facing UI, or eval execution.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `263eec5fc14e0923807e2a040d46125846fd1152`
- Last Replit-validated at: not applicable for docs-only planning
- Notes: this branch is not stacked on PR #260. The Phase 4 eval brief was read from `origin/codex/init-001-phase4-step-coach:docs/handoffs/2026-07-07-codex-live-cooking-step-preview-eval-brief.md` without checking out or taking ownership of the active PR #260 branch.
