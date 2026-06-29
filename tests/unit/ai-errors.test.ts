import { createServer } from "http";
import express from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { logAiError } from "../../server/aiErrors";
import { requestIdMiddleware } from "../../server/requestId";
import { requestHttp } from "./http-test-client";

describe("logAiError", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes only allowlisted derived telemetry fields", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = Object.assign(new Error("raw provider message with user@example.com"), {
      status: 429,
      code: "RATE_LIMITED",
      headers: {
        "Retry-After": "90",
      },
    });
    const req = {
      body: {
        preferences: "private dinner for user@example.com",
        ingredients: ["rice", "eggs"],
      },
      firebaseUser: {
        uid: "linked-user-1",
        isAnonymous: false,
      },
      requestId: "11111111-1111-4111-8111-111111111111",
      requestStartedAt: Date.now() - 25,
      header: (name: string) => (name === "X-Client-Attempt" ? "3" : undefined),
    };

    logAiError({
      error,
      req: req as any,
      route: "/api/recipes/pantry",
      feature: "chef_it_up_suggestions",
      vendor: "openai",
    });

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(consoleSpy.mock.calls[0][0] as string);

    expect(payload).toMatchObject({
      event: "ai_error",
      request_id: "11111111-1111-4111-8111-111111111111",
      route: "/api/recipes/pantry",
      feature: "chef_it_up_suggestions",
      vendor: "openai",
      http_status: 429,
      error_class: "rate_limit",
      error_code: "RATE_LIMITED",
      is_authenticated: true,
      auth_user_id: "linked-user-1",
      retry_after_secs: 90,
      preference_length: 35,
      ingredient_count: 2,
      image_count: null,
      attempt_number: 3,
    });
    expect(payload.latency_ms).toBeGreaterThanOrEqual(0);
    expect(payload.input_shape_hash).toMatch(/^[a-f0-9]{64}$/);

    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain("private dinner");
    expect(serialized).not.toContain("user@example.com");
    expect(serialized).not.toContain("rice");
    expect(serialized).not.toContain("raw provider message");
  });
});

describe("requestIdMiddleware", () => {
  it("overwrites client-supplied request IDs for API requests", async () => {
    const app = express();
    app.use("/api", requestIdMiddleware);
    app.get("/api/ping", (req, res) => {
      res.json({ requestId: req.requestId });
    });

    const response = await requestHttp(createServer(app), {
      method: "GET",
      path: "/api/ping",
      headers: {
        "X-Request-Id": "client-supplied",
      },
    });
    const body = await response.json<{ requestId: string }>();

    expect(response.status).toBe(200);
    expect(response.headers["x-request-id"]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(body.requestId).toBe(response.headers["x-request-id"]);
    expect(body.requestId).not.toBe("client-supplied");
  });
});
