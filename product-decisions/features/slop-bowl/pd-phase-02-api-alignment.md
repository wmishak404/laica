# Slop Bowl Phase 2 — API and Implementation Alignment

**Status:** Accepted / Resolved by Phase 3
**Document kind:** Feature Phase Record
**Phase owners:** codex, claude
**Date:** 2026-04-09

## Goal

Align the API contract, model strategy, and current app behavior so the feature can be implemented without rework across server and client.

## Decisions accepted so far

- The server entry point is `POST /api/recipes/slop-bowl` with Firebase bearer authentication.
- The request may include `pantryOverride`, `feedback`, and `previousRecipe`.
- The response returns one recipe plus component breakdown for the bowl.
- Slop Bowl recipe generation uses `gpt-4.1`.
- Existing OpenAI endpoints move to a tiered model strategy per [PD-003](../../pd-003-openai-model-strategy.md).

## Resolved alignment questions

### 1. Prompt-manager scope

The current handoff proposes `getActivePrompt('slop_bowl')` and `logInteraction('slop_bowl', ...)`, but the current prompt-manager, eval criteria, and admin routes only support `recipe_suggestions`, `cooking_assistance`, and `cooking_steps`.

Accepted direction: keep Slop Bowl on a hardcoded default prompt in v1 and defer prompt-manager support.

### 2. Cooking instruction handoff

The current handoff expects the Slop Bowl response to include a flattened `instructions` array for `LiveCooking`, but the current client regenerates cooking steps later from `/api/cooking/steps` using only `recipeName`.

Accepted direction: extend the cooking-steps path so the later step generation receives enough context to preserve component order and equipment constraints.

### 3. Sparse cooking-history fallback

The current route concept expects `recentMeals.cuisine` from `cookingSessions.recipeSnapshot`, but older sessions may have no snapshot or no cuisine.

Accepted direction: define null-safe fallback behavior in the route and prompt when recent history is partial.

## Sources

- [PD-003](../../pd-003-openai-model-strategy.md)
- `docs/handoffs/2026-04-09-claude-slop-bowl-plan.md`
- `docs/handoffs/2026-04-09-codex-slop-bowl-doc-review.md`

## Exit criteria for Phase 2

- Resolved by [Phase 3 simplified bowl](pd-phase-03-simplified-bowl.md).
- The API contract was stable enough for server and client work to proceed independently.
