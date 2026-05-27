import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import express from 'express';
import { resetRateLimitBucketsForTest } from '../../server/rate-limit';

const mocks = vi.hoisted(() => ({
  firebaseUser: {
    uid: 'guest-user-id',
    email: null,
    displayName: null,
    photoURL: null,
    emailVerified: false,
    authProvider: 'anonymous',
    isAnonymous: true,
  },
  storage: {
    reserveAnonymousRecipeGeneration: vi.fn(),
    refundAnonymousRecipeGeneration: vi.fn(),
    updateUserProfile: vi.fn(),
    getUser: vi.fn(),
    getUserCookingSessions: vi.fn(),
  },
  getRecipeSuggestions: vi.fn(),
  getSlopBowlRecipe: vi.fn(),
}));

vi.mock('../../server/firebaseAuth', () => ({
  verifyFirebaseToken: vi.fn((req, _res, next) => {
    req.firebaseUser = mocks.firebaseUser;
    next();
  }),
  getFirebaseUserFromRequest: vi.fn(),
}));

vi.mock('../../server/storage', () => ({
  storage: mocks.storage,
}));

vi.mock('../../server/openai', () => ({
  getRecipeSuggestions: mocks.getRecipeSuggestions,
  getCookingSteps: vi.fn(),
  getGroceryList: vi.fn(),
  getIngredientAlternatives: vi.fn(),
  getCookingAssistance: vi.fn(),
  analyzeIngredientImage: vi.fn(),
  getSlopBowlRecipe: mocks.getSlopBowlRecipe,
}));

vi.mock('../../server/admin-routes', () => ({
  registerAdminRoutes: vi.fn(),
}));

vi.mock('../../server/elevenlabs', () => ({
  synthesizeSpeech: vi.fn(),
  getAvailableVoices: vi.fn(),
  COOKING_VOICES: [],
}));

vi.mock('../../server/db', () => ({
  db: {},
}));

async function startTestServer() {
  const { registerRoutes } = await import('../../server/routes');
  const app = express();
  app.use(express.json());

  const server = await registerRoutes(app);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
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

describe('anonymous production gates', () => {
  beforeEach(() => {
    resetRateLimitBucketsForTest();
    delete process.env.ANONYMOUS_RECIPE_GENERATION_LIMIT;
    mocks.firebaseUser = {
      uid: 'guest-user-id',
      email: null,
      displayName: null,
      photoURL: null,
      emailVerified: false,
      authProvider: 'anonymous',
      isAnonymous: true,
    };
    mocks.storage.reserveAnonymousRecipeGeneration.mockResolvedValue({
      allowed: true,
      quota: { limit: 10, used: 1, remaining: 9 },
    });
    mocks.storage.refundAnonymousRecipeGeneration.mockResolvedValue({
      limit: 10,
      used: 0,
      remaining: 10,
    });
    mocks.storage.updateUserProfile.mockResolvedValue({});
    mocks.storage.getUser.mockResolvedValue({});
    mocks.storage.getUserCookingSessions.mockResolvedValue([]);
    mocks.getRecipeSuggestions.mockResolvedValue({ recipes: [] });
    mocks.getSlopBowlRecipe.mockResolvedValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
    resetRateLimitBucketsForTest();
    delete process.env.ANONYMOUS_RECIPE_GENERATION_LIMIT;
  });

  it('reserves anonymous quota and returns remaining quota after a successful pantry generation', async () => {
    const { server, url } = await startTestServer();

    try {
      const response = await fetch(`${url}/api/recipes/pantry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          ingredients: ['rice', 'eggs'],
          preferences: 'quick dinner',
        }),
      });

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        recipes: [],
        anonymousRecipeQuota: {
          limit: 10,
          used: 1,
          remaining: 9,
        },
      });
      expect(mocks.storage.reserveAnonymousRecipeGeneration).toHaveBeenCalledWith('guest-user-id', 10);
      expect(mocks.getRecipeSuggestions).toHaveBeenCalledWith('quick dinner', ['rice', 'eggs']);
      expect(mocks.storage.refundAnonymousRecipeGeneration).not.toHaveBeenCalled();
    } finally {
      await closeServer(server);
    }
  });

  it('blocks anonymous recipe generation after the quota is exhausted', async () => {
    mocks.storage.reserveAnonymousRecipeGeneration.mockResolvedValueOnce({
      allowed: false,
      quota: { limit: 10, used: 10, remaining: 0 },
    });
    const { server, url } = await startTestServer();

    try {
      const response = await fetch(`${url}/api/recipes/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          preferences: 'quick dinner',
        }),
      });

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({
        code: 'UPGRADE_REQUIRED',
        upgradeReason: 'recipe_quota',
        message: 'Link Google to unlock more recipes.',
        anonymousRecipeQuota: {
          limit: 10,
          used: 10,
          remaining: 0,
        },
      });
      expect(mocks.getRecipeSuggestions).not.toHaveBeenCalled();
    } finally {
      await closeServer(server);
    }
  });

  it('refunds an anonymous quota reservation when generation fails', async () => {
    mocks.getRecipeSuggestions.mockRejectedValueOnce(new Error('provider down'));
    const { server, url } = await startTestServer();

    try {
      const response = await fetch(`${url}/api/recipes/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          preferences: 'quick dinner',
        }),
      });

      expect(response.status).toBe(500);
      expect(mocks.storage.reserveAnonymousRecipeGeneration).toHaveBeenCalledWith('guest-user-id', 10);
      expect(mocks.storage.refundAnonymousRecipeGeneration).toHaveBeenCalledWith('guest-user-id', 10);
    } finally {
      await closeServer(server);
    }
  });

  it('keeps durable profile writes linked-account only', async () => {
    const { server, url } = await startTestServer();

    try {
      const response = await fetch(`${url}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          cookingSkill: 'beginner',
          pantryIngredients: ['rice'],
        }),
      });

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({
        code: 'UPGRADE_REQUIRED',
        upgradeReason: 'durable_save',
        message: 'Link Google to save your kitchen.',
      });
      expect(mocks.storage.updateUserProfile).not.toHaveBeenCalled();
    } finally {
      await closeServer(server);
    }
  });

  it('keeps Slop Bowl generation linked-only until the anonymous dry-run phase exists', async () => {
    const { server, url } = await startTestServer();

    try {
      const response = await fetch(`${url}/api/recipes/slop-bowl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          pantryOverride: ['rice', 'eggs', 'soy sauce'],
        }),
      });

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({
        code: 'UPGRADE_REQUIRED',
        upgradeReason: 'durable_save',
        message: 'Link Google to save your kitchen.',
      });
      expect(mocks.storage.getUser).not.toHaveBeenCalled();
      expect(mocks.getSlopBowlRecipe).not.toHaveBeenCalled();
    } finally {
      await closeServer(server);
    }
  });
});
