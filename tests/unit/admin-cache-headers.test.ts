import { afterEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import http from 'node:http';
import { requestHttp } from './http-test-client';

const mocks = vi.hoisted(() => ({
  getPendingCount: vi.fn(),
}));

vi.mock('../../server/evaluator', () => ({
  submitEvalBatch: vi.fn(),
  checkBatchStatus: vi.fn(),
  processBatchResults: vi.fn(),
  getEvalSummary: vi.fn(),
  generateImprovedPrompt: vi.fn(),
  getPendingCount: mocks.getPendingCount,
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
    vi.clearAllMocks();
  });

  it('marks successful admin responses as non-cacheable', async () => {
    process.env.ADMIN_SECRET = 'test-secret';
    mocks.getPendingCount.mockResolvedValueOnce({});

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
});
