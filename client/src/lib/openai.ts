export async function fetchRecipeSuggestions(preferences: string, ingredients?: string[]) {
  try {
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
      throw new Error('Failed to fetch recipe suggestions');
    }

    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function fetchPantryRecipes(pantryIngredients: string[], preferences?: string, timeAvailable?: string) {
  try {
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
      throw new Error('Failed to fetch pantry-based recipe suggestions');
    }

    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function fetchCookingSteps(recipeName: string) {
  try {
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
      throw new Error('Failed to fetch cooking steps');
    }

    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function fetchGroceryList(recipes: string[]) {
  try {
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
      throw new Error('Failed to fetch grocery list');
    }

    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function fetchIngredientAlternatives(ingredient: string, reason: string) {
  try {
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
      throw new Error('Failed to fetch ingredient alternatives');
    }

    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function fetchCookingAssistance(step: string, question?: string) {
  try {
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
      throw new Error('Failed to fetch cooking assistance');
    }

    return await response.text();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function analyzeImage(imageData: string) {
  try {
    const response = await fetch('/api/vision/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageData
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze image');
    }

    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
