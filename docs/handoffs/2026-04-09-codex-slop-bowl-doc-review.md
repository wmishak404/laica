# Slop Bowl Docs Review

**Agent:** codex
**Branch:** `codex/slop-bowl-doc-review` (planned; local worktree is currently detached pending branch creation approval)
**Date:** 2026-04-09

## Summary

Reviewed Claude's pushed Slop Bowl planning docs on `origin/claude/funny-boyd` against the current committed codebase. The feature direction and authenticated route fit the project well, but three spec mismatches need to be resolved or explicitly accepted as v1 scope: prompt-manager support for `slop_bowl`, preservation of equipment-aware instructions through `LiveCooking`, and null-safe handling of `recentMeals` history data.

## Changes

| File | What |
|------|------|
| `docs/handoffs/2026-04-09-codex-slop-bowl-doc-review.md` | Added Codex review comments on Claude's Slop Bowl handoff and product decisions |
| `AGENTS.md` | Added pushed-handoff rule and planning-doc git-collaboration rule for Codex/Claude discussion |

## Impact on other agents

- **Claude:** Please review these three spec mismatches before the API contract is treated as final:
- `slop_bowl` prompt-manager path: the handoff calls for `getActivePrompt('slop_bowl')` and `logInteraction('slop_bowl', ...)`, but current prompt/eval/admin code only supports `recipe_suggestions`, `cooking_assistance`, and `cooking_steps`. If Slop Bowl should be prompt-managed in v1, the docs need to include that wider surface area; otherwise the spec should explicitly say v1 uses a hardcoded default prompt only.
- `LiveCooking` instruction path: the handoff says the flattened `instructions` array is what `LiveCooking` consumes, but current `LiveCooking` ignores recipe instructions and regenerates steps from `/api/cooking/steps` using only `recipeName`. If Slop Bowl needs to preserve component ordering and equipment constraints, either the client flow or the cooking-steps contract needs to change.
- `recentMeals` data quality: the handoff expects `cuisine` from `cookingSessions.recipeSnapshot`, but `recipeSnapshot` is optional in current storage. The route and prompt should define fallback behavior when older sessions have no snapshot or no cuisine.
- **Codex:** Once those points are confirmed, the route and `server/openai.ts` work can proceed with much lower risk of rework.

## Open items

- Human review is needed if the chosen fix changes product direction, such as using Slop Bowl's generated instructions directly in `LiveCooking` instead of the current step-regeneration flow.
- Branch creation, commit, and push from this worktree still need sandbox approval because git metadata writes land outside the writable sandbox.

## Verification

- Reviewed pushed docs from `origin/claude/funny-boyd`:
  - `docs/handoffs/2026-04-09-claude-slop-bowl-plan.md`
  - `product-decisions/002-slop-bowl.md`
  - `product-decisions/003-openai-model-strategy.md`
  - `AGENTS.md`
- Cross-checked against committed code in:
  - `server/openai.ts`
  - `server/routes.ts`
  - `server/storage.ts`
  - `server/prompt-manager.ts`
  - `server/eval-criteria.ts`
  - `server/admin-routes.ts`
  - `client/src/components/cooking/live-cooking.tsx`
  - `client/src/components/cooking/meal-planning.tsx`
  - `client/src/lib/openai.ts`
