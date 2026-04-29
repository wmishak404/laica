import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import express from 'express';

const mocks = vi.hoisted(() => ({
  storage: {
    getUser: vi.fn(),
    getUserCookingSessions: vi.fn(),
  },
  getSlopBowlRecipe: vi.fn(),
}));

vi.mock('../../server/firebaseAuth', () => ({
  verifyFirebaseToken: vi.fn((req, _res, next) => {
    req.firebaseUser = {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: null,
      emailVerified: true,
    };
    next();
  }),
}));

vi.mock('../../server/storage', () => ({
  storage: mocks.storage,
}));

vi.mock('../../server/openai', () => ({
  getRecipeSuggestions: vi.fn(),
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

describe('POST /api/recipes/slop-bowl sparse pantry guard', () => {
  beforeEach(() => {
    mocks.storage.getUser.mockResolvedValue({
      id: 'test-user-id',
      cookingSkill: 'intermediate',
      dietaryRestrictions: [],
      pantryIngredients: ['ground beef patties', 'buns'],
      kitchenEquipment: [],
      favoriteChefs: [],
    });
    mocks.storage.getUserCookingSessions.mockResolvedValue([]);
    mocks.getSlopBowlRecipe.mockResolvedValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns a typed 422 before history lookup or OpenAI when pantryOverride has fewer than 3 distinct ingredients', async () => {
    const { server, url } = await startTestServer();

    try {
      const response = await fetch(`${url}/api/recipes/slop-bowl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          pantryOverride: ['ground beef patties', 'buns'],
        }),
      });

      expect(response.status).toBe(422);
      await expect(response.json()).resolves.toEqual({
        code: 'SLOP_BOWL_TOO_FEW_INGREDIENTS',
        message: 'Add at least 3 ingredients before generating a Slop Bowl.',
      });

      expect(mocks.storage.getUser).toHaveBeenCalledWith('test-user-id');
      expect(mocks.storage.getUserCookingSessions).not.toHaveBeenCalled();
      expect(mocks.getSlopBowlRecipe).not.toHaveBeenCalled();
    } finally {
      await closeServer(server);
    }
  });

  it('counts distinct trimmed ingredients case-insensitively', async () => {
    const { server, url } = await startTestServer();

    try {
      const response = await fetch(`${url}/api/recipes/slop-bowl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          pantryOverride: [' Buns ', 'buns', 'ground beef patties'],
        }),
      });

      expect(response.status).toBe(422);
      expect(mocks.storage.getUserCookingSessions).not.toHaveBeenCalled();
      expect(mocks.getSlopBowlRecipe).not.toHaveBeenCalled();
    } finally {
      await closeServer(server);
    }
  });
});
