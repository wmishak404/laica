import { test, expect, type Page } from '@playwright/test';

/**
 * End-to-End Smoke Tests (Guest Lane)
 *
 * Why guest lane:
 * - Avoids brittle Google popup OAuth automation.
 * - Still exercises the real client auth contract (Firebase anonymous session).
 * - Lets us validate end-to-end UI state transitions without hitting paid providers by default.
 */

const pantryRecipesResponse = {
  recipes: [
    {
      recipeName: 'Soy Rice Breakfast Bowl',
      description: 'A fast bowl built from rice, eggs, soy sauce, tortillas, and lime.',
      cookTime: 25,
      difficulty: 'Easy',
      cuisine: 'Mexican-inspired',
      pantryMatch: 95,
      pantryIngredientsUsed: ['rice', 'eggs', 'soy sauce', 'tortillas', 'lime'],
      additionalIngredientsNeeded: ['cilantro'],
      overview: 'Pantry-first, bright, and weeknight-friendly.',
    },
    {
      recipeName: 'Crispy Egg Tortilla Rice',
      description: 'Crisped rice and eggs tucked into warm tortillas.',
      cookTime: 30,
      difficulty: 'Easy',
      cuisine: 'Mexican-inspired',
      pantryMatch: 88,
      pantryIngredientsUsed: ['rice', 'eggs', 'tortillas'],
      additionalIngredientsNeeded: ['hot sauce'],
      overview: 'A low-lift second ticket with familiar staples.',
    },
    {
      recipeName: 'Soy Lime Rice Skillet',
      description: 'A skillet dinner that leans on soy sauce and lime.',
      cookTime: 35,
      difficulty: 'Medium',
      cuisine: 'Pantry-first',
      pantryMatch: 82,
      pantryIngredientsUsed: ['rice', 'soy sauce', 'lime'],
      additionalIngredientsNeeded: ['green onion'],
      overview: 'Simple enough for a guest smoke, varied enough for UI proof.',
    },
  ],
};

const cookingStepsResponse = {
  steps: [
    {
      instruction: 'Warm the rice in a skillet until steamy.',
      duration: 120,
      tips: 'Stir once so the grains loosen without drying out.',
      visualCues: 'Steam rises and the rice separates easily.',
      commonMistakes: 'Cranking the heat too high before the eggs are ready.',
      safetyLevel: 'minor',
    },
    {
      instruction: 'Scramble the eggs until soft curds form.',
      duration: 180,
      tips: 'Pull the pan from heat while the eggs still look glossy.',
      visualCues: 'Curds are soft and slightly shiny.',
      commonMistakes: 'Leaving the eggs on heat until they look dry.',
      safetyLevel: 'important',
    },
    {
      instruction: 'Fold rice and eggs into warm tortillas with lime.',
      tips: 'Keep the filling centered so the tortillas close cleanly.',
      visualCues: 'Tortillas are pliable and the filling is tucked in.',
      commonMistakes: 'Overfilling before rolling.',
      safetyLevel: 'minor',
    },
  ],
  recipe: {
    ingredients: [
      { name: 'rice', quantity: '1 cup', forSteps: [1, 3] },
      { name: 'eggs', quantity: '2', forSteps: [2, 3] },
      { name: 'tortillas', quantity: '2', forSteps: [3] },
      { name: 'lime', quantity: '1 wedge', forSteps: [3] },
    ],
  },
};

async function stubRecipeImageResolver(
  page: Page,
  responses: Array<Record<string, unknown>> = [{ status: 'unavailable' }],
) {
  let requestCount = 0;

  await page.route('**/api/recipe-images/selected/resolve', async (route) => {
    const response = responses[Math.min(requestCount, responses.length - 1)] ?? { status: 'unavailable' };
    requestCount += 1;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });

  return {
    getRequestCount: () => requestCount,
  };
}

async function stubPantryRecipes(
  page: Page,
  recipeImageResponses: Array<Record<string, unknown>> = [{ status: 'unavailable' }],
) {
  let requestCount = 0;
  const imageResolverRoutes = await stubRecipeImageResolver(page, recipeImageResponses);

  await page.route('**/api/recipes/pantry', async (route) => {
    requestCount += 1;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(pantryRecipesResponse),
    });
  });

  return {
    getRequestCount: () => requestCount,
    getImageResolverRequestCount: imageResolverRoutes.getRequestCount,
  };
}

async function stubPantryRecipeQuotaRequired(page: Page) {
  let requestCount = 0;

  await page.route('**/api/recipes/pantry', async (route) => {
    requestCount += 1;

    await route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'LINKED_ACCOUNT_REQUIRED',
        message: 'Link Google to keep generating recipes.',
        linkedAccountReason: 'recipe_quota',
      }),
    });
  });

  return {
    getRequestCount: () => requestCount,
  };
}

async function stubLiveCookingProviders(page: Page) {
  let stepsRequestCount = 0;
  let assistanceRequestCount = 0;

  await page.route('**/api/cooking/steps', async (route) => {
    stepsRequestCount += 1;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(cookingStepsResponse),
    });
  });

  await page.route('**/api/cooking/assistance', async (route) => {
    assistanceRequestCount += 1;

    await route.fulfill({
      status: 200,
      contentType: 'text/plain',
      body: 'Provider-light help response from the Playwright harness.',
    });
  });

  await page.route('**/api/speech/synthesize', async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Speech synthesis stubbed in provider-light E2E smoke.' }),
    });
  });

  await page.route('**/api/speech/transcribe', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, transcription: 'How do I know when the rice is warm?' }),
    });
  });

  return {
    getStepsRequestCount: () => stepsRequestCount,
    getAssistanceRequestCount: () => assistanceRequestCount,
  };
}

async function completeGuestSetupToPlanning(page: Page) {
  await page.goto('/');

  await expect(page.getByRole('button', { name: 'Start cooking now' })).toBeVisible();
  await page.getByRole('button', { name: 'Start cooking now' }).click();

  // Setup flow should appear after guest auth completes.
  await expect(page.getByRole('button', { name: 'Get started' })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Get started' }).click();

  await expect(page.getByRole('heading', { name: 'Start with pantry staples.' })).toBeVisible();
  await page.getByRole('button', { name: 'Enter manually' }).click();
  await page.getByLabel('Pantry items').fill('rice, eggs, soy sauce');
  await page.getByRole('button', { name: 'Save ingredients' }).click();
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(page.getByRole('heading', { name: 'Any kitchen tools to add?' })).toBeVisible();
  await page.getByRole('button', { name: 'Skip tools' }).click();

  await expect(page.getByRole('heading', { name: 'How comfortable are you with cooking?' })).toBeVisible();
  await page.getByRole('radio', { name: 'Beginner' }).click();

  await expect(page.getByRole('heading', { name: 'Anything I should avoid?' })).toBeVisible();
  await page.getByRole('button', { name: 'No restrictions' }).click();
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(page.getByRole('heading', { name: 'You are ready.' })).toBeVisible();
  await page.getByRole('button', { name: 'Finish setup' }).click();

  // Planning choice is the first "post-setup" stable UI surface.
  await expect(page.getByRole('heading', { name: 'What are we cooking today?' })).toBeVisible();
}

async function completeChefItUpToStapleSelection(page: Page) {
  await completeGuestSetupToPlanning(page);
  await page.getByRole('button', { name: 'Chef It Up' }).click();

  await expect(page.getByRole('heading', { name: 'How much time do you have today?' })).toBeVisible();
  await page.getByRole('button', { name: '1hr' }).click();
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(page.getByRole('heading', { name: 'What sounds good?' })).toBeVisible();
  await page.getByRole('button', { name: /Mexican/ }).click();
  await page.getByRole('button', { name: 'View recipe suggestions' }).click();

  await expect(page.getByRole('heading', { name: 'Anything else around?' })).toBeVisible();
  await page.getByRole('button', { name: 'tortillas' }).click();
  await page.getByRole('button', { name: 'lime' }).click();
}

async function completeChefItUpToPrepTray(page: Page) {
  await completeChefItUpToStapleSelection(page);

  const pantryRequestPromise = page.waitForRequest('**/api/recipes/pantry');
  await page.getByRole('button', { name: 'View recipe suggestions' }).click();
  const pantryRequest = await pantryRequestPromise;
  const pantryPayload = pantryRequest.postDataJSON() as {
    ingredients: string[];
    preferences: string;
    timeAvailable: string;
  };

  expect(pantryPayload.ingredients).toEqual(['rice', 'eggs', 'soy sauce', 'tortillas', 'lime']);
  expect(pantryPayload.preferences).toContain('Time available: 1 hour');
  expect(pantryPayload.preferences).toContain('Preferred cuisines: Mexican');
  expect(pantryPayload.preferences).toContain('Confirmed staples: tortillas, lime');
  expect(pantryPayload.preferences).toContain('Unconfirmed staples: cilantro, cumin; do not assume');
  expect(pantryPayload.timeAvailable).toBe('1 hour');

  await expect(page.getByRole('heading', { name: 'Recipe suggestions from your pantry' })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('button', { name: /Soy Rice Breakfast Bowl/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Crispy Egg Tortilla Rice/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Soy Lime Rice Skillet/ })).toBeVisible();

  await page.getByRole('button', { name: 'View prep tray' }).click();

  await expect(page.getByRole('heading', { name: 'Soy Rice Breakfast Bowl' })).toBeVisible();
  await expect(page.getByText('Use these')).toBeVisible();
  await expect(page.getByText('rice', { exact: true })).toBeVisible();
  await expect(page.getByText('tortillas', { exact: true })).toBeVisible();
  await expect(page.getByText('Optional if around')).toBeVisible();
  await expect(page.getByText('cilantro', { exact: true })).toBeVisible();
}

test.describe('Laica Guest E2E Smoke', () => {
  test('Guest can complete setup via manual entry and reach planning choice', async ({ page }) => {
    await completeGuestSetupToPlanning(page);

    await expect(page.getByRole('button', { name: 'Chef It Up' })).toBeVisible();
  });

  test('Guest can request Chef It Up suggestions and open the prep tray with a stubbed AI response', async ({ page }) => {
    const pantryRoutes = await stubPantryRecipes(page);

    await completeChefItUpToPrepTray(page);

    expect(pantryRoutes.getRequestCount()).toBe(1);
  });

  test('Guest sees selected recipe preview imagery only after opening Prep Tray', async ({ page }) => {
    const imageUrl = '/mock/recipe-image-selected.png';
    const pantryRoutes = await stubPantryRecipes(page, [{
      status: 'ready',
      image: {
        imageUrl,
        cacheKey: 'cache-selected',
      },
    }]);

    await completeChefItUpToStapleSelection(page);

    await page.getByRole('button', { name: 'View recipe suggestions' }).click();

    await expect(page.getByRole('heading', { name: 'Recipe suggestions from your pantry' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator('.planning-ticket .planning-recipe-image-slot[data-has-image="true"]')).toHaveCount(0);
    await expect(page.locator('.planning-ticket .planning-recipe-image')).toHaveCount(0);
    expect(pantryRoutes.getImageResolverRequestCount()).toBe(0);

    await page.getByRole('button', { name: 'View prep tray' }).click();

    await expect(page.getByRole('heading', { name: 'Soy Rice Breakfast Bowl' })).toBeVisible();
    const prepHero = page.locator('.planning-prep-hero');
    const prepImageSlot = page.locator('.planning-prep-hero .planning-recipe-image-slot');
    const prepImage = page.locator('.planning-prep-hero .planning-recipe-image');
    await expect(prepHero).toHaveAttribute('data-image-state', 'ready');
    await expect(prepImage).toHaveCount(1);
    await expect(prepImage).toHaveCSS('object-fit', 'cover');
    expect(await prepImage.evaluateAll((images) =>
      images.map((image) => image.getAttribute('src'))
    )).toEqual([imageUrl]);
    const heroBox = await prepHero.boundingBox();
    const imageSlotBox = await prepImageSlot.boundingBox();
    expect(heroBox).not.toBeNull();
    expect(imageSlotBox).not.toBeNull();
    if (!heroBox || !imageSlotBox) throw new Error('Prep Tray preview image bounds were unavailable');
    expect(Math.abs(imageSlotBox.x - heroBox.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(imageSlotBox.y - heroBox.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(imageSlotBox.width - heroBox.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(imageSlotBox.height - heroBox.height)).toBeLessThanOrEqual(1);
    expect(pantryRoutes.getRequestCount()).toBe(1);
    expect(pantryRoutes.getImageResolverRequestCount()).toBe(1);
  });

  test('Guest recipe quota block shows sign-up copy with a forced linked-account response', async ({ page }) => {
    const pantryRoutes = await stubPantryRecipeQuotaRequired(page);

    await completeChefItUpToStapleSelection(page);

    const pantryResponsePromise = page.waitForResponse((response) =>
      response.url().includes('/api/recipes/pantry') && response.status() === 403
    );
    await page.getByRole('button', { name: 'View recipe suggestions' }).click();
    const pantryResponse = await pantryResponsePromise;

    await expect(page.getByText('Sign up to unlock more recipes', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Sign up before making more recipes.', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'View recipe suggestions' })).toBeVisible();

    expect(await pantryResponse.json()).toEqual(expect.objectContaining({
      code: 'LINKED_ACCOUNT_REQUIRED',
      linkedAccountReason: 'recipe_quota',
    }));
    expect(pantryRoutes.getRequestCount()).toBe(1);
  });

  test('Guest can enter live cooking with stubbed steps and use provider-light controls', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
          getUserMedia: async () => {
            throw new DOMException('Microphone permission stubbed in provider-light smoke.', 'NotAllowedError');
          },
        },
      });
    });

    const pantryRoutes = await stubPantryRecipes(page);
    const liveCookingRoutes = await stubLiveCookingProviders(page);

    await completeChefItUpToPrepTray(page);

    await page.getByRole('button', { name: 'Cook this' }).click();
    await expect(page.getByRole('heading', { name: 'Ready to cook?' })).toBeVisible();
    expect(liveCookingRoutes.getStepsRequestCount()).toBe(0);

    const cookingStepsRequestPromise = page.waitForRequest('**/api/cooking/steps');
    await page.getByRole('button', { name: /^start cooking$/i }).click();
    const cookingStepsRequest = await cookingStepsRequestPromise;
    const cookingStepsPayload = cookingStepsRequest.postDataJSON() as {
      recipeName: string;
      ingredients?: string[];
      description?: string;
      acknowledgedMissingIngredients?: string[];
    };

    expect(cookingStepsPayload.recipeName).toBe('Soy Rice Breakfast Bowl');
    expect(cookingStepsPayload.ingredients).toEqual(['rice', 'eggs', 'soy sauce', 'tortillas', 'lime']);
    expect(cookingStepsPayload.description).toBe('A fast bowl built from rice, eggs, soy sauce, tortillas, and lime.');
    expect(cookingStepsPayload.acknowledgedMissingIngredients).toEqual(['cilantro']);

    await expect(page.getByText('Live Cooking', { exact: true })).toBeVisible();
    await expect(page.getByText('Step 1 of 3')).toBeVisible();
    await expect(page.getByTestId('step-guidance-panel')).toBeVisible();
    await expect(page.getByTestId('step-preview-strip')).toContainText('Warm Rice Skillet');
    await expect(page.getByText('Warm the rice in a skillet until steamy.', { exact: true })).toBeVisible();
    await expect(page.getByText('Steam rises and the rice separates easily.')).toBeVisible();
    await expect(page.getByText('Stir once so the grains loosen without drying out.')).toBeVisible();
    await expect(page.getByTestId('transcription-box')).toHaveCount(0);
    await page.getByRole('button', { name: 'Show captions' }).click();
    await expect(page.getByTestId('transcription-box')).toBeVisible();

    await expect(page.getByRole('button', { name: 'Previous' })).toBeDisabled();
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('Step 2 of 3')).toBeVisible();
    await expect(page.getByText('Scramble the eggs until soft curds form.', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Previous' }).click();
    await expect(page.getByText('Step 1 of 3')).toBeVisible();
    await expect(page.getByText('Warm the rice in a skillet until steamy.', { exact: true })).toBeVisible();

    await expect(page.getByTestId('live-cooking-timer')).toContainText('0:02:00');
    await page.getByRole('button', { name: 'Start 2 min timer' }).click();
    await expect(page.getByTestId('live-cooking-timer')).toContainText(/0:0[12]:[0-5][0-9]/);
    await expect(page.getByText("Timer set for 2 minutes. I'll let you know when time is up!")).toBeVisible();
    await page.getByRole('button', { name: 'Pause timer' }).click();
    await expect(page.getByRole('button', { name: 'Resume timer' })).toBeVisible();

    await page.getByRole('button', { name: 'Ask a question' }).click();
    await expect(page.getByTestId('assistance-status-issue')).toContainText("Microphone didn't start");
    await expect(page.getByTestId('assistance-status-issue')).toContainText('The cooking guide is unchanged.');
    await expect(page.getByTestId('step-guidance-panel')).not.toContainText("Microphone didn't start");
    await expect(page.getByRole('button', { name: 'Ask a question' })).toBeVisible();

    expect(pantryRoutes.getRequestCount()).toBe(1);
    expect(liveCookingRoutes.getStepsRequestCount()).toBe(1);
    expect(liveCookingRoutes.getAssistanceRequestCount()).toBe(0);
  });
});
