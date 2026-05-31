import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import express from 'express';

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

  const server = await new Promise<Server>((resolve) => {
    const started = app.listen(0, '127.0.0.1', () => resolve(started));
  });

  const address = server.address() as AddressInfo;
  return {
    server,
    url: `http://127.0.0.1:${address.port}`,
  };
}

function closeServer(server: Server) {
  return new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
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

    const { server, url } = await startAdminServer();

    try {
      const response = await fetch(`${url}/api/admin/eval/pending`, {
        headers: {
          'X-Admin-Secret': 'test-secret',
        },
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe('no-store, max-age=0');
      expect(response.headers.get('pragma')).toBe('no-cache');
      expect(response.headers.get('expires')).toBe('0');
      expect(response.headers.get('vary')).toContain('X-Admin-Secret');
    } finally {
      await closeServer(server);
    }
  });
});

