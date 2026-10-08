import { expect, type Locator, type Page, type TestInfo } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

export const recipeName = 'Soy Rice Breakfast Bowl';
const recipes = { recipes: [
  { recipeName, description: 'A fast bowl built from rice, eggs, soy sauce, tortillas, and lime.',
    cookTime: 25, difficulty: 'Easy', cuisine: 'Mexican-inspired', pantryMatch: 95,
    pantryIngredientsUsed: ['rice', 'eggs', 'soy sauce', 'tortillas', 'lime'], additionalIngredientsNeeded: ['cilantro'] },
  { recipeName: 'Crispy Egg Tortilla Rice', description: 'Crisped rice and eggs in warm tortillas.',
    cookTime: 30, difficulty: 'Easy', cuisine: 'Mexican-inspired', pantryMatch: 88,
    pantryIngredientsUsed: ['rice', 'eggs', 'tortillas'], additionalIngredientsNeeded: ['hot sauce'] },
  { recipeName: 'Soy Lime Rice Skillet', description: 'A skillet dinner with soy sauce and lime.',
    cookTime: 35, difficulty: 'Medium', cuisine: 'Pantry-first', pantryMatch: 82,
    pantryIngredientsUsed: ['rice', 'soy sauce', 'lime'], additionalIngredientsNeeded: ['green onion'] },
] };
const steps = { steps: [
  { instruction: 'Warm the rice in a skillet until steamy.', duration: 120,
    tips: 'Stir once so the grains loosen without drying out.', visualCues: 'Steam rises and the rice separates easily.',
    commonMistakes: 'Cranking the heat too high.', safetyLevel: 'minor' },
  { instruction: 'Scramble the eggs until soft curds form.', duration: 180,
    tips: 'Pull the pan from heat while the eggs look glossy.', visualCues: 'Curds are soft and slightly shiny.', safetyLevel: 'important' },
  { instruction: 'Fold rice and eggs into warm tortillas with lime.', tips: 'Keep the filling centered.', safetyLevel: 'minor' },
], recipe: { ingredients: [
  { name: 'rice', quantity: '1 cup', forSteps: [1, 3] }, { name: 'eggs', quantity: '2', forSteps: [2, 3] },
  { name: 'tortillas', quantity: '2', forSteps: [3] }, { name: 'lime', quantity: '1 wedge', forSteps: [3] },
] } };

export async function installFixtures(page: Page, mode: 'linked' | 'guest' | 'signed-out' = 'linked', dark = false) {
  const unknownRequests: string[] = [];
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const expectedConsoleErrors: string[] = [];
  const requests: Array<{ method: string; path: string; status: number }> = [];
  let active: Record<string, unknown> | null = null;
  const profile = {
    id: 'visual-fixture-user', email: 'visual@example.test', firstName: 'Fixture', lastName: 'Cook',
    authProvider: 'google', firebaseUid: 'visual-fixture-user',
    cookingSkill: 'Beginner', dietaryRestrictions: ['No restrictions'],
    pantryIngredients: ['rice', 'eggs', 'soy sauce', 'tortillas', 'lime', ...Array.from({ length: 18 }, (_, i) => `pantry item ${i + 1}`)],
    kitchenEquipment: ['skillet', 'knife', 'board', ...Array.from({ length: 15 }, (_, i) => `kitchen tool ${i + 1}`)],
    favoriteChefs: [],
  };
  const history = [{ id: 101, userId: profile.id, recipeName: 'Miso Eggs', recipeDescription: 'A quick skillet dinner.',
    recipeSnapshot: { recipeName: 'Miso Eggs', description: 'Jammy eggs with miso butter.', cookTime: 18,
      difficulty: 'Easy', cuisine: 'Japanese', missingIngredients: ['scallions'],
      ingredients: [{ name: 'eggs', quantity: '2' }, { name: 'miso butter' }],
      steps: [{ instruction: 'Warm the pan and melt the miso butter.' }, { instruction: 'Fold in the eggs until just set.' }] },
    ingredientsUsed: ['eggs', 'miso butter'], totalSteps: 2, completedSteps: 2, completed: true,
    startedAt: '2026-10-07T18:30:00Z', completedAt: '2026-10-07T18:50:00Z', cookingDuration: 20,
    ingredientsRemaining: [], userRating: null, userNotes: null }];

  await page.addInitScript(({ mode, dark }) => {
    (window as any).__LAICA_VISUAL_AUTH_MODE__ = mode;
    localStorage.setItem('vite-ui-theme', dark ? 'dark' : 'light');
    Math.random = () => 0.1;
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: {
      getUserMedia: async () => { throw new DOMException('Synthetic microphone permission denied.', 'NotAllowedError'); },
    } });
  }, { mode, dark });

  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (/Error starting recording|Error recording|Microphone|Synthetic microphone|Speech synthesis|synthesiz|ElevenLabs|audio playback|Audio playback|503 \(Service Unavailable\)/i.test(text)) {
      expectedConsoleErrors.push(text);
    } else consoleErrors.push(text);
  });

  await page.route('**/api/**', async route => {
    const pathname = new URL(route.request().url()).pathname;
    const method = route.request().method();
    let body: unknown;
    let status = 200;
    let contentType = 'application/json';
    const currentMode = await page.evaluate(() => (window as any).__LAICA_VISUAL_AUTH_MODE__);
    const user = currentMode === 'guest'
      ? { id: profile.id, firebaseUid: profile.id, email: null, firstName: null, lastName: null, isAnonymous: true, authProvider: 'anonymous' }
      : profile;
    if (pathname === '/api/auth/session') body = { authMode: currentMode, user };
    else if (pathname === '/api/auth/google' || pathname === '/api/auth/user') body = user;
    else if (pathname === '/api/user/profile') {
      if (method === 'PUT') Object.assign(profile, route.request().postDataJSON());
      body = { user: profile, settings: null, recentSessions: history };
    } else if (pathname === '/api/cooking/sessions') body = history;
    else if (pathname === '/api/cooking/session/active') body = active;
    else if (pathname === '/api/cooking/session/start') {
      active = { id: 202, userId: profile.id, ...route.request().postDataJSON(), completed: false };
      body = active;
    } else if (/^\/api\/cooking\/session\/\d+(?:\/complete)?$/.test(pathname)) {
      active = { ...active, ...route.request().postDataJSON() }; body = active;
    } else if (pathname === '/api/recipes/pantry') body = recipes;
    else if (pathname === '/api/recipe-images/selected/resolve') body = { status: 'unavailable' };
    else if (pathname === '/api/cooking/steps') body = steps;
    else if (pathname === '/api/cooking/assistance') { body = 'Synthetic advice for visual fixture.'; contentType = 'text/plain'; }
    else if (pathname === '/api/speech/synthesize') { status = 503; body = { message: 'Synthetic speech-disabled fixture.' }; }
    else if (pathname === '/api/speech/voices') body = { cookingVoices: [], allVoices: [] };
    else if (pathname === '/api/cooking/actions/capabilities') body = { version: 1, capabilities: [] };
    else if (pathname === '/api/feedback') body = { success: true };
    else if (pathname === '/api/grocery/list') body = { categories: [
      { name: 'Produce', items: [{ name: 'Scallions', price: '$2.00' }, { name: 'Lime', price: '$1.00' }] },
      { name: 'Dairy', items: [{ name: 'Eggs', price: '$3.00' }] },
    ] };
    else { unknownRequests.push(`${method} ${pathname}`); await route.abort('blockedbyclient'); return; }
    requests.push({ method, path: pathname, status });
    await route.fulfill({ status, contentType, body: contentType === 'application/json' ? JSON.stringify(body) : String(body) });
  });

  // Fonts are the only external resources allowed by this synthetic lane.
  await page.route(/https?:\/\/(?!127\.0\.0\.1(?::\d+)?\/|localhost(?::\d+)?\/).*/, async route => {
    const host = new URL(route.request().url()).hostname;
    if (host === 'fonts.googleapis.com' || host === 'fonts.gstatic.com') await route.continue();
    else { unknownRequests.push(`external ${host}`); await route.abort('blockedbyclient'); }
  });

  return {
    requests,
    async assertAndSave(testInfo: TestInfo) {
      await testInfo.attach('synthetic-service-request-evidence', { contentType: 'application/json',
        body: Buffer.from(JSON.stringify({ fixture: true, requests, unknownRequests, pageErrors, consoleErrors, expectedConsoleErrors }, null, 2)) });
      expect(unknownRequests, 'All APIs and non-font external requests must be intercepted').toEqual([]);
      expect(pageErrors, 'Unexpected browser exceptions').toEqual([]);
      expect(consoleErrors, 'Unexpected browser console errors').toEqual([]);
    },
  };
}

export async function settled(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    // Newly mounted/hovered nodes can start transitions during the next paint.
    // Drain those frames before sampling; do not compare an intermediate alpha.
    for (let frame = 0; frame < 3; frame++) {
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      for (const animation of document.getAnimations()) {
        if (animation.effect?.getComputedTiming().iterations === Infinity) animation.cancel();
        else { try { animation.finish(); } catch { animation.cancel(); } }
      }
    }
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
}

export async function expectHitTarget(locator: Locator, minimum = 44) {
  await locator.scrollIntoViewIfNeeded();
  const evidence = await locator.evaluate(element => {
    const rect = element.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return { width: rect.width, height: rect.height, owned: hit === element || element.contains(hit) };
  });
  expect(evidence.height).toBeGreaterThanOrEqual(minimum);
  expect(evidence.width).toBeGreaterThanOrEqual(minimum);
  expect(evidence.owned).toBe(true);
}

export async function capture(page: Page, testInfo: TestInfo, screen: string, probes: Record<string, Locator>) {
  // Mobile journeys use mouse-backed Playwright clicks; remove their synthetic
  // persistent hover before sampling the touch layout.
  await page.mouse.move(0, 0);
  // Transient journey notifications are exercised separately by the motion lane.
  // Dismiss through the real Close controls, so screenshots do not race expiry.
  for (const close of await page.locator('[toast-close]').all()) {
    if (await close.isVisible()) await close.click();
  }
  await settled(page);
  const probeEvidence: Record<string, unknown> = {};
  for (const [name, locator] of Object.entries(probes)) {
    await expect(locator).toBeVisible();
    probeEvidence[name] = await locator.evaluate(element => {
      const rect = element.getBoundingClientRect();
      const css = getComputedStyle(element);
      const properties = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'display', 'position',
        'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'marginTop', 'marginBottom', 'gap', 'rowGap', 'columnGap',
        'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderTopLeftRadius',
        'backgroundImage', 'boxShadow', 'outlineWidth', 'outlineStyle', 'transform', 'translate', 'overflowX', 'overflowY'] as const;
      const style = Object.fromEntries(properties.map(property => [property, css[property]]));
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const context = canvas.getContext('2d')!;
      const colors = Object.fromEntries(['color', 'backgroundColor', 'borderTopColor', 'outlineColor'].map(property => {
        context.clearRect(0, 0, 1, 1); context.fillStyle = (css as any)[property]; context.fillRect(0, 0, 1, 1);
        return [property, Array.from(context.getImageData(0, 0, 1, 1).data)];
      }));
      const range = document.createRange(); range.selectNodeContents(element);
      const lineRects = Array.from(range.getClientRects()).filter(box => box.width > 0 && box.height > 0);
      return { bounds: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }, style, colors,
        textLines: new Set(lineRects.map(box => Math.round(box.top))).size };
    });
  }
  const overflow = await page.evaluate(() => ({
    viewportWidth: innerWidth, viewportHeight: innerHeight,
    documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth,
    outerScrollRange: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) - innerHeight,
  }));
  expect(overflow.documentWidth).toBeLessThanOrEqual(overflow.viewportWidth + 1);
  expect(overflow.bodyWidth).toBeLessThanOrEqual(overflow.viewportWidth + 1);

  const appRoot = path.resolve(process.env.LAICA_VISUAL_APP_ROOT || '.');
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: appRoot, encoding: 'utf8' }).trim();
  const diff = execFileSync('git', ['diff', '--binary'], { cwd: appRoot });
  const appDependencyVersions = Object.fromEntries(await Promise.all(
    ['tailwindcss', 'tailwind-merge', 'tailwindcss-animate', 'tw-animate-css'].map(async name => {
      try { return [name, JSON.parse(await readFile(path.join(appRoot, 'node_modules', name, 'package.json'), 'utf8')).version]; }
      catch { return [name, null]; }
    }),
  ));
  const harnessHash = createHash('sha256');
  for (const file of ['playwright.visual.config.ts', 'tests/visual/vite-server.ts', 'tests/visual/fixtures.ts',
    'tests/visual/parity.spec.ts', 'tests/visual/animation.spec.ts']) {
    harnessHash.update(file); harnessHash.update(await readFile(path.resolve(file)));
  }
  if (process.env.LAICA_VISUAL_RECORD === '1') {
    expect(head, 'Baseline recording must use the reviewed pre-migration source').toBe('c611b903ddff1833175ac67226b121d78f0f3c18');
    expect(diff.byteLength, 'Baseline tracked source must be unchanged').toBe(0);
    expect(process.env.LAICA_VISUAL_LABEL, 'Recording must be explicitly labeled baseline').toBe('baseline');
  }
  const evidence = { fixture: true, screen, project: testInfo.project.name, appHead: head,
    browserVersion: page.context().browser()?.version(), viewport: page.viewportSize(),
    appRoot, serverWorkingDirectory: appRoot, appDependencyVersions, harnessSha256: harnessHash.digest('hex'),
    trackedDiffSha256: createHash('sha256').update(diff).digest('hex'), overflow, probes: probeEvidence,
    negativeScope: 'Synthetic auth/API; no DB, live identity provider, camera/microphone hardware, speech/provider or production evidence.' };
  const root = path.resolve(process.env.LAICA_VISUAL_ARTIFACTS || '../visual-parity');
  const label = process.env.LAICA_VISUAL_LABEL || 'migration';
  const directory = path.join(root, label, 'metrics', testInfo.project.name);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, `${screen}.json`), JSON.stringify(evidence, null, 2));
  await testInfo.attach(`${screen}-computed-layout`, { body: Buffer.from(JSON.stringify(evidence, null, 2)), contentType: 'application/json' });
  if (process.env.LAICA_VISUAL_RECORD !== '1') {
    const baseline = JSON.parse(await readFile(path.join(root, 'baseline', 'metrics', testInfo.project.name, `${screen}.json`), 'utf8'));
    for (const [name, actual] of Object.entries(probeEvidence) as Array<[string, any]>) {
      const expected = baseline.probes[name];
      for (const axis of ['x', 'y', 'width', 'height']) {
        expect(Math.abs(actual.bounds[axis] - expected.bounds[axis]), `${screen}.${name}.${axis}`).toBeLessThanOrEqual(1);
      }
      for (const property of ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'paddingTop', 'paddingRight',
        'paddingBottom', 'paddingLeft', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderTopLeftRadius']) {
        expect(actual.style[property], `${screen}.${name}.${property}`).toBe(expected.style[property]);
      }
      expect(actual.textLines, `${screen}.${name}.textLines`).toBe(expected.textLines);
      const paintedColors = (probe: any) => ({ ...probe.colors,
        outlineColor: probe.style.outlineStyle === 'none' || parseFloat(probe.style.outlineWidth) === 0
          ? [0, 0, 0, 0] : probe.colors.outlineColor,
      });
      // An outline:none element may retain the UA's outline color in computed
      // style. Compare the color that actually paints, and retain raw evidence.
      expect(paintedColors(actual), `${screen}.${name}.paintedColors`).toEqual(paintedColors(expected));
    }
  }
  await expect(page).toHaveScreenshot(`${screen}.png`, { animations: 'disabled', caret: 'hide',
    maxDiffPixelRatio: 0.005, threshold: 0.1, mask: [page.getByTestId('live-cooking-timer-clock')] });
}
