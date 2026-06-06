# Planning Staple Auth Churn Fix

**Agent:** codex
**Branch:** codex/fix-planning-staple-auth-churn
**Date:** 2026-06-05
**Initiative:** none
**INIT updated:** n/a

## Summary

Wilson's short Replit smoke before production deploy found that Chef It Up could return to the planning-choice screen when a real Google-linked user selected a new cuisine, added suggested staples, and requested recipes. The same recipe path proceeded when no new staples were added.

The branch keeps ordinary profile/pantry saves from invalidating `/api/auth/session`. Profile mutations still refresh `/api/user/profile` and `/api/auth/user`; identity-changing flows such as guest promotion still manage auth-session state explicitly. This prevents a planning-time pantry save from briefly churning auth state and remounting/aborting active recipe generation.

## Changes

- `client/src/hooks/useAuth.ts`
  Removes `/api/auth/session` invalidation from `useUpdateUserProfile` and `useResetPantry`.
- `tests/unit/auth-profile-mutation-cache.test.tsx`
  Adds a regression test proving linked profile saves invalidate profile/user data without invalidating auth session.
- `efforts/effort-017-environment-parity-and-ci-confidence.md`
  Records the Replit smoke finding and validation-gap lesson.

## Evidence

Observed before fix in Replit/browser smoke:

- Trigger: linked Google user, Chef It Up, select a new cuisine, add newly suggested staples, then request recipe suggestions.
- Result: UI returned to "What are we cooking today?" instead of staying on recipe suggestions.
- Non-triggering variants: no added staples proceeded; cuisine-only proceeded.
- Logs showed `PUT /api/user/profile 200`, `POST /api/recipes/pantry 200`, intermittent `GET /api/auth/session 401`, follow-up `POST /api/auth/google 200`, and browser `AbortError: signal is aborted without reason` from meal-planning cancellation.

Local validation after fix:

- `npx vitest run tests/unit/auth-profile-mutation-cache.test.tsx` passed: 1 file, 1 test.
- `npx vitest run tests/unit/meal-planning.test.tsx tests/unit/planning-choice.test.tsx tests/unit/auth-profile-mutation-cache.test.tsx` passed: 3 files, 29 tests.
- `npm run test:unit` passed: 34 files, 220 tests.
- `npm run check` passed.
- `npm run build` passed with existing non-blocking Browserslist age, Firebase dynamic/static import, and chunk-size warnings.

## Reasoning

Adding selected staples during planning is the only reported variant that performs a profile mutation before the recipe request completes. The profile mutation succeeded, and the recipe route returned `200`, but the client aborted active generation and returned to planning choice while auth/session sync retried. Ordinary profile/pantry mutations do not need to refresh identity, so removing auth-session invalidation preserves profile refresh behavior without routing the app through a transient signed-out state.

## Required Replit Re-test

Before production deploy, re-test on the Replit runtime branch/head:

1. Confirm branch/SHA.
2. Google sign in.
3. Chef It Up with an existing pantry.
4. Select a cuisine that offers suggested staples.
5. Select one or more newly suggested staples.
6. Request recipe suggestions.
7. Confirm the UI stays in the recipe flow and shows suggestions instead of returning to "What are we cooking today?"
8. Confirm the added staples persist once and the pantry count/profile reflects the additions.
9. Spot-check the non-added-staple variant still proceeds.

## Negative Scope

- Does not change Google popup/linking behavior.
- Does not change recipe generation prompts or provider calls.
- Does not prove production OAuth authorized-domain state.
- Does not validate full production deployment behavior.
- Does not resolve EFF-017; it records another reason real Replit/Google smoke remains useful before production deploys.

## Stack / Base Status

- Base refreshed: yes
- Current base: `origin/main` at `0a2616932e3cb45f97ebe6fc5bd0552cf2cb65e7`
- Last Replit-validated at: not yet validated after fix
- Notes: started from main after PR #140 merged.
