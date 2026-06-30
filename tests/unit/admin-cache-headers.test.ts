import { afterEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import http from 'node:http';
import { resetRateLimitBucketsForTest } from '../../server/rate-limit';
import { requestHttp } from './http-test-client';

const mocks = vi.hoisted(() => ({
  getPendingQueueSummary: vi.fn(),
}));

vi.mock('../../server/evaluator', () => ({
  submitEvalBatch: vi.fn(),
  checkBatchStatus: vi.fn(),
  processBatchResults: vi.fn(),
  getEvalSummary: vi.fn(),
  generateImprovedPrompt: vi.fn(),
  getPendingQueueSummary: mocks.getPendingQueueSummary,
}));

vi.mock('../../server/prompt-manager', () => ({
  createPromptVersion: vi.fn(),
  activatePromptVersion: vi.fn(),
  getPromptVersionHistory: vi.fn(),
  getAllActivePrompts: vi.fn(),
}));

vi.mock('../../server/db', () => ({
  db: {},
}));

async function startAdminServer() {
  const { registerAdminRoutes } = await import('../../server/admin-routes');

  const app = express();
  app.use(express.json());
  registerAdminRoutes(app);

  // Avoid `app.listen()` because the local Codex sandbox blocks TCP binds (EPERM).
  return http.createServer(app);
}

describe('Admin caching headers', () => {
  const originalAdminSecret = process.env.ADMIN_SECRET;

  afterEach(() => {
    process.env.ADMIN_SECRET = originalAdminSecret;
    resetRateLimitBucketsForTest();
    vi.clearAllMocks();
  });

  it('marks successful admin responses as non-cacheable', async () => {
    process.env.ADMIN_SECRET = 'test-secret';
    mocks.getPendingQueueSummary.mockResolvedValueOnce({
      total: 0,
      eligibleTotal: 0,
      skippedTotal: 0,
      byFeature: {},
      eligibleByFeature: {},
      skippedByFeature: {},
    });

    const server = await startAdminServer();

    const response = await requestHttp(server, {
      method: 'GET',
      path: '/api/admin/eval/pending',
      headers: {
        'X-Admin-Secret': 'test-secret',
      },
    });

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store, max-age=0');
    expect(response.headers['pragma']).toBe('no-cache');
    expect(response.headers['expires']).toBe('0');
    expect(response.headers['vary']).toContain('X-Admin-Secret');
  });

  it('rate-limits repeated invalid admin attempts before hitting handlers', async () => {
    process.env.ADMIN_SECRET = 'test-secret';
    const server = await startAdminServer();

    for (let index = 0; index < 60; index += 1) {
      const response = await requestHttp(server, {
        method: 'GET',
        path: '/api/admin/eval/pending',
        headers: {
          'X-Admin-Secret': 'wrong-secret',
        },
      });

      expect(response.status).toBe(403);
    }

    const response = await requestHttp(server, {
      method: 'GET',
      path: '/api/admin/eval/pending',
      headers: {
        'X-Admin-Secret': 'wrong-secret',
      },
    });

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      code: 'RATE_LIMITED',
      message: 'Too many requests. Try again later.',
    });
    expect(response.headers['cache-control']).toBe('no-store, max-age=0');
    expect(mocks.getPendingQueueSummary).not.toHaveBeenCalled();
  });
});
