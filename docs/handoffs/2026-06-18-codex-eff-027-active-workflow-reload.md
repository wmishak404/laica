# EFF-027 Active Workflow Reload Restore

**Agent:** codex
**Branch:** `codex/eff-027-active-workflow-reload`
**Date:** 2026-06-18
**Initiative:** none
**INIT updated:** yes - EFF-027 remains the implementation owner, and INIT-001 Phase 5 resume guidance now records the future Saved/History boundary.

## Summary

This branch implements the first EFF-027 reload-resilience slice. A hard reload or app remount with a valid scoped Chef It Up / MealPlanning session from the last 15 minutes now returns directly into Chef It Up instead of landing on the Planning choice screen and making the user tap Chef It Up again. The branch was later rebased onto `origin/main` at `d42e3d115ab2296909d94974b46442013ce483ad` after PR #200/#202 advanced `main`.

## Hygiene Result

- Active Efforts audited: EFF-010, EFF-017, EFF-022, EFF-025, and EFF-027.
- No Effort should be closed, deferred, moved into an INIT, or graduated into a PD/workflow from current `main`.
- Open PR #196 already owns the actionable hygiene drift: EFF-027 is missing from `AGENTS.md` and `CLAUDE.md` on `main`, and #196 adds that mirror plus Efforts implementation-loop workflow language. This branch does not duplicate those docs changes.
- Open PR #191 is draft INIT-001 Phase 4 Live Cooking audio work and does not own EFF-027's app-shell/MealPlanning restore slice.
- Open PR #195 is a broad Dependabot dependency update and is unrelated to this active Effort implementation.
- Blocked handoff discovery found the known EFF-017 OAuth-preflight blocker; it does not block EFF-027.

## Effort Implementation Choice

EFF-027 was selected because it has explicit `Priority: High`, came from fresh Replit validation pain on PR #192, affects active user workflow continuity, has a clear validation path, and is not already owned by an open implementation PR. EFF-010 and EFF-017 remain important infrastructure Efforts, but their next moves still depend on database ownership, provider canary, OAuth-preflight, or policy/config decisions. EFF-022 has an unresolved product fallback rule, and EFF-025 is lower priority than the active workflow reset.

## Changes

- `client/src/lib/planningCache.ts`
  - Adds shared MealPlanning step validation, a 15-minute session freshness constant, and `readActiveMealPlanningSession(scopeKey, profileFingerprint)`.
- `client/src/components/cooking/meal-planning.tsx`
  - Reuses the shared MealPlanning step/freshness helpers so parent bootstrap and child restore agree.
- `client/src/pages/app.tsx`
  - After guest or linked profile load, checks active Settings, active Live Cooking plan, then valid active MealPlanning session.
  - Enters `planning` with `showPlanningChoice=false` when the MealPlanning session is valid.
  - Clears scoped MealPlanning restore state on explicit Back-to-Planning / Cook-choice exits.
- `tests/unit/planning-choice.test.tsx`
  - Adds linked restore, guest restore, expired-session cleanup, stale-profile invalidation, and explicit Back cleanup regressions.
- `tests/e2e/linked-dev-auth.test.ts`
  - Updates the linked browser smoke so reload from recipe suggestions expects the new Ticket Pass restore behavior, then explicitly backs out and verifies a later reload remains on the Planning choice screen.
- `efforts/effort-027-active-workflow-reload-resilience.md`
  - Records this branch signal, the 15-minute transient recovery decision, future Saved/History boundary, and remaining exact-head Replit reload validation.
- `efforts/registry.md`
  - Refreshes EFF-027's last-signal summary.
- `product-decisions/features/mobile-refresh/pd-phase-03-planning.md`
  - Records the 15-minute Chef It Up / MealPlanning recovery window as Phase 3 planning behavior and distinguishes it from recipe saving.
- `product-decisions/features/mobile-refresh/pd-phase-05-post-cook.md`
  - Records future Saved recipe suggestions as adjacent to History, distinct from completed-cook History, and usable later as taste signal input without over-narrowing recommendations.
- `product-decisions/pd-012-public-anonymous-trial-and-account-upgrade.md`
  - Records future Saved recipe bookmarks as a durable memory decision point under the guest/linked-account boundary.
- `product-decisions/features/mobile-refresh/README.md`
  - Adds the Saved recipe / History adjacency note to the Phase 5 sequence summary.
- `initiatives/INIT-001-mobile-refresh.md`
  - Adds the same Saved/History pointer to Phase 5 resume guidance.

## Impact on other agents

Future EFF-027 work should build on `readActiveMealPlanningSession` instead of adding another app-shell cache parser. Keep Settings restore and active Live Cooking restore ahead of MealPlanning restore. Do not stretch this transient 15-minute cache into a recipe bookmark feature; future explicit Saved recipes belong adjacent to History in Phase 5 work. Do not resolve EFF-027 until PR #201 merges and the post-merge closeout flips the Effort status.

If PR #196 merges before this branch, rebase and drop any duplicate hygiene language from the PR body only; there should be no code conflict. If this branch is reviewed first, mention that #196 still owns the `AGENTS.md` / `CLAUDE.md` mirror fix.

## Open Items

- EFF-027 remains open until PR #201 merges and closeout updates the Effort status/read lists.
- This branch does not address Slop Bowl active-flow restore, Live Cooking audio arbitration in PR #191, recipe image provider benchmarking, Settings dirty-state warnings, or EFF-017 provider/OAuth/canary lanes.
- Future Phase 5 Saved/History IA is documented but not implemented here.
- Replit validation used Chrome/direct workspace shell only. Replit Agent was not used.

## Verification

- `npx vitest run tests/unit/planning-choice.test.tsx` passed: 1 file / 27 tests.
- `npx vitest run tests/unit/meal-planning.test.tsx` passed: 1 file / 23 tests.
- `npm run check` passed: `tsc` plus `lint:ui`.
- `npm run test:unit` passed: 42 files / 297 tests.
- `npm run build` passed with the existing Browserslist age, Firebase dynamic/static import, and chunk-size warnings.
- `npx playwright test tests/e2e/linked-dev-auth.test.ts --project=chromium --list` passed: 2 tests listed in 1 file.
- `git diff --check` passed.
- Chrome/Replit validation after switching the workspace to `codex/eff-027-active-workflow-reload` and pulling the PR head:
  - Ticket Pass reload restored `Recipe suggestions from your pantry`.
  - Prep Tray reload restored the selected recipe.
  - Explicit Back-to-Planning followed by reload stayed on `What are we cooking today?`.
  - Replit shell showed the workspace on the PR branch with only the pre-existing `.replit` modification left untouched.

GitHub `unit`, CodeQL, dependency audit, and TruffleHog checks passed on pushed head `c02550a9df5ec042237caafd87f52482267bf5dd`. The `e2e_guest_smoke` rerun for that head was still in progress at the time of this handoff update, stuck in the `Install Playwright Browsers (Chromium)` step before app tests began.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `d42e3d115ab2296909d94974b46442013ce483ad`
- Last Replit-validated at: PR body should carry the final pushed head after this docs refresh; runtime validation was performed in Chrome/Replit on the PR branch after pulling `c02550a9df5ec042237caafd87f52482267bf5dd`.
- Notes: PR #196 is an open docs/workflow PR touching Efforts hygiene mirrors; this implementation branch intentionally avoids duplicating those files.
