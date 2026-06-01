import { afterEach, describe, expect, it, vi } from "vitest";
import express from "express";
import { requestHttp } from "./http-test-client";

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
  return server;
}

describe("Phase 0 protected routes", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("requires auth before recipe suggestion generation", async () => {
    const server = await startTestServer();

    const response = await requestHttp(server, {
      method: "POST",
      path: "/api/recipes/suggestions",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferences: "quick dinner" }),
    });

    expect(response.status).toBe(401);
    expect(mocks.getRecipeSuggestions).not.toHaveBeenCalled();
  });

  it("accepts longer recipe suggestion preferences after staple context is added", async () => {
    mocks.getRecipeSuggestions.mockResolvedValueOnce({ recipes: [] });
    const server = await startTestServer();

    const response = await requestHttp(server, {
      method: "POST",
      path: "/api/recipes/suggestions",
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
  });

  it("accepts longer pantry recipe preferences after staple context is added", async () => {
    mocks.getRecipeSuggestions.mockResolvedValueOnce({ recipes: [] });
    const server = await startTestServer();

    const response = await requestHttp(server, {
      method: "POST",
      path: "/api/recipes/pantry",
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
  });

  it("blocks pantry recipe generation when the pantry ingredient list is empty", async () => {
    const server = await startTestServer();

    const response = await requestHttp(server, {
      method: "POST",
      path: "/api/recipes/pantry",
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
    expect(await response.json()).toEqual({
      code: "EMPTY_PANTRY",
      message: "Your pantry is empty. Add or scan pantry items before I can suggest recipes.",
    });
    expect(mocks.getRecipeSuggestions).not.toHaveBeenCalled();
  });

  it("returns a typed 400 when recipe suggestion preferences exceed the route contract", async () => {
    const server = await startTestServer();

    const response = await requestHttp(server, {
      method: "POST",
      path: "/api/recipes/suggestions",
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
    expect(await response.json()).toEqual({
      code: "PREFERENCES_TOO_LONG",
      message: "Invalid recipe suggestions request",
    });
    expect(mocks.getRecipeSuggestions).not.toHaveBeenCalled();
  });

  it("returns a typed 400 when pantry recipe preferences exceed the route contract", async () => {
    const server = await startTestServer();

    const response = await requestHttp(server, {
      method: "POST",
      path: "/api/recipes/pantry",
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
    expect(await response.json()).toEqual({
      code: "PREFERENCES_TOO_LONG",
      message: "Invalid pantry recipe request",
    });
    expect(mocks.getRecipeSuggestions).not.toHaveBeenCalled();
  });

  it("returns a typed 400 for invalid cooking step requests", async () => {
    const server = await startTestServer();

    const response = await requestHttp(server, {
      method: "POST",
      path: "/api/cooking/steps",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({ recipeName: "" }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: "INVALID_REQUEST",
      message: "Invalid cooking steps request",
    });
  });

  it("ignores request-body authUserId when updating user settings", async () => {
    mocks.storage.upsertUserSettings.mockResolvedValueOnce({ authUserId: "owner-user" });
    const server = await startTestServer();

    const response = await requestHttp(server, {
      method: "PUT",
      path: "/api/user/settings",
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
  });

  it("does not mark authenticated speech synthesis responses as publicly cacheable", async () => {
    mocks.synthesizeSpeech.mockResolvedValueOnce(Buffer.from("audio"));
    const server = await startTestServer();

    const response = await requestHttp(server, {
      method: "POST",
      path: "/api/speech/synthesize",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({ text: "hello from test" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("private, no-store, max-age=0");
    expect(response.headers["pragma"]).toBe("no-cache");
    expect(response.headers["vary"]).toContain("Authorization");
  });

  it("keeps transcription unavailable instead of blocking server startup when OPENAI_API_KEY is missing", async () => {
    const originalOpenAIKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    try {
      const server = await startTestServer();
      const boundary = "laica-test-boundary";
      const body = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="audio"; filename="audio.wav"',
        "Content-Type: audio/wav",
        "",
        "fake audio bytes",
        `--${boundary}--`,
        "",
      ].join("\r\n");

      const response = await requestHttp(server, {
        method: "POST",
        path: "/api/speech/transcribe",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          Authorization: "Bearer test-token",
        },
        body,
      });

      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({
        error: "Speech transcription is unavailable",
        details: "OPENAI_API_KEY is not configured",
      });
    } finally {
      if (typeof originalOpenAIKey === "string") {
        process.env.OPENAI_API_KEY = originalOpenAIKey;
      } else {
        delete process.env.OPENAI_API_KEY;
      }
    }
  });

  it("rejects cross-user cooking-session mutation", async () => {
    mocks.storage.getCookingSession.mockResolvedValueOnce({
      id: 42,
      authUserId: "other-user",
    });
    const server = await startTestServer();

    const response = await requestHttp(server, {
      method: "PUT",
      path: "/api/cooking/session/42",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({ completedSteps: 1 }),
    });

    expect(response.status).toBe(403);
    expect(mocks.storage.updateCookingSession).not.toHaveBeenCalled();
  });
});
