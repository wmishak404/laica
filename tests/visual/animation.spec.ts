import { expect, test, type Locator } from '@playwright/test';
import { installFixtures, settled } from './fixtures';

test.use({ reducedMotion: 'no-preference' });

// Check rendered animation composition, rather than only utility-name strings.
async function animationFrame(locator: Locator, progress: number) {
  return locator.evaluate((element, progress) => {
    // Replay the component's actual CSS animation to remove click/worker timing.
    const node = element as HTMLElement;
    const original = node.style.animation;
    node.style.animation = 'none';
    void getComputedStyle(node).animationName;
    node.style.animation = original;
    const animation = element.getAnimations().find(item => item.effect?.target === element);
    if (!animation) throw new Error('Expected a CSS entry/exit animation on the component');
    const duration = Number(animation.effect!.getComputedTiming().duration);
    animation.pause();
    animation.currentTime = duration * progress;
    const css = getComputedStyle(element);
    const matrix = new DOMMatrixReadOnly(css.transform);
    const box = element.getBoundingClientRect();
    return { translate: css.translate, x: matrix.m41, y: matrix.m42,
      width: (element as HTMLElement).offsetWidth, height: (element as HTMLElement).offsetHeight,
      centerX: box.x + box.width / 2, centerY: box.y + box.height / 2,
      viewportWidth: innerWidth, viewportHeight: innerHeight, duration, cssDuration: css.animationDuration, className: element.className, inlineStyle: element.getAttribute("style") };
  }, progress);
}

test('Feedback dialog keeps legacy entry centering and its settled position', async ({ page }, info) => {
  const fixtures = await installFixtures(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: /^Feedback/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Feedback', exact: true });
  await expect(dialog).toBeVisible();
  const start = await animationFrame(dialog, 0);
  expect(start.translate).toBe('none');
  expect(Math.abs(start.x + start.width / 2)).toBeLessThanOrEqual(1);
  expect(Math.abs(start.y + start.height * 0.48)).toBeLessThanOrEqual(1);
  expect(start.duration).toBe(150);
  await settled(page);
  const center = await dialog.evaluate(element => {
    const box = element.getBoundingClientRect();
    return { x: box.x + box.width / 2, y: box.y + box.height / 2, width: innerWidth, height: innerHeight };
  });
  expect(Math.abs(center.x - center.width / 2)).toBeLessThanOrEqual(1);
  expect(Math.abs(center.y - center.height / 2)).toBeLessThanOrEqual(1);
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(dialog).toBeHidden();
  await fixtures.assertAndSave(info);
});

test('Select popper offsets do not add to transform entry frames', async ({ page }, info) => {
  const fixtures = await installFixtures(page);
  await page.goto('/__visual-components');
  await page.getByRole('combobox', { name: 'Fixture choice', exact: true }).click();
  const listbox = page.getByRole('listbox');
  await expect(listbox).toBeVisible();
  const side = await listbox.getAttribute('data-side');
  const start = await animationFrame(listbox, 0);
  expect(start.translate).toBe('none');
  const expected = side === 'bottom' ? { x: 0, y: -8 }
    : side === 'top' ? { x: 0, y: 8 }
    : side === 'left' ? { x: 8, y: 0 } : { x: -8, y: 0 };
  expect(Math.abs(start.x - expected.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(start.y - expected.y)).toBeLessThanOrEqual(1);
  await settled(page);
  await page.getByRole('option', { name: 'Second choice', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Fixture choice' })).toContainText('Second choice');
  await fixtures.assertAndSave(info);
});

for (const direction of ['left', 'up'] as const) {
  test(`Toast ${direction} swipe keeps one transform and dismisses`, async ({ page }, info) => {
    const fixtures = await installFixtures(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await page.getByRole('button', { name: /^Feedback/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Feedback', exact: true });
    await dialog.getByPlaceholder('Share your thoughts, suggestions, or report any issues...').fill('Synthetic animation fixture');
    await dialog.getByRole('button', { name: 'Submit', exact: true }).click();
    const toast = page.locator('li').filter({ hasText: 'Feedback received!' });
    await expect(toast).toBeVisible();
    await settled(page);
    const close = toast.locator('[toast-close]');
    await close.focus();
    await expect(close).toBeFocused();
    await settled(page);
    const ring = await close.evaluate(element => {
      const css = getComputedStyle(element);
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const context = canvas.getContext('2d')!;
      const rgba = (color: string) => {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        return Array.from(context.getImageData(0, 0, 1, 1).data);
      };
      return { actual: rgba(css.getPropertyValue('--tw-ring-color').trim()),
        legacy: rgba('rgb(59 130 246 / 0.5)'), shadow: css.boxShadow };
    });
    expect(ring.actual).toEqual(ring.legacy);
    expect(ring.shadow).not.toBe('none');
    await settled(page);
    const box = await toast.boundingBox();
    if (!box) throw new Error('Expected visible toast bounds');
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(direction === 'left' ? x - 80 : x, direction === 'up' ? y - 80 : y, { steps: 5 });
    const move = await toast.evaluate(element => {
      const css = getComputedStyle(element);
      const matrix = new DOMMatrixReadOnly(css.transform);
      return { translate: css.translate, x: matrix.m41, y: matrix.m42, swipe: element.getAttribute('data-swipe') };
    });
    expect(move.swipe).toBe('move');
    expect(move.translate).toBe('none');
    expect(Math.abs(move.x - (direction === 'left' ? -80 : 0))).toBeLessThanOrEqual(1);
    expect(Math.abs(move.y - (direction === 'up' ? -80 : 0))).toBeLessThanOrEqual(1);
    await page.mouse.up();
    const exit = await animationFrame(toast, 0.5);
    expect(exit.translate).toBe('none');
    await info.attach('rendered-toast-swipe', { contentType: 'application/json', body: Buffer.from(JSON.stringify({ fixture: true, direction, move, exit })) });
    await settled(page);
    await expect(toast).toBeHidden();
    await fixtures.assertAndSave(info);
  });
}
