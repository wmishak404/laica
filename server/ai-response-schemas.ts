import { z } from "zod";

const nonEmptyString = z.string().trim().min(1);

export const recipeSuggestionSchema = z.object({
  recipeName: nonEmptyString,
  description: nonEmptyString,
  difficulty: nonEmptyString,
  cookTime: z.coerce.number().int().nonnegative(),
  pantryIngredientsUsed: z.array(z.string()).default([]),
  additionalIngredientsNeeded: z.array(z.string()).default([]),
  overview: nonEmptyString,
  instructions: z.array(nonEmptyString).min(1),
  cuisine: nonEmptyString,
  isFusion: z.boolean(),
  imageUrl: z.string().nullish(),
}).passthrough();

export const recipeSuggestionsResponseSchema = z.object({
  recipes: z.array(recipeSuggestionSchema).length(3),
}).passthrough();

export const slopBowlRecipeSchema = z.object({
  recipeName: nonEmptyString,
  description: nonEmptyString,
  cookTime: z.coerce.number().int().nonnegative(),
  difficulty: nonEmptyString,
  cuisine: nonEmptyString,
  pantryIngredientsUsed: z.array(z.string()).default([]),
  additionalIngredientsNeeded: z.array(z.string()).default([]),
  overview: nonEmptyString,
  instructions: z.array(nonEmptyString).min(1),
  isFusion: z.boolean(),
  pantryMatch: z.coerce.number().min(0).max(100),
}).passthrough();

export const slopBowlResponseSchema = z.object({
  recipe: slopBowlRecipeSchema,
}).passthrough();

export const cookingStepSchema = z.object({
  instruction: nonEmptyString,
}).passthrough();

export const cookingStepsResponseSchema = z.object({
  recipe: z.object({}).passthrough(),
  steps: z.array(cookingStepSchema).min(1),
  variations: z.array(z.string()).optional(),
}).passthrough();
