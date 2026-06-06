/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useUpdateUserProfile } from '@/hooks/useAuth';

const mocks = vi.hoisted(() => ({
  apiRequest: vi.fn(),
}));

vi.mock('@/lib/queryClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/queryClient')>();
  return {
    ...actual,
    apiRequest: mocks.apiRequest,
  };
});

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function ProfileMutationProbe() {
  const updateProfile = useUpdateUserProfile();

  return (
    <button
      type="button"
      onClick={() => updateProfile.mutate({
        cookingSkill: 'Intermediate',
        dietaryRestrictions: ['No restrictions'],
        pantryIngredients: ['rice', 'eggs', 'tortillas'],
        kitchenEquipment: ['skillet'],
        favoriteChefs: [],
      })}
    >
      Save profile
    </button>
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('profile mutation cache updates', () => {
  it('does not invalidate auth session when saving pantry/profile changes', async () => {
    const queryClient = createQueryClient();
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
    mocks.apiRequest.mockResolvedValue({
      json: async () => ({ ok: true }),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ProfileMutationProbe />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /save profile/i }));

    await waitFor(() => {
      expect(mocks.apiRequest).toHaveBeenCalledWith('PUT', '/api/user/profile', {
        cookingSkill: 'Intermediate',
        dietaryRestrictions: ['No restrictions'],
        pantryIngredients: ['rice', 'eggs', 'tortillas'],
        kitchenEquipment: ['skillet'],
        favoriteChefs: [],
      });
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['/api/user/profile'] });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['/api/auth/user'] });
    expect(invalidateQueriesSpy).not.toHaveBeenCalledWith({ queryKey: ['/api/auth/session'] });
  });
});
