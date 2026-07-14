# Cooking-step schema boundary

**Agent:** codex
**Branch:** `codex/init-001-cooking-step-schema`
**PR:** [#281](https://github.com/wmishak404/laica/pull/281)
**Date:** 2026-07-13
**Initiative:** INIT-001
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary

This branch makes Live Cooking less dependent on raw provider JSON by normalizing cooking-step output at the server boundary before the route returns it or eval logging records it. The user value is more reliable cooking guidance: blank/placeholder step junk cannot silently become a guide, duration/timing data has one seconds-based shape for the timer, recipe ingredients survive consistently, and the short `actionLabel` labels used for hands-busy recall are preserved into linked cooking-session snapshots.

Architecture triage selected INIT-001 Phase 4 because it was the only clearly executable, unowned INIT lane:

- INIT-001: PR #275 had merged and closeout landed; current resume point explicitly named full provider schema shape before Phase 5 cleanup. PR #281 takes the bounded schema-foundation slice.
- INIT-002: still in Phase 2 Replit observation; docs say not to start DB persistence or admin APIs.
- INIT-003: still waits on INIT-001 Phase 5 semantics before guest current-cook/history import decisions.
- INIT-004: active/open ownership exists in PR #272 closeout and Claude PR #274; automation should not touch those branches.

## Changes

- `server/ai-response-schemas.ts`
  - Extends the cooking-step response schema into a normalizer for provider output.
  - Normalizes string/object recipe ingredients, trims step strings, drops placeholder-only steps, rejects all-placeholder output, converts `timing` minutes into numeric `duration` seconds, trims variations, and constrains safety level to `critical | important | minor`.
- `server/openai.ts`
  - Parses `/api/cooking/steps` provider JSON through the normalizer before logging or returning it.
- `server/routes.ts`
  - Accepts `actionLabel` and constrained `safetyLevel` in linked cooking-session recipe snapshots instead of stripping those fields at session start.
- `client/src/lib/openai.ts`
  - Narrows the client cooking-step response type to the normalized route contract.
- `tests/unit/cooking-steps-prompt.test.ts`
  - Adds coverage that provider output is normalized before `getCookingSteps` returns/logs it.
- `tests/unit/p0-route-contracts.test.ts`
  - Proves linked cooking-session route contracts preserve `actionLabel` in recipe snapshots.
- `product-decisions/features/mobile-refresh/pd-phase-04-cooking.md`
  - Records the schema-boundary slice and keeps `suggestedTimer`/Phase 5 cleanup as future work.
- `initiatives/INIT-001-mobile-refresh.md` and `initiatives/registry.md`
  - Update current resume state to point at this branch and the remaining follow-up scope.

## Impact on other agents

Future Phase 4 work should treat the server-normalized cooking-step response as the route contract. The client still keeps defensive normalization for old browser-local step trays and mocked tests, but the provider route should now return cleaned `steps[]`, normalized `recipe.ingredients[]`, and trimmed `variations[]`.

This branch does not implement Phase 5 cleanup, DB schema changes, prompt changes, live-provider runs, the future `suggestedTimer` object with kind/reason metadata, UI redesign, or the voice-activity affordance. PR #280 viewport-fit, PR #272 closeout, PR #274 Claude prompt/eval work, PR #265 voice-affordance docs, and PR #277 EFF-017 coverage remain separate owned/open work.

## PR #284 coordination

Wilson asked PR #281 to coordinate with docs-cleanup PR #284 before merge-readiness review. The first coordination pass checked PR #281 against draft PR #284 without touching the docs-cleanup branch. After Wilson approved and merged #284, a fresh fetch on 2026-07-14 showed `origin/main` at the #284 squash merge `28f96d2c11c3069b5d6b5157d79dc003a32c7014`; `git rebase origin/main` then replayed PR #281 cleanly on top of the merged cleanup.

Mechanical overlap check before #284 merged: `git merge-tree --messages --write-tree HEAD origin/codex/docs-spring-cleaning` completed without conflict entries and reported auto-merging only `initiatives/INIT-001-mobile-refresh.md` and `product-decisions/features/mobile-refresh/pd-phase-04-cooking.md`. Post-merge rebase result: no textual conflicts. PR #281 did not modify, push, or rewrite the #284 branch.

Semantic cleanup applied on this branch where PR #281 touches the same durable records:

- Phase 4 timer decisions now describe the accepted PR #269 runtime: automatic timer controls for timer-worthy steps, explicit start, no separate shipped `suggestedTimer` object, and richer timer metadata left as future schema work.
- The Phase 4 assistance criterion now scopes PR #275 to narrow Ask-a-question technical/quota failures in a separate voice-help status/retry area outside Step guidance.
- INIT-001's Phase Progress table now treats PR #275 as merged while leaving PR #281-specific status in the current resume point, registry, this handoff, and the PR body so the merged #284 cleanup row does not erase the schema-boundary context.

## Open items

- PR #281 is ready for review; Wilson's explicit merge instruction is still required because this is code/runtime work.
- Use the PR body and live PR checks as the final exact-head CI authority. The PR body records the final pushed head after this handoff update because a commit cannot cite its own immutable SHA without changing that SHA.
- Human Replit validation is deferred to release/batch validation unless Wilson asks for PR-level live-provider smoke. Suggested release-batch check: generate a real Live Cooking guide, confirm the current step/timer/action-label surfaces still work, and confirm linked History/recipe snapshot still has readable step labels.

## Verification

Local evidence so far:

- `npm ci` passed after this worktree was missing `node_modules`; npm reported 0 vulnerabilities.
- Focused `npx vitest run tests/unit/cooking-steps-prompt.test.ts tests/unit/eval-fixtures.test.ts tests/unit/p0-route-contracts.test.ts tests/unit/provider-boundary-happy-paths.test.ts tests/unit/live-cooking-guest-session.test.tsx --testTimeout=15000` passed: 5 files / 86 tests.
- `npm run check` passed.
- `npm run test:unit` passed: 48 files / 376 tests.
- `npm run eval:fixtures` passed after rerun outside the sandbox because the first sandboxed run hit the known `tsx` IPC `EPERM` pipe restriction; result: 19 public eval fixtures validated.
- `npm audit --audit-level=high` passed with 0 vulnerabilities.
- `npm run build` passed with existing non-blocking warnings for stale Browserslist data, Firebase dynamic/static import, and chunk size.
- `git diff --check` passed.
- PR #281 was marked ready and GitHub checks passed on runtime head `a4e8e96e29d3a57206a7d5da9d64c0be1d793421`: `unit`, `e2e_guest_smoke`, `npm-audit`, and `trufflehog_pr`.

Evidence limits: provider calls are mocked; no live OpenAI/Replit cooking-step generation has been run; Phase 5 cleanup and `suggestedTimer` remain unimplemented.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `28f96d2c11c3069b5d6b5157d79dc003a32c7014` after PR #284 merged.
- Last Replit-validated at: not PR-level validated; human Replit validation deferred to release/batch validation
- Notes: independent branch from current `origin/main`; not stacked on PR #280, #272, #274, #265, or #277. The overlapping INIT and Phase 4 docs were checked after #284 merged, with no product-decision ambiguity found.
