import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('setup button CSS guards', () => {
  const css = readFileSync('client/src/index.css', 'utf8');

  it('keeps setup primary button text white in mobile tap states', () => {
    expect(css).toContain('.setup-primary-button:hover');
    expect(css).toContain('.setup-primary-button:focus');
    expect(css).toContain('.setup-primary-button:focus-visible');
    expect(css).toContain('.setup-primary-button:active');
    expect(css).toContain('touch-action: manipulation;');

    const hoverRule = css.match(/\.setup-primary-button:hover,[\s\S]*?\{[\s\S]*?\}/)?.[0] ?? '';
    const stateRule = css.match(/\.setup-primary-button:focus,[\s\S]*?\{[\s\S]*?\}/)?.[0] ?? '';

    expect(hoverRule).toContain('color: hsl(0 0% 100%);');
    expect(stateRule).toContain('color: hsl(0 0% 100%);');
  });

  it('keeps setup and returning Settings inventory cameras at phone-camera proportions', () => {
    const sharedCameraRule = css.match(/\.setup-inventory-camera \.setup-viewfinder > \.relative,[\s\S]*?\.returning-inventory-camera \.setup-viewfinder > \.relative \{[\s\S]*?\}/)?.[0] ?? '';
    const mobileSetupCameraRule = css.match(/\.setup-scan-step \.setup-viewfinder > \.relative \{[\s\S]*?\}/)?.[0] ?? '';

    expect(sharedCameraRule).toContain('aspect-ratio: 4 / 5;');
    expect(mobileSetupCameraRule).toContain('aspect-ratio: 4 / 5;');
  });

  it('reserves a bounded inventory scroller above an opaque in-flow returning action dock', () => {
    const inventoryRootRule = css.match(/\.returning-ui\.returning-ui-inventory \{[\s\S]*?\}/)?.[0] ?? '';
    const inventoryShellRule = css.match(/\.returning-inventory-shell \{[\s\S]*?\}/)?.[0] ?? '';
    const inventoryScrollerRule = css.match(/\.returning-inventory-scroll \{[\s\S]*?\}/)?.[0] ?? '';
    const inventoryActionRule = css.match(/\.returning-inventory-actions \{[\s\S]*?\}/)?.[0] ?? '';
    const inventoryActionInnerRule = css.match(/\.returning-inventory-actions-inner \{[\s\S]*?\}/)?.[0] ?? '';

    expect(css).toContain('--app-bottom-nav-height');
    expect(inventoryRootRule).toContain('inset: 0 0 var(--app-bottom-nav-height);');
    expect(inventoryRootRule).toContain('display: flex;');
    expect(inventoryRootRule).toContain('flex-direction: column;');
    expect(inventoryRootRule).toContain('overflow: hidden;');
    expect(inventoryShellRule).toContain('flex: 1 1 auto;');
    expect(inventoryScrollerRule).toContain('overflow-y: auto;');
    expect(inventoryActionRule).toContain('position: relative;');
    expect(inventoryActionRule).toContain('z-index: auto;');
    expect(inventoryActionRule).toContain('flex: 0 0 auto;');
    expect(inventoryActionRule).toContain('width: 100%;');
    expect(inventoryActionRule).toContain('margin: 0;');
    expect(inventoryActionRule).toContain('background-color: hsl(var(--returning-cream));');
    expect(inventoryActionRule).toContain('hsl(var(--returning-cream-deep))');
    expect(inventoryActionRule).not.toMatch(/background(?:-color|-image)?:.*\/\s*0\./);
    expect(inventoryActionInnerRule).toContain('max-width: 36rem;');
    expect(inventoryActionInnerRule).toContain('margin: 0 auto;');
  });

  it('keeps non-inventory Settings height tied to the bottom nav instead of an extra screen', () => {
    const returningRootRule = css.match(/\.returning-ui \{[\s\S]*?\}/)?.[0] ?? '';
    const returningShellRule = css.match(/\.returning-ui:not\(\.returning-ui-inventory\) \.returning-settings-shell \{[\s\S]*?\}/)?.[0] ?? '';

    expect(returningRootRule).toContain('min-height: calc(100dvh - var(--app-bottom-nav-height) - 0.75rem);');
    expect(returningRootRule).toContain('padding-bottom: calc(var(--app-bottom-nav-height) + 0.75rem);');
    expect(returningShellRule).toContain('min-height: calc(100dvh - var(--app-bottom-nav-height) - 0.75rem);');
    expect(returningRootRule).not.toContain('var(--returning-bottom-nav-clearance) + 1.25rem');
  });
});
