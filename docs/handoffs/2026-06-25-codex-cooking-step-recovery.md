# Codex handoff — Live Cooking step recovery

**Date:** 2026-06-25
**Branch:** `codex/init-001-cooking-step-recovery`
**Base:** `origin/main` at `0c94f76ab69ded678fd4cfff067f97e458bd80ac`
**Initiative:** [INIT-001 — Mobile Refresh](../../initiatives/INIT-001-mobile-refresh.md)
**Phase:** [Mobile Refresh Phase 4 — Cooking Guidance](../../product-decisions/features/mobile-refresh/pd-phase-04-cooking.md)
**INIT updated:** yes

## Summary

This branch makes Live Cooking more honest when the AI step generator fails and when a cook finishes. A cook no longer gets silently dropped into generic backup instructions after failed or empty cooking-step generation; they see an inline recovery panel with `Try again`, `Use basic steps`, and `Back to Planning`. The final step now exposes `Finish`, and linked completion no longer submits a hidden default 5-star rating or says pantry inventory was updated.

User value: a cook stays in control during the most fragile part of the cooking guide. Failures are visible and recoverable, backup guidance is clearly labeled as generic, and completion copy matches what Laica actually saves.

## Architecture Triage

- INIT-004 Phase 3 was skipped because PR #232 (`codex/init-004-eval-summary`) is open, non-draft, green, checked out in another worktree, and owns eval summary/taxonomy work.
- INIT-001 Phase 3.1 ingredient-chip unification was skipped because PR #234 (`codex/init-001-ingredient-chip-unification`) is open, green, checked out in another worktree, and owns that slice.
- EFF-017 auth/session coverage was skipped as non-INIT work already owned by PR #235.
- INIT-002 remains in Phase 2 Replit observation; DB persistence/admin API work should not start before observation signal.
- INIT-003 later guest/History promotion remains dependent on future INIT-001 Phase 5 semantics.
- Selected INIT-001 Phase 4 because the phase record already accepted inline cooking-step failure recovery and Finish semantics, PR #191 merged the speech baseline, and this branch touches independent Live Cooking files without overlapping open PR #232/#234/#235.

## Changes

- `client/src/components/cooking/live-cooking.tsx`
  - Replaced the automatic generic-step fallback after failed/empty step generation with an inline recovery state.
  - Added explicit `Try again`, `Use basic steps`, and `Back to Planning` recovery actions.
  - Kept the generic backup guide available only after user choice.
  - Changed the last-step action from disabled `Next` to reachable `Finish`.
  - Removed hidden default `userRating: 5` and invented `userNotes` from linked completion payloads.
  - Updated linked Finish copy to `Nice, dinner's ready.` / `Saved to your cooking history. Pantry cleanup comes next.`
- `tests/unit/live-cooking-guest-session.test.tsx`
  - Added coverage for inline step-generation recovery, explicit backup-guide choice, and no hidden rating/notes on linked Finish.
- Durable docs updated:
  - `initiatives/INIT-001-mobile-refresh.md`
  - `initiatives/registry.md`
  - `product-decisions/features/mobile-refresh/pd-phase-04-cooking.md`

## Validation

Local validation run before this handoff:

- `npm ci` — passed; `found 0 vulnerabilities`.
- `npx vitest run tests/unit/live-cooking-guest-session.test.tsx` — passed, 1 file / 21 tests.

Validation still required before review/merge:

- `npm run test:unit`
- `npm run check`
- `npm audit --audit-level=high`
- `npm run build`
- `git diff --check origin/main...HEAD`
- Exact-head GitHub `unit`, `e2e_guest_smoke`, `npm-audit`, `trufflehog_pr`, and CodeQL after the PR is opened or marked ready.

## Evidence Report

Value claim: cooks are not silently moved into generic instructions when personalized step generation fails.

Evidence: `tests/unit/live-cooking-guest-session.test.tsx` now rejects the step-generation promise, asserts the inline recovery panel, confirms generic steps are not rendered first, confirms no toast is used as the only error surface, then retries and reaches generated steps.

Evidence limits: this is mocked local component evidence. It does not prove live OpenAI/provider availability, Replit routing, or real provider failure classifications.

Value claim: the backup guide is an explicit user choice.

Evidence: focused unit coverage returns an empty `steps` payload, asserts no basic steps render until `Use basic steps` is clicked, then verifies the backup guide transcript and step.

Evidence limits: this proves the client decision boundary, not that the generic fallback is culinarily sufficient for every recipe.

Value claim: linked Finish no longer invents rating/pantry semantics.

Evidence: focused unit coverage uses a linked user, completes the final step, and asserts the completion payload has no `userRating` or `userNotes` while preserving `ingredientsRemaining`, `completedSteps`, and `cookingDuration`; it also asserts accepted Finish copy.

Evidence limits: this does not implement Phase 5 pending cleanup state, cleanup review, taste signal, or History detail improvements.

## Risk Lane

Risk lane: automation-primary if exact-head GitHub CI/E2E passes.

Rationale: the branch is a narrow client/state correction with focused deterministic unit coverage, no schema or migration, no prompt/provider behavior change, no navigation/IA change, no auth/session contract change, and no new persistence field. Human Replit validation is not required before merge, but Replit/mobile speech and cooking-session persistence smoke remain useful before broader Phase 4 closeout or release-batch validation.

## Negative Scope

- Does not implement Ready Check.
- Does not add Coach Feed redesign or inline cooking-assistance recovery.
- Does not redesign timers or suggested-timer metadata.
- Does not change OpenAI prompts, provider calls, route schemas, or DB schema.
- Does not create Phase 5 pending cleanup, pantry cleanup review, taste memory, or next-meal retention state.
- Does not alter PR #234 ingredient-chip work or PR #232 eval taxonomy/reporting work.

## Resume Point

Open a PR from `codex/init-001-cooking-step-recovery`, refresh validation on the final head, and update this handoff/PR body with the PR number plus exact-head GitHub checks. Do not merge without Wilson instruction because this is runtime/UI behavior work.
