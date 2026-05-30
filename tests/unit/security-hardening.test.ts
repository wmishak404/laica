import { describe, expect, it } from 'vitest';
import { getPublicErrorMessage, getSecurityHeaderOptions } from '../../server/security';
import { getViteAllowedHosts, normalizeAllowedHost } from '../../server/vite-hosts';

describe('security hardening', () => {
  it('returns generic 500 responses while preserving expected 4xx messages', () => {
    expect(getPublicErrorMessage(500, 'database connection failed')).toBe('Internal Server Error');
    expect(getPublicErrorMessage(503, 'upstream failed')).toBe('Internal Server Error');
    expect(getPublicErrorMessage(400, 'Invalid request body')).toBe('Invalid request body');
  });

  it('enables production security headers without applying production CSP in dev', () => {
    const productionOptions = getSecurityHeaderOptions('production');
    const developmentOptions = getSecurityHeaderOptions('development');

    expect(productionOptions.contentSecurityPolicy).not.toBe(false);
    expect(productionOptions.strictTransportSecurity).not.toBe(false);
    expect(developmentOptions.contentSecurityPolicy).toBe(false);
    expect(developmentOptions.strictTransportSecurity).toBe(false);
    expect(productionOptions.crossOriginOpenerPolicy).toEqual({
      policy: 'same-origin-allow-popups',
    });
    expect(productionOptions.referrerPolicy).toEqual({ policy: 'strict-origin-when-cross-origin' });
  });

  it('keeps expected production CSP sources for the app shell and Firebase auth', () => {
    const options = getSecurityHeaderOptions('production');
    const contentSecurityPolicy = options.contentSecurityPolicy;

    expect(contentSecurityPolicy?.directives?.['script-src']).toEqual(
      expect.not.arrayContaining(['https://replit.com']),
    );
    expect(contentSecurityPolicy).toMatchObject({
      directives: {
        'default-src': ["'self'"],
        'frame-ancestors': ["'none'"],
        'connect-src': expect.arrayContaining([
          "'self'",
          'https://*.googleapis.com',
          'https://accounts.google.com',
          'https://*.firebaseapp.com',
        ]),
        'script-src': expect.arrayContaining([
          "'self'",
          'https://www.google.com',
          'https://www.gstatic.com',
        ]),
        'frame-src': expect.arrayContaining([
          "'self'",
          'https://accounts.google.com',
          'https://www.google.com',
        ]),
      },
    });
  });

  it('normalizes configured Vite dev hosts and rejects wildcard entries', () => {
    expect(normalizeAllowedHost(' https://Preview.Example.test:443/path ')).toBe(
      'preview.example.test',
    );
    expect(normalizeAllowedHost('.Replit.Dev')).toBe('.replit.dev');
    expect(normalizeAllowedHost('*')).toBeNull();
  });

  it('builds Vite allowed host policy from explicit environment metadata', () => {
    expect(
      getViteAllowedHosts({
        REPLIT_DOMAINS: 'one.replit.dev, https://two.replit.dev/path',
        REPLIT_DEV_DOMAIN: 'three.replit.dev',
        LAICA_DEV_ALLOWED_HOSTS: 'laica.local',
        __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS: 'extra.local',
      }),
    ).toEqual(['one.replit.dev', 'two.replit.dev', 'three.replit.dev', 'laica.local', 'extra.local']);
  });

  it('adds Replit suffixes only when running in a Replit environment', () => {
    expect(getViteAllowedHosts({})).toEqual([]);
    expect(getViteAllowedHosts({ REPL_ID: 'abc123' })).toEqual([
      '.replit.dev',
      '.replit.app',
      '.repl.co',
    ]);
  });
});
