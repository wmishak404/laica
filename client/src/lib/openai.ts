import { apiFetch, apiRequest } from './queryClient';
import type { VisionAnalysisResult } from './visionResult';

interface CookingStepObject {
  instruction?: string;
  step?: string;
  duration?: string | number;
  tips?: string;
  visualCues?: string;
  commonMistakes?: string;
  safetyLevel?: string;
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

export async function fetchPantryRecipes(pantryIngredients: string[], preferences?: string, timeAvailable?: string) {
  const response = await apiRequest('POST', '/api/recipes/pantry', {
    ingredients: pantryIngredients,
    preferences,
    timeAvailable
  });
  return await response.json();
}

export async function fetchCookingSteps(
  recipeName: string,
  options?: {
    ingredients?: string[];
    equipment?: string[];
    description?: string;
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

interface SlopBowlErrorBody {
  code?: string;
  message?: string;
  error?: string;
}

export class SlopBowlApiError extends Error {
  status: number;
  code?: string;
  body?: SlopBowlErrorBody;

  constructor(status: number, body?: SlopBowlErrorBody, fallbackMessage = 'Failed to generate Slop Bowl recipe') {
    super(body?.message || body?.error || fallbackMessage);
    this.name = 'SlopBowlApiError';
    this.status = status;
    this.code = body?.code;
    this.body = body;
  }
}

export async function fetchSlopBowlRecipe(options?: {
  pantryOverride?: string[];
  feedback?: string;
  previousRecipe?: string;
}): Promise<{ recipe: SlopBowlRecipe }> {
  const response = await apiFetch('/api/recipes/slop-bowl', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options || {}),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorBody: SlopBowlErrorBody | undefined;

    try {
      errorBody = JSON.parse(errorText) as SlopBowlErrorBody;
    } catch {
      errorBody = { message: errorText };
    }

    throw new SlopBowlApiError(response.status, errorBody);
  }

  return await response.json();
}

export async function analyzeImage(
  imageData: string,
  isHEIC?: boolean,
  options?: { signal?: AbortSignal },
): Promise<VisionAnalysisResult> {
  const response = await apiRequest('POST', '/api/vision/analyze', {
    image: imageData,
    isHEIC: isHEIC
  }, { signal: options?.signal });
  return await response.json();
}
