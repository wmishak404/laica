import { afterEach, describe, expect, it, vi } from "vitest";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import express from "express";

const mocks = vi.hoisted(() => ({
  storage: {
    getCookingSession: vi.fn(),
    updateCookingSession: vi.fn(),
  },
  getRecipeSuggestions: vi.fn(),
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
  synthesizeSpeech: vi.fn(),
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
