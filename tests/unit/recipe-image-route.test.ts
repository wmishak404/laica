import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import { z } from "zod";
import { resetRateLimitBucketsForTest } from "../../server/rate-limit";
import { requestHttp, type TestResponse } from "./http-test-client";

const mocks = vi.hoisted(() => ({
  firebaseUser: {
    uid: "recipe-image-user",
    email: "image@example.com",
    displayName: "Recipe Image User",
    photoURL: null,
    emailVerified: true,
    authProvider: "google",
    isAnonymous: false,
  },
  resolveRecipeImagesForRequest: vi.fn(),
  serveRecipeImageCacheObject: vi.fn(),
}));

vi.mock("../../server/firebaseAuth", () => ({
  verifyFirebaseToken: vi.fn((req, _res, next) => {
    req.firebaseUser = mocks.firebaseUser;
    next();
  }),
  getFirebaseUserFromRequest: vi.fn(),
}));

vi.mock("../../server/storage", () => ({
  storage: {},
}));

vi.mock("../../server/openai", () => ({
  getRecipeSuggestions: vi.fn(),
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

vi.mock("../../server/recipe-images", () => ({
  resolveRecipeImagesForRequest: mocks.resolveRecipeImagesForRequest,
  serveRecipeImageCacheObject: mocks.serveRecipeImageCacheObject,
}));

const authHeaders = {
  "Content-Type": "application/json",
  Authorization: "Bearer test-token",
};

const recipeImagePayload = {
  recipes: [
    {
      recipeName: "Pantry Rice Bowl",
      cuisine: "Pantry-first",
      pantryIngredientsUsed: ["rice", "eggs"],
    },
    {
      recipeName: "Spinach Egg Skillet",
      cuisine: "Pantry-first",
      pantryIngredientsUsed: ["eggs", "spinach"],
    },
    {
      recipeName: "Rice Frittata",
      cuisine: "Pantry-first",
      pantryIngredientsUsed: ["rice", "eggs", "spinach"],
    },
  ],
};

async function startTestServer() {
  const { registerRoutes } = await import("../../server/routes");
  const app = express();
  app.use(express.json());

  return await registerRoutes(app);
}

async function postJson(path: string, body: unknown, headers = authHeaders): Promise<TestResponse> {
  const server = await startTestServer();
  return await requestHttp(server, {
    method: "POST",
    path,
    headers,
    body: JSON.stringify(body),
  });
}

describe("recipe image routes", () => {
  beforeEach(() => {
    resetRateLimitBucketsForTest();
    mocks.resolveRecipeImagesForRequest.mockResolvedValue({ status: "pending" });
    mocks.serveRecipeImageCacheObject.mockImplementation((_req, res) => {
      res.status(200).send(Buffer.from("image-bytes"));
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("requires Firebase auth for image resolution", async () => {
    const response = await postJson(
      "/api/recipe-images/resolve",
      recipeImagePayload,
      { "Content-Type": "application/json" },
    );

    expect(response.status).toBe(401);
    expect(mocks.resolveRecipeImagesForRequest).not.toHaveBeenCalled();
  });

  it("passes structured recipe data to the resolver", async () => {
    mocks.resolveRecipeImagesForRequest.mockResolvedValue({
      status: "ready",
      images: [
        { recipeIndex: 0, imageUrl: "/api/recipe-images/a", cacheKey: "a" },
        { recipeIndex: 1, imageUrl: "/api/recipe-images/b", cacheKey: "b" },
        { recipeIndex: 2, imageUrl: "/api/recipe-images/c", cacheKey: "c" },
      ],
    });

    const response = await postJson("/api/recipe-images/resolve", recipeImagePayload);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ready",
      images: [
        { recipeIndex: 0, imageUrl: "/api/recipe-images/a", cacheKey: "a" },
        { recipeIndex: 1, imageUrl: "/api/recipe-images/b", cacheKey: "b" },
        { recipeIndex: 2, imageUrl: "/api/recipe-images/c", cacheKey: "c" },
      ],
    });
    expect(mocks.resolveRecipeImagesForRequest).toHaveBeenCalledWith(
      recipeImagePayload,
      expect.objectContaining({
        consumeGenerationRateLimit: expect.any(Function),
      }),
    );
  });

  it("returns a validation error for invalid resolver payloads", async () => {
    mocks.resolveRecipeImagesForRequest.mockRejectedValue(new z.ZodError([
      {
        code: z.ZodIssueCode.custom,
        message: "Expected three recipes",
        path: ["recipes"],
      },
    ]));

    const response = await postJson("/api/recipe-images/resolve", { recipes: [] });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(expect.objectContaining({
      code: "INVALID_REQUEST",
      message: "Invalid recipe image request",
    }));
  });

  it("does not charge repeated pending polls against the generation limit", async () => {
    const responses: TestResponse[] = [];
    for (let index = 0; index < 13; index += 1) {
      responses.push(await postJson("/api/recipe-images/resolve", recipeImagePayload));
    }

    expect(responses.every((response) => response.status === 200)).toBe(true);
    expect(mocks.resolveRecipeImagesForRequest).toHaveBeenCalledTimes(13);
  });

  it("rate-limits repeated image generation starts per user", async () => {
    mocks.resolveRecipeImagesForRequest.mockImplementation(async (_payload, options) => {
      const allowed = await options.consumeGenerationRateLimit();
      return allowed ? { status: "pending" } : { status: "unavailable", reason: "rate_limited" };
    });

    const responses: TestResponse[] = [];
    for (let index = 0; index < 13; index += 1) {
      responses.push(await postJson("/api/recipe-images/resolve", recipeImagePayload));
    }

    expect(responses.slice(0, 12).every((response) => response.status === 200)).toBe(true);
    expect(responses[12].status).toBe(429);
    expect(await responses[12].json()).toEqual(expect.objectContaining({
      code: "RATE_LIMITED",
    }));
  });

  it("serves opaque image routes without Firebase auth", async () => {
    const server = await startTestServer();
    const response = await requestHttp(server, {
      method: "GET",
      path: "/api/recipe-images/0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    });

    expect(response.status).toBe(200);
    expect(response.text).toBe("image-bytes");
    expect(mocks.serveRecipeImageCacheObject).toHaveBeenCalled();
  });
});
