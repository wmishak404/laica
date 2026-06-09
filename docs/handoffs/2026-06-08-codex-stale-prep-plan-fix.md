# Stale Prep Plan Invalidation Fix

**Agent:** codex
**Branch:** codex/deferred-stale-prep-plan-effort
**Date:** 2026-06-08
**Initiative:** none
**INIT updated:** n/a

## Summary

This branch now fixes the stale prep tray/active recipe plan bug that EFF-026 captured: generated planning and Live Cooking restore state is tied to the saved pantry/kitchen/profile basis that produced it, and Settings saves clear scoped active planning/cooking caches when those inputs materially change. This keeps PR #144's refresh reliability for unchanged profiles while preventing a materially old pantry plan from staying actionable after Settings changes.

## Changes

- `client/src/lib/planningCache.ts`: adds shared storage keys, a normalized order-insensitive planning-profile fingerprint, and scoped meal-planning/cooking cache clearing helpers.
- `client/src/pages/app.tsx`: stores active cooking plans with the current profile fingerprint, refuses to restore mismatched plans, clears active plan/prep/session caches on material Settings profile changes, and passes the fingerprint into Live Cooking.
- `client/src/components/cooking/meal-planning.tsx`: stores Chef It Up planning sessions with the current profile fingerprint and drops stale prep tray/session restores when pantry/kitchen/profile inputs differ.
- `client/src/components/cooking/live-cooking.tsx`: stores generated-step session caches with the profile fingerprint and regenerates steps instead of restoring stale generated trays when the fingerprint changes.
- `client/src/components/cooking/user-settings.tsx`: notifies the parent app after successful linked pantry/kitchen/profile saves and resets, matching the guest callback path so cache invalidation happens immediately.
- `tests/unit/planning-choice.test.tsx`: covers active-plan restore with matching fingerprint, refusal after pantry-basis changes, and direct scoped cache clearing from a Settings save callback.
- `tests/unit/meal-planning.test.tsx`: covers dropping a restored stale prep tray when the saved pantry fingerprint differs.
- `tests/unit/live-cooking-guest-session.test.tsx`: covers replacing a stale generated-step tray with freshly generated steps when the profile fingerprint changes.
- `efforts/effort-026-stale-prep-plan-invalidation.md`, `efforts/README.md`, and `efforts/registry.md`: move EFF-026 to `In Progress` and record local implementation evidence.

## Impact on other agents

- EFF-026 is not resolved yet. Replit guest/linked validation remains required before the branch can be treated as deployment-ready.
- Future changes to active cooking restore, prep tray persistence, or Settings inventory/profile saves should preserve the profile-basis invalidation rule.
- Existing pre-fingerprint cached active plans are intentionally not restored because their pantry/profile basis cannot be verified.

## Open items

- Replit validation for guest and linked flows.
- Pantry add/delete/reset/save after viewing a prep tray.
- Hard refresh after pantry changes to confirm stale active plans and generated step trays do not resurrect.
- Unchanged-profile Live Cooking refresh to confirm PR #144 restore reliability still holds.
- History review to confirm completed sessions remain correct and distinct from invalidated active plans.

## Verification

- `npx vitest run tests/unit/planning-choice.test.tsx tests/unit/meal-planning.test.tsx tests/unit/live-cooking-guest-session.test.tsx` passed: 3 files, 37 tests.
- `npm run check` passed.
- `npm run build` passed with existing non-blocking Browserslist age, Firebase dynamic/static import, and chunk-size warnings.

## Stack / base status

- Base refreshed: yes
- Current base: `origin/main` at `ba924d6ad0f7ef0906d967a25ecb95fd7319da88`
- Last Replit-validated at: not yet validated
- Notes: branch created from PR #146 merge commit; implementation was added after the docs-only Effort PR was filed as draft PR #149.
