/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import CookingHistory from '../../client/src/components/cooking/cooking-history';
import type { CookingSession } from '@shared/schema';

const toastMock = vi.hoisted(() => vi.fn());
const deleteSessionMutateMock = vi.hoisted(() => vi.fn());
const deleteAllMutateMock = vi.hoisted(() => vi.fn());
const cookingSessionsState = vi.hoisted(() => ({
  sessions: [] as CookingSession[],
  isLoading: false,
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock('@/hooks/useCookingSession', () => ({
  useCookingSessions: () => ({
    data: cookingSessionsState.sessions,
    isLoading: cookingSessionsState.isLoading,
  }),
  useDeleteCookingSession: () => ({ mutate: deleteSessionMutateMock }),
  useDeleteAllCookingSessions: () => ({ mutate: deleteAllMutateMock }),
}));

function makeSession(overrides: Partial<CookingSession> = {}): CookingSession {
  return {
    id: 101,
    userId: 'linked-user-1',
    recipeName: 'Miso Eggs',
    recipeDescription: 'A quick skillet dinner.',
    recipeSnapshot: {
      recipeName: 'Miso Eggs',
      description: 'Jammy eggs with miso butter.',
      cookTime: 18,
      difficulty: 'Easy',
      cuisine: 'Japanese',
      pantryMatch: 92,
      missingIngredients: ['scallions'],
      ingredients: [
        { name: 'eggs', quantity: '2' },
        { name: 'miso butter' },
      ],
      isFusion: false,
      steps: [
        {
          instruction: 'Warm the pan and melt the miso butter.',
          tips: 'Keep the heat gentle.',
        },
        {
          instruction: 'Fold in the eggs until just set.',
        },
      ],
    },
    ingredientsUsed: ['eggs', 'miso butter'],
    totalSteps: 2,
    completedSteps: 2,
    completed: true,
    startedAt: new Date('2026-06-09T18:30:00Z'),
    completedAt: new Date('2026-06-09T18:50:00Z'),
    cookingDuration: 20,
    ingredientsRemaining: [],
    userRating: null,
    userNotes: null,
    createdAt: new Date('2026-06-09T18:30:00Z'),
    updatedAt: new Date('2026-06-09T18:50:00Z'),
    ...overrides,
  } as CookingSession;
}

function renderHistory() {
  return render(<CookingHistory onBackToPlanning={vi.fn()} />);
}

describe('CookingHistory', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    cookingSessionsState.sessions = [];
    cookingSessionsState.isLoading = false;
    window.sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders loading cards, then the empty state when there are no sessions', () => {
    cookingSessionsState.isLoading = true;
    const { container, rerender } = renderHistory();

    expect(container.querySelectorAll('.history-card')).toHaveLength(3);

    cookingSessionsState.isLoading = false;
    cookingSessionsState.sessions = [];
    rerender(<CookingHistory onBackToPlanning={vi.fn()} />);

    expect(screen.getByText('No cooking history yet.')).toBeInTheDocument();
    expect(screen.getByText('Finished recipes will appear here after you cook.')).toBeInTheDocument();
  });

  it('expands a completed session to show saved ingredients and steps', () => {
    cookingSessionsState.sessions = [makeSession()];
    renderHistory();

    expect(screen.getByText('Miso Eggs')).toBeInTheDocument();
    expect(screen.queryByText('Ingredients')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Miso Eggs').closest('article')!);

    expect(screen.getByText('Ingredients')).toBeInTheDocument();
    expect(screen.getByText('2 eggs')).toBeInTheDocument();
    expect(screen.getByText('miso butter')).toBeInTheDocument();
    expect(screen.getByText('Steps')).toBeInTheDocument();
    expect(screen.getByText('Warm the pan and melt the miso butter.')).toBeInTheDocument();
    expect(screen.getByText('Tip: Keep the heat gentle.')).toBeInTheDocument();
  });

  it('hides a deleted session during the undo window and calls delete only after the delay', () => {
    cookingSessionsState.sessions = [
      makeSession(),
      makeSession({ id: 202, recipeName: 'Rice Bowl' }),
    ];
    renderHistory();

    fireEvent.click(screen.getByRole('button', { name: 'Delete Miso Eggs from history' }));

    expect(screen.queryByText('Miso Eggs')).not.toBeInTheDocument();
    expect(screen.getByText('Rice Bowl')).toBeInTheDocument();
    expect(deleteSessionMutateMock).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(deleteSessionMutateMock).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(deleteSessionMutateMock).toHaveBeenCalledWith(101, expect.objectContaining({
      onError: expect.any(Function),
    }));
  });

  it('restores a hidden session when the delete toast undo is clicked', () => {
    cookingSessionsState.sessions = [makeSession()];
    renderHistory();

    fireEvent.click(screen.getByRole('button', { name: 'Delete Miso Eggs from history' }));

    const deleteToast = toastMock.mock.calls.find(([call]) => call.title === 'Recipe removed')?.[0];
    expect(deleteToast).toEqual(expect.objectContaining({ title: 'Recipe removed' }));

    act(() => {
      deleteToast.action.props.onClick();
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText('Miso Eggs')).toBeInTheDocument();
    expect(deleteSessionMutateMock).not.toHaveBeenCalled();
  });

  it('confirms delete-all, hides all visible sessions, and calls the bulk delete after the undo window', () => {
    cookingSessionsState.sessions = [
      makeSession(),
      makeSession({ id: 202, recipeName: 'Rice Bowl' }),
    ];
    renderHistory();

    const historyActionsButton = screen.getByRole('button', { name: 'Open history actions' });
    historyActionsButton.focus();
    fireEvent.keyDown(historyActionsButton, { key: 'Enter' });
    fireEvent.click(screen.getByText('Delete all history'));
    fireEvent.click(screen.getByRole('button', { name: 'Delete all' }));

    expect(screen.queryByText('Miso Eggs')).not.toBeInTheDocument();
    expect(screen.queryByText('Rice Bowl')).not.toBeInTheDocument();
    expect(screen.getByText('No cooking history yet.')).toBeInTheDocument();
    expect(deleteAllMutateMock).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(deleteAllMutateMock).toHaveBeenCalledWith(undefined, expect.objectContaining({
      onError: expect.any(Function),
    }));
  });
});
