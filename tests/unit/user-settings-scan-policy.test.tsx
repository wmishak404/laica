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

  it('consolidates Pantry and Tools under Kitchen Inventory while preserving deep links', () => {
    const { container, rerender } = render(
      <UserSettings
        userProfile={baseProfile()}
        onProfileUpdate={vi.fn()}
        onBackToPlanning={vi.fn()}
        initialSection="hub"
      />,
    );

    expect(screen.getByRole('button', { name: /kitchen inventory/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^kitchen$/i })).toBeNull();
    expect(screen.queryByRole('tablist', { name: /kitchen inventory sections/i })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /kitchen inventory/i }));

    expect(screen.getByRole('tablist', { name: /kitchen inventory sections/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /^pantry$/i }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tab', { name: /^tools$/i }).getAttribute('aria-selected')).toBe('false');
    expect(screen.queryByRole('tab', { name: /cooking profile/i })).toBeNull();
    expect(container.querySelector('.returning-mini-chip')).toBeNull();
    expect(screen.getByRole('heading', { name: /^pantry$/i })).toBeTruthy();
    expect(container.querySelector('.returning-inventory-camera .setup-viewfinder')).toBeTruthy();
    expect(container.querySelector('.setup-camera-state')).toBeTruthy();
    expect(container.querySelector('.setup-camera-state-icon')).toBeTruthy();
    expect(container.querySelector('.setup-camera-state-copy')).toBeTruthy();
    expect(container.querySelector('.setup-camera-controls')).toBeTruthy();
    expect(container.querySelector('.setup-viewfinder-corner')).toBeNull();

    fireEvent.click(screen.getByRole('tab', { name: /^tools$/i }));

    expect(screen.getByRole('heading', { name: /^tools$/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /^tools$/i }).getAttribute('aria-selected')).toBe('true');
    expect(container.querySelector('.returning-inventory-camera .setup-viewfinder')).toBeTruthy();
    expect(container.querySelector('.setup-viewfinder-corner')).toBeNull();

    rerender(
      <UserSettings
        userProfile={baseProfile()}
        onProfileUpdate={vi.fn()}
        onBackToPlanning={vi.fn()}
        initialSection="pantry"
      />,
    );

    expect(screen.getByRole('heading', { name: /^pantry$/i })).toBeTruthy();

    rerender(
      <UserSettings
        userProfile={baseProfile()}
        onProfileUpdate={vi.fn()}
        onBackToPlanning={vi.fn()}
        initialSection="kitchen"
      />,
    );

    expect(screen.getByRole('heading', { name: /^tools$/i })).toBeTruthy();
  });

  it('uses the same inventory header tabs for session-only Settings access', () => {
    const { container, rerender } = render(
      <UserSettings
        userProfile={baseProfile()}
        onProfileUpdate={vi.fn()}
        onBackToPlanning={vi.fn()}
        initialSection="pantry"
        persistenceMode="session"
      />,
    );

    expect(screen.getByRole('button', { name: /^back$/i })).toBeTruthy();
    expect(screen.getByRole('tablist', { name: /kitchen inventory sections/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /^pantry$/i }).getAttribute('aria-selected')).toBe('true');
    expect(container.querySelector('.returning-mini-chip')).toBeNull();

    rerender(
      <UserSettings
        userProfile={baseProfile()}
        onProfileUpdate={vi.fn()}
        onBackToPlanning={vi.fn()}
        initialSection="profile"
        persistenceMode="session"
      />,
    );

    expect(screen.getByRole('heading', { name: /how laica adapts/i })).toBeTruthy();
    expect(screen.queryByRole('tablist', { name: /kitchen inventory sections/i })).toBeNull();
  });

  it('marks Cooking Profile with the returning profile panel hook', () => {
    const { container } = render(
      <UserSettings
        userProfile={baseProfile()}
        onProfileUpdate={vi.fn()}
        onBackToPlanning={vi.fn()}
        initialSection="profile"
      />,
    );

    const profilePanel = container.querySelector('.returning-profile-panel');
    expect(profilePanel).toBeTruthy();
    expect(profilePanel?.textContent).toContain('How Laica adapts.');
  });

  it('uses the same 20-photo over-cap guard for Pantry and Tools Settings refreshes', () => {
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
    expect(screen.getByText('broccoli').closest('.setup-chip')?.getAttribute('data-state')).toBe('recent');

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

  it('does not correct Settings tools manual entry', () => {
    render(
      <UserSettings
        userProfile={baseProfile()}
        onProfileUpdate={vi.fn()}
        onBackToPlanning={vi.fn()}
        initialSection="kitchen"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /enter manually/i }));
    fireEvent.change(screen.getByLabelText(/^tools$/i), {
      target: { value: 'brocolli' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add tools/i }));

    expect(screen.getByText('brocolli')).toBeTruthy();
    expect(toastMock).not.toHaveBeenCalledWith(expect.objectContaining({
      title: 'Corrected some entries',
    }));
  });

  it('uses saved and recent chip states in Settings and clears them after saving', async () => {
    updateProfileMock.mockResolvedValue({});

    const pantryRender = render(
      <UserSettings
        userProfile={baseProfile()}
        onProfileUpdate={vi.fn()}
        onBackToPlanning={vi.fn()}
        initialSection="pantry"
      />,
    );

    expect(screen.getByText('rice').closest('.setup-chip')?.getAttribute('data-state')).toBe('saved');

    fireEvent.click(screen.getByRole('button', { name: /enter manually/i }));
    fireEvent.change(screen.getByLabelText(/pantry items/i), {
      target: { value: 'miso' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save ingredients/i }));

    expect(screen.getByText('miso').closest('.setup-chip')?.getAttribute('data-state')).toBe('recent');
    expect(screen.getByText('Unsaved pantry changes')).toBeTruthy();
    expect(screen.getByRole('button', { name: /save pantry changes/i }).getAttribute('data-dirty')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: /save pantry/i }));

    await waitFor(() => {
      expect(updateProfileMock).toHaveBeenCalledWith(expect.objectContaining({
        pantryIngredients: expect.arrayContaining(['miso']),
      }));
    });
    expect(screen.getByText('miso').closest('.setup-chip')?.getAttribute('data-state')).toBe('saved');
    expect(screen.queryByText('Unsaved pantry changes')).toBeNull();

    pantryRender.unmount();

    render(
      <UserSettings
        userProfile={baseProfile()}
        onProfileUpdate={vi.fn()}
        onBackToPlanning={vi.fn()}
        initialSection="kitchen"
      />,
    );

    expect(screen.getByText('sheet pan').closest('.setup-chip')?.getAttribute('data-state')).toBe('saved');

    fireEvent.click(screen.getByRole('button', { name: /enter manually/i }));
    fireEvent.change(screen.getByLabelText(/^tools$/i), {
      target: { value: 'blender' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add tools/i }));

    expect(screen.getByText('blender').closest('.setup-chip')?.getAttribute('data-state')).toBe('recent');
    expect(screen.getByText('Unsaved tools changes')).toBeTruthy();
    expect(screen.getByRole('button', { name: /save tools changes/i }).getAttribute('data-dirty')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: /save tools/i }));

    await waitFor(() => {
      expect(updateProfileMock).toHaveBeenCalledWith(expect.objectContaining({
        kitchenEquipment: expect.arrayContaining(['blender']),
      }));
    });
    expect(screen.getByText('blender').closest('.setup-chip')?.getAttribute('data-state')).toBe('saved');
    expect(screen.queryByText('Unsaved tools changes')).toBeNull();
  });

  it('warns before leaving or switching away from unsaved Settings inventory edits', () => {
    const onBackToPlanning = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      <UserSettings
        userProfile={baseProfile()}
        onProfileUpdate={vi.fn()}
        onBackToPlanning={onBackToPlanning}
        initialSection="pantry"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /enter manually/i }));
    fireEvent.change(screen.getByLabelText(/pantry items/i), {
      target: { value: 'miso' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save ingredients/i }));

    expect(screen.getByText('Unsaved pantry changes')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /^back$/i }));

    expect(confirmSpy).toHaveBeenCalledWith('You have unsaved pantry changes. Leave Settings without saving them?');
    expect(onBackToPlanning).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('tab', { name: /^tools$/i }));

    expect(confirmSpy).toHaveBeenCalledWith('You have unsaved pantry changes. Switch to Tools without saving them?');
    expect(screen.getByRole('heading', { name: /^pantry$/i })).toBeTruthy();

    confirmSpy.mockReturnValue(true);
    fireEvent.click(screen.getByRole('tab', { name: /^tools$/i }));

    expect(screen.getByRole('heading', { name: /^tools$/i })).toBeTruthy();
    confirmSpy.mockRestore();
  });

  it('saves guest pantry add and delete edits through the session callback without durable API calls', async () => {
    const onProfileUpdate = vi.fn();
    render(
      <UserSettings
        userProfile={baseProfile()}
        onProfileUpdate={onProfileUpdate}
        onBackToPlanning={vi.fn()}
        initialSection="pantry"
        persistenceMode="session"
      />,
    );

    fireEvent.click(screen.getByLabelText(/remove rice/i));
    fireEvent.click(screen.getByRole('button', { name: /enter manually/i }));
    fireEvent.change(screen.getByLabelText(/pantry items/i), {
      target: { value: 'miso' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save ingredients/i }));

    expect(screen.queryByText('rice')).toBeNull();
    expect(screen.getByText('miso').closest('.setup-chip')?.getAttribute('data-state')).toBe('recent');

    fireEvent.click(screen.getByRole('button', { name: /save pantry/i }));

    await waitFor(() => {
      expect(onProfileUpdate).toHaveBeenCalledWith(expect.objectContaining({
        pantryIngredients: expect.arrayContaining(['miso']),
      }));
    });

    const savedProfile = onProfileUpdate.mock.calls.at(-1)?.[0];
    expect(savedProfile.pantryIngredients).not.toContain('rice');
    expect(updateProfileMock).not.toHaveBeenCalled();
    expect(resetPantryMock).not.toHaveBeenCalled();
    expect(screen.getByText('miso').closest('.setup-chip')?.getAttribute('data-state')).toBe('saved');
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Pantry updated',
      description: 'Your pantry is updated.',
    }));
  });

  it('saves guest kitchen edits through the session callback without durable API calls', async () => {
    const onProfileUpdate = vi.fn();
    render(
      <UserSettings
        userProfile={baseProfile()}
        onProfileUpdate={onProfileUpdate}
        onBackToPlanning={vi.fn()}
        initialSection="kitchen"
        persistenceMode="session"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /enter manually/i }));
    fireEvent.change(screen.getByLabelText(/^tools$/i), {
      target: { value: 'blender' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add tools/i }));
    fireEvent.click(screen.getByRole('button', { name: /save tools/i }));

    await waitFor(() => {
      expect(onProfileUpdate).toHaveBeenCalledWith(expect.objectContaining({
        kitchenEquipment: expect.arrayContaining(['blender']),
      }));
    });

    expect(updateProfileMock).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Tools updated',
      description: 'Your tools are updated.',
    }));
  });

  it('saves guest cooking profile edits through the session callback without durable API calls', async () => {
    const onProfileUpdate = vi.fn();
    render(
      <UserSettings
        userProfile={baseProfile()}
        onProfileUpdate={onProfileUpdate}
        onBackToPlanning={vi.fn()}
        initialSection="profile"
        persistenceMode="session"
      />,
    );

    fireEvent.click(screen.getByRole('radio', { name: /expert/i }));
    fireEvent.click(screen.getByRole('button', { name: /save profile/i }));

    await waitFor(() => {
      expect(onProfileUpdate).toHaveBeenCalledWith(expect.objectContaining({
        cookingSkill: 'expert',
      }));
    });

    expect(updateProfileMock).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Profile updated',
      description: 'Your cooking profile is updated.',
    }));
  });

  it('marks repeated Settings scan matches as found again without adding duplicate chips', async () => {
    vi.mocked(analyzeImage).mockResolvedValue({ ingredients: ['Rice'] });
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
      target: { files: [new File(['image'], 'pantry.heic', { type: 'image/heic' })] },
    });

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Already saved',
        description: 'No new pantry items were added from that scan. 1 saved item was found again.',
      }));
    });

    expect(screen.getAllByText('rice')).toHaveLength(1);
    expect(screen.getByText('rice').closest('.setup-chip')?.getAttribute('data-state')).toBe('found-again');
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
    expect(screen.getByText('Unsaved pantry changes')).toBeTruthy();
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
