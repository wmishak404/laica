import { test, expect } from '@playwright/test';

/**
 * End-to-End Smoke Tests (Guest Lane)
 *
 * Why guest lane:
 * - Avoids brittle Google popup OAuth automation.
 * - Still exercises the real client auth contract (Firebase anonymous session).
 * - Lets us validate end-to-end UI state transitions without hitting paid providers by default.
 */

test.describe('Laica Guest E2E Smoke', () => {
  test('Guest can complete setup via manual entry and reach planning choice', async ({ page }) => {
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
    await expect(page.getByRole('button', { name: 'Chef It Up' })).toBeVisible();
  });
});
