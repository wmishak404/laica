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

  it('keeps returning Settings camera and actions clear of mobile nav', () => {
    const cameraRule = css.match(/\.returning-inventory-camera \.setup-viewfinder > \.relative \{[\s\S]*?\}/)?.[0] ?? '';
    const actionRule = css.match(/\.returning-actions \{[\s\S]*?\}/)?.[0] ?? '';

    expect(css).toContain('--returning-bottom-nav-clearance');
    expect(cameraRule).toContain('aspect-ratio: 4 / 5;');
    expect(actionRule).toContain('bottom: var(--returning-bottom-nav-clearance);');
    expect(actionRule).toContain('z-index: 20;');
  });
});
