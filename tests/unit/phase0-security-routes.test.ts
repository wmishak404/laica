import { afterEach, describe, expect, it, vi } from "vitest";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import express from "express";

const mocks = vi.hoisted(() => ({
  storage: {
    getCookingSession: vi.fn(),
    updateCookingSession: vi.fn(),
    upsertUserSettings: vi.fn(),
  },
  getRecipeSuggestions: vi.fn(),
  synthesizeSpeech: vi.fn(),
}));

vi.mock("../../server/firebaseAuth", () => ({
  verifyFirebaseToken: vi.fn((req, _res, next) => {
    req.firebaseUser = {
      uid: "owner-user",
      email: "owner@example.com",
      displayName: "Owner User",
      photoURL: null,
      emailVerified: true,
    };
    next();
  }),
  getFirebaseUserFromRequest: vi.fn(),
}));

vi.mock("../../server/storage", () => ({
  storage: mocks.storage,
}));

vi.mock("../../server/openai", () => ({
  getRecipeSuggestions: mocks.getRecipeSuggestions,
  getCookingSteps: vi.fn(),
  getGroceryList: vi.fn(),
  getIngredientAlternatives: vi.fn(),
  getCookingAssistance: vi.fn(),
  analyzeIngredientImage: vi.fn(),
  getSlopBowlRecipe: vi.fn(),
}));

vi.mock("../../server/admin-routes", () => ({
  registerAdminRoutes: vi.fn(),
}));

vi.mock("../../server/elevenlabs", () => ({
  synthesizeSpeech: mocks.synthesizeSpeech,
  getAvailableVoices: vi.fn(),
  COOKING_VOICES: [],
}));

vi.mock("../../server/db", () => ({
  db: {},
}));

async function startTestServer() {
  const { registerRoutes } = await import("../../server/routes");
  const app = express();
  app.use(express.json());

  const server = await registerRoutes(app);

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
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

describe("Phase 0 protected routes", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("requires auth before recipe suggestion generation", async () => {
    const { server, url } = await startTestServer();

    try {
      const response = await fetch(`${url}/api/recipes/suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: "quick dinner" }),
      });

      expect(response.status).toBe(401);
      expect(mocks.getRecipeSuggestions).not.toHaveBeenCalled();
    } finally {
      await closeServer(server);
    }
  });

  it("accepts longer recipe suggestion preferences after staple context is added", async () => {
    mocks.getRecipeSuggestions.mockResolvedValueOnce({ recipes: [] });
    const { server, url } = await startTestServer();

    try {
      const response = await fetch(`${url}/api/recipes/suggestions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify({
          preferences: "x".repeat(750),
          ingredients: ["rice", "eggs"],
        }),
      });

      expect(response.status).toBe(200);
      expect(mocks.getRecipeSuggestions).toHaveBeenCalledWith("x".repeat(750), ["rice", "eggs"]);
    } finally {
      await closeServer(server);
    }
  });

  it("accepts longer pantry recipe preferences after staple context is added", async () => {
    mocks.getRecipeSuggestions.mockResolvedValueOnce({ recipes: [] });
    const { server, url } = await startTestServer();

    try {
      const response = await fetch(`${url}/api/recipes/pantry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify({
          preferences: "x".repeat(750),
          ingredients: ["rice", "eggs"],
        }),
      });

      expect(response.status).toBe(200);
      expect(mocks.getRecipeSuggestions).toHaveBeenCalledWith("x".repeat(750), ["rice", "eggs"]);
    } finally {
      await closeServer(server);
    }
  });

  it("blocks pantry recipe generation when the pantry ingredient list is empty", async () => {
    const { server, url } = await startTestServer();

    try {
      const response = await fetch(`${url}/api/recipes/pantry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify({
          preferences: "quick dinner",
          ingredients: [],
        }),
      });

      expect(response.status).toBe(422);
      await expect(response.json()).resolves.toEqual({
        code: "EMPTY_PANTRY",
        message: "Your pantry is empty. Add or scan pantry items before I can suggest recipes.",
      });
      expect(mocks.getRecipeSuggestions).not.toHaveBeenCalled();
    } finally {
      await closeServer(server);
    }
  });

  it("returns a typed 400 when recipe suggestion preferences exceed the route contract", async () => {
    const { server, url } = await startTestServer();

    try {
      const response = await fetch(`${url}/api/recipes/suggestions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify({
          preferences: "x".repeat(1001),
          ingredients: ["rice", "eggs"],
        }),
      });

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        code: "PREFERENCES_TOO_LONG",
        message: "Invalid recipe suggestions request",
      });
      expect(mocks.getRecipeSuggestions).not.toHaveBeenCalled();
    } finally {
      await closeServer(server);
    }
  });

  it("returns a typed 400 when pantry recipe preferences exceed the route contract", async () => {
    const { server, url } = await startTestServer();

    try {
      const response = await fetch(`${url}/api/recipes/pantry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify({
          preferences: "x".repeat(1001),
          ingredients: ["rice", "eggs"],
        }),
      });

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        code: "PREFERENCES_TOO_LONG",
        message: "Invalid pantry recipe request",
      });
      expect(mocks.getRecipeSuggestions).not.toHaveBeenCalled();
    } finally {
      await closeServer(server);
    }
  });

  it("returns a typed 400 for invalid cooking step requests", async () => {
    const { server, url } = await startTestServer();

    try {
      const response = await fetch(`${url}/api/cooking/steps`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify({ recipeName: "" }),
      });

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        code: "INVALID_REQUEST",
        message: "Invalid cooking steps request",
      });
    } finally {
      await closeServer(server);
    }
  });

  it("ignores request-body authUserId when updating user settings", async () => {
    mocks.storage.upsertUserSettings.mockResolvedValueOnce({ authUserId: "owner-user" });
    const { server, url } = await startTestServer();

    try {
      const response = await fetch(`${url}/api/user/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify({
          authUserId: "victim-user",
          voiceEnabled: false,
        }),
      });

      expect(response.status).toBe(200);
      expect(mocks.storage.upsertUserSettings).toHaveBeenCalledTimes(1);

      const [calledUserId, calledSettings] = mocks.storage.upsertUserSettings.mock.calls[0]!;
      expect(calledUserId).toBe("owner-user");
      expect(calledSettings).toEqual({ voiceEnabled: false });
      expect(calledSettings).not.toHaveProperty("authUserId");
    } finally {
      await closeServer(server);
    }
  });

  it("does not mark authenticated speech synthesis responses as publicly cacheable", async () => {
    mocks.synthesizeSpeech.mockResolvedValueOnce(Buffer.from("audio"));
    const { server, url } = await startTestServer();

    try {
      const response = await fetch(`${url}/api/speech/synthesize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify({ text: "hello from test" }),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("private, no-store, max-age=0");
      expect(response.headers.get("pragma")).toBe("no-cache");
      expect(response.headers.get("vary")).toContain("Authorization");
    } finally {
      await closeServer(server);
    }
  });

  it("rejects cross-user cooking-session mutation", async () => {
    mocks.storage.getCookingSession.mockResolvedValueOnce({
      id: 42,
      authUserId: "other-user",
    });
    const { server, url } = await startTestServer();

    try {
      const response = await fetch(`${url}/api/cooking/session/42`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify({ completedSteps: 1 }),
      });

      expect(response.status).toBe(403);
      expect(mocks.storage.updateCookingSession).not.toHaveBeenCalled();
    } finally {
      await closeServer(server);
    }
  });
});
