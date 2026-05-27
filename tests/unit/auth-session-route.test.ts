import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import express from 'express';

const mocks = vi.hoisted(() => ({
  firebaseUser: {
    uid: 'linked-user-id',
    email: 'linked@example.com',
    displayName: 'Linked User',
    photoURL: null,
    emailVerified: true,
    authProvider: 'google',
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
  storage: {
    getUser: vi.fn(),
    upsertUser: vi.fn(),
    getAnonymousRecipeQuota: vi.fn(),
  },
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
  getRecipeSuggestions: vi.fn(),
  getCookingSteps: vi.fn(),
  getGroceryList: vi.fn(),
  getIngredientAlternatives: vi.fn(),
  getCookingAssistance: vi.fn(),
  analyzeIngredientImage: vi.fn(),
  getSlopBowlRecipe: vi.fn(),
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

describe('auth session routes', () => {
  beforeEach(() => {
    mocks.firebaseUser = {
      uid: 'linked-user-id',
      email: 'linked@example.com',
      displayName: 'Linked User',
      photoURL: null,
      emailVerified: true,
      authProvider: 'google',
      isAnonymous: false,
    };
    mocks.storage.getUser.mockResolvedValue({
      id: 'linked-user-id',
      email: 'linked@example.com',
      authProvider: 'google',
    });
    mocks.storage.upsertUser.mockResolvedValue({
      id: 'linked-user-id',
      email: 'linked@example.com',
      authProvider: 'google',
    });
    mocks.storage.getAnonymousRecipeQuota.mockResolvedValue({
      limit: 10,
      used: 0,
      remaining: 10,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns linked session metadata without anonymous flags', async () => {
    const { server, url } = await startTestServer();

    try {
      const response = await fetch(`${url}/api/auth/session`, {
        headers: { Authorization: 'Bearer test-token' },
      });

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        authMode: 'linked',
        user: {
          id: 'linked-user-id',
          email: 'linked@example.com',
          authProvider: 'google',
        },
      });
      expect(mocks.storage.getUser).toHaveBeenCalledWith('linked-user-id');
    } finally {
      await closeServer(server);
    }
  });

  it('returns anonymous session metadata without creating a durable user row', async () => {
    mocks.firebaseUser = {
      uid: 'anonymous-user-id',
      email: null,
      displayName: null,
      photoURL: null,
      emailVerified: false,
      authProvider: 'anonymous',
      isAnonymous: true,
    };
    const { server, url } = await startTestServer();

    try {
      const response = await fetch(`${url}/api/auth/session`, {
        headers: { Authorization: 'Bearer test-token' },
      });

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        authMode: 'anonymous',
        anonymousRecipeQuota: {
          limit: 10,
          used: 0,
          remaining: 10,
        },
        user: {
          id: 'anonymous-user-id',
          email: null,
          firstName: null,
          lastName: null,
          profileImageUrl: null,
          authProvider: 'anonymous',
          firebaseUid: 'anonymous-user-id',
          isAnonymous: true,
        },
      });
      expect(mocks.storage.getUser).not.toHaveBeenCalled();
      expect(mocks.storage.getAnonymousRecipeQuota).toHaveBeenCalledWith('anonymous-user-id', 10);
      expect(mocks.storage.upsertUser).not.toHaveBeenCalled();
    } finally {
      await closeServer(server);
    }
  });

  it('rejects anonymous tokens on the linked Google upsert route', async () => {
    mocks.firebaseUser = {
      uid: 'anonymous-user-id',
      email: null,
      displayName: null,
      photoURL: null,
      emailVerified: false,
      authProvider: 'anonymous',
      isAnonymous: true,
    };
    const { server, url } = await startTestServer();

    try {
      const response = await fetch(`${url}/api/auth/google`, {
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
      });

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        message: 'Google sign-in requires a linked account email',
      });
      expect(mocks.storage.upsertUser).not.toHaveBeenCalled();
    } finally {
      await closeServer(server);
    }
  });
});
