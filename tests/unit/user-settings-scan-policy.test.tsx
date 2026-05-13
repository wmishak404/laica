/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { analyzeImage } from '@/lib/openai';
import { SCAN_ANALYSIS_CONCURRENCY } from '@shared/scan-policy';
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

function makeHeicFiles(count: number) {
  return Array.from(
    { length: count },
    (_, index) => new File(['image'], `settings-photo-${index + 1}.heic`, { type: 'image/heic' }),
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

  it('corrects Settings pantry manual-entry spelling and lets Undo restore the original batch', () => {
    render(
      <UserSettings
        userProfile={baseProfile()}
        onProfileUpdate={vi.fn()}
        onBackToPlanning={vi.fn()}
        initialSection="pantry"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /enter manually/i }));
    fireEvent.change(screen.getByLabelText(/pantry items/i), {
      target: { value: 'brocolli' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save ingredients/i }));

    expect(screen.getByText('broccoli')).toBeTruthy();
    expect(screen.queryByText('brocolli')).toBeNull();
    expect(screen.getByText('broccoli').closest('.setup-chip')?.getAttribute('data-corrected')).toBe('true');

    const correctionToast = toastMock.mock.calls.find(([call]) => call.title === 'Corrected some entries')?.[0];
    expect(correctionToast).toEqual(expect.objectContaining({
      title: 'Corrected some entries',
    }));

    act(() => {
      correctionToast.action.props.onClick();
    });

    expect(screen.getByText('brocolli')).toBeTruthy();
    expect(screen.queryByText('broccoli')).toBeNull();
  });

  it('does not correct Settings kitchen manual entry', () => {
    render(
      <UserSettings
        userProfile={baseProfile()}
        onProfileUpdate={vi.fn()}
        onBackToPlanning={vi.fn()}
        initialSection="kitchen"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /enter manually/i }));
    fireEvent.change(screen.getByLabelText(/kitchen tools/i), {
      target: { value: 'brocolli' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save equipment/i }));

    expect(screen.getByText('brocolli')).toBeTruthy();
    expect(toastMock).not.toHaveBeenCalledWith(expect.objectContaining({
      title: 'Corrected some entries',
    }));
  });

  it('processes Settings upload batches with bounded concurrency', async () => {
    const resolvers: Array<(value: { ingredients: string[] }) => void> = [];
    const resolved = new Set<number>();
    vi.mocked(analyzeImage).mockImplementation(() => new Promise((resolve) => {
      resolvers.push(resolve);
    }));
    const { container } = render(
      <UserSettings
        userProfile={baseProfile()}
        onProfileUpdate={vi.fn()}
        onBackToPlanning={vi.fn()}
        initialSection="pantry"
      />,
    );

    const pantryUpload = container.querySelector('#pantry-upload') as HTMLInputElement;
    fireEvent.change(pantryUpload, {
      target: { files: makeHeicFiles(SCAN_ANALYSIS_CONCURRENCY + 1) },
    });

    await waitFor(() => {
      expect(analyzeImage).toHaveBeenCalledTimes(SCAN_ANALYSIS_CONCURRENCY);
    });

    const resolveAt = (index: number) => {
      if (!resolved.has(index)) {
        resolved.add(index);
        resolvers[index]({ ingredients: [`settings item ${index + 1}`] });
      }
    };

    resolveAt(0);

    await waitFor(() => {
      expect(analyzeImage).toHaveBeenCalledTimes(SCAN_ANALYSIS_CONCURRENCY + 1);
    });

    for (let index = 1; index < resolvers.length; index += 1) {
      resolveAt(index);
    }

    await waitFor(() => {
      expect(screen.getByText('settings item 1')).toBeTruthy();
    });
  });

  it('cancels an active Settings scan before leaving', async () => {
    let capturedSignal: AbortSignal | undefined;
    vi.mocked(analyzeImage).mockImplementation((_image, _isHEIC, options) => {
      capturedSignal = options?.signal;
      return new Promise(() => {});
    });
    const onBackToPlanning = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    const { container } = render(
      <UserSettings
        userProfile={baseProfile()}
        onProfileUpdate={vi.fn()}
        onBackToPlanning={onBackToPlanning}
        initialSection="pantry"
      />,
    );

    const pantryUpload = container.querySelector('#pantry-upload') as HTMLInputElement;
    fireEvent.change(pantryUpload, { target: { files: makeHeicFiles(1) } });

    await waitFor(() => {
      expect(analyzeImage).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('button', { name: /save pantry/i })).toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /^back$/i }));

    expect(confirmSpy).toHaveBeenCalledWith('Leave Settings and cancel the active scan? Items found so far may not be saved.');
    expect(capturedSignal?.aborted).toBe(true);
    expect(onBackToPlanning).toHaveBeenCalledTimes(1);
    confirmSpy.mockRestore();
  });
});
