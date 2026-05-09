import { describe, expect, it, vi } from 'vitest';
import type { Request } from 'express';
import {
  consumeRateLimit,
  createRateLimit,
  getVisionIpRateLimitKey,
  getVisionUserRateLimitKey,
} from '../../server/rate-limit';

function makeRequest(scanType?: string): Request {
  return {
    headers: {
      ...(scanType ? { 'x-laica-scan-type': scanType } : {}),
    },
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    firebaseUser: { uid: 'user-1' },
  } as unknown as Request;
}

describe('vision rate-limit keys', () => {
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
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res = {
      setHeader: vi.fn(),
      status,
    };

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
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res = {
      setHeader: vi.fn(),
      status,
    };

    expect(consumeRateLimit(options, makeRequest(), res as any, 2)).toBe(true);
    expect(consumeRateLimit(options, makeRequest(), res as any, 2)).toBe(false);

    expect(status).toHaveBeenCalledWith(429);
    expect(json).toHaveBeenCalledWith({
      code: 'RATE_LIMITED',
      message: 'Too many requests. Try again later.',
    });
  });
});
