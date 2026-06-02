import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import { requestHttp, type TestResponse } from "./http-test-client";

const mocks = vi.hoisted(() => ({
  firebaseUser: {
    uid: "linked-user-id",
    email: "linked@example.com",
    displayName: "Linked User",
    photoURL: null,
    emailVerified: true,
    authProvider: "google",
    isAnonymous: false,
  } as {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    emailVerified: boolean;
    authProvider: string | null;
    isAnonymous: boolean;
  },
  getFirebaseUserFromRequest: vi.fn(),
  storage: {
    createCookingSession: vi.fn(),
    getCookingSession: vi.fn(),
    updateCookingSession: vi.fn(),
    getUserCookingSessions: vi.fn(),
    getActiveCookingSession: vi.fn(),
    deleteCookingSession: vi.fn(),
    deleteAllCookingSessions: vi.fn(),
    updateUserProfile: vi.fn(),
  },
  getCookingAssistance: vi.fn(),
  getGroceryList: vi.fn(),
  getIngredientAlternatives: vi.fn(),
  getAvailableVoices: vi.fn(),
  cookingVoices: [
    {
      id: "voice-cook-1",
      name: "Test Cook",
      description: "Clear cooking guidance",
      category: "test",
    },
  ],
  dbInsert: vi.fn(),
  dbValues: vi.fn(),
  dbReturning: vi.fn(),
}));

vi.mock("../../server/firebaseAuth", () => ({
  verifyFirebaseToken: vi.fn((req, _res, next) => {
    req.firebaseUser = mocks.firebaseUser;
    next();
  }),
  getFirebaseUserFromRequest: mocks.getFirebaseUserFromRequest,
}));

vi.mock("../../server/storage", () => ({
  storage: mocks.storage,
}));

vi.mock("../../server/openai", () => ({
  getRecipeSuggestions: vi.fn(),
  getCookingSteps: vi.fn(),
  getGroceryList: mocks.getGroceryList,
  getIngredientAlternatives: mocks.getIngredientAlternatives,
  getCookingAssistance: mocks.getCookingAssistance,
  analyzeIngredientImage: vi.fn(),
  getSlopBowlRecipe: vi.fn(),
}));

vi.mock("../../server/admin-routes", () => ({
  registerAdminRoutes: vi.fn(),
}));

vi.mock("../../server/elevenlabs", () => ({
  synthesizeSpeech: vi.fn(),
  getAvailableVoices: mocks.getAvailableVoices,
  COOKING_VOICES: mocks.cookingVoices,
}));

vi.mock("../../server/db", () => ({
  db: {
    insert: mocks.dbInsert,
  },
}));

const authHeaders = {
  "Content-Type": "application/json",
  Authorization: "Bearer test-token",
};

const sampleSession = {
  id: 42,
  authUserId: "linked-user-id",
  recipeName: "Test Pasta",
  recipeDescription: "A direct route-contract fixture",
  recipeSnapshot: {
    recipeName: "Test Pasta",
    description: "A direct route-contract fixture",
    cookTime: 20,
    difficulty: "easy",
    cuisine: "Italian",
    pantryMatch: 80,
    pantryIngredientsUsed: ["pasta"],
    additionalIngredientsNeeded: ["tomato"],
    missingIngredients: ["tomato"],
    instructions: ["Boil pasta"],
    ingredients: [{ name: "pasta", quantity: "1 cup", forSteps: [1] }],
    steps: [{ id: 1, instruction: "Boil pasta", duration: 10 }],
    isFusion: false,
  },
  ingredientsUsed: ["pasta"],
  ingredientsRemaining: null,
  cookingDuration: null,
  completedSteps: 0,
  totalSteps: 2,
  completed: false,
  userRating: null,
  userNotes: null,
  startedAt: "2026-06-01T12:00:00.000Z",
  completedAt: null,
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

describe("P0 user-facing route contracts", () => {
  beforeEach(() => {
    mocks.firebaseUser = {
      uid: "linked-user-id",
      email: "linked@example.com",
      displayName: "Linked User",
      photoURL: null,
      emailVerified: true,
      authProvider: "google",
      isAnonymous: false,
    };
    mocks.getFirebaseUserFromRequest.mockResolvedValue({
      uid: "linked-user-id",
      email: "linked@example.com",
      isAnonymous: false,
    });
    mocks.storage.createCookingSession.mockResolvedValue(sampleSession);
    mocks.storage.getCookingSession.mockResolvedValue(sampleSession);
    mocks.storage.updateCookingSession.mockResolvedValue({
      ...sampleSession,
      completedSteps: 1,
    });
    mocks.storage.getUserCookingSessions.mockResolvedValue([sampleSession]);
    mocks.storage.getActiveCookingSession.mockResolvedValue(sampleSession);
    mocks.storage.deleteCookingSession.mockResolvedValue(true);
    mocks.storage.deleteAllCookingSessions.mockResolvedValue(2);
    mocks.storage.updateUserProfile.mockResolvedValue({
      id: "linked-user-id",
      pantryIngredients: [],
    });
    mocks.getCookingAssistance.mockResolvedValue("Lower the heat and keep stirring.");
    mocks.getIngredientAlternatives.mockResolvedValue({
      alternatives: ["tamari", "coconut aminos"],
    });
    mocks.getAvailableVoices.mockResolvedValue([
      {
        id: "voice-live-1",
        name: "Live Mock Voice",
        category: "generated",
        description: "Provider response without a live ElevenLabs call",
        previewUrl: "https://example.test/voice.mp3",
      },
    ]);
    mocks.dbReturning.mockResolvedValue([{ id: 987 }]);
    mocks.dbValues.mockReturnValue({ returning: mocks.dbReturning });
    mocks.dbInsert.mockReturnValue({ values: mocks.dbValues });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("writes feedback anonymously without requiring auth", async () => {
    const response = await postJson(
      "/api/feedback",
      {
        currentPage: "/cook",
        feedbackText: "The prep tray made this easier.",
      },
      { "Content-Type": "application/json" },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      message: "Feedback received successfully",
      id: 987,
    });
    expect(mocks.getFirebaseUserFromRequest).not.toHaveBeenCalled();
    expect(mocks.dbValues).toHaveBeenCalledWith({
      currentPage: "/cook",
      feedbackText: "The prep tray made this easier.",
      authUserId: null,
    });
  });

  it("adds the Firebase uid to authenticated feedback writes", async () => {
    const response = await postJson("/api/feedback", {
      currentPage: "/history",
      feedbackText: "History deletion was clear.",
    });

    expect(response.status).toBe(200);
    expect(mocks.getFirebaseUserFromRequest).toHaveBeenCalledTimes(1);
    expect(mocks.dbValues).toHaveBeenCalledWith({
      currentPage: "/history",
      feedbackText: "History deletion was clear.",
      authUserId: "linked-user-id",
    });
  });

  it("rejects invalid feedback before writing", async () => {
    const response = await postJson("/api/feedback", {
      currentPage: "",
      feedbackText: "x",
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "Invalid feedback request" });
    expect(mocks.dbInsert).not.toHaveBeenCalled();
  });

  it("routes cooking assistance through the mocked OpenAI helper", async () => {
    const response = await postJson("/api/cooking/assistance", {
      step: "Saute onions until translucent.",
      question: "How do I know they are done?",
    });

    expect(response.status).toBe(200);
    expect(response.text).toBe("Lower the heat and keep stirring.");
    expect(mocks.getCookingAssistance).toHaveBeenCalledWith(
      "Saute onions until translucent.",
      "How do I know they are done?",
    );
  });

  it("rejects invalid cooking assistance before provider calls", async () => {
    const response = await postJson("/api/cooking/assistance", {
      step: "",
      question: "Help?",
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: "INVALID_REQUEST",
      message: "Invalid cooking assistance request",
    });
    expect(mocks.getCookingAssistance).not.toHaveBeenCalled();
  });

  it("keeps the disabled grocery list route unavailable and provider-light", async () => {
    const response = await postJson("/api/grocery/list", {
      recipes: ["Test Pasta"],
    });

    expect(response.status).toBe(404);
    expect(mocks.getGroceryList).not.toHaveBeenCalled();
  });

  it("routes ingredient alternatives through the mocked OpenAI helper", async () => {
    const response = await postJson("/api/ingredients/alternatives", {
      ingredient: "soy sauce",
      reason: "gluten-free dinner",
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      alternatives: ["tamari", "coconut aminos"],
    });
    expect(mocks.getIngredientAlternatives).toHaveBeenCalledWith(
      "soy sauce",
      "gluten-free dinner",
    );
  });

  it("rejects invalid ingredient alternatives before provider calls", async () => {
    const response = await postJson("/api/ingredients/alternatives", {
      ingredient: "soy sauce",
      reason: "",
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: "INVALID_REQUEST",
      message: "Invalid ingredient alternatives request",
    });
    expect(mocks.getIngredientAlternatives).not.toHaveBeenCalled();
  });

  it("starts a linked-account cooking session with normalized session data", async () => {
    const response = await postJson("/api/cooking/session/start", {
      recipeName: "Test Pasta",
      recipeDescription: "A direct route-contract fixture",
      recipeSnapshot: sampleSession.recipeSnapshot,
      totalSteps: 2,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(sampleSession);
    expect(mocks.storage.createCookingSession).toHaveBeenCalledWith({
      authUserId: "linked-user-id",
      recipeName: "Test Pasta",
      recipeDescription: "A direct route-contract fixture",
      recipeSnapshot: sampleSession.recipeSnapshot,
      totalSteps: 2,
      ingredientsUsed: ["pasta"],
      completedSteps: 0,
      completed: false,
    });
  });

  it("blocks anonymous users from durable cooking-session writes", async () => {
    mocks.firebaseUser = {
      uid: "guest-user-id",
      email: null,
      displayName: null,
      photoURL: null,
      emailVerified: false,
      authProvider: "anonymous",
      isAnonymous: true,
    };

    const response = await postJson("/api/cooking/session/start", {
      recipeName: "Test Pasta",
      totalSteps: 2,
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      code: "LINKED_ACCOUNT_REQUIRED",
      linkedAccountReason: "durable_save",
      message: "Sign in or create an account to save your ingredients and profile.",
    });
    expect(mocks.storage.createCookingSession).not.toHaveBeenCalled();
  });

  it("updates cooking-session progress after ownership verification", async () => {
    const server = await startTestServer();
    const response = await requestHttp(server, {
      method: "PUT",
      path: "/api/cooking/session/42",
      headers: authHeaders,
      body: JSON.stringify({
        completedSteps: 1,
        ingredientsRemaining: ["tomato"],
        userNotes: "Needs more salt",
      }),
    });

    expect(response.status).toBe(200);
    expect(mocks.storage.getCookingSession).toHaveBeenCalledWith(42);
    expect(mocks.storage.updateCookingSession).toHaveBeenCalledWith(42, {
      completedSteps: 1,
      ingredientsRemaining: ["tomato"],
      userNotes: "Needs more salt",
    });
  });

  it("completes a cooking session with completion fields and completed=true", async () => {
    const response = await postJson("/api/cooking/session/42/complete", {
      ingredientsRemaining: ["tomato"],
      userRating: 5,
      userNotes: "Worked well",
      cookingDuration: 24,
      completedSteps: 2,
    });

    expect(response.status).toBe(200);
    expect(mocks.storage.getCookingSession).toHaveBeenCalledWith(42);
    expect(mocks.storage.updateCookingSession).toHaveBeenCalledWith(42, {
      ingredientsRemaining: ["tomato"],
      userRating: 5,
      userNotes: "Worked well",
      cookingDuration: 24,
      completedSteps: 2,
      completed: true,
    });
  });

  it("lists cooking-session history with the route limit capped at 200", async () => {
    const server = await startTestServer();
    const response = await requestHttp(server, {
      method: "GET",
      path: "/api/cooking/sessions?limit=999",
      headers: { Authorization: "Bearer test-token" },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([sampleSession]);
    expect(mocks.storage.getUserCookingSessions).toHaveBeenCalledWith("linked-user-id", 200);
  });

  it("returns the active cooking session for the linked user", async () => {
    const server = await startTestServer();
    const response = await requestHttp(server, {
      method: "GET",
      path: "/api/cooking/session/active",
      headers: { Authorization: "Bearer test-token" },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(sampleSession);
    expect(mocks.storage.getActiveCookingSession).toHaveBeenCalledWith("linked-user-id");
  });

  it("deletes a single owned cooking session", async () => {
    const server = await startTestServer();
    const response = await requestHttp(server, {
      method: "DELETE",
      path: "/api/cooking/session/42",
      headers: { Authorization: "Bearer test-token" },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: "Session deleted" });
    expect(mocks.storage.getCookingSession).toHaveBeenCalledWith(42);
    expect(mocks.storage.deleteCookingSession).toHaveBeenCalledWith(42, "linked-user-id");
  });

  it("deletes all cooking sessions for the linked user", async () => {
    const server = await startTestServer();
    const response = await requestHttp(server, {
      method: "DELETE",
      path: "/api/cooking/sessions/all",
      headers: { Authorization: "Bearer test-token" },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      message: "Deleted 2 sessions",
      count: 2,
    });
    expect(mocks.storage.deleteAllCookingSessions).toHaveBeenCalledWith("linked-user-id");
  });

  it("resets pantry ingredients for a linked user", async () => {
    const response = await postJson("/api/user/pantry/reset", {});

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      message: "Pantry reset successfully",
      pantryIngredients: [],
    });
    expect(mocks.storage.updateUserProfile).toHaveBeenCalledWith("linked-user-id", {
      pantryIngredients: [],
    });
  });

  it("returns configured cooking voices and mocked provider voices", async () => {
    const server = await startTestServer();
    const response = await requestHttp(server, {
      method: "GET",
      path: "/api/speech/voices",
      headers: { Authorization: "Bearer test-token" },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      cookingVoices: mocks.cookingVoices,
      allVoices: [
        {
          id: "voice-live-1",
          name: "Live Mock Voice",
          category: "generated",
          description: "Provider response without a live ElevenLabs call",
          previewUrl: "https://example.test/voice.mp3",
        },
      ],
    });
    expect(mocks.getAvailableVoices).toHaveBeenCalledTimes(1);
  });
});
