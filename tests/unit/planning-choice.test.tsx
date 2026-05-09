/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MobileApp from '../../client/src/pages/app';

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  updateProfile: vi.fn(),
  userProfileReturn: {
    data: null as { user: ReturnType<typeof makeProfile> } | null,
    isLoading: false,
  },
}));

function makeProfile(overrides: Partial<{
  cookingSkill: string;
  dietaryRestrictions: string[];
  pantryIngredients: string[];
  kitchenEquipment: string[];
  favoriteChefs: string[];
}> = {}) {
  return {
    cookingSkill: 'intermediate',
    dietaryRestrictions: ['No restrictions'],
    pantryIngredients: ['rice', 'eggs', 'beans'],
    kitchenEquipment: ['skillet'],
    favoriteChefs: [],
    ...overrides,
  };
}

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1', email: 'tester@example.com' } }),
  useUserProfile: () => mocks.userProfileReturn,
  useUpdateUserProfile: () => ({ mutateAsync: mocks.updateProfile }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock('@/components/cooking/user-profiling', () => ({
  default: () => <div data-testid="user-profiling">User profiling</div>,
}));

vi.mock('@/components/cooking/meal-planning', () => ({
  default: () => <div data-testid="meal-planning">Chef It Up flow</div>,
}));

vi.mock('@/components/cooking/slop-bowl', () => ({
  default: () => <div data-testid="slop-bowl">Slop Bowl flow</div>,
}));

vi.mock('@/components/cooking/live-cooking', () => ({
  default: () => <div data-testid="live-cooking">Live cooking</div>,
}));

vi.mock('@/components/cooking/user-settings', () => ({
  default: ({ initialSection }: { initialSection?: string }) => (
    <div data-testid="user-settings">Settings section: {initialSection}</div>
  ),
}));

vi.mock('@/components/cooking/cooking-history', () => ({
  default: () => <div data-testid="cooking-history">Cooking history</div>,
}));

vi.mock('@/components/feedback/feedback-modal', () => ({
  FeedbackModal: () => null,
}));

vi.mock('@/components/ui/drawer', () => ({
  Drawer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DrawerContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DrawerHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DrawerTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

async function renderPlanningChoice(profile = makeProfile()) {
  mocks.userProfileReturn.data = { user: profile };
  render(<MobileApp />);
  await screen.findByRole('heading', { name: /what are we cooking today/i });
}

describe('MobileApp planning choice pantry status', () => {
  beforeEach(() => {
    mocks.userProfileReturn.data = { user: makeProfile() };
    mocks.userProfileReturn.isLoading = false;
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('shows the empty-pantry status line on the planning choice screen', async () => {
    await renderPlanningChoice(makeProfile({ pantryIngredients: [] }));

    expect(screen.getByText('Your pantry is empty. Please add or scan more items.')).toBeTruthy();
  });

  it('shows the pantry count status line with pluralization', async () => {
    await renderPlanningChoice(makeProfile({
      pantryIngredients: Array.from({ length: 13 }, (_, index) => `item ${index + 1}`),
    }));

    expect(screen.getByText('Right now I see 13 pantry items we can work with.')).toBeTruthy();

    cleanup();

    await renderPlanningChoice(makeProfile({ pantryIngredients: ['rice'] }));

    expect(screen.getByText('Right now I see 1 pantry item we can work with.')).toBeTruthy();
  });

  it('keeps an empty-pantry user on the choice screen and opens Pantry settings from the toast action', async () => {
    await renderPlanningChoice(makeProfile({ pantryIngredients: [] }));

    fireEvent.click(screen.getByRole('button', { name: /chef it up/i }));

    expect(screen.getByRole('heading', { name: /what are we cooking today/i })).toBeTruthy();
    expect(screen.queryByTestId('meal-planning')).toBeNull();
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Your pantry is empty',
      description: 'Add or scan pantry items before I can suggest recipes.',
      variant: 'destructive',
    }));

    const toastCall = mocks.toast.mock.calls[mocks.toast.mock.calls.length - 1]?.[0];
    expect(toastCall.action).toBeTruthy();

    act(() => {
      toastCall.action.props.onClick();
    });

    expect((await screen.findByTestId('user-settings')).textContent).toBe('Settings section: pantry');
  });

  it('lets users with pantry items enter Chef It Up', async () => {
    await renderPlanningChoice(makeProfile({ pantryIngredients: ['rice', 'eggs'] }));

    fireEvent.click(screen.getByRole('button', { name: /chef it up/i }));

    await waitFor(() => {
      expect(screen.getByTestId('meal-planning')).toBeTruthy();
    });
  });
});
