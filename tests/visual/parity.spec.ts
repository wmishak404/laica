import { expect, test } from '@playwright/test';
import { capture, installFixtures, recipeName, settled } from './fixtures';
import { expectInventoryActionDockLayout } from '../e2e/helpers/inventory-action-dock';

test('Actual App returning Settings and Feedback retain mobile layout', async ({ page }, info) => {
  const fixtures = await installFixtures(page);
  try {
    await page.goto('/');
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await capture(page, info, 'menu-drawer', {
      sheet: page.locator('.menu-sheet'), title: page.getByRole('heading', { name: 'Menu', exact: true }),
    });
    await page.getByRole('button', { name: /^Settings/ }).click();
    await capture(page, info, 'settings-hub', {
      heading: page.getByRole('heading', { name: 'Keep Laica matched to your kitchen.', exact: true }),
      inventory: page.getByRole('button', { name: /Kitchen Inventory/ }),
    });
    await page.getByRole('button', { name: /Kitchen Inventory/ }).click();
    await expectInventoryActionDockLayout(page, 'Pantry', page.viewportSize() as { width: 390 | 412; height: 844 | 915 });
    await capture(page, info, 'settings-pantry', {
      heading: page.getByRole('heading', { name: 'Pantry', exact: true }),
      dock: page.getByTestId('returning-inventory-actions'),
    });
    await page.getByTestId('returning-inventory-actions').getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByRole('button', { name: /Cooking Profile/ }).click();
    const noRestrictions = page.getByRole('button', { name: /^No restrictions/ });
    await noRestrictions.scrollIntoViewIfNeeded();
    await capture(page, info, 'settings-profile-diet', {
      profile: page.locator('.returning-profile-panel'),
      heading: page.getByRole('heading', { name: 'How Laica adapts.', exact: true }),
      noRestrictions, choices: noRestrictions.locator('..'),
    });
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await page.getByRole('button', { name: /^Feedback/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Feedback', exact: true });
    await settled(page);
    const center = await dialog.evaluate(element => {
      const box = element.getBoundingClientRect();
      return { x: box.x + box.width / 2, y: box.y + box.height / 2, w: innerWidth, h: innerHeight };
    });
    expect(Math.abs(center.x - center.w / 2)).toBeLessThanOrEqual(1);
    expect(Math.abs(center.y - center.h / 2)).toBeLessThanOrEqual(1);
    const input = dialog.getByPlaceholder('Share your thoughts, suggestions, or report any issues...');
    await input.fill('Synthetic visual fixture feedback');
    await input.focus();
    await capture(page, info, 'feedback-dialog-focus', { dialog, input, cancel: dialog.getByRole('button', { name: 'Cancel', exact: true }) });
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  } finally { await fixtures.assertAndSave(info); }
});

test('Existing primitives retain dark focus, disabled, Select, and Switch styling', async ({ page }, info) => {
  const fixtures = await installFixtures(page, 'linked', true);
  try {
    await page.goto('/__visual-components');
    const input = page.getByLabel('Fixture input', { exact: true });
    await input.fill('Synthetic focus text');
    await input.focus();
    await capture(page, info, 'primitives-dark-focus', {
      heading: page.getByRole('heading', { name: 'Existing primitives fixture', exact: true }),
      label: page.locator('label[for="fixture-input"]'),
      input, outline: page.getByRole('button', { name: 'Outline button', exact: true }),
      disabled: page.getByRole('button', { name: 'Disabled button', exact: true }),
      select: page.getByRole('combobox', { name: 'Fixture choice', exact: true }),
    });
    await page.getByRole('combobox', { name: 'Fixture choice', exact: true }).click();
    await capture(page, info, 'primitives-select-open', {
      listbox: page.getByRole('listbox'), option: page.getByRole('option', { name: 'Second choice', exact: true }),
    });
    await page.getByRole('option', { name: 'Second choice', exact: true }).click();
    await page.getByRole('switch', { name: 'Fixture switch', exact: true }).click();
    await expect(page.getByRole('switch', { name: 'Fixture switch', exact: true })).toBeChecked();
    await capture(page, info, 'primitives-selected', {
      select: page.getByRole('combobox', { name: 'Fixture choice', exact: true }),
      toggle: page.getByRole('switch', { name: 'Fixture switch', exact: true }),
    });
  } finally { await fixtures.assertAndSave(info); }
});

test('Actual App guest setup, planning, ReadyCheck, timer and Ask retain mobile layout', async ({ page }, info) => {
  const fixtures = await installFixtures(page, 'signed-out');
  try {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start cooking now', exact: true }).click();
    await page.getByRole('button', { name: 'Get started', exact: true }).click();
    await page.getByRole('button', { name: 'Enter manually', exact: true }).click();
    const pantry = page.getByLabel('Pantry items', { exact: true });
    await pantry.fill('rice, eggs, soy sauce');
    await pantry.scrollIntoViewIfNeeded();
    await pantry.focus();
    await capture(page, info, 'setup-pantry-focus', {
      frame: page.locator('.setup-phone-frame'),
      heading: page.getByRole('heading', { name: 'Start with pantry staples.', exact: true }), pantry,
      save: page.getByRole('button', { name: 'Save ingredients', exact: true }),
    });
    await page.getByRole('button', { name: 'Save ingredients', exact: true }).click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('button', { name: 'Skip tools', exact: true }).click();
    await page.getByRole('radio', { name: /Beginner/ }).click();
    await capture(page, info, 'setup-skill-selected', {
      heading: page.getByRole('heading', { name: 'How comfortable are you with cooking?', exact: true }),
      selected: page.getByRole('radio', { name: /Beginner/ }),
      next: page.getByRole('button', { name: 'Next', exact: true }),
    });
    expect(await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)).toBeLessThanOrEqual(1);
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('button', { name: /^No restrictions/ }).click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await capture(page, info, 'setup-confirmation', {
      heading: page.getByRole('heading', { name: 'You are ready.', exact: true }),
      finish: page.getByRole('button', { name: 'Finish setup', exact: true }),
    });
    await page.getByRole('button', { name: 'Finish setup', exact: true }).click();
    await page.getByRole('button', { name: /Chef It Up/ }).click();
    await capture(page, info, 'planning-time', {
      heading: page.getByRole('heading', { name: 'How much time do you have today?', exact: true }),
      clock: page.locator('.planning-clock'), slider: page.locator('.planning-slider-card'),
      dock: page.locator('.planning-action-dock'),
    });
    await page.getByRole('button', { name: '1hr', exact: true }).click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('button', { name: /Mexican/ }).click();
    await capture(page, info, 'planning-cuisine-selected', {
      heading: page.getByRole('heading', { name: 'What sounds good?', exact: true }),
      selected: page.getByRole('button', { name: /Mexican/ }),
    });
    await page.getByRole('button', { name: 'View recipe suggestions', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Anything else around?', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'tortillas', exact: true }).click();
    await page.getByRole('button', { name: 'lime', exact: true }).click();
    await page.getByRole('button', { name: 'View recipe suggestions', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Recipe suggestions', exact: true })).toBeVisible();
    await capture(page, info, 'planning-ticket-pass', {
      ticket: page.locator('.planning-ticket-large'), row: page.locator('.planning-ticket-row').first(),
      prep: page.getByRole('button', { name: 'View prep tray', exact: true }),
    });
    await page.getByRole('button', { name: 'View prep tray', exact: true }).click();
    await capture(page, info, 'planning-prep-tray', {
      hero: page.locator('.planning-prep-hero'), heading: page.getByRole('heading', { name: recipeName, exact: true }),
      cook: page.getByRole('button', { name: 'Cook this', exact: true }),
    });
    await page.getByRole('button', { name: 'Cook this', exact: true }).click();
    await capture(page, info, 'ready-check', {
      panel: page.locator('.live-cooking-ready-check-panel'),
      list: page.locator('.live-cooking-ready-list'),
      heading: page.getByRole('heading', { name: 'Ready to cook?', exact: true }),
      start: page.getByRole('button', { name: 'Start cooking', exact: true }),
    });
    expect(fixtures.requests.filter(request => request.path === '/api/cooking/steps')).toHaveLength(0);
    await page.getByRole('button', { name: 'Start cooking', exact: true }).click();
    await page.getByRole('button', { name: 'Start 2 min timer', exact: true }).click();
    await page.getByRole('button', { name: 'Pause timer', exact: true }).click();
    await page.getByRole('button', { name: 'Show captions', exact: true }).click();
    await capture(page, info, 'live-cooking-paused', {
      step: page.getByTestId('current-step-panel'), timer: page.getByTestId('live-cooking-timer'),
      guide: page.getByTestId('step-guidance-panel'), ask: page.getByRole('button', { name: 'Ask a question', exact: true }),
    });
    await page.getByRole('button', { name: 'Ask a question', exact: true }).click();
    await expect(page.getByTestId('assistance-status-issue')).toContainText("Microphone didn't start");
    await expect(page.getByRole('button', { name: 'Resume timer', exact: true })).toBeVisible();
    await expect(page.getByTestId('step-guidance-panel')).not.toContainText("Microphone didn't start");
    await capture(page, info, 'live-cooking-ask-failure', {
      issue: page.getByTestId('assistance-status-issue'), guide: page.getByTestId('step-guidance-panel'),
      ask: page.getByRole('button', { name: 'Ask a question', exact: true }),
    });
  } finally { await fixtures.assertAndSave(info); }
});
