/**
 * @vitest-environment jsdom
 */

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isGuestUser, useAuth } from "@/hooks/useAuth";

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  getIdToken: vi.fn(),
}));

vi.mock("@/lib/firebase", () => ({
  FirebaseAuthService: {
    getIdToken: mocks.getIdToken,
  },
}));

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function AuthSessionProbe() {
  const auth = useAuth();

  return (
    <div>
      <span data-testid="loading">{auth.isLoading ? "loading" : "ready"}</span>
      <span data-testid="authenticated">{auth.isAuthenticated ? "yes" : "no"}</span>
      <span data-testid="user-id">{auth.user?.id ?? "none"}</span>
      <span data-testid="mode">{isGuestUser(auth.user) ? "guest" : auth.user ? "linked" : "signed-out"}</span>
    </div>
  );
}

function renderAuthSessionProbe() {
  render(
    <QueryClientProvider client={createQueryClient()}>
      <AuthSessionProbe />
    </QueryClientProvider>,
  );
}

describe("useAuth session query", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", mocks.fetch);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("does not call the session route when Firebase has no current ID token", async () => {
    mocks.getIdToken.mockResolvedValue(null);

    renderAuthSessionProbe();

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("ready"));
    expect(screen.getByTestId("authenticated")).toHaveTextContent("no");
    expect(screen.getByTestId("mode")).toHaveTextContent("signed-out");
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("returns linked users from the backend session envelope with the Firebase bearer token", async () => {
    mocks.getIdToken.mockResolvedValue("fresh-token");
    mocks.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        authMode: "linked",
        user: {
          id: "linked-user-id",
          email: "linked@example.com",
          authProvider: "google",
        },
      }),
    });

    renderAuthSessionProbe();

    await waitFor(() => expect(screen.getByTestId("authenticated")).toHaveTextContent("yes"));
    expect(screen.getByTestId("user-id")).toHaveTextContent("linked-user-id");
    expect(screen.getByTestId("mode")).toHaveTextContent("linked");
    expect(mocks.fetch).toHaveBeenCalledWith("/api/auth/session", {
      headers: {
        Authorization: "Bearer fresh-token",
      },
    });
  });

  it("preserves anonymous session users as guest auth state", async () => {
    mocks.getIdToken.mockResolvedValue("guest-token");
    mocks.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        authMode: "anonymous",
        user: {
          id: "guest-user-id",
          email: null,
          firstName: null,
          lastName: null,
          profileImageUrl: null,
          authProvider: "anonymous",
          firebaseUid: "guest-user-id",
          isAnonymous: true,
        },
      }),
    });

    renderAuthSessionProbe();

    await waitFor(() => expect(screen.getByTestId("authenticated")).toHaveTextContent("yes"));
    expect(screen.getByTestId("user-id")).toHaveTextContent("guest-user-id");
    expect(screen.getByTestId("mode")).toHaveTextContent("guest");
  });

  it("treats 401 session responses as signed-out state", async () => {
    mocks.getIdToken.mockResolvedValue("expired-token");
    mocks.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    });

    renderAuthSessionProbe();

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("ready"));
    expect(screen.getByTestId("authenticated")).toHaveTextContent("no");
    expect(screen.getByTestId("mode")).toHaveTextContent("signed-out");
  });

  it("keeps auth state signed out when the session route fails", async () => {
    mocks.getIdToken.mockResolvedValue("fresh-token");
    mocks.fetch.mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => "Service unavailable",
    });

    renderAuthSessionProbe();

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("ready"));
    expect(screen.getByTestId("authenticated")).toHaveTextContent("no");
    expect(screen.getByTestId("mode")).toHaveTextContent("signed-out");
    expect(console.error).toHaveBeenCalledWith("Auth check failed:", expect.any(Error));
  });
});
