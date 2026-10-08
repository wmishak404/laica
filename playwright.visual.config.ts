import { defineConfig } from '@playwright/test';
import path from 'node:path';

const appRoot = path.resolve(process.env.LAICA_VISUAL_APP_ROOT || '.');
const artifactsRoot = path.resolve(process.env.LAICA_VISUAL_ARTIFACTS || '../visual-parity');
const label = process.env.LAICA_VISUAL_LABEL || 'migration';
const baseURL = process.env.LAICA_VISUAL_BASE_URL || 'http://127.0.0.1:4174';

// Separate, synthetic-service evidence. This does not replace playwright.config.ts
// or the exact-head guest/linked service-backed GitHub regression gate.
export default defineConfig({
  testDir: './tests/visual',
  testMatch: '**/*.spec.ts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  outputDir: path.join(artifactsRoot, label, 'playwright'),
  reporter: [
    ['list'],
    ['json', { outputFile: path.join(artifactsRoot, label, 'results.json') }],
  ],
  snapshotPathTemplate: path.join(artifactsRoot, 'baseline', 'screens', '{projectName}', '{arg}{ext}'),
  updateSnapshots: process.env.LAICA_VISUAL_RECORD === '1' ? 'all' : 'none',
  use: {
    baseURL,
    locale: 'en-US',
    timezoneId: 'America/Los_Angeles',
    colorScheme: 'light',
    reducedMotion: 'reduce',
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
  },
  projects: ['chromium', 'webkit'].flatMap(browserName =>
    [{ width: 390, height: 844 }, { width: 412, height: 915 }].map(viewport => ({
      name: `${browserName}-${viewport.width}x${viewport.height}`,
      use: { browserName: browserName as 'chromium' | 'webkit', viewport, isMobile: true, hasTouch: true },
    })),
  ),
  webServer: {
    command: 'node --import tsx tests/visual/vite-server.ts',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 60_000,
    env: { LAICA_VISUAL_APP_ROOT: appRoot, LAICA_VISUAL_BASE_URL: baseURL },
  },
});
