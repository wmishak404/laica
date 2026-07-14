import { apiRequest } from './queryClient';
import type { VisionAnalysisResult } from './visionResult';
import type { PlanningTimeValue } from '@shared/planning';

interface CookingStepObject {
  actionLabel?: string;
  instruction?: string;
  step?: string;
  duration?: number;
  tips?: string;
  visualCues?: string;
  commonMistakes?: string;
  safetyLevel?: 'critical' | 'important' | 'minor';
  [key: string]: unknown;
}

interface CookingIngredientObject {
  name: string;
  quantity?: string;
  forSteps?: number[];
}

interface CookingRecipeObject {
  ingredients?: CookingIngredientObject[];
}

interface CookingStepsResponse {
  steps?: Array<string | CookingStepObject>;
  recipe?: CookingRecipeObject;
}

export async function fetchRecipeSuggestions(preferences: string, ingredients?: string[]) {
  const response = await apiRequest('POST', '/api/recipes/suggestions', {
    preferences,
    ingredients
  });
  return await response.json();
}

export async function fetchPantryRecipes(
  pantryIngredients: string[],
  preferences?: string,
  timeAvailable?: string,
  options?: { signal?: AbortSignal },
) {
  const response = await apiRequest('POST', '/api/recipes/pantry', {
    ingredients: pantryIngredients,
    preferences,
    timeAvailable
  }, { signal: options?.signal });
  return await response.json();
}

export interface RecipeImageResolveRecipe {
  recipeName: string;
  cuisine?: string;
  pantryIngredientsUsed?: string[];
  ingredients?: string[];
  additionalIngredientsNeeded?: string[];
  missingIngredients?: string[];
  overview?: string;
  description?: string;
}

export type RecipeImageResolveResponse =
  | {
      status: 'ready';
      images: Array<{
        recipeIndex: number;
        imageUrl: string;
        cacheKey: string;
      }>;
    }
  | { status: 'pending' }
  | { status: 'unavailable'; reason?: string };

export type SelectedRecipeImageResolveResponse =
  | {
      status: 'ready';
      image: {
        imageUrl: string;
        cacheKey: string;
      };
    }
  | { status: 'pending' }
  | { status: 'unavailable'; reason?: string };

export async function resolveRecipeImages(
  recipes: RecipeImageResolveRecipe[],
  options?: { signal?: AbortSignal },
): Promise<RecipeImageResolveResponse> {
  const response = await apiRequest('POST', '/api/recipe-images/resolve', {
    recipes,
  }, { signal: options?.signal });
  return await response.json();
}

export async function resolveSelectedRecipeImage(
  recipe: RecipeImageResolveRecipe,
  options?: { signal?: AbortSignal },
): Promise<SelectedRecipeImageResolveResponse> {
  const response = await apiRequest('POST', '/api/recipe-images/selected/resolve', {
    recipe,
  }, { signal: options?.signal });
  return await response.json();
}

export async function fetchCookingSteps(
  recipeName: string,
  options?: {
    ingredients?: string[];
    equipment?: string[];
    description?: string;
    acknowledgedMissingIngredients?: string[];
  }
): Promise<CookingStepsResponse> {
  const response = await apiRequest('POST', '/api/cooking/steps', {
    recipeName,
    ...options,
  });
  return await response.json();
}

export async function fetchGroceryList(recipes: string[]) {
  const response = await apiRequest('POST', '/api/grocery/list', {
    recipes
  });
  return await response.json();
}

export async function fetchIngredientAlternatives(ingredient: string, reason: string) {
  const response = await apiRequest('POST', '/api/ingredients/alternatives', {
    ingredient,
    reason
  });
  return await response.json();
}

export async function fetchCookingAssistance(step: string, question?: string) {
  const response = await apiRequest('POST', '/api/cooking/assistance', {
    step,
    question
  });
  return await response.text();
}

export interface SlopBowlRecipe {
  recipeName: string;
  description: string;
  cookTime: number;
  difficulty: string;
  cuisine: string;
  pantryIngredientsUsed: string[];
  additionalIngredientsNeeded: string[];
  overview: string;
  instructions: string[];
  isFusion: boolean;
  pantryMatch: number;
}

export const SLOP_BOWL_TOO_FEW_INGREDIENTS = 'SLOP_BOWL_TOO_FEW_INGREDIENTS';

export async function fetchSlopBowlRecipe(options?: {
  pantryOverride?: string[];
  planningTimeAvailable?: PlanningTimeValue;
  feedback?: string;
  previousRecipe?: string;
}): Promise<{ recipe: SlopBowlRecipe }> {
  const response = await apiRequest('POST', '/api/recipes/slop-bowl', options || {});
  return await response.json();
}

export async function analyzeImage(
  imageData: string,
  isHEIC?: boolean,
  options?: { signal?: AbortSignal; scanType?: 'pantry' | 'kitchen' },
): Promise<VisionAnalysisResult> {
  const headers = new Headers();
  if (options?.scanType) {
    headers.set('X-Laica-Scan-Type', options.scanType);
  }

  const response = await apiRequest('POST', '/api/vision/analyze', {
    image: imageData,
    isHEIC: isHEIC
  }, { signal: options?.signal, headers });
  return await response.json();
}
