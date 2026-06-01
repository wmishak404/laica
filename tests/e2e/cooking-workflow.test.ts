import { test, expect, type Page } from '@playwright/test';

/**
 * End-to-End Smoke Tests (Guest Lane)
 *
 * Why guest lane:
 * - Avoids brittle Google popup OAuth automation.
 * - Still exercises the real client auth contract (Firebase anonymous session).
 * - Lets us validate end-to-end UI state transitions without hitting paid providers by default.
 */

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

  await expect(page.getByRole('heading', { name: 'Tell me what tools you use.' })).toBeVisible();
  await page.getByRole('button', { name: 'Skip for now' }).click();

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

test.describe('Laica Guest E2E Smoke', () => {
  test('Guest can complete setup via manual entry and reach planning choice', async ({ page }) => {
    await completeGuestSetupToPlanning(page);

    await expect(page.getByRole('button', { name: 'Chef It Up' })).toBeVisible();
  });

  test('Guest can request Chef It Up suggestions and open the prep tray with a stubbed AI response', async ({ page }) => {
    let pantryRequestCount = 0;

    await page.route('**/api/recipes/pantry', async (route) => {
      pantryRequestCount += 1;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
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
        }),
      });
    });

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
    expect(pantryRequestCount).toBe(1);
    await expect(page.getByRole('button', { name: /Soy Rice Breakfast Bowl/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Crispy Egg Tortilla Rice/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Soy Lime Rice Skillet/ })).toBeVisible();

    await page.getByRole('button', { name: 'View prep tray' }).click();

    await expect(page.getByRole('heading', { name: 'Soy Rice Breakfast Bowl' })).toBeVisible();
    await expect(page.getByText('Use these')).toBeVisible();
    await expect(page.getByText('rice')).toBeVisible();
    await expect(page.getByText('tortillas')).toBeVisible();
    await expect(page.getByText('Optional if around')).toBeVisible();
    await expect(page.getByText('cilantro')).toBeVisible();
  });
});
