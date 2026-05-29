/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError } from '@/lib/queryClient';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

type FirebaseAuthCallback = (user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous: boolean;
} | null) => void;

const mocks = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  authStateCallback: undefined as FirebaseAuthCallback | undefined,
  handleRedirectResult: vi.fn(),
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(),
  toast: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock('@/lib/firebase', () => ({
  FirebaseAuthService: {
    handleRedirectResult: mocks.handleRedirectResult,
    onAuthStateChanged: mocks.onAuthStateChanged,
    signOut: mocks.signOut,
  },
}));

vi.mock('@/lib/queryClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/queryClient')>();
  return {
    ...actual,
    apiRequest: mocks.apiRequest,
  };
});

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

const anonymousFirebaseUser = {
  uid: 'anonymous-user-id',
  email: null,
  displayName: null,
  isAnonymous: true,
};

const anonymousSessionUser = {
  id: 'anonymous-user-id',
  email: null,
  firstName: null,
  lastName: null,
  profileImageUrl: null,
  authProvider: 'anonymous',
  firebaseUid: 'anonymous-user-id',
  isAnonymous: true,
};

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function AuthProbe() {
  const auth = useFirebaseAuth();

  return (
    <div>
      <span data-testid="loading">{auth.isLoading ? 'loading' : 'ready'}</span>
      <span data-testid="authenticated">{auth.isAuthenticated ? 'yes' : 'no'}</span>
    </div>
  );
}

function renderAuthProbe(queryClient: QueryClient) {
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProbe />
    </QueryClientProvider>,
  );
}

function blockedAnonymousError() {
  return new ApiRequestError({
    status: 403,
    statusText: 'Forbidden',
    body: {
      code: 'ANONYMOUS_ACCESS_DISABLED',
      message: 'Guest cooking is temporarily unavailable. Continue with Google to keep cooking.',
    },
    responseText: '{"code":"ANONYMOUS_ACCESS_DISABLED"}',
  });
}

describe('useFirebaseAuth anonymous session verification', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.authStateCallback = undefined;
    mocks.handleRedirectResult.mockResolvedValue(null);
    mocks.onAuthStateChanged.mockImplementation((callback: FirebaseAuthCallback) => {
      mocks.authStateCallback = callback;
      return mocks.unsubscribe;
    });
    mocks.signOut.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('does not mark anonymous Firebase auth as signed in when the backend kill switch rejects it', async () => {
    const queryClient = createQueryClient();
    mocks.apiRequest.mockRejectedValue(blockedAnonymousError());

    renderAuthProbe(queryClient);

    await act(async () => {
      mocks.authStateCallback?.(anonymousFirebaseUser);
    });

    await waitFor(() => expect(mocks.signOut).toHaveBeenCalledTimes(1));
    expect(mocks.apiRequest).toHaveBeenCalledWith('GET', '/api/auth/session');
    expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
    expect(queryClient.getQueryData(["/api/auth/session"])).toBeNull();
    expect(queryClient.getQueryData(["/api/auth/user"])).toBeNull();
  });

  it('accepts anonymous Firebase auth only after the backend confirms the guest session', async () => {
    const queryClient = createQueryClient();
    mocks.apiRequest.mockResolvedValue({
      json: async () => ({
        authMode: 'anonymous',
        anonymousRecipeQuota: {
          limit: 10,
          used: 0,
          remaining: 10,
        },
        user: anonymousSessionUser,
      }),
    });

    renderAuthProbe(queryClient);

    await act(async () => {
      mocks.authStateCallback?.(anonymousFirebaseUser);
    });

    await waitFor(() => expect(screen.getByTestId('authenticated')).toHaveTextContent('yes'));
    expect(mocks.signOut).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(["/api/auth/session"])).toEqual(anonymousSessionUser);
    expect(queryClient.getQueryData(["/api/auth/user"])).toBeNull();
  });
});
