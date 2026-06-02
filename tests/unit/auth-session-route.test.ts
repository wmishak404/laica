import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import { requestHttp } from './http-test-client';

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
  return server;
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
    const server = await startTestServer();

    const response = await requestHttp(server, {
      method: 'GET',
      path: '/api/auth/session',
      headers: { Authorization: 'Bearer test-token' },
    });

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('private, no-store, max-age=0');
    expect(response.headers['pragma']).toBe('no-cache');
    expect(response.headers['vary']).toContain('Authorization');
    expect(await response.json()).toEqual({
      authMode: 'linked',
      user: {
        id: 'linked-user-id',
        email: 'linked@example.com',
        authProvider: 'google',
      },
    });
    expect(mocks.storage.getUser).toHaveBeenCalledWith('linked-user-id');
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
    const server = await startTestServer();

    const response = await requestHttp(server, {
      method: 'GET',
      path: '/api/auth/session',
      headers: { Authorization: 'Bearer test-token' },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
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
    const server = await startTestServer();

    const response = await requestHttp(server, {
      method: 'POST',
      path: '/api/auth/google',
      headers: { Authorization: 'Bearer test-token' },
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      message: 'Google sign-in requires a linked account email',
    });
    expect(mocks.storage.upsertUser).not.toHaveBeenCalled();
  });
});
