/**
 * @vitest-environment jsdom
 */

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  useActiveCookingSession,
  useCompleteCookingSession,
  useCookingSessions,
} from "@/hooks/useCookingSession";

const mocks = vi.hoisted(() => ({
  authUser: null as { id: string; isAnonymous?: boolean } | null,
  apiRequest: vi.fn(),
  queryFn: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  isGuestUser: (user: { isAnonymous?: boolean } | null | undefined) => Boolean(user?.isAnonymous),
  useAuth: () => ({ user: mocks.authUser }),
}));

vi.mock("@/lib/queryClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/queryClient")>();
  return {
    ...actual,
    apiRequest: mocks.apiRequest,
  };
});

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        queryFn: mocks.queryFn,
        retry: false,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  });
}

function renderWithClient(element: React.ReactElement, queryClient = createQueryClient()) {
  render(
    <QueryClientProvider client={queryClient}>
      {element}
    </QueryClientProvider>,
  );

  return queryClient;
}

function CookingSessionQueryProbe() {
  const activeSession = useActiveCookingSession();
  const sessions = useCookingSessions(25);

  return (
    <div>
      <span data-testid="active-status">{activeSession.status}</span>
      <span data-testid="active-fetch">{activeSession.fetchStatus}</span>
      <span data-testid="active-id">{activeSession.data?.id ?? "none"}</span>
      <span data-testid="history-status">{sessions.status}</span>
      <span data-testid="history-fetch">{sessions.fetchStatus}</span>
      <span data-testid="history-count">{sessions.data?.length ?? 0}</span>
    </div>
  );
}

function CompleteSessionProbe() {
  const completeSession = useCompleteCookingSession();

  return (
    <button
      type="button"
      onClick={() => completeSession.mutate({
        sessionId: 42,
        completionData: {
          ingredientsRemaining: ["rice"],
          cookingDuration: 12,
          completedSteps: 3,
        },
      })}
    >
      Finish
    </button>
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("useCookingSession hooks", () => {
  it("does not fetch linked-only cooking sessions for guest users", async () => {
    mocks.authUser = {
      id: "guest-user-id",
      isAnonymous: true,
    };

    renderWithClient(<CookingSessionQueryProbe />);

    await waitFor(() => {
      expect(screen.getByTestId("active-fetch")).toHaveTextContent("idle");
      expect(screen.getByTestId("history-fetch")).toHaveTextContent("idle");
    });

    expect(screen.getByTestId("active-status")).toHaveTextContent("pending");
    expect(screen.getByTestId("history-status")).toHaveTextContent("pending");
    expect(mocks.queryFn).not.toHaveBeenCalled();
  });

  it("scopes linked cooking-session queries by auth user id", async () => {
    mocks.authUser = {
      id: "linked-user-id",
      isAnonymous: false,
    };
    mocks.queryFn.mockImplementation(async ({ queryKey }) => {
      if (queryKey[0] === "/api/cooking/session/active") {
        return { id: 7 };
      }

      return [{ id: 11 }, { id: 12 }];
    });

    renderWithClient(<CookingSessionQueryProbe />);

    await waitFor(() => expect(screen.getByTestId("active-id")).toHaveTextContent("7"));
    expect(screen.getByTestId("history-count")).toHaveTextContent("2");
    expect(mocks.queryFn).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["/api/cooking/session/active", "linked-user-id"],
      }),
    );
    expect(mocks.queryFn).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["/api/cooking/sessions", "linked-user-id", 25],
      }),
    );
  });

  it("refreshes cooking and profile caches after completion without invalidating auth session", async () => {
    mocks.authUser = {
      id: "linked-user-id",
      isAnonymous: false,
    };
    mocks.apiRequest.mockResolvedValue({
      json: async () => ({ ok: true }),
    });
    const queryClient = createQueryClient();
    const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

    renderWithClient(<CompleteSessionProbe />, queryClient);

    fireEvent.click(screen.getByRole("button", { name: /finish/i }));

    await waitFor(() => {
      expect(mocks.apiRequest).toHaveBeenCalledWith(
        "POST",
        "/api/cooking/session/42/complete",
        {
          ingredientsRemaining: ["rice"],
          cookingDuration: 12,
          completedSteps: 3,
        },
      );
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ["/api/cooking/session/active"] });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ["/api/cooking/sessions"] });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ["/api/user/profile"] });
    expect(invalidateQueriesSpy).not.toHaveBeenCalledWith({ queryKey: ["/api/auth/session"] });
  });
});
