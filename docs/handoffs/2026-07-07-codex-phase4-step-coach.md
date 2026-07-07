# Phase 4 Step and Coach Feed

**Agent:** codex
**Branch:** codex/init-001-phase4-step-coach
**Date:** 2026-07-07
**Initiative:** INIT-001
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary

This branch advances INIT-001 Phase 4 from the merged Ready Check baseline into the first active cooking visual refresh. Live Cooking keeps the existing speech, recovery, invalid-step, and Ready Check behavior, but the cook now lands in a calmer focus-mode guide: the current step is pinned as the primary object, and step cues plus repeat/help/audio/transcript controls are framed as a named Coach Feed below it.

The slice is intentionally visual/structural. It does not change cooking-step prompts, provider schema, route contracts, timer semantics, assistance failure handling, durable navigation, Finish/History semantics, or Phase 5 cleanup state.

## Changes

- `client/src/components/cooking/live-cooking.tsx`
  - Replaces the old dark centered active-cooking layout with a tokenized focus-mode surface.
  - Pins the current step in a sticky top panel with progress, safety badge, instruction text, and unchanged timer controls.
  - Moves `Look for`, `Pro tip`, `Avoid`, transcript, Repeat Step, Ask for Help, and audio controls into a named Coach Feed.
  - Brings the preparing-guide and step-recovery panels onto the same tokenized surface while preserving Retry/basic-backup/Back behavior.
- `tests/unit/live-cooking-guest-session.test.tsx`
  - Adds deterministic coverage that Step 1 renders in a sticky current-step panel and that Coach Feed shows the current step's cues, tip, and mistake warning after Ready Check.
- `tests/e2e/cooking-workflow.test.ts`
  - Extends the guest cooking smoke to expect the Coach Feed heading after Live Cooking starts.
- `product-decisions/features/mobile-refresh/pd-phase-04-cooking.md`
  - Records this visual/structural slice, source baselines, negative scope, and local evidence.
- `initiatives/INIT-001-mobile-refresh.md`
  - Updates Phase 4 status, branch table, and current resume point for the step/Coach Feed branch.
- `initiatives/registry.md`
  - Updates the INIT-001 index summary to point to the current Phase 4 visual slice.

## Impact on other agents

Treat PR #191 speech arbitration, PR #236 recovery/Finish, PR #256 invalid-step validation, PR #258 Ready Check, and this branch's sticky-step/Coach Feed framing as the intended Phase 4 baseline if this PR merges. Timer redesign should follow after this slice unless Wilson reprioritizes.

The implementation conforms to PD-005 and `design_guidelines.md` for focus-mode cooking: tokenized colors, shadcn Button variants instead of custom button color overrides, large readable step text, visible Back, and no durable navigation changes.

Blocked handoff scan found only unrelated blockers:

- `docs/handoffs/2026-06-05-codex-eff-017-oauth-preflight-blocked.md`
- `docs/handoffs/2026-06-21-codex-prod-vision-scan-investigation-blocked.md`

## Open items

- Exact-head GitHub CI/E2E/security checks are required after the branch is pushed and the PR is opened.
- Local Playwright E2E was not run because this worktree lacks `.env.keys` and a configured `LAICA_LOCAL_SANDBOX_DATABASE_URL`; use the GitHub `e2e_guest_smoke` lane for merge-gate E2E evidence.
- Human Replit validation is deferred to the next production/release batch unless Wilson asks for PR-level mobile visual validation. The batch should smoke Ready Check -> generated steps -> sticky current step -> Coach Feed cues -> repeat/help/audio controls -> timer controls -> Back/Finish cleanup.

## Verification

Value claim: cooks get a calmer, more glanceable mobile guide where the current step stays visually primary and contextual cues/help remain nearby without changing the underlying speech, step-generation, or recovery contracts.

Evidence:

- `npx vitest run tests/unit/live-cooking-guest-session.test.tsx` passed: 1 file, 28 tests. This covers the new sticky current-step/Coach Feed assertion and existing Live Cooking guest/session/recovery baselines.
- `npm run test:unit` passed: 45 files, 343 tests.
- `npm run check` passed: TypeScript and UI lint.
- `npm run build` passed. Existing warnings remained: stale Browserslist data, Firebase dynamic/static import chunk warning, and large bundle warning.
- `rg` style scan found no remaining `tracking-*`, raw hex classes, or old dark/gray utility classes in `client/src/components/cooking/live-cooking.tsx` after the tokenization pass.
- `git diff --check` passed on the final working-tree diff.

Evidence limits:

- Unit tests mock providers and do not prove real ElevenLabs/browser audio output.
- Local build does not prove mobile visual ergonomics on an actual phone.
- Local Playwright E2E was not run in this worktree because the required local secrets/sandbox database are absent.
- GitHub exact-head `e2e_guest_smoke`, security checks, and any PR review findings are pending until the PR exists.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `263eec5fc14e0923807e2a040d46125846fd1152`
- Last Replit-validated at: not yet validated
- Notes: started from fresh `origin/main` after PR #258 merged as `496731c` and PR #259 closeout merged as `263eec5`. No lower stacked branch remains unmerged for this slice.
