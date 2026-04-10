# Slop Bowl — Revised Spec (Responds to Codex Review)

**Agent:** claude
**Branch:** `claude/funny-boyd`
**Date:** 2026-04-09

## Summary

Wilson reviewed the three alignment questions Codex raised in `phase-02-api-alignment.md` and simplified the feature direction. The rigid base/protein/toppings/sauce component structure is removed. The cooking steps path is enriched with actual ingredient and equipment context. All three Codex questions are now resolved.

## Answers to Codex's 3 questions

### 1. Prompt-manager scope → Hardcode for v1
Use `DEFAULT_SLOP_BOWL_PROMPT` directly. No expansion of prompt-manager/eval/admin feature types needed. `logInteraction('slop_bowl', ...)` works as-is since the `featureType` column is free-form text.

### 2. Cooking instruction handoff → Enrich existing path (Option B, simplified)
Wilson's direction: steps should be generated from actual ingredients, not a recipe name string.

**What Codex needs to change in `server/routes.ts`:**
The `POST /api/cooking/steps` route currently only parses `recipeName`. Add optional fields:
```typescript
const schema = z.object({
  recipeName: z.string(),
  ingredients: z.array(z.string()).optional(),
  equipment: z.array(z.string()).optional(),
  description: z.string().optional(),
});
```
Pass all fields through to `getCookingSteps()`.

**What Codex needs to change in `server/openai.ts`:**
`getCookingSteps()` already has `ingredients?` in its signature. Expand to:
```typescript
export async function getCookingSteps(
  recipeName: string,
  ingredients?: string[],
  equipment?: string[],
  description?: string
)
```
Update the user message to include equipment and description when present:
```
I want to cook ${recipeName}.
${description ? `Description: ${description}` : ''}
${ingredients?.length ? `Using these ingredients: ${ingredients.join(', ')}` : ''}
${equipment?.length ? `Available equipment: ${equipment.join(', ')}` : ''}
Please provide detailed home cooking instructions...
```

This is backward-compatible — existing callers (manual meal planning) pass only `recipeName` and everything still works.

### 3. Sparse cooking history → Null-safe fallback
When building `recentMeals` from `getUserCookingSessions()`:
- If `recipeSnapshot` is null/missing, use `recipeName` only, set cuisine to `"unknown"`
- The prompt treats unknown-cuisine sessions as "avoid the recipe name" without cuisine-based reasoning

## Revised API contract for Slop Bowl

**Removed** from previous spec:
- `components` object (base, protein, toppings, sauce)
- `assembly` string

**Final shape:**
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

## Revised prompt guidance

The Slop Bowl prompt should:
- Generate one tasty bowl recipe from pantry ingredients
- NOT enforce rigid component categories — work with whatever's available
- Maximize pantry usage, minimize additional ingredients
- Respect dietary restrictions and available equipment
- Use cooking history to avoid repeats and vary cuisine
- The output is a coherent meal that goes in a bowl — that's it

## Changes (this handoff)

| File | What |
|------|------|
| `product-decisions/features/slop-bowl/phase-03-simplified-bowl.md` | New — resolves all 3 alignment questions |
| `docs/handoffs/2026-04-09-claude-slop-bowl-revised.md` | This file — revised spec for Codex |

## Impact on other agents

- **Codex:** This replaces the API contract from the original handoff. Three things to build:
  1. `POST /api/recipes/slop-bowl` — simpler response (no `components`), same auth/history logic
  2. `getCookingSteps()` — add `equipment?` and `description?` params, update user message
  3. `POST /api/cooking/steps` route — parse and pass through optional `ingredients`, `equipment`, `description`
  4. Model upgrades (unchanged from PD-003)
- **Claude:** Will update client code to match (simpler types, pass context to `fetchCookingSteps`)

## Open items

- Claude still needs to update client-side types and `slop-bowl.tsx` to remove component breakdown UI
- `live-cooking.tsx` needs to pass ingredients/equipment when calling `fetchCookingSteps` from a Slop Bowl session

## Verification

- `getCookingSteps("Chicken Rice Bowl")` — still works with just name (backward compat)
- `getCookingSteps("Chicken Rice Bowl", ["chicken", "rice"], ["skillet", "pot"], "A simple bowl...")` — generates equipment-aware steps
- `POST /api/recipes/slop-bowl` — returns flat recipe object, no `components`
