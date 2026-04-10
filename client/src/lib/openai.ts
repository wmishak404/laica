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
  const response = await fetch('/api/recipes/suggestions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      preferences,
      ingredients
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status}: ${errorText}`);
  }

  return await response.json();
}

export async function fetchPantryRecipes(pantryIngredients: string[], preferences?: string, timeAvailable?: string) {
  const response = await fetch('/api/recipes/pantry', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ingredients: pantryIngredients,
      preferences,
      timeAvailable
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status}: ${errorText}`);
  }

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
  const response = await fetch('/api/cooking/steps', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipeName,
        ...options,
      }),
    });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status}: ${errorText}`);
  }

  return await response.json();
}

export async function fetchGroceryList(recipes: string[]) {
  const response = await fetch('/api/grocery/list', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipes
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status}: ${errorText}`);
  }

  return await response.json();
}

export async function fetchIngredientAlternatives(ingredient: string, reason: string) {
  const response = await fetch('/api/ingredients/alternatives', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ingredient,
      reason
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status}: ${errorText}`);
  }

  return await response.json();
}

export async function fetchCookingAssistance(step: string, question?: string) {
  const response = await fetch('/api/cooking/assistance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      step,
      question
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status}: ${errorText}`);
  }

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

export async function fetchSlopBowlRecipe(options?: {
  pantryOverride?: string[];
  feedback?: string;
  previousRecipe?: string;
}): Promise<{ recipe: SlopBowlRecipe }> {
  const { FirebaseAuthService } = await import('@/lib/firebase');
  const idToken = await FirebaseAuthService.getIdToken();
  if (!idToken) {
    throw new Error('Not authenticated');
  }

  const response = await fetch('/api/recipes/slop-bowl', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify(options || {}),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status}: ${errorText}`);
  }

  return await response.json();
}

export async function analyzeImage(imageData: string, isHEIC?: boolean) {
  const response = await fetch('/api/vision/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: imageData,
      isHEIC: isHEIC
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status}: ${errorText}`);
  }

  return await response.json();
}
