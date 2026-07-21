import { expect, type Locator, type Page } from '@playwright/test';

export type InventoryViewport = {
  width: 390 | 412;
  height: 844 | 915;
};

type InventorySection = 'Pantry' | 'Tools';

async function expectCenterPointOwnedBy(locator: Locator) {
  await expect(locator).toBeVisible();
  const evidence = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const hit = document.elementFromPoint(centerX, centerY);

    return {
      height: rect.height,
      hitIsOwned: hit === element || element.contains(hit),
    };
  });

  expect(evidence.height).toBeGreaterThanOrEqual(44);
  expect(evidence.hitIsOwned).toBe(true);
}

export async function expectInventoryActionDockLayout(
  page: Page,
  section: InventorySection,
  viewport: InventoryViewport,
) {
  await page.setViewportSize(viewport);

  const scroll = page.getByTestId('returning-inventory-scroll');
  const dock = page.getByTestId('returning-inventory-actions');
  const nav = page.locator('.app-bottom-nav');
  const cameraToggle = page.getByRole('button', {
    name: new RegExp(`^(Turn on|Turn off) ${section.toLowerCase()} camera$`),
  });
  const upload = page.getByRole('button', { name: 'Upload photos' });
  const manual = page.getByRole('button', { name: 'Enter manually' });
  const settings = dock.getByRole('button', { name: 'Settings' });
  const save = dock.getByRole('button', { name: new RegExp(`^Save ${section.toLowerCase()}`) });

  await expect(scroll).toBeVisible();
  await expect(dock).toBeVisible();
  await expect(nav).toBeVisible();

  const geometry = await page.evaluate(() => {
    const scrollElement = document.querySelector<HTMLElement>('[data-testid="returning-inventory-scroll"]');
    const dockElement = document.querySelector<HTMLElement>('[data-testid="returning-inventory-actions"]');
    const navElement = document.querySelector<HTMLElement>('.app-bottom-nav');
    if (!scrollElement || !dockElement || !navElement) return null;

    const scrollRect = scrollElement.getBoundingClientRect();
    const dockRect = dockElement.getBoundingClientRect();
    const navRect = navElement.getBoundingClientRect();
    const dockStyle = getComputedStyle(dockElement);
    const scrollStyle = getComputedStyle(scrollElement);

    return {
      scrollBottom: scrollRect.bottom,
      dockTop: dockRect.top,
      dockBottom: dockRect.bottom,
      navTop: navRect.top,
      dockLeft: dockRect.left,
      dockRight: dockRect.right,
      viewportWidth: window.innerWidth,
      dockIsPageChild: dockElement.parentElement?.matches('main.returning-ui-inventory') ?? false,
      dockPosition: dockStyle.position,
      dockBackgroundColor: dockStyle.backgroundColor,
      dockBackgroundImage: dockStyle.backgroundImage,
      scrollOverflowY: scrollStyle.overflowY,
      scrollHasOverflow: scrollElement.scrollHeight > scrollElement.clientHeight,
    };
  });

  expect(geometry).not.toBeNull();
  if (!geometry) throw new Error('Inventory dock geometry was unavailable');
  expect(geometry.scrollBottom).toBeLessThanOrEqual(geometry.dockTop + 1);
  expect(Math.abs(geometry.dockBottom - geometry.navTop)).toBeLessThanOrEqual(1);
  expect(Math.abs(geometry.dockLeft)).toBeLessThanOrEqual(1);
  expect(Math.abs(geometry.dockRight - geometry.viewportWidth)).toBeLessThanOrEqual(1);
  expect(geometry.dockIsPageChild).toBe(true);
  expect(geometry.dockPosition).toBe('relative');
  expect(geometry.dockBackgroundColor).not.toMatch(/rgba\([^)]*,\s*0(?:\.0+)?\)$/);
  expect(geometry.dockBackgroundImage).not.toBe('none');
  expect(geometry.scrollOverflowY).toBe('auto');
  expect(geometry.scrollHasOverflow).toBe(true);

  await cameraToggle.scrollIntoViewIfNeeded();
  await expectCenterPointOwnedBy(cameraToggle);
  await upload.scrollIntoViewIfNeeded();
  await expectCenterPointOwnedBy(upload);
  await manual.scrollIntoViewIfNeeded();
  await expectCenterPointOwnedBy(manual);
  await expectCenterPointOwnedBy(settings);
  await expectCenterPointOwnedBy(save);
}

export async function expectFocusedManualEntryViewportClearance(
  page: Page,
  inputName: 'Pantry items' | 'Tools',
  viewport: InventoryViewport,
) {
  const input = page.getByRole('textbox', { name: inputName });
  await input.focus();
  await page.setViewportSize({ width: viewport.width, height: viewport.height - 280 });
  await input.scrollIntoViewIfNeeded();

  const evidence = await input.evaluate((element) => {
    const inputRect = element.getBoundingClientRect();
    const dock = document.querySelector<HTMLElement>('[data-testid="returning-inventory-actions"]');
    const nav = document.querySelector<HTMLElement>('.app-bottom-nav');
    if (!dock || !nav) return null;
    const dockRect = dock.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();
    const centerHit = document.elementFromPoint(
      inputRect.left + inputRect.width / 2,
      inputRect.top + inputRect.height / 2,
    );

    return {
      inputBottom: inputRect.bottom,
      dockTop: dockRect.top,
      dockBottom: dockRect.bottom,
      navTop: navRect.top,
      hitIsOwned: centerHit === element || element.contains(centerHit),
    };
  });

  expect(evidence).not.toBeNull();
  if (!evidence) throw new Error('Focused manual-entry geometry was unavailable');
  expect(evidence.inputBottom).toBeLessThanOrEqual(evidence.dockTop + 1);
  expect(Math.abs(evidence.dockBottom - evidence.navTop)).toBeLessThanOrEqual(1);
  expect(evidence.hitIsOwned).toBe(true);

  await page.setViewportSize(viewport);
}
