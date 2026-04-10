# Slop Bowl UI Ready for Integration

**Agent:** claude
**Branch:** `claude/slop-bowl-ui`
**Date:** 2026-04-10

## Summary
Implemented the client-side Slop Bowl flow per phase-3 spec (`product-decisions/features/slop-bowl/phase-03-simplified-bowl.md`). Carried forward the prototype WIP from the now-merged planning branch (`claude/funny-boyd`), fixed the missing `RecipeRecommendation` type fields that prevented `npm run check` from passing, and wired the cooking-step enrichment context-pass-through that phase-3 explicitly requires.

The branch is the client-side counterpart to `codex/slop-bowl-api` (handoff: `docs/handoffs/2026-04-10-codex-slop-bowl-api.md`). Both are ready for integration testing together; neither is independently mergeable.

## Changes

| File | What changed |
|------|--------------|
| `client/src/components/cooking/slop-bowl.tsx` (new) | Full Slop Bowl page component with 4 states: `pantry-check` (tappable ingredient badges, inline add/remove, "this looks right" CTA), `generating` (spinner with rotating tongue-in-cheek loading messages), `approval` (recipe card with cuisine/difficulty/cookTime/isFusion badge, pantry-ingredients-used in green, missing-ingredients in amber, accept/reject CTAs, escape-to-manual link), `feedback` (textarea for "less spicy, more Asian"-style feedback, regenerate button). Uses `withDemoErrorHandling` for graceful API errors. Saves edited pantry to profile via `useUpdateUserProfile`. |
| `client/src/lib/openai.ts` | Added `SlopBowlRecipe` interface matching the phase-3 contract. Added `fetchSlopBowlRecipe(options)` that POSTs to `/api/recipes/slop-bowl` with Firebase Bearer auth. Extended `fetchCookingSteps()` with optional second arg `{ ingredients?, equipment?, description? }` — undefined fields are stripped by JSON.stringify, so existing callers stay backward-compatible. |
| `client/src/pages/app.tsx` | Added `'slop-bowl'` to the `WorkflowPhase` union. Added `showPlanningChoice` state and `renderPlanningChoice()`, a 2-card screen ("Slop Bowl" vs "Plan your meal") rendered when entering the `planning` phase. Added `case 'slop-bowl'` to the render switch. Updated bottom-nav to highlight when in either `planning` or `slop-bowl`. Extended local `RecipeRecommendation` interface with optional `isFusion`, `ingredients`, `equipment`, `overview` fields. |
| `client/src/components/cooking/live-cooking.tsx` | Extended local `RecipeRecommendation` interface to mirror app.tsx (optional `isFusion`, `ingredients`, `equipment`, `overview`). Updated the `fetchCookingSteps` call at the top of `loadRecipeSteps` to pass `{ ingredients: selectedMeal.ingredients, equipment: selectedMeal.equipment, description: selectedMeal.description }`. When entering cooking from manual planning these are undefined and the request body matches the old shape. |

## Impact on other agents
- **Codex:** No client-server contract drift. The `SlopBowlRecipe` fields, `fetchSlopBowlRecipe()` request shape (`{ pantryOverride?, feedback?, previousRecipe? }`), and `fetchCookingSteps()` enrichment fields all match Codex's `2026-04-10-codex-slop-bowl-api.md`. No follow-up server changes needed for the client-side work to function.
- **Codex (cooking session):** Confirmed via the Codex handoff that `POST /api/cooking/session/start` is "backward-compatible with the existing manual flow," so this branch does NOT modify `live-cooking.tsx:327` (`recipeSnapshot` build) or `live-cooking.tsx:351` (`ingredientsUsed`). If Codex's server prefers the richer Slop Bowl snapshot fields over the legacy ones, that's a follow-up — see Open items.
- **Branch parallelism:** Codex touched only `server/openai.ts`, `server/routes.ts`, and one handoff doc. Claude touched only `client/` files. Zero file overlap, zero merge-conflict risk when both branches land on `main`.

## Open items
- **End-to-end testing requires both branches merged together.** Neither branch can be tested in isolation: this branch's `fetchSlopBowlRecipe()` will 404 against current `main`, and Codex's branch has no client to drive the new endpoint. Recommended: merge both into a shared integration branch, or land them as a coordinated pair on `main` (e.g. Codex's PR first, then this PR).
- **`live-cooking.tsx:351` `ingredientsUsed: selectedMeal.missingIngredients || []`** — pre-existing semantic mismatch (this persists the shopping list, not the ingredients actually used). For Slop Bowl sessions, the correct value is `selectedMeal.ingredients` (which is `recipe.pantryIngredientsUsed`). Affects the manual flow too, so it's a separate cleanup. **Not in this PR** because it touches a code path Codex may also want to reshape during the recipe-snapshot enrichment Codex's handoff alludes to.
- **`recipeSnapshot` field set in `live-cooking.tsx:327`** — Codex made the server route accept richer Slop Bowl fields (`pantryIngredientsUsed`, `additionalIngredientsNeeded`, `overview`), but the client snapshot build still uses the legacy field set. Server is backward-compatible, so nothing breaks; this is a future-quality improvement, not a blocker.
- **Approval-screen polish** — current prototype shows recipe name, cuisine, difficulty, cookTime, isFusion badge, and the two ingredient lists. Does NOT display `recipe.description` or `recipe.overview` even though both are in the API response. Intentional minimalism per the WIP, but worth a Wilson review pass before shipping.
- **Replit validation gate** — per `AGENTS.md`, deployment-bound changes need Firebase sign-in / recipe suggestion / cooking-session persistence / feedback writes / ElevenLabs speech checks in Replit before merging to a deployable branch. Required for both this branch and Codex's.

## Verification

Local checks (this branch only, against current `main`):
- `npm run check` — clean
- `npm run build` — clean (only pre-existing firebase dynamic-import warnings, unrelated)

Manual local dev test (this branch + Codex's branch merged):
1. Merge `claude/slop-bowl-ui` and `codex/slop-bowl-api` into a temporary integration branch (or pull both into Replit).
2. `PORT=3000 npx @dotenvx/dotenvx run -- npm run dev`.
3. Sign in via Firebase. Complete the user profile if needed (cooking skill, weekly time, pantry, equipment).
4. Land on the planning screen. Confirm the new "What are we cooking today?" choice screen with two equal-prominence cards: **Slop Bowl** and **Plan your meal**.
5. Tap **Slop Bowl** → pantry-check screen renders with the user's pantry as tappable badges. Try removing one and adding one. Tap "This looks right".
6. Generating screen with rotating loading messages. After ~5–15s, approval screen renders with the AI-generated bowl.
7. Verify the pantry-ingredients-used badges and missing-ingredients badges populate correctly from the API response.
8. Tap "Try something else" → feedback screen. Enter "less spicy, more Asian" and tap "Generate another bowl". Verify the new recipe avoids the previous one and incorporates the feedback.
9. From a generated recipe, tap "Let's cook this!" → LiveCooking renders. Verify the loaded cooking steps reflect the actual pantry ingredients and user's equipment (not generic recipe-name-only steps). This is the phase-3 enrichment validation.
10. Check the network tab: `POST /api/cooking/steps` body should contain `recipeName`, `ingredients`, `equipment`, `description`.

Replit validation (before merge to `main`):
- All checks listed in `AGENTS.md` "Replit validation gate" plus the Slop Bowl flow above.
