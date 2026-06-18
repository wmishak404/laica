# EFF-027 Active Workflow Reload Restore

**Agent:** codex
**Branch:** `codex/eff-027-active-workflow-reload`
**Date:** 2026-06-18
**Initiative:** none
**INIT updated:** yes - EFF-027 remains the implementation owner, and INIT-001 Phase 5 resume guidance now records the future Saved/History boundary.

## Summary

This branch starts from fresh `origin/main` at `0462db2b061ab9d8ecc942eaf284090b1b26b87d` and implements the first EFF-027 reload-resilience slice. A hard reload or app remount with a valid scoped Chef It Up / MealPlanning session from the last 15 minutes now returns directly into Chef It Up instead of landing on the Planning choice screen and making the user tap Chef It Up again.

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
- `efforts/effort-027-active-workflow-reload-resilience.md`
  - Records this branch signal, the 15-minute transient recovery decision, future Saved/History boundary, and remaining exact-head Replit reload validation.
- `efforts/registry.md`
  - Refreshes EFF-027's last-signal summary.
- `product-decisions/features/mobile-refresh/pd-phase-05-post-cook.md`
  - Records future Saved recipe suggestions as adjacent to History, distinct from completed-cook History, and usable later as taste signal input without over-narrowing recommendations.
- `initiatives/INIT-001-mobile-refresh.md`
  - Adds the same Saved/History pointer to Phase 5 resume guidance.

## Impact on other agents

Future EFF-027 work should build on `readActiveMealPlanningSession` instead of adding another app-shell cache parser. Keep Settings restore and active Live Cooking restore ahead of MealPlanning restore. Do not stretch this transient 15-minute cache into a recipe bookmark feature; future explicit Saved recipes belong adjacent to History in Phase 5 work. Do not resolve EFF-027 until Replit validation forces a reload in Ticket Pass or Prep Tray on the final PR head.

If PR #196 merges before this branch, rebase and drop any duplicate hygiene language from the PR body only; there should be no code conflict. If this branch is reviewed first, mention that #196 still owns the `AGENTS.md` / `CLAUDE.md` mirror fix.

## Open Items

- Exact-head Replit validation still required before resolving EFF-027: enter Chef It Up, reach Ticket Pass or Prep Tray, force a browser reload/remount, and confirm the same active workflow returns directly.
- This branch does not address Slop Bowl active-flow restore, Live Cooking audio arbitration in PR #191, recipe image provider benchmarking, Settings dirty-state warnings, or EFF-017 provider/OAuth/canary lanes.
- Future Phase 5 Saved/History IA is documented but not implemented here.
- Human Replit validation should be manual before merge because the user-visible issue was observed in Replit and depends on app remount/browser reload behavior.

## Verification

- `npx vitest run tests/unit/planning-choice.test.tsx` passed: 1 file / 27 tests.
- `npx vitest run tests/unit/meal-planning.test.tsx` passed: 1 file / 23 tests.
- `npm run check` passed: `tsc` plus `lint:ui`.
- `npm run test:unit` passed: 42 files / 297 tests.
- `npm run build` passed with the existing Browserslist age, Firebase dynamic/static import, and chunk-size warnings.
- `git diff --check` passed.

GitHub CI/E2E and Replit reload validation are still pending.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `0462db2b061ab9d8ecc942eaf284090b1b26b87d`
- Last Replit-validated at: not yet validated for this branch
- Notes: PR #196 is an open docs/workflow PR touching Efforts hygiene mirrors; this implementation branch intentionally avoids duplicating those files.
