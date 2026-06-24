import { z } from "zod";

export const EVAL_FEATURE_TYPES = [
  "recipe_suggestions",
  "chef_it_up_suggestions",
  "slop_bowl_suggestions",
  "cooking_steps",
  "cooking_assistance",
] as const;

export type EvalFeatureType = (typeof EVAL_FEATURE_TYPES)[number];

export const LEGACY_EVAL_FEATURE_TYPES = [
  "pantry_recipes",
  "slop_bowl",
] as const;

export type LegacyEvalFeatureType = (typeof LEGACY_EVAL_FEATURE_TYPES)[number];

export const LEGACY_EVAL_FEATURE_TYPE_ALIASES = {
  pantry_recipes: "chef_it_up_suggestions",
  slop_bowl: "slop_bowl_suggestions",
} as const satisfies Record<LegacyEvalFeatureType, EvalFeatureType>;

export const PROMPT_FEATURE_TYPES = [
  "recipe_suggestions",
  "cooking_steps",
  "cooking_assistance",
] as const;

export type PromptFeatureType = (typeof PROMPT_FEATURE_TYPES)[number];

export const AI_ERROR_FEATURE_TYPES = [
  ...EVAL_FEATURE_TYPES,
  ...LEGACY_EVAL_FEATURE_TYPES,
  "ingredient_detection",
  "tts",
  "tts_voices",
  "transcription",
] as const;

export type AiErrorFeature = (typeof AI_ERROR_FEATURE_TYPES)[number];

export const evalFeatureTypeSchema = z.enum(EVAL_FEATURE_TYPES);
export const promptFeatureTypeSchema = z.enum(PROMPT_FEATURE_TYPES);

export function isEvalFeatureType(value: string): value is EvalFeatureType {
  return EVAL_FEATURE_TYPES.includes(value as EvalFeatureType);
}

export function isLegacyEvalFeatureType(value: string): value is LegacyEvalFeatureType {
  return LEGACY_EVAL_FEATURE_TYPES.includes(value as LegacyEvalFeatureType);
}

export function normalizeEvalFeatureType(value: string): EvalFeatureType | null {
  if (isEvalFeatureType(value)) {
    return value;
  }
  return isLegacyEvalFeatureType(value) ? LEGACY_EVAL_FEATURE_TYPE_ALIASES[value] : null;
}

export function isPromptFeatureType(value: string): value is PromptFeatureType {
  return PROMPT_FEATURE_TYPES.includes(value as PromptFeatureType);
}
