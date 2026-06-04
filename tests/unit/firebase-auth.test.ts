import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";

const firebaseAdminMocks = vi.hoisted(() => ({
  applicationDefault: vi.fn(() => ({ type: "application-default" })),
  cert: vi.fn((serviceAccount) => ({ serviceAccount })),
  getApps: vi.fn(() => []),
  initializeApp: vi.fn(),
  verifyIdToken: vi.fn(),
  createCustomToken: vi.fn(),
  verifyAppCheckToken: vi.fn(),
}));

vi.mock("firebase-admin/app", () => ({
  applicationDefault: firebaseAdminMocks.applicationDefault,
  cert: firebaseAdminMocks.cert,
  getApps: firebaseAdminMocks.getApps,
  initializeApp: firebaseAdminMocks.initializeApp,
}));

vi.mock("firebase-admin/auth", () => ({
  getAuth: vi.fn(() => ({
    verifyIdToken: firebaseAdminMocks.verifyIdToken,
    createCustomToken: firebaseAdminMocks.createCustomToken,
  })),
}));

vi.mock("firebase-admin/app-check", () => ({
  getAppCheck: vi.fn(() => ({
    verifyToken: firebaseAdminMocks.verifyAppCheckToken,
  })),
}));

function createResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

describe("verifyFirebaseToken", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    delete process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    delete process.env.FIREBASE_APP_CHECK_ENFORCED;
    delete process.env.ANONYMOUS_AUTH_DISABLED;
  });

  it("rejects forged JWT payloads when Firebase Admin verification fails", async () => {
    firebaseAdminMocks.verifyIdToken.mockRejectedValueOnce(new Error("bad signature"));
    const { verifyFirebaseToken } = await import("../../server/firebaseAuth");
    const req = {
      headers: {
        authorization: "Bearer header.eyJzdWIiOiJ2aWN0aW0tdWlkIn0.signature",
      },
    } as Request;
    const res = createResponse();
    const next = vi.fn();

    await verifyFirebaseToken(req, res, next);

    expect(firebaseAdminMocks.verifyIdToken).toHaveBeenCalledWith("header.eyJzdWIiOiJ2aWN0aW0tdWlkIn0.signature");
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid Firebase token" });
    expect(next).not.toHaveBeenCalled();
    expect((req as any).firebaseUser).toBeUndefined();
  });

  it("attaches verified Firebase user data", async () => {
    firebaseAdminMocks.verifyIdToken.mockResolvedValueOnce({
      uid: "user-123",
      email: "cook@example.com",
      name: "Test Cook",
      picture: "https://example.com/cook.png",
      email_verified: true,
    });
    const { verifyFirebaseToken } = await import("../../server/firebaseAuth");
    const req = {
      headers: {
        authorization: "Bearer verified-token",
      },
    } as Request;
    const res = createResponse();
    const next = vi.fn();

    await verifyFirebaseToken(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect((req as any).firebaseUser).toEqual({
      uid: "user-123",
      email: "cook@example.com",
      displayName: "Test Cook",
      photoURL: "https://example.com/cook.png",
      emailVerified: true,
      authProvider: null,
      isAnonymous: false,
    });
  });

  it("marks anonymous Firebase sessions without requiring email", async () => {
    firebaseAdminMocks.verifyIdToken.mockResolvedValueOnce({
      uid: "guest-123",
      firebase: {
        sign_in_provider: "anonymous",
      },
    });
    const { verifyFirebaseToken } = await import("../../server/firebaseAuth");
    const req = {
      headers: {
        authorization: "Bearer anonymous-token",
      },
    } as Request;
    const res = createResponse();
    const next = vi.fn();

    await verifyFirebaseToken(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect((req as any).firebaseUser).toEqual({
      uid: "guest-123",
      email: null,
      displayName: null,
      photoURL: null,
      emailVerified: false,
      authProvider: "anonymous",
      isAnonymous: true,
    });
  });

  it("rejects missing App Check tokens when enforcement is enabled", async () => {
    process.env.FIREBASE_APP_CHECK_ENFORCED = "true";
    const { verifyFirebaseToken } = await import("../../server/firebaseAuth");
    const req = {
      headers: {
        authorization: "Bearer verified-token",
      },
    } as Request;
    const res = createResponse();
    const next = vi.fn();

    await verifyFirebaseToken(req, res, next);

    expect(firebaseAdminMocks.verifyIdToken).not.toHaveBeenCalled();
    expect(firebaseAdminMocks.verifyAppCheckToken).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      code: "APP_CHECK_REQUIRED",
      message: "Firebase App Check token is required",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("verifies App Check before accepting Firebase tokens when enforcement is enabled", async () => {
    process.env.FIREBASE_APP_CHECK_ENFORCED = "true";
    firebaseAdminMocks.verifyAppCheckToken.mockResolvedValueOnce({ appId: "app-1" });
    firebaseAdminMocks.verifyIdToken.mockResolvedValueOnce({
      uid: "user-123",
      email: "cook@example.com",
      firebase: {
        sign_in_provider: "google.com",
      },
    });
    const { verifyFirebaseToken } = await import("../../server/firebaseAuth");
    const req = {
      headers: {
        authorization: "Bearer verified-token",
        "x-firebase-appcheck": "app-check-token",
      },
    } as Request;
    const res = createResponse();
    const next = vi.fn();

    await verifyFirebaseToken(req, res, next);

    expect(firebaseAdminMocks.verifyAppCheckToken).toHaveBeenCalledWith("app-check-token");
    expect(firebaseAdminMocks.verifyIdToken).toHaveBeenCalledWith("verified-token");
    expect(next).toHaveBeenCalledOnce();
    expect((req as any).firebaseUser.isAnonymous).toBe(false);
  });

  it("honors the anonymous auth kill switch after token verification", async () => {
    process.env.ANONYMOUS_AUTH_DISABLED = "true";
    firebaseAdminMocks.verifyIdToken.mockResolvedValueOnce({
      uid: "guest-123",
      firebase: {
        sign_in_provider: "anonymous",
      },
    });
    const { verifyFirebaseToken } = await import("../../server/firebaseAuth");
    const req = {
      headers: {
        authorization: "Bearer anonymous-token",
      },
    } as Request;
    const res = createResponse();
    const next = vi.fn();

    await verifyFirebaseToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      code: "ANONYMOUS_ACCESS_DISABLED",
      message: "Guest cooking is temporarily unavailable. Continue with Google to keep cooking.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("delegates custom token creation to Firebase Admin", async () => {
    firebaseAdminMocks.createCustomToken.mockResolvedValueOnce("custom-token");
    const { createFirebaseCustomToken } = await import("../../server/firebaseAuth");

    await expect(
      createFirebaseCustomToken("dev-test-linked-ci", { laicaDevAuth: true }),
    ).resolves.toBe("custom-token");

    expect(firebaseAdminMocks.createCustomToken).toHaveBeenCalledWith("dev-test-linked-ci", {
      laicaDevAuth: true,
    });
  });
});
