# Slop Bowl Sparse-Pantry Guard

**Agent:** codex
**Branch:** codex/slop-bowl-sparse-pantry-guard
**Date:** 2026-04-27

## Summary

Implemented EPIC-006 so Slop Bowl no longer tries to generate from a 1-2 ingredient pantry and then reports the failure as a generic service outage. The pantry-check screen now blocks sparse lists inline, and the server has a matching typed guard for stale clients or direct API calls.

This work cites EPIC-005 because it adds acceptance criteria for a core cooking-flow edge case. It also preserves EPIC-003's ephemeral pantry-edit model: quick add/remove still only affects the current bowl unless the user edits their profile.

Follow-up policy from localhost validation is now captured in `product-decisions/008-optional-context-and-local-validation-boundaries.md`: sparse-pantry checks are core product behavior, while recent cooking history is optional context that can degrade gracefully with warnings.

## Changes

- `epics/006-slop-bowl-sparse-pantry-guard.md` — new active epic documenting the sparse-pantry failure, accepted product behavior, API semantics, and resolution criteria.
- `epics/README.md` and `epics/registry.md` — added EPIC-006 to the active read list and registry.
- `client/src/components/cooking/slop-bowl.tsx` — added a 3-distinct-ingredient readiness guard, sparse-pantry helper copy, and typed Slop Bowl error handling that avoids the generic toast for `SLOP_BOWL_TOO_FEW_INGREDIENTS`.
- `client/src/lib/openai.ts` — added `SlopBowlApiError` plus the `SLOP_BOWL_TOO_FEW_INGREDIENTS` code constant so Slop Bowl can inspect server error details.
- `server/routes.ts` — added a server-side distinct-ingredient guard that returns HTTP `422` with `code: "SLOP_BOWL_TOO_FEW_INGREDIENTS"` before OpenAI is called.
- `server/routes.ts` — follow-up local validation fix: recent cooking sessions are now best-effort for profile load and Slop Bowl generation, so a stale local DB history schema does not block the current cooking flow.
- `client/src/pages/app.tsx` — follow-up validation fix: app-level `userProfile` now syncs after `/api/user/profile` refetches, so settings pantry saves/reset updates are reflected when returning to Slop Bowl.
- `product-decisions/008-optional-context-and-local-validation-boundaries.md` — durable policy for optional context, local validation boundaries, and production-safe graceful degradation.

## Impact on other agents

Future Slop Bowl generation or pantry-check work should read EPIC-006 first. The minimum viable Slop Bowl input is now 3 distinct trimmed ingredient names, enforced on both client and server.

The generic `withDemoErrorHandling` path is still used elsewhere. Slop Bowl now bypasses it only where typed domain errors need inline UI treatment.

## Open items

- Replit/manual validation is still needed for the authenticated end-to-end flow before EPIC-006 is marked `Resolved`.
- A direct authenticated API check should verify that `pantryOverride: ["beef", "buns"]` returns `422` with `SLOP_BOWL_TOO_FEW_INGREDIENTS`.
- True OpenAI/model failures still use the existing generic service-unavailable toast. EPIC-006 leaves a follow-up question about whether Slop Bowl should get a more specific retry message later.
- The local Neon database used during 2026-04-27 validation is still behind the current schema (`cooking_sessions.recipe_snapshot` missing). The server now tolerates that for recent-history reads, but DB schema sync remains a separate local-environment cleanup.

## Verification

- `npm ci` — passed; installed local dependencies for this worktree.
- `npm run check` — passed.
- `npm run build` — passed. Vite emitted existing warnings about dynamic Firebase imports and chunk size.
- `git diff --check` — passed.
- Follow-up localhost log check after restart — `/api/user/profile` returned `200`; recent cooking sessions were skipped with a warning because local Neon is missing `cooking_sessions.recipe_snapshot`.

Manual Replit validation still required:

- `0` ingredients: generation remains unavailable and empty-state copy is shown.
- `1` ingredient: inline sparse-pantry prompt appears and no API call is made.
- `2` ingredients: inline sparse-pantry prompt appears and no generic toast appears.
- `3+` ingredients: generation proceeds normally.
- Direct authenticated API call with two ingredients returns the typed `422`.
