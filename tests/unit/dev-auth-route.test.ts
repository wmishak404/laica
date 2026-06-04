import { createServer } from "http";
import express from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requestHttp } from "./http-test-client";

const mocks = vi.hoisted(() => ({
  createFirebaseCustomToken: vi.fn(),
  storage: {
    upsertUser: vi.fn(),
  },
}));

vi.mock("../../server/firebaseAuth", () => ({
  createFirebaseCustomToken: mocks.createFirebaseCustomToken,
}));

vi.mock("../../server/storage", () => ({
  storage: mocks.storage,
}));

const envKeys = [
  "NODE_ENV",
  "REPLIT_DEPLOYMENT",
  "LAICA_DEV_AUTH_ENABLED",
  "LAICA_DEV_AUTH_SECRET",
  "LAICA_DEV_AUTH_ALLOWED_USERS",
] as const;

const originalEnv = new Map<string, string | undefined>();
for (const key of envKeys) {
  originalEnv.set(key, process.env[key]);
}

async function startTestServer() {
  const { handleLinkedDevAuthTokenRequest } = await import("../../server/devAuth");
  const { apiRequestLimit } = await import("../../server/rate-limit");
  const app = express();
  app.use(express.json());
  app.use("/api", apiRequestLimit);
  app.post("/api/dev/auth/linked-token", handleLinkedDevAuthTokenRequest);
  return createServer(app);
}

function resetDevAuthEnv() {
  process.env.NODE_ENV = "test";
  delete process.env.REPLIT_DEPLOYMENT;
  process.env.LAICA_DEV_AUTH_ENABLED = "true";
  process.env.LAICA_DEV_AUTH_SECRET = "dev-auth-test-secret";
  process.env.LAICA_DEV_AUTH_ALLOWED_USERS = "dev-test-linked-ci";
}

function restoreEnv() {
  for (const key of envKeys) {
    const originalValue = originalEnv.get(key);
    if (typeof originalValue === "undefined") {
      delete process.env[key];
    } else {
      process.env[key] = originalValue;
    }
  }
}

function validRequestBody(uid = "dev-test-linked-ci") {
  return JSON.stringify({
    uid,
    email: `${uid}@example.test`,
    displayName: "Linked Test Cook",
  });
}

describe("linked dev auth route", () => {
  beforeEach(() => {
    resetDevAuthEnv();
    mocks.createFirebaseCustomToken.mockResolvedValue("custom-token");
    mocks.storage.upsertUser.mockResolvedValue({
      id: "dev-test-linked-ci",
      email: "dev-test-linked-ci@example.test",
      authProvider: "dev-test",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    restoreEnv();
  });

  it("is unavailable unless the explicit dev-auth flag is enabled", async () => {
    delete process.env.LAICA_DEV_AUTH_ENABLED;
    const server = await startTestServer();

    const response = await requestHttp(server, {
      method: "POST",
      path: "/api/dev/auth/linked-token",
      headers: {
        "content-type": "application/json",
        "x-laica-dev-auth": "dev-auth-test-secret",
      },
      body: validRequestBody(),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ message: "Not found" });
    expect(mocks.storage.upsertUser).not.toHaveBeenCalled();
    expect(mocks.createFirebaseCustomToken).not.toHaveBeenCalled();
  });

  it("stays unavailable in production and Replit deployments", async () => {
    const server = await startTestServer();

    process.env.NODE_ENV = "production";
    const productionResponse = await requestHttp(server, {
      method: "POST",
      path: "/api/dev/auth/linked-token",
      headers: {
        "content-type": "application/json",
        "x-laica-dev-auth": "dev-auth-test-secret",
      },
      body: validRequestBody(),
    });

    process.env.NODE_ENV = "test";
    process.env.REPLIT_DEPLOYMENT = "1";
    const replitResponse = await requestHttp(server, {
      method: "POST",
      path: "/api/dev/auth/linked-token",
      headers: {
        "content-type": "application/json",
        "x-laica-dev-auth": "dev-auth-test-secret",
      },
      body: validRequestBody(),
    });

    expect(productionResponse.status).toBe(404);
    expect(replitResponse.status).toBe(404);
    expect(mocks.storage.upsertUser).not.toHaveBeenCalled();
    expect(mocks.createFirebaseCustomToken).not.toHaveBeenCalled();
  });

  it("rejects requests without the matching guarded dev-auth header", async () => {
    const server = await startTestServer();

    const missingHeaderResponse = await requestHttp(server, {
      method: "POST",
      path: "/api/dev/auth/linked-token",
      headers: {
        "content-type": "application/json",
      },
      body: validRequestBody(),
    });
    const wrongHeaderResponse = await requestHttp(server, {
      method: "POST",
      path: "/api/dev/auth/linked-token",
      headers: {
        "content-type": "application/json",
        "x-laica-dev-auth": "wrong-secret",
      },
      body: validRequestBody(),
    });

    expect(missingHeaderResponse.status).toBe(401);
    expect(wrongHeaderResponse.status).toBe(401);
    expect(await missingHeaderResponse.json()).toEqual({ message: "Unauthorized" });
    expect(await wrongHeaderResponse.json()).toEqual({ message: "Unauthorized" });
    expect(mocks.storage.upsertUser).not.toHaveBeenCalled();
    expect(mocks.createFirebaseCustomToken).not.toHaveBeenCalled();
  });

  it("validates the request before seeding or minting a token", async () => {
    const server = await startTestServer();

    const response = await requestHttp(server, {
      method: "POST",
      path: "/api/dev/auth/linked-token",
      headers: {
        "content-type": "application/json",
        "x-laica-dev-auth": "dev-auth-test-secret",
      },
      body: JSON.stringify({
        uid: "real-user-id",
        email: "real-user-id@example.test",
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: "INVALID_REQUEST",
      message: "Invalid linked dev auth request",
    });
    expect(mocks.storage.upsertUser).not.toHaveBeenCalled();
    expect(mocks.createFirebaseCustomToken).not.toHaveBeenCalled();
  });

  it("rejects dev-test users that are not explicitly allowlisted", async () => {
    const server = await startTestServer();

    const response = await requestHttp(server, {
      method: "POST",
      path: "/api/dev/auth/linked-token",
      headers: {
        "content-type": "application/json",
        "x-laica-dev-auth": "dev-auth-test-secret",
      },
      body: validRequestBody("dev-test-other-user"),
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      code: "DEV_AUTH_USER_NOT_ALLOWED",
      message: "Linked dev auth user is not allowlisted",
    });
    expect(mocks.storage.upsertUser).not.toHaveBeenCalled();
    expect(mocks.createFirebaseCustomToken).not.toHaveBeenCalled();
  });

  it("seeds the allowlisted linked test user and returns a Firebase custom token", async () => {
    const server = await startTestServer();

    const response = await requestHttp(server, {
      method: "POST",
      path: "/api/dev/auth/linked-token",
      headers: {
        "content-type": "application/json",
        "x-laica-dev-auth": "dev-auth-test-secret",
      },
      body: validRequestBody(),
    });

    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("private, no-store, max-age=0");
    expect(response.headers.pragma).toBe("no-cache");
    expect(await response.json()).toEqual({
      customToken: "custom-token",
      user: {
        id: "dev-test-linked-ci",
        email: "dev-test-linked-ci@example.test",
        authMode: "linked",
      },
    });
    expect(mocks.storage.upsertUser).toHaveBeenCalledWith({
      id: "dev-test-linked-ci",
      email: "dev-test-linked-ci@example.test",
      firstName: "Linked",
      lastName: "Test Cook",
      profileImageUrl: "",
      authProvider: "dev-test",
      firebaseUid: "dev-test-linked-ci",
    });
    expect(mocks.createFirebaseCustomToken).toHaveBeenCalledWith("dev-test-linked-ci", {
      laicaDevAuth: true,
    });
  });
});
