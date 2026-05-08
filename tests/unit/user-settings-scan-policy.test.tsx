/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { analyzeImage } from '@/lib/openai';
import UserSettings from '../../client/src/components/cooking/user-settings';

const toastMock = vi.hoisted(() => vi.fn());
const updateProfileMock = vi.hoisted(() => vi.fn());
const resetPantryMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/openai', () => ({
  analyzeImage: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useResetPantry: () => ({ mutateAsync: resetPantryMock }),
  useUpdateUserProfile: () => ({ mutateAsync: updateProfileMock }),
}));

vi.mock('@/hooks/useCookingSession', () => ({
  useDeleteCookingSession: () => ({ mutate: vi.fn() }),
  useDeleteAllCookingSessions: () => ({ mutate: vi.fn() }),
}));

function baseProfile() {
  return {
    cookingSkill: 'beginner',
    dietaryRestrictions: ['No restrictions'],
    pantryIngredients: ['rice', 'eggs', 'spinach'],
    kitchenEquipment: ['sheet pan'],
    favoriteChefs: [],
  };
}

function makeImageFiles(count: number) {
  return Array.from(
    { length: count },
    (_, index) => new File(['image'], `settings-photo-${index + 1}.jpg`, { type: 'image/jpeg' }),
  );
}

describe('UserSettings scan upload policy', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('uses the same 20-photo over-cap guard for Pantry and Kitchen Settings refreshes', () => {
    const { container, rerender } = render(
      <UserSettings
        userProfile={baseProfile()}
        onProfileUpdate={vi.fn()}
        onBackToPlanning={vi.fn()}
        initialSection="pantry"
      />,
    );

    const pantryUpload = container.querySelector('#pantry-upload') as HTMLInputElement;
    fireEvent.change(pantryUpload, { target: { files: makeImageFiles(21) } });

    expect(analyzeImage).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Too many photos',
      description: expect.stringContaining('up to 20 photos per refresh'),
      variant: 'destructive',
    }));

    rerender(
      <UserSettings
        userProfile={baseProfile()}
        onProfileUpdate={vi.fn()}
        onBackToPlanning={vi.fn()}
        initialSection="kitchen"
      />,
    );

    const kitchenUpload = container.querySelector('#equipment-upload') as HTMLInputElement;
    fireEvent.change(kitchenUpload, { target: { files: makeImageFiles(21) } });

    expect(analyzeImage).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Too many photos',
      description: expect.stringContaining('up to 20 photos per refresh'),
      variant: 'destructive',
    }));
  });
});
