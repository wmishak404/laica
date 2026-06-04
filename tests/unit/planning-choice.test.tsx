/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MobileApp, {
  SLOP_IT_UP_PLANNING_COPY_OPTIONS,
  getPlanningPantryCountLabel,
  getRandomSlopItUpPlanningCopy,
  mergeProfilesForGuestPromotion,
} from '../../client/src/pages/app';

const mocks = vi.hoisted(() => ({
  authUser: { id: 'user-1', email: 'tester@example.com' } as {
    id: string;
    email: string | null;
    isAnonymous?: boolean;
  },
  toast: vi.fn(),
  updateProfile: vi.fn(),
  apiRequest: vi.fn(),
  getGoogleCredentialFromError: vi.fn(),
  linkCurrentGuestWithGooglePopup: vi.fn(),
  signInWithGoogleCredential: vi.fn(),
  signOut: vi.fn(),
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
  isGuestUser: (user: { isAnonymous?: boolean } | null | undefined) => Boolean(user?.isAnonymous),
  useAuth: () => ({ user: mocks.authUser }),
  useUserProfile: () => mocks.userProfileReturn,
  useUpdateUserProfile: () => ({ mutateAsync: mocks.updateProfile }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock('@/lib/firebase', () => ({
  FirebaseAuthService: {
    getGoogleCredentialFromError: mocks.getGoogleCredentialFromError,
    linkCurrentGuestWithGooglePopup: mocks.linkCurrentGuestWithGooglePopup,
    signInWithGoogleCredential: mocks.signInWithGoogleCredential,
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

vi.mock('@/components/cooking/user-profiling', () => ({
  default: () => <div data-testid="user-profiling">User profiling</div>,
}));

vi.mock('@/components/cooking/meal-planning', () => ({
  default: ({
    sessionScopeKey,
    initialTimeAvailable,
  }: {
    sessionScopeKey?: string;
    initialTimeAvailable?: string;
  }) => (
    <div
      data-testid="meal-planning"
      data-scope={sessionScopeKey}
      data-time={initialTimeAvailable}
    >
      Chef It Up flow
    </div>
  ),
}));

vi.mock('@/components/cooking/slop-bowl', () => ({
  default: () => <div data-testid="slop-bowl">Slop Bowl flow</div>,
}));

vi.mock('@/components/cooking/live-cooking', () => ({
  default: () => <div data-testid="live-cooking">Live cooking</div>,
}));

vi.mock('@/components/cooking/user-settings', () => ({
  default: ({ initialSection, persistenceMode }: { initialSection?: string; persistenceMode?: string }) => (
    <div data-testid="user-settings">Settings section: {initialSection}; mode: {persistenceMode}</div>
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

async function renderGuestPlanningChoice(profile = makeProfile()) {
  mocks.authUser = {
    id: 'guest-test-1',
    email: null,
    isAnonymous: true,
  };
  window.localStorage.setItem('laica:guest-profile:guest-test-1', JSON.stringify(profile));
  render(<MobileApp />);
  await screen.findByRole('heading', { name: /what are we cooking today/i });
}

describe('MobileApp planning choice pantry status', () => {
  beforeEach(() => {
    mocks.authUser = { id: 'user-1', email: 'tester@example.com' };
    mocks.userProfileReturn.data = { user: makeProfile() };
    mocks.userProfileReturn.isLoading = false;
    mocks.apiRequest.mockImplementation(async (method: string, url: string) => ({
      json: async () => {
        if (method === 'POST' && url === '/api/auth/google') {
          return { id: 'guest-test-1', email: 'tester@example.com', authProvider: 'google' };
        }

        if (method === 'GET' && url === '/api/user/profile') {
          return { user: makeProfile({ pantryIngredients: ['rice'], kitchenEquipment: ['skillet'] }) };
        }

        return {};
      },
    }));
    mocks.linkCurrentGuestWithGooglePopup.mockResolvedValue({
      uid: 'guest-test-1',
      email: 'tester@example.com',
      displayName: 'Test User',
      isAnonymous: false,
    });
    mocks.signInWithGoogleCredential.mockResolvedValue({
      uid: 'linked-existing',
      email: 'tester@example.com',
      displayName: 'Test User',
      isAnonymous: false,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('shows the empty-pantry status line on the planning choice screen', async () => {
    await renderPlanningChoice(makeProfile({ pantryIngredients: [] }));

    const emptyEmphasis = screen.getByText('empty');
    expect(emptyEmphasis.className).toContain('planning-pantry-status-emphasis');
    expect(emptyEmphasis.closest('p')?.textContent).toBe('Your pantry is empty. Please add or scan more items.');
  });

  it('shows the pantry count status line with pluralization', async () => {
    await renderPlanningChoice(makeProfile({
      pantryIngredients: Array.from({ length: 13 }, (_, index) => `item ${index + 1}`),
    }));

    const pluralCount = screen.getByText('13 pantry items');
    expect(pluralCount.className).toContain('planning-pantry-status-emphasis');
    expect(pluralCount.closest('p')?.textContent).toBe('Right now I see 13 pantry items we can work with.');

    cleanup();

    await renderPlanningChoice(makeProfile({ pantryIngredients: ['rice'] }));

    const singularCount = screen.getByText('1 pantry item');
    expect(singularCount.className).toContain('planning-pantry-status-emphasis');
    expect(singularCount.closest('p')?.textContent).toBe('Right now I see 1 pantry item we can work with.');
  });

  it('builds the pantry count phrase separately from the surrounding status line', () => {
    expect(getPlanningPantryCountLabel(1)).toBe('1 pantry item');
    expect(getPlanningPantryCountLabel(17)).toBe('17 pantry items');
  });

  it('uses the Slop It Up title with italic title and one approved italic supporting line', async () => {
    const expectedCopy = getRandomSlopItUpPlanningCopy(() => 0.5);
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

    await renderPlanningChoice(makeProfile({ pantryIngredients: ['rice', 'eggs'] }));

    const slopCard = screen.getByRole('button', { name: /slop it up/i });
    const slopTitle = screen.getByText('Slop It Up');
    const supportingCopy = screen.getByText(expectedCopy);

    expect(slopCard).toBeTruthy();
    expect(slopTitle.className).toContain('italic');
    expect(supportingCopy.className).toContain('italic');
    expect(SLOP_IT_UP_PLANNING_COPY_OPTIONS).toContain(supportingCopy.textContent);
    expect(screen.queryByText('Randomly make me something from the chaos.')).toBeNull();
    expect(screen.queryByRole('button', { name: /^slop bowl/i })).toBeNull();

    fireEvent.click(slopCard);

    await waitFor(() => {
      expect(screen.getByTestId('slop-bowl')).toBeTruthy();
    });

    randomSpy.mockRestore();
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

    expect((await screen.findByTestId('user-settings')).textContent).toBe('Settings section: pantry; mode: linked');
  });

  it('opens session-only Pantry settings for an empty-pantry guest from the toast action', async () => {
    await renderGuestPlanningChoice(makeProfile({ pantryIngredients: [] }));

    fireEvent.click(screen.getByRole('button', { name: /chef it up/i }));

    expect(screen.getByRole('heading', { name: /what are we cooking today/i })).toBeTruthy();
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Your pantry is empty',
      description: 'Add or scan pantry items in Settings.',
      variant: 'destructive',
    }));

    const toastCall = mocks.toast.mock.calls[mocks.toast.mock.calls.length - 1]?.[0];
    expect(toastCall.action).toBeTruthy();

    act(() => {
      toastCall.action.props.onClick();
    });

    expect((await screen.findByTestId('user-settings')).textContent).toBe('Settings section: pantry; mode: session');
  });

  it('allows guest Settings from the menu while keeping History linked-account only', async () => {
    await renderGuestPlanningChoice(makeProfile());

    const settingsButton = screen.getByRole('button', {
      name: /settings pantry, kitchen, and cooking profile/i,
    });
    const historyButton = screen.getByRole('button', {
      name: /history meals you cooked/i,
    });

    expect(settingsButton).not.toBeDisabled();
    expect(historyButton).toBeDisabled();

    fireEvent.click(settingsButton);

    expect((await screen.findByTestId('user-settings')).textContent).toBe('Settings section: hub; mode: session');
  });

  it('shows guest sign-up separately from the start-over action', async () => {
    await renderGuestPlanningChoice(makeProfile());

    expect(screen.getByRole('button', { name: /keep your pantry and recipes for next time/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /sign up save your pantry and profile/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /start over clear this setup and return home/i })).toBeTruthy();
    expect(screen.queryByText('Guest session')).toBeNull();
    expect(screen.queryByText('Sign out')).toBeNull();
  });

  it('imports this-browser guest setup into the linked Google account on sign-up', async () => {
    await renderGuestPlanningChoice(makeProfile({
      pantryIngredients: ['rice', 'eggs', 'beans'],
      kitchenEquipment: ['skillet', 'pot'],
      favoriteChefs: ['Samin Nosrat'],
    }));

    fireEvent.click(screen.getByRole('button', { name: /keep your pantry and recipes for next time/i }));

    await waitFor(() => expect(mocks.linkCurrentGuestWithGooglePopup).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mocks.updateProfile).toHaveBeenCalledWith({
      cookingSkill: 'intermediate',
      dietaryRestrictions: ['No restrictions'],
      pantryIngredients: ['rice', 'eggs', 'beans'],
      kitchenEquipment: ['skillet', 'pot'],
      favoriteChefs: ['Samin Nosrat'],
    }));
    expect(mocks.apiRequest).toHaveBeenCalledWith('POST', '/api/auth/google');
    expect(mocks.apiRequest).toHaveBeenCalledWith('GET', '/api/user/profile');
    expect(window.localStorage.getItem('laica:guest-profile:guest-test-1')).toBeNull();
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Progress saved',
    }));
  });

  it('asks before adding guest setup to an existing Google account', async () => {
    const credential = { providerId: 'google.com' };
    mocks.linkCurrentGuestWithGooglePopup.mockRejectedValueOnce({ code: 'auth/credential-already-in-use' });
    mocks.getGoogleCredentialFromError.mockReturnValueOnce(credential);

    await renderGuestPlanningChoice(makeProfile({
      pantryIngredients: ['rice', 'eggs'],
      kitchenEquipment: ['skillet', 'wok'],
      favoriteChefs: ['Samin Nosrat'],
    }));

    fireEvent.click(screen.getByRole('button', { name: /keep your pantry and recipes for next time/i }));

    expect(await screen.findByRole('heading', { name: /add this browser's setup/i })).toBeTruthy();
    expect(screen.getByText(/that google sign-in already exists/i)).toBeTruthy();
    expect(screen.getByText(/without overwriting saved details/i)).toBeTruthy();
    expect(mocks.updateProfile).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /add setup/i }));

    await waitFor(() => expect(mocks.signInWithGoogleCredential).toHaveBeenCalledWith(credential));
    await waitFor(() => expect(mocks.updateProfile).toHaveBeenCalledWith({
      cookingSkill: 'intermediate',
      dietaryRestrictions: ['No restrictions'],
      pantryIngredients: ['rice', 'eggs'],
      kitchenEquipment: ['skillet', 'wok'],
      favoriteChefs: ['Samin Nosrat'],
    }));
    expect(mocks.apiRequest).toHaveBeenCalledWith('POST', '/api/auth/google');
    expect(mocks.apiRequest).toHaveBeenCalledWith('GET', '/api/user/profile');
  });

  it('treats a canceled Google popup as a cancel instead of a failed sign-up', async () => {
    mocks.linkCurrentGuestWithGooglePopup.mockRejectedValueOnce({ code: 'auth/popup-closed-by-user' });

    await renderGuestPlanningChoice(makeProfile());

    fireEvent.click(screen.getByRole('button', { name: /keep your pantry and recipes for next time/i }));

    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Sign-up canceled',
      description: 'Nothing changed. Your pantry is still here when you are ready.',
    })));
    expect(mocks.updateProfile).not.toHaveBeenCalled();
    expect(mocks.apiRequest).not.toHaveBeenCalledWith('POST', '/api/auth/google');
  });

  it('lets users with pantry items enter Chef It Up', async () => {
    await renderPlanningChoice(makeProfile({ pantryIngredients: ['rice', 'eggs'] }));

    fireEvent.click(screen.getByRole('button', { name: /chef it up/i }));

    await waitFor(() => {
      expect(screen.getByTestId('meal-planning')).toBeTruthy();
    });
  });

  it('scopes Chef It Up planning time by guest or linked account identity', async () => {
    window.localStorage.setItem('laica_last_planning_time', '90');
    window.localStorage.setItem('laica_last_planning_time:guest:guest-test-1', '60');

    await renderGuestPlanningChoice(makeProfile({ pantryIngredients: ['rice', 'eggs'] }));

    fireEvent.click(screen.getByRole('button', { name: /chef it up/i }));

    const guestPlanning = await screen.findByTestId('meal-planning');
    expect(guestPlanning.dataset.scope).toBe('guest:guest-test-1');
    expect(guestPlanning.dataset.time).toBe('60');
    expect(window.localStorage.getItem('laica_last_planning_time')).toBeNull();

    cleanup();

    mocks.authUser = { id: 'user-1', email: 'tester@example.com' };
    mocks.userProfileReturn.data = { user: makeProfile({ pantryIngredients: ['rice', 'eggs'] }) };

    render(<MobileApp />);
    await screen.findByRole('heading', { name: /what are we cooking today/i });
    fireEvent.click(screen.getByRole('button', { name: /chef it up/i }));

    const linkedPlanning = await screen.findByTestId('meal-planning');
    expect(linkedPlanning.dataset.scope).toBe('linked:user-1');
    expect(linkedPlanning.dataset.time).toBe('30');
  });

  it('merges guest promotion data without silently overwriting existing linked setup', () => {
    const merged = mergeProfilesForGuestPromotion(
      makeProfile({
        cookingSkill: 'expert',
        dietaryRestrictions: ['Vegetarian'],
        pantryIngredients: ['rice'],
        kitchenEquipment: ['skillet'],
        favoriteChefs: ['Alice Waters'],
      }),
      makeProfile({
        cookingSkill: 'beginner',
        dietaryRestrictions: ['No restrictions', 'Dairy Free'],
        pantryIngredients: ['rice', 'eggs'],
        kitchenEquipment: ['skillet', 'wok'],
        favoriteChefs: ['Samin Nosrat'],
      }),
    );

    expect(merged).toEqual({
      cookingSkill: 'expert',
      dietaryRestrictions: ['Vegetarian', 'Dairy Free'],
      pantryIngredients: ['rice', 'eggs'],
      kitchenEquipment: ['skillet', 'wok'],
      favoriteChefs: ['Alice Waters', 'Samin Nosrat'],
    });
  });
});
