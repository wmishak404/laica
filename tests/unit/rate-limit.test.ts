import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request } from 'express';
import {
  RATE_LIMIT_BUCKET_CAP,
  consumeRateLimit,
  createRateLimit,
  getClientIp,
  getConfiguredRateLimit,
  getRateLimitBucketCountForTest,
  getRateLimitEnvKey,
  getVisionIpRateLimitKey,
  getVisionUserRateLimitKey,
  resetRateLimitBucketsForTest,
} from '../../server/rate-limit';

interface MockRequestOptions {
  scanType?: string;
  headers?: Record<string, string>;
  ip?: string;
  remoteAddress?: string;
  firebaseUser?: { uid: string } | null;
  rateLimitKey?: string;
}

function makeRequest(scanTypeOrOptions: string | MockRequestOptions = {}): Request {
  const options =
    typeof scanTypeOrOptions === 'string' ? { scanType: scanTypeOrOptions } : scanTypeOrOptions;
  const req: Record<string, unknown> = {
    headers: {
      ...options.headers,
      ...(options.scanType ? { 'x-laica-scan-type': options.scanType } : {}),
    },
    socket: { remoteAddress: options.remoteAddress ?? '127.0.0.1' },
    rateLimitKey: options.rateLimitKey,
  };

  if ('ip' in options) {
    req.ip = options.ip;
  } else {
    req.ip = '127.0.0.1';
  }

  if (options.firebaseUser !== null) {
    req.firebaseUser = options.firebaseUser ?? { uid: 'user-1' };
  }

  return req as unknown as Request;
}

function makeResponse() {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  const res = {
    setHeader: vi.fn(),
    status,
  };

  return { json, res, status };
}

describe('vision rate-limit keys', () => {
  beforeEach(() => {
    resetRateLimitBucketsForTest();
  });

  afterEach(() => {
    delete process.env.RATE_LIMIT_RECIPE_HOUR;
    vi.useRealTimers();
    resetRateLimitBucketsForTest();
  });

  it('uses Express proxy-aware req.ip instead of raw forwarded headers', () => {
    expect(
      getClientIp(
        makeRequest({
          headers: { 'x-forwarded-for': '198.51.100.10, 203.0.113.5' },
          ip: '203.0.113.20',
        }),
      ),
    ).toBe('203.0.113.20');
  });

  it('falls back to the socket remote address when req.ip is unavailable', () => {
    expect(getClientIp(makeRequest({ ip: undefined, remoteAddress: '203.0.113.30' }))).toBe(
      '203.0.113.30',
    );
  });

  it('maps rate-limit override names to RATE_LIMIT_<KEY>_<WINDOW>', () => {
    expect(getRateLimitEnvKey('recipe', 'hour')).toBe('RATE_LIMIT_RECIPE_HOUR');
    expect(getRateLimitEnvKey('slopBowl', 'hour')).toBe('RATE_LIMIT_SLOP_BOWL_HOUR');
    expect(getRateLimitEnvKey('app', 'short')).toBe('RATE_LIMIT_APP_SHORT');
  });

  it('reads positive integer rate-limit overrides and ignores invalid values', () => {
    process.env.RATE_LIMIT_RECIPE_HOUR = '7';
    expect(getConfiguredRateLimit('recipe', 'hour', 10)).toBe(7);

    process.env.RATE_LIMIT_RECIPE_HOUR = '0';
    expect(getConfiguredRateLimit('recipe', 'hour', 10)).toBe(10);
  });

  it('separates Pantry and Kitchen scan meters for signed-in users', () => {
    expect(getVisionUserRateLimitKey(makeRequest('pantry'))).toBe('user-1:pantry');
    expect(getVisionUserRateLimitKey(makeRequest('kitchen'))).toBe('user-1:kitchen');
  });

  it('falls back to a generic scan meter for missing or unexpected contexts', () => {
    expect(getVisionUserRateLimitKey(makeRequest())).toBe('user-1:generic');
    expect(getVisionUserRateLimitKey(makeRequest('recipes'))).toBe('user-1:generic');
  });

  it('separates IP keys with the same scan context', () => {
    expect(getVisionIpRateLimitKey(makeRequest('pantry'))).toBe('127.0.0.1:pantry');
    expect(getVisionIpRateLimitKey(makeRequest('kitchen'))).toBe('127.0.0.1:kitchen');
  });

  it('returns a typed RATE_LIMITED payload with Retry-After when a bucket is exhausted', () => {
    const limit = createRateLimit({
      name: 'test:typed-payload',
      windowMs: 60_000,
      max: 1,
      keyGenerator: () => 'user-1',
    });
    const next = vi.fn();
    const { json, res, status } = makeResponse();

    limit(makeRequest(), res as any, next);
    limit(makeRequest(), res as any, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(String));
    expect(status).toHaveBeenCalledWith(429);
    expect(json).toHaveBeenCalledWith({
      code: 'RATE_LIMITED',
      message: 'Too many requests. Try again later.',
    });
  });

  it('can consume multiple image slots for image-count based limits', () => {
    const options = {
      name: 'test:image-count',
      windowMs: 60_000,
      max: 3,
      keyGenerator: () => 'user-1',
    };
    const { json, res, status } = makeResponse();

    expect(consumeRateLimit(options, makeRequest(), res as any, 2)).toBe(true);
    expect(consumeRateLimit(options, makeRequest(), res as any, 2)).toBe(false);

    expect(status).toHaveBeenCalledWith(429);
    expect(json).toHaveBeenCalledWith({
      code: 'RATE_LIMITED',
      message: 'Too many requests. Try again later.',
    });
  });

  it('prunes expired buckets during periodic cleanup', () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const options = {
      name: 'test:prune-expired',
      windowMs: 10,
      max: 10,
      keyGenerator: (req: Request) => String((req as any).rateLimitKey),
    };
    const { res } = makeResponse();

    consumeRateLimit(options, makeRequest({ rateLimitKey: 'old' }), res as any);
    expect(getRateLimitBucketCountForTest()).toBe(1);

    vi.setSystemTime(61_000);
    consumeRateLimit(options, makeRequest({ rateLimitKey: 'new' }), res as any);

    expect(getRateLimitBucketCountForTest()).toBe(1);
  });

  it('caps custom in-memory rate-limit buckets', () => {
    const options = {
      name: 'test:bucket-cap',
      windowMs: 60_000,
      max: 100,
      keyGenerator: (req: Request) => String((req as any).rateLimitKey),
    };
    const { res } = makeResponse();

    for (let index = 0; index < RATE_LIMIT_BUCKET_CAP + 25; index += 1) {
      consumeRateLimit(options, makeRequest({ rateLimitKey: `key-${index}` }), res as any);
    }

    expect(getRateLimitBucketCountForTest()).toBe(RATE_LIMIT_BUCKET_CAP);
  });
});
