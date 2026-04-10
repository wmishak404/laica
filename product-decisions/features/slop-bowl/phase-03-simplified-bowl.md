# Slop Bowl Phase 3 — Simplified Bowl & Cooking Steps Enrichment

**Status:** Accepted
**Phase owner:** Wilson
**Date:** 2026-04-09

## Goal

Simplify the bowl concept and fix the cooking instruction handoff so steps are generated from actual ingredients, not just a recipe name.

## Context

Phase 2 raised three alignment questions. Wilson resolved all three with a clear product direction: the rigid base/protein/toppings/sauce component structure is over-engineered. What matters is putting pantry ingredients together into a good meal — not labeling which slot each ingredient fills. The cooking steps should be generated from first principles (actual ingredients and equipment), not from a recipe name string.

## Decisions

### 1. No rigid component structure

The Slop Bowl prompt should generate a tasty bowl recipe from whatever's in the pantry. It does NOT need to enforce base/protein/toppings/sauce categories. Users might be missing entire categories (no protein, no grains) and that's fine — the system works with what they have.

**Removed from API contract:**
- `components` object (base, protein, toppings, sauce)
- `assembly` string

**Kept:**
- `pantryIngredientsUsed` — what we're using
- `additionalIngredientsNeeded` — what's missing (minimize this)
- `instructions` — flattened cooking steps
- `overview` — short description of what the bowl is

### 2. Enrich cooking steps with real context (resolves Phase 2 question #2)

The existing `getCookingSteps(recipeName, ingredients?)` already accepts an optional `ingredients` param but the route never passes it. The fix:

**Server (`routes.ts`):** Update `POST /api/cooking/steps` to accept optional `ingredients`, `equipment`, and `description` fields. All optional — existing callers (manual meal planning) continue working unchanged.

**Server (`openai.ts`):** Update `getCookingSteps()` signature to accept and pass through equipment and description context to the prompt. When present, the AI generates steps aware of actual ingredients and available tools.

**Client (`live-cooking.tsx`):** When entering cooking from Slop Bowl, pass the recipe's `pantryIngredientsUsed` and user's `kitchenEquipment` to `fetchCookingSteps()`. When entering from manual planning, behavior is unchanged (just recipeName).

### 3. Hardcode prompt for v1 (resolves Phase 2 question #1)

Slop Bowl uses a hardcoded `DEFAULT_SLOP_BOWL_PROMPT` in v1. No prompt-manager expansion needed. `logInteraction('slop_bowl', ...)` is fine for eval logging — the feature type string in `aiInteractions` is free-form.

### 4. Null-safe cooking history (resolves Phase 2 question #3)

When building `recentMeals` from `cookingSessions`:
- Skip sessions with no `recipeSnapshot` — just use `recipeName` as-is
- Default `cuisine` to `"unknown"` when missing from snapshot
- The prompt treats unknown-cuisine sessions as "avoid the recipe name" only

## Updated API contract

```
POST /api/recipes/slop-bowl
Auth: Firebase Bearer token
Body: {
  pantryOverride?: string[],
  feedback?: string,
  previousRecipe?: string
}
Response: {
  recipe: {
    recipeName: string,
    description: string,
    cookTime: number,
    difficulty: string,
    cuisine: string,
    pantryIngredientsUsed: string[],
    additionalIngredientsNeeded: string[],
    overview: string,
    instructions: string[],
    isFusion: boolean,
    pantryMatch: number
  }
}
```

```
POST /api/cooking/steps (updated — all new fields optional)
Body: {
  recipeName: string,
  ingredients?: string[],
  equipment?: string[],
  description?: string
}
```

## Source decisions

- Wilson's direction: "The bowl structure isn't all that important. What we care about is putting ingredients all together into a meal from what they have."
- Phase 2 alignment questions: all three resolved

## Impact

- Codex: simpler prompt, simpler response shape, one additional change to `/api/cooking/steps` route
- Claude: simpler approval screen UI, pass extra context from `live-cooking.tsx` when entering from Slop Bowl
