# Phase 4 Live Cooking Cockpit

**Agent:** codex
**Branch:** codex/init-001-phase4-step-coach
**Date:** 2026-07-07
**Initiative:** INIT-001
**INIT updated:** yes
**Resolves blocked handoff:** none

## Summary

This branch advances INIT-001 Phase 4 from the merged Ready Check baseline into the first active cooking visual refresh. Live Cooking keeps the existing speech, recovery, invalid-step, and Ready Check behavior, but Wilson's 2026-07-07 UX review revised the story from a named feed into a compact hands-busy cooking cockpit: the current instruction is the sticky headline, step progress shows dot-node previews, cues stay compact, captions are opt-in, Repeat/Ask/mute are anchored in a bottom command bar, and the guide requests a screen wake lock when supported.

The slice is intentionally visual/structural. It does not change cooking-step prompts, provider schema, route contracts, assistance failure handling, durable navigation, Finish/History semantics, or Phase 5 cleanup state. It only makes the existing timer presentation more compact/optional and adds best-effort browser wake-lock handling during active cooking.

## Changes

- `client/src/components/cooking/live-cooking.tsx`
  - Replaces the old dark centered active-cooking layout with a tokenized focus-mode surface.
  - Pins the current instruction in a sticky top panel with `Step X of N`, safety badge, and a horizontal dot-node step preview strip.
  - Keeps `Look for`, `Pro tip`, and `Avoid` guidance compact beneath the current step without naming it as a separate feed.
  - Makes transcript text opt-in via `Closed captions`; a hidden transcript node remains for accessibility/test fidelity while the visual transcript is off.
  - Moves Repeat, Ask, and audio mute into a sticky bottom command bar with Ask centered.
  - Requests a best-effort screen wake lock while the live guide is active and releases it on page hide/exit.
  - Brings the preparing-guide and step-recovery panels onto the same tokenized surface while preserving Retry/basic-backup/Back behavior.
- `tests/unit/live-cooking-guest-session.test.tsx`
  - Adds deterministic coverage that the cockpit renders the sticky current-step panel, compact cue guidance, step preview strip, opt-in captions, and existing Live Cooking guest/session/recovery baselines after Ready Check.
- `tests/e2e/cooking-workflow.test.ts`
  - Extends the guest cooking smoke to expect the step-guidance panel, step preview strip, hidden-by-default captions, and bottom `Ask a question` control after Live Cooking starts.
- `product-decisions/features/mobile-refresh/pd-phase-04-cooking.md`
  - Records Wilson's 2026-07-07 UX correction, the revised cockpit acceptance criteria, source baselines, negative scope, and validation expectations.
- `initiatives/INIT-001-mobile-refresh.md`
  - Updates Phase 4 status, branch table, and current resume point for the compact cockpit branch.
- `initiatives/registry.md`
  - Updates the INIT-001 index summary to point to the current Phase 4 visual slice.
- `client/src/index.css`
  - Adds a `live-cooking-ui` font hook so Live Cooking inherits the Nunito tone used by earlier Laica setup/planning surfaces.

## Impact on other agents

Treat PR #191 speech arbitration, PR #236 recovery/Finish, PR #256 invalid-step validation, PR #258 Ready Check, and this branch's compact Live Cooking cockpit as the intended Phase 4 baseline if this PR merges. Full timer redesign should follow after this slice unless Wilson reprioritizes.

The implementation conforms to PD-005 and `design_guidelines.md` for focus-mode cooking: tokenized colors, shadcn Button variants instead of custom button color overrides, large readable step text, visible Back, and no durable navigation changes.

Blocked handoff scan found only unrelated blockers:

- `docs/handoffs/2026-06-05-codex-eff-017-oauth-preflight-blocked.md`
- `docs/handoffs/2026-06-21-codex-prod-vision-scan-investigation-blocked.md`

## Open items

- Exact-head GitHub CI/E2E/security checks are required after the branch is pushed and the PR is opened.
- Local Playwright E2E was not run because this worktree lacks `.env.keys` and a configured `LAICA_LOCAL_SANDBOX_DATABASE_URL`; use the GitHub `e2e_guest_smoke` lane for merge-gate E2E evidence.
- Human Replit validation is deferred to the next production/release batch unless Wilson asks for PR-level mobile visual validation. The batch should smoke Ready Check -> generated steps -> sticky current instruction -> step-preview rail -> compact cues -> opt-in captions -> bottom Repeat/Ask/mute controls -> optional timer -> Back/Finish cleanup.

## Verification

Value claim: cooks get a calmer, more glanceable mobile guide that fits the hands-busy moment: the current instruction stays primary, the route through the recipe is visible, captions do not crowd the default view, core voice/audio controls stay at thumb reach, and the phone is less likely to sleep mid-step.

Evidence:

- `npx vitest run tests/unit/live-cooking-guest-session.test.tsx` passed: 1 file, 28 tests. This covers the revised compact cockpit assertion and existing Live Cooking guest/session/recovery/speech baselines.
- `npm run test:unit` passed: 45 files, 343 tests.
- `npm run check` passed: TypeScript and UI lint.
- `npm run build` passed. Existing warnings remained: stale Browserslist data, Firebase dynamic/static import chunk warning, and large bundle warning.
- `git diff --check` passed on the final working-tree diff.

Evidence limits:

- Unit tests mock providers and do not prove real ElevenLabs/browser audio output.
- Local build does not prove mobile visual ergonomics on an actual phone.
- Local Playwright E2E has not been re-run after the UX revision in this worktree because the required local secrets/sandbox database are absent; rely on GitHub exact-head `e2e_guest_smoke` unless a local/release validation lane is explicitly set up.
- GitHub exact-head `unit`, `e2e_guest_smoke`, security checks, and any PR review findings must be refreshed after the revised branch is pushed.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `263eec5fc14e0923807e2a040d46125846fd1152`
- Last Replit-validated at: not yet validated
- Notes: started from fresh `origin/main` after PR #258 merged as `496731c` and PR #259 closeout merged as `263eec5`. No lower stacked branch remains unmerged for this slice.
