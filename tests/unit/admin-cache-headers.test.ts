import { afterEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import http from 'node:http';
import { resetRateLimitBucketsForTest } from '../../server/rate-limit';
import { requestHttp } from './http-test-client';

const mocks = vi.hoisted(() => ({
  getPendingQueueSummary: vi.fn(),
  getEvalReportArtifact: vi.fn(),
  buildEvalReportArtifact: vi.fn(),
  formatEvalReportArtifactMarkdown: vi.fn(),
}));

vi.mock('../../server/evaluator', () => ({
  submitEvalBatch: vi.fn(),
  checkBatchStatus: vi.fn(),
  processBatchResults: vi.fn(),
  getEvalSummary: vi.fn(),
  generateImprovedPrompt: vi.fn(),
  getEvalReportArtifact: mocks.getEvalReportArtifact,
  buildEvalReportArtifact: mocks.buildEvalReportArtifact,
  getPendingQueueSummary: mocks.getPendingQueueSummary,
  formatEvalReportArtifactMarkdown: mocks.formatEvalReportArtifactMarkdown,
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

  it('rejects missing and invalid credentials with the same non-cacheable response', async () => {
    process.env.ADMIN_SECRET = 'test-secret';
    const server = await startAdminServer();

    const missingResponse = await requestHttp(server, {
      method: 'GET',
      path: '/api/admin/eval/pending',
    });
    const invalidResponse = await requestHttp(server, {
      method: 'GET',
      path: '/api/admin/eval/pending',
      headers: {
        'X-Admin-Secret': 'wrong',
      },
    });

    expect(missingResponse.status).toBe(403);
    expect(invalidResponse.status).toBe(403);
    expect(await missingResponse.json()).toEqual(await invalidResponse.json());
    for (const response of [missingResponse, invalidResponse]) {
      expect(response.headers['cache-control']).toBe('no-store, max-age=0');
      expect(response.headers['pragma']).toBe('no-cache');
      expect(response.headers['expires']).toBe('0');
      expect(response.headers['vary']).toContain('X-Admin-Secret');
    }
    expect(mocks.getPendingQueueSummary).not.toHaveBeenCalled();
  });

  it('rate-limits repeated invalid attempts before protected handlers and resets in-process for tests', async () => {
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

    const throttledResponse = await requestHttp(server, {
      method: 'GET',
      path: '/api/admin/eval/pending',
      headers: {
        'X-Admin-Secret': 'wrong-secret',
      },
    });

    expect(throttledResponse.status).toBe(429);
    expect(await throttledResponse.json()).toEqual({
      code: 'RATE_LIMITED',
      message: 'Too many requests. Try again later.',
    });
    expect(throttledResponse.headers['cache-control']).toBe('no-store, max-age=0');
    expect(throttledResponse.headers['pragma']).toBe('no-cache');
    expect(throttledResponse.headers['expires']).toBe('0');
    expect(throttledResponse.headers['vary']).toContain('X-Admin-Secret');
    expect(mocks.getPendingQueueSummary).not.toHaveBeenCalled();

    resetRateLimitBucketsForTest();

    const resetResponse = await requestHttp(server, {
      method: 'GET',
      path: '/api/admin/eval/pending',
      headers: {
        'X-Admin-Secret': 'test-secret',
      },
    });

    expect(resetResponse.status).toBe(200);
    expect(mocks.getPendingQueueSummary).toHaveBeenCalledTimes(1);
  });

  it('serves report export in JSON and markdown with non-cache headers', async () => {
    process.env.ADMIN_SECRET = 'test-secret';
    const reportPayload = {
      reportGeneratedAt: new Date().toISOString(),
      requestedSourceClass: 'real-usage sample',
      requestedRunType: 'provider-backed judge smoke',
      requestedOutputFormat: 'json',
      rows: [],
      metrics: {
        overall: { total: 0, passed: 0, failed: 0, passRate: null },
        passRate: null,
        tpr: { value: null, status: 'unavailable' },
        tnr: { value: null, status: 'unavailable' },
      },
      criterionAggregate: {},
    };

    mocks.getEvalReportArtifact.mockResolvedValueOnce(reportPayload);
    const markdownPayload = { ...reportPayload, requestedOutputFormat: 'markdown' };
    mocks.getEvalReportArtifact.mockResolvedValueOnce(markdownPayload);
    mocks.formatEvalReportArtifactMarkdown.mockReturnValue(
      `# Eval Report\n- Source class: ${markdownPayload.requestedSourceClass}\n`,
    );

    const server = await startAdminServer();

    const jsonResponse = await requestHttp(server, {
      method: 'GET',
      path: '/api/admin/eval/report?format=json&sourceClass=real-usage%20sample&runType=provider-backed%20judge%20smoke',
      headers: {
        'X-Admin-Secret': 'test-secret',
      },
    });

    expect(jsonResponse.status).toBe(200);
    expect(jsonResponse.headers['cache-control']).toBe('no-store, max-age=0');
    expect(jsonResponse.headers['content-type']).toContain('application/json');
    const jsonBody = await jsonResponse.json();
    expect(Array.isArray(jsonBody.rows)).toBe(true);

    const markdownResponse = await requestHttp(server, {
      method: 'GET',
      path: '/api/admin/eval/report?format=markdown&sourceClass=real-usage%20sample&runType=provider-backed%20judge%20smoke',
      headers: {
        'X-Admin-Secret': 'test-secret',
      },
    });

    expect(markdownResponse.status).toBe(200);
    expect(markdownResponse.headers['cache-control']).toBe('no-store, max-age=0');
    expect(markdownResponse.headers['content-type']).toContain('text/markdown');
    expect(markdownResponse.text).toContain('# Eval Report');
  });
});
