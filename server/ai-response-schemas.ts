import { z } from "zod";

const nonEmptyString = z.string().trim().min(1);

const cookingSafetyLevelSchema = z.enum(["critical", "important", "minor"]);

function cleanOptionalText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function parseDurationText(value: string, options: { bareNumberMeansMinutes?: boolean } = {}): number | undefined {
  const normalized = value.trim().replace(/[–—]/g, "-");
  if (!normalized) {
    return undefined;
  }

  if (options.bareNumberMeansMinutes && /^\d+(?:\.\d+)?$/.test(normalized)) {
    return Math.round(Number.parseFloat(normalized) * 60);
  }

  const candidates: number[] = [];
  const durationPattern = /\b(\d+(?:\.\d+)?)\s*(seconds?|secs?|minutes?|mins?)\b/gi;
  let match: RegExpExecArray | null;

  while ((match = durationPattern.exec(normalized)) !== null) {
    const amount = Number.parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    const seconds = unit.startsWith("sec") ? amount : amount * 60;
    if (Number.isFinite(seconds) && seconds > 0) {
      candidates.push(seconds);
    }
  }

  return candidates.length > 0 ? Math.round(Math.max(...candidates)) : undefined;
}

function normalizeStepDurationSeconds(duration: unknown, timing: unknown): number | undefined {
  if (typeof duration === "number" && Number.isFinite(duration) && duration > 0) {
    return Math.round(duration);
  }

  if (typeof duration === "string") {
    const parsedDuration = parseDurationText(duration);
    if (parsedDuration) {
      return parsedDuration;
    }
  }

  if (typeof timing === "number" && Number.isFinite(timing) && timing > 0) {
    return Math.round(timing * 60);
  }

  if (typeof timing === "string") {
    return parseDurationText(timing, { bareNumberMeansMinutes: true });
  }

  return undefined;
}

function normalizeInstructionText(value: unknown): string | undefined {
  const text = cleanOptionalText(value);
  return text?.replace(/\s+/g, " ");
}

function isPlaceholderInstruction(instruction: string): boolean {
  const compact = instruction
    .toLowerCase()
    .replace(/[.:;,\-—–_()[\]{}'"!?]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (/^step\s*\d+$/.test(compact)) {
    return true;
  }

  return [
    "tbd",
    "to be determined",
    "n a",
    "na",
    "none",
    "null",
    "undefined",
    "placeholder",
    "lorem ipsum",
    "no instructions",
    "no instructions available",
    "instructions unavailable",
    "instruction unavailable",
    "add instruction here",
    "details to come",
    "follow the recipe",
    "follow recipe instructions",
    "follow the recipe instructions",
  ].includes(compact);
}

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
  actionLabel: nonEmptyString.optional(),
  instruction: nonEmptyString,
  duration: z.number().int().positive().optional(),
  tips: z.string(),
  visualCues: z.string(),
  commonMistakes: z.string(),
  safetyLevel: cookingSafetyLevelSchema,
});

export const cookingStepIngredientSchema = z.object({
  name: nonEmptyString,
  quantity: z.string().trim().optional(),
  forSteps: z.array(z.coerce.number().int().positive()).optional(),
}).passthrough();

const rawCookingStepIngredientSchema = z.union([
  nonEmptyString,
  cookingStepIngredientSchema,
]).transform((value) => {
  if (typeof value === "string") {
    return { name: value.trim() };
  }

  return value;
});

const rawCookingStepObjectSchema = z.record(z.unknown());
const rawCookingStepSchema = z
  .union([z.string(), rawCookingStepObjectSchema])
  .transform((value) => {
    const rawStep = typeof value === "string" ? { instruction: value } : value;
    const instruction = normalizeInstructionText(rawStep.instruction ?? rawStep.step);

    if (!instruction || isPlaceholderInstruction(instruction)) {
      return null;
    }

    const actionLabel = cleanOptionalText(rawStep.actionLabel ?? rawStep.label ?? rawStep.title);
    const duration = normalizeStepDurationSeconds(rawStep.duration, rawStep.timing);
    const safetyLevel = cookingSafetyLevelSchema.safeParse(rawStep.safetyLevel).success
      ? rawStep.safetyLevel as z.infer<typeof cookingSafetyLevelSchema>
      : "minor";

    return {
      ...(actionLabel ? { actionLabel } : {}),
      instruction,
      ...(duration ? { duration } : {}),
      tips: cleanOptionalText(rawStep.tips) ?? "",
      visualCues: cleanOptionalText(rawStep.visualCues) ?? "",
      commonMistakes: cleanOptionalText(rawStep.commonMistakes) ?? "",
      safetyLevel,
    };
  });

export const cookingStepsResponseSchema = z.object({
  recipe: z.object({
    ingredients: z.array(rawCookingStepIngredientSchema).default([]),
  }).passthrough(),
  steps: z.array(rawCookingStepSchema).min(1),
  variations: z.array(z.string().trim()).default([]),
}).passthrough().transform((response, ctx) => {
  const steps = response.steps.filter((step): step is z.infer<typeof cookingStepSchema> => step !== null);

  if (steps.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["steps"],
      message: "At least one usable cooking step is required.",
    });
    return z.NEVER;
  }

  return {
    recipe: {
      ...response.recipe,
      ingredients: response.recipe.ingredients,
    },
    steps,
    variations: response.variations.filter((variation) => variation.length > 0),
  };
});

export function normalizeCookingStepsResponse(response: unknown) {
  return cookingStepsResponseSchema.parse(response);
}
