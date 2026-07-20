import { createServer } from "node:http";
import express, { type RequestHandler } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { requestHttp } from "./http-test-client";

async function loadGlobalLimiters(options: { appLimit: number; apiLimit: number }) {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("RATE_LIMIT_APP_SHORT", String(options.appLimit));
  vi.stubEnv("RATE_LIMIT_API_SHORT", String(options.apiLimit));
  vi.resetModules();

  return await import("../../server/rate-limit");
}

function createLimiterServer(limiter: RequestHandler, mountPath?: string) {
  const app = express();

  if (mountPath) {
    app.use(mountPath, limiter);
  } else {
    app.use(limiter);
  }

  app.get("/health", (_req, res) => res.status(200).json({ ok: true }));
  app.get("/api/health", (_req, res) => res.status(200).json({ ok: true }));
  return createServer(app);
}

describe("express-rate-limit global middleware", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("enforces the app-wide limit with draft-8 headers and the typed 429 response", async () => {
    const { appRequestLimit } = await loadGlobalLimiters({ appLimit: 2, apiLimit: 10 });
    const server = createLimiterServer(appRequestLimit);

    const first = await requestHttp(server, { method: "GET", path: "/health" });
    const second = await requestHttp(server, { method: "GET", path: "/health" });
    const blocked = await requestHttp(server, { method: "GET", path: "/health" });

    expect(first.status).toBe(200);
    expect(first.headers.ratelimit).toMatch(/r=1/);
    expect(first.headers["ratelimit-policy"]).toMatch(/q=2/);
    expect(first.headers["x-ratelimit-limit"]).toBeUndefined();

    expect(second.status).toBe(200);
    expect(second.headers.ratelimit).toMatch(/r=0/);

    expect(blocked.status).toBe(429);
    expect(blocked.headers.ratelimit).toMatch(/r=0/);
    expect(Number(blocked.headers["retry-after"])).toBeGreaterThan(0);
    expect(await blocked.json()).toEqual({
      code: "RATE_LIMITED",
      message: "Too many requests. Try again later.",
    });
  });

  it("scopes the API limiter to /api while preserving the same header and 429 contract", async () => {
    const { apiRequestLimit } = await loadGlobalLimiters({ appLimit: 10, apiLimit: 1 });
    const server = createLimiterServer(apiRequestLimit, "/api");

    const outsideApi = await requestHttp(server, { method: "GET", path: "/health" });
    const firstApi = await requestHttp(server, { method: "GET", path: "/api/health" });
    const blockedApi = await requestHttp(server, { method: "GET", path: "/api/health" });

    expect(outsideApi.status).toBe(200);
    expect(outsideApi.headers.ratelimit).toBeUndefined();

    expect(firstApi.status).toBe(200);
    expect(firstApi.headers.ratelimit).toMatch(/r=0/);
    expect(firstApi.headers["ratelimit-policy"]).toMatch(/q=1/);

    expect(blockedApi.status).toBe(429);
    expect(Number(blockedApi.headers["retry-after"])).toBeGreaterThan(0);
    expect(await blockedApi.json()).toEqual({
      code: "RATE_LIMITED",
      message: "Too many requests. Try again later.",
    });
  });
});
