# Slop Bowl Feature — Plan & API Contract for Codex

**Agent:** claude
**Branch:** `claude/funny-boyd` (planning), implementation will be on `claude/slop-bowl-ui`
**Date:** 2026-04-09

## Summary

Planned and documented the "Slop Bowl" feature — a zero-decision cooking path for returning users. The system auto-generates one multi-component bowl recipe from the user's pantry, cooking history, and profile. Created product decisions PD-002 and PD-003, and prepared the API contract for Codex to implement the server side.

## What Codex needs to build

### Branch: `codex/slop-bowl-api`

### Files to modify

1. **`server/openai.ts`** — Two changes:
   - **Add `getSlopBowlRecipe(profile)` function + `DEFAULT_SLOP_BOWL_PROMPT`**
   - **Upgrade all 6 `model: "gpt-4o"` references** (see PD-003 for model mapping)

2. **`server/routes.ts`** — Add `POST /api/recipes/slop-bowl` endpoint

### API Contract

```
POST /api/recipes/slop-bowl
Auth: Firebase Bearer token (use existing isAuthenticated middleware)
Content-Type: application/json

Request Body:
{
  "pantryOverride": ["chicken", "rice", ...],  // optional, overrides DB pantry
  "feedback": "less spicy, more Asian",         // optional, from rejected recipe
  "previousRecipe": "Spiced Chicken Bowl"       // optional, name to avoid repeating
}

Response (200):
{
  "recipe": {
    "recipeName": "Mediterranean Chicken Power Bowl",
    "description": "A hearty bowl with...",
    "cookTime": 35,
    "difficulty": "Easy",
    "cuisine": "Mediterranean",
    "pantryIngredientsUsed": ["chicken", "rice", "chickpeas", ...],
    "additionalIngredientsNeeded": ["tahini", "fresh parsley"],
    "overview": "...",
    "instructions": ["Step 1: ...", "Step 2: ...", ...],
    "isFusion": false,
    "pantryMatch": 85,
    "components": {
      "base": {
        "name": "Lemon herb rice",
        "ingredients": ["rice", "lemon", "olive oil"],
        "instructions": "Cook rice with lemon zest..."
      },
      "protein": {
        "name": "Grilled chicken thigh",
        "ingredients": ["chicken thigh", "garlic", "paprika"],
        "instructions": "Season and grill..."
      },
      "toppings": [
        {
          "name": "Roasted chickpeas",
          "ingredients": ["chickpeas", "cumin"],
          "instructions": "Toss with spices, roast at 400F..."
        }
      ],
      "sauce": {
        "name": "Tahini dressing",
        "ingredients": ["tahini", "lemon juice", "garlic"],
        "instructions": "Whisk together..."
      }
    },
    "assembly": "Layer rice, top with chicken, scatter chickpeas, drizzle tahini"
  }
}
```

**Important:** The top-level `instructions` array must be a flattened version of the component preps + assembly step. This is what `LiveCooking` consumes — it doesn't know about `components`.

### getSlopBowlRecipe() specification

**Input:**
```typescript
interface SlopBowlInput {
  ingredients: string[];
  cookingSkill: string;           // "beginner" | "intermediate" | "expert"
  dietaryRestrictions: string[];
  weeklyTime: string;             // "1-2" | "3-5" | "6-10" | "10+"
  kitchenEquipment: string[];
  recentMeals: {                  // from cookingSessions table
    recipeName: string;
    cuisine: string;
    daysAgo: number;
    rating: number | null;        // 1-5 or null if not rated
  }[];
  feedback?: string;              // user's comment on rejected recipe
  previousRecipe?: string;        // name to avoid
}
```

**Time mapping** (derive max cook time from weeklyTime):
- `'1-2'` → 30 min max
- `'3-5'` → 60 min max
- `'6-10'` → 90 min max
- `'10+'` → 120 min max

**Prompt requirements:**
- Return exactly 1 bowl recipe (not 3)
- Always a multi-component bowl (base, protein, toppings, sauce)
- Categorize pantry ingredients into component slots
- Maximize pantry usage, minimize `additionalIngredientsNeeded`
- Constrain techniques by available `kitchenEquipment`
- Avoid repeating recipes from last 7 days
- Vary cuisine from most recent session
- Consider ratings (5-star = preferred direction, 1-2 star = avoid)
- If `feedback` provided, incorporate it (e.g. "less spicy")
- If `previousRecipe` provided, don't generate that recipe
- Use prompt-manager pattern: `await getActivePrompt('slop_bowl') || DEFAULT_SLOP_BOWL_PROMPT`
- Log via `logInteraction('slop_bowl', ...)`

### Model upgrades (PD-003)

| Function | Current | New |
|----------|---------|-----|
| `getSlopBowlRecipe()` (new) | — | `gpt-4.1` |
| `getRecipeSuggestions()` :157 | `gpt-4o` | `gpt-4.1` |
| `getCookingSteps()` :188 | `gpt-4o` | `gpt-4.1` |
| `getCookingAssistance()` :301 | `gpt-4o` | `gpt-4.1-mini` |
| `getGroceryList()` :215 | `gpt-4o` | `gpt-4o-mini` |
| `getIngredientAlternatives()` :271 | `gpt-4o` | `gpt-4o-mini` |
| `analyzeIngredientImage()` :344 | `gpt-4o` | `gpt-4.1` |

### Route handler logic

```
1. Verify Firebase auth (isAuthenticated middleware)
2. Parse body: { pantryOverride?, feedback?, previousRecipe? }
3. Fetch user from DB: storage.getUser(userId)
4. Validate: pantryIngredients.length > 0, cookingSkill, weeklyTime
5. Fetch recent sessions: storage.getUserCookingSessions(userId, 10)
6. Build recentMeals array from sessions (extract recipeName, cuisine from recipeSnapshot, compute daysAgo, get userRating)
7. Determine ingredients: pantryOverride || user.pantryIngredients
8. Call getSlopBowlRecipe({ ingredients, cookingSkill, dietaryRestrictions, weeklyTime, kitchenEquipment, recentMeals, feedback, previousRecipe })
9. Return { recipe: ... }
```

## Changes (this handoff)

| File | What |
|------|------|
| `product-decisions/002-slop-bowl.md` | Created — Slop Bowl product decision |
| `product-decisions/003-openai-model-strategy.md` | Created — model upgrade decision |
| `product-decisions/README.md` | Updated index |
| `docs/handoffs/2026-04-09-claude-slop-bowl-plan.md` | This file |

## Impact on other agents

- **Codex:** This is your spec. Build `codex/slop-bowl-api` from the contract above. Claude is building the client side in parallel — no shared files.
- **Replit:** After both branches merge, validate the full flow end-to-end.

## Open items

- Claude is building client UI on `claude/slop-bowl-ui` in parallel
- After both merge to `main`, Replit E2E validation needed

## Verification

- Codex API: `curl -X POST /api/recipes/slop-bowl -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{}'` should return single bowl recipe JSON
- Model upgrades: verify all endpoints still return valid responses after model swap
- `npm run check` and `npm run build` must pass
