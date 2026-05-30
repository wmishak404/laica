import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Request } from 'express';

const mocks = vi.hoisted(() => ({
  insert: vi.fn(),
  values: vi.fn(),
  onConflictDoUpdate: vi.fn(),
  returning: vi.fn(),
  del: vi.fn(),
  where: vi.fn(),
}));

vi.mock(import('../../server/db'), () => ({
  db: {
    insert: mocks.insert,
    delete: mocks.del,
  },
}));

vi.mock(import('@shared/schema'), () => ({
  rateLimitBuckets: {
    bucketKey: 'bucket_key',
    windowStart: 'window_start',
    windowMs: 'window_ms',
    count: 'count',
  },
}));

function makeRequest(): Request {
  return {
    headers: {},
    ip: '203.0.113.20',
    socket: { remoteAddress: '203.0.113.20' },
    firebaseUser: { uid: 'user-1' },
  } as unknown as Request;
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

describe('distributed rate limits (production mode)', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalDistributed = process.env.RATE_LIMIT_DISTRIBUTED;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.RATE_LIMIT_DISTRIBUTED = originalDistributed;
    vi.useRealTimers();
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('enforces a distributed limiter using the shared bucket store', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    process.env.NODE_ENV = 'production';
    delete process.env.RATE_LIMIT_DISTRIBUTED;
    vi.resetModules();

    mocks.returning.mockResolvedValueOnce([{ count: 1 }]).mockResolvedValueOnce([{ count: 2 }]);
    mocks.onConflictDoUpdate.mockReturnValue({ returning: mocks.returning });
    mocks.values.mockReturnValue({ onConflictDoUpdate: mocks.onConflictDoUpdate });
    mocks.insert.mockReturnValue({ values: mocks.values });
    mocks.where.mockResolvedValue(undefined);
    mocks.del.mockReturnValue({ where: mocks.where });

    const { createRateLimit } = await import('../../server/rate-limit');
    const limit = createRateLimit({
      name: 'test:distributed',
      windowMs: 60_000,
      max: 1,
      keyGenerator: () => 'user-1',
    });

    const next = vi.fn();
    const { json, res, status } = makeResponse();

    await limit(makeRequest(), res as any, next);
    await limit(makeRequest(), res as any, next);

    expect(mocks.insert).toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(status).toHaveBeenCalledWith(429);
    expect(json).toHaveBeenCalledWith({
      code: 'RATE_LIMITED',
      message: 'Too many requests. Try again later.',
    });
  });
});
