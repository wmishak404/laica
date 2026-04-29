import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";

const firebaseAdminMocks = vi.hoisted(() => ({
  applicationDefault: vi.fn(() => ({ type: "application-default" })),
  cert: vi.fn((serviceAccount) => ({ serviceAccount })),
  getApps: vi.fn(() => []),
  initializeApp: vi.fn(),
  verifyIdToken: vi.fn(),
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
    });
  });
});
