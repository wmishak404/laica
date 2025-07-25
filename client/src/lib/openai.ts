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

export async function fetchCookingSteps(recipeName: string) {
  const response = await fetch('/api/cooking/steps', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipeName
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
