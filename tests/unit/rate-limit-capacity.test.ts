import type { NextFunction, Request, RequestHandler, Response } from "express";
import { describe, expect, it } from "vitest";

import playwrightConfig from "../../playwright.config";
import {
  E2E_APP_REQUEST_LIMIT_BYPASS_ENV,
  createApiRequestLimit,
  createAppRequestLimit,
} from "../../server/rate-limit";

function makeLocalRequest(index: number): Request {
  return {
    app: { get: () => false },
    headers: {},
    ip: "127.0.0.1",
    method: "GET",
    originalUrl: `/src/cold-module.ts?request=${index}`,
    socket: { remoteAddress: "127.0.0.1" },
  } as unknown as Request;
}

function makeResponse(): Response {
  const headers = new Map<string, string>();
  const response = {
    append(name: string, value: string) {
      headers.set(name, value);
      return response;
    },
    headersSent: false,
    send() {
      response.writableEnded = true;
      return response;
    },
    setHeader(name: string, value: string | number | readonly string[]) {
      headers.set(name, Array.isArray(value) ? value.join(", ") : String(value));
      return response;
    },
    status(code: number) {
      response.statusCode = code;
      return response;
    },
    statusCode: 200,
    writableEnded: false,
  };

  return response as unknown as Response;
}

async function invokeLimit(limit: RequestHandler, index: number): Promise<number> {
  const request = makeLocalRequest(index);
  const response = makeResponse();
  let middlewareError: unknown;
  const next: NextFunction = (error?: unknown) => {
    middlewareError = error;
  };

  await limit(request, response, next);
  if (middlewareError) {
    throw middlewareError;
  }

  return response.statusCode;
}

async function requestStatuses(limit: RequestHandler, count: number): Promise<number[]> {
  const statuses: number[] = [];
  for (let index = 0; index < count; index += 1) {
    statuses.push(await invokeLimit(limit, index));
  }
  return statuses;
}

describe("E2E app-asset limiter capacity", () => {
  it("opts the Playwright-managed web server into the E2E-only bypass", () => {
    const webServer = playwrightConfig.webServer;
    expect(Array.isArray(webServer)).toBe(false);
    expect(webServer).toMatchObject({
      env: {
        [E2E_APP_REQUEST_LIMIT_BYPASS_ENV]: "true",
      },
    });
  });

  it("lets the explicit development E2E lane exceed the former 1,000-request ceiling", async () => {
    const statuses = await requestStatuses(
      createAppRequestLimit({
        NODE_ENV: "development",
        [E2E_APP_REQUEST_LIMIT_BYPASS_ENV]: "true",
      }),
      1_001,
    );

    expect(statuses).toHaveLength(1_001);
    expect(statuses.every((status) => status === 200)).toBe(true);
  });

  it("retains the 1,000-request broad limit in production/default configuration", async () => {
    const statuses = await requestStatuses(createAppRequestLimit({ NODE_ENV: "production" }), 1_001);

    expect(statuses.slice(0, 1_000).every((status) => status === 200)).toBe(true);
    expect(statuses[1_000]).toBe(429);
  });

  it("keeps the API limiter active when the app-asset E2E bypass is requested", async () => {
    const statuses = await requestStatuses(
      createApiRequestLimit({
        NODE_ENV: "development",
        [E2E_APP_REQUEST_LIMIT_BYPASS_ENV]: "true",
      }),
      301,
    );

    expect(statuses.slice(0, 300).every((status) => status === 200)).toBe(true);
    expect(statuses[300]).toBe(429);
  });

  it("rejects the E2E-only bypass in production instead of silently enabling it", () => {
    expect(() =>
      createAppRequestLimit({
        NODE_ENV: "production",
        [E2E_APP_REQUEST_LIMIT_BYPASS_ENV]: "true",
      }),
    ).toThrow(`${E2E_APP_REQUEST_LIMIT_BYPASS_ENV}=true is forbidden when NODE_ENV=production`);
  });
});
