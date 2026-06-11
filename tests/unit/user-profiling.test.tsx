/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { analyzeImage } from '@/lib/openai';
import { SCAN_ANALYSIS_CONCURRENCY } from '@shared/scan-policy';
import UserProfiling from '../../client/src/components/cooking/user-profiling';

const toastMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/openai', () => ({
  analyzeImage: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

function makeImageFiles(count: number) {
  return Array.from(
    { length: count },
    (_, index) => new File(['image'], `setup-photo-${index + 1}.jpg`, { type: 'image/jpeg' }),
  );
}

function makeHeicFiles(count: number) {
  return Array.from(
    { length: count },
    (_, index) => new File(['image'], `setup-photo-${index + 1}.heic`, { type: 'image/heic' }),
  );
}

describe('UserProfiling setup flow', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('starts with a welcome screen and lets pantry back return there', () => {
    render(
      <UserProfiling
        onProfileComplete={vi.fn()}
        menuSlot={<button type="button">Account menu</button>}
      />,
    );

    expect(screen.getByRole('heading', { name: /yes, chef/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /account menu/i })).toBeTruthy();
    expect(screen.queryByText(/laica setup/i)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /get started/i }));

    expect(screen.getByRole('heading', { name: /start with pantry staples/i })).toBeTruthy();
    expect(screen.getByText('1/5')).toBeTruthy();
    expect(screen.getByText(/camera is off/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /upload photos/i })).toBeTruthy();
    const manualButton = screen.getByRole('button', { name: /enter manually/i });
    expect(manualButton.getAttribute('aria-pressed')).toBe('false');
    expect(manualButton.hasAttribute('data-active')).toBe(false);
    expect(manualButton).toBeTruthy();
    expect(screen.getByRole('button', { name: /scanning tips/i })).toBeTruthy();

    fireEvent.click(manualButton);
    expect(manualButton.getAttribute('aria-pressed')).toBe('true');
    expect(manualButton.getAttribute('data-active')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: /back/i }));

    expect(screen.getByRole('heading', { name: /yes, chef/i })).toBeTruthy();
  });

  it('auto-advances from Cooking Skill after one selection', () => {
    const onProfileComplete = vi.fn();
    render(<UserProfiling onProfileComplete={onProfileComplete} />);

    fireEvent.click(screen.getByRole('button', { name: /get started/i }));
    fireEvent.click(screen.getByRole('button', { name: /enter manually/i }));
    fireEvent.change(screen.getByLabelText(/pantry items/i), {
      target: { value: 'ground beef, mayo, rice' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save ingredients/i }));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /skip tools/i }));

    expect(screen.getByRole('heading', { name: /how comfortable are you with cooking/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('radio', { name: /beginner/i }));

    expect(screen.getByRole('heading', { name: /anything i should avoid/i })).toBeTruthy();
    expect(onProfileComplete).not.toHaveBeenCalled();

    const nextButton = screen.getByRole('button', { name: /next/i }) as HTMLButtonElement;
    expect(nextButton.disabled).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: /no restrictions/i }));
    expect(nextButton.disabled).toBe(false);
  });

  it('asks before opening the optional tools scanner', () => {
    render(<UserProfiling onProfileComplete={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /get started/i }));
    fireEvent.click(screen.getByRole('button', { name: /enter manually/i }));
    fireEvent.change(screen.getByLabelText(/pantry items/i), {
      target: { value: 'ground beef, mayo, rice' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save ingredients/i }));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(screen.getByRole('heading', { name: /any kitchen tools to add/i })).toBeTruthy();
    expect(screen.getAllByText(/totally optional/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/ready to scan your kitchen for tools/i)).toBeTruthy();
    expect(screen.getByText(/we'll stick to common kitchen basics if you choose to skip/i)).toBeTruthy();
    expect(screen.queryByRole('heading', { name: /tell me what tools you use/i })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /add tools/i }));

    expect(screen.getByRole('heading', { name: /tell me what tools you use/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /tools camera/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /back/i }));

    expect(screen.getByRole('heading', { name: /any kitchen tools to add/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /skip tools/i }));

    expect(screen.getByRole('heading', { name: /how comfortable are you with cooking/i })).toBeTruthy();
  });

  it('restores in-progress setup after a browser-local remount', () => {
    const sessionScopeKey = 'guest:setup-remount-test';
    const firstRender = render(<UserProfiling onProfileComplete={vi.fn()} sessionScopeKey={sessionScopeKey} />);

    fireEvent.click(screen.getByRole('button', { name: /get started/i }));
    fireEvent.click(screen.getByRole('button', { name: /enter manually/i }));
    fireEvent.change(screen.getByLabelText(/pantry items/i), {
      target: { value: 'ground beef, mayo, rice' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save ingredients/i }));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /add tools/i }));
    fireEvent.click(screen.getByRole('button', { name: /enter manually/i }));
    fireEvent.change(screen.getByLabelText(/^tools$/i), {
      target: { value: 'blender' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add tools/i }));

    firstRender.unmount();
    render(<UserProfiling onProfileComplete={vi.fn()} sessionScopeKey={sessionScopeKey} />);

    expect(screen.getByRole('heading', { name: /tell me what tools you use/i })).toBeTruthy();
    expect(screen.getByText('blender')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByText('ground beef')).toBeTruthy();
  });

  it('corrects setup pantry manual-entry spelling and lets Undo restore the original batch', () => {
    render(<UserProfiling onProfileComplete={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /get started/i }));
    fireEvent.click(screen.getByRole('button', { name: /enter manually/i }));
    fireEvent.change(screen.getByLabelText(/pantry items/i), {
      target: { value: 'brocoli, avcado, beens, ryce, chickin' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save ingredients/i }));

    expect(screen.getByText('broccoli')).toBeTruthy();
    expect(screen.getByText('avocado')).toBeTruthy();
    expect(screen.getByText('beans')).toBeTruthy();
    expect(screen.getByText('rice')).toBeTruthy();
    expect(screen.getByText('chicken')).toBeTruthy();
    expect(screen.queryByText('brocoli')).toBeNull();
    expect(screen.queryByText('avcado')).toBeNull();
    expect(screen.queryByText('beens')).toBeNull();
    expect(screen.queryByText('ryce')).toBeNull();
    expect(screen.queryByText('chickin')).toBeNull();
    expect(screen.getByText('broccoli').closest('.setup-chip')?.getAttribute('data-corrected')).toBe('true');
    expect(screen.getByText('broccoli').closest('.setup-chip')?.getAttribute('data-state')).toBe('recent');
    expect(screen.getByText('avocado').closest('.setup-chip')?.getAttribute('data-corrected')).toBe('true');

    const correctionToast = toastMock.mock.calls.find(([call]) => call.title === 'Corrected some entries')?.[0];
    expect(correctionToast).toEqual(expect.objectContaining({
      title: 'Corrected some entries',
    }));

    act(() => {
      correctionToast.action.props.onClick();
    });

    expect(screen.getByText('brocoli')).toBeTruthy();
    expect(screen.getByText('avcado')).toBeTruthy();
    expect(screen.getByText('beens')).toBeTruthy();
    expect(screen.getByText('ryce')).toBeTruthy();
    expect(screen.getByText('chickin')).toBeTruthy();
    expect(screen.queryByText('broccoli')).toBeNull();
    expect(screen.queryByText('avocado')).toBeNull();
  });

  it('does not correct setup tools manual entry', () => {
    render(<UserProfiling onProfileComplete={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /get started/i }));
    fireEvent.click(screen.getByRole('button', { name: /enter manually/i }));
    fireEvent.change(screen.getByLabelText(/pantry items/i), {
      target: { value: 'ground beef, mayo, rice' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save ingredients/i }));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /add tools/i }));

    toastMock.mockClear();

    fireEvent.click(screen.getByRole('button', { name: /enter manually/i }));
    fireEvent.change(screen.getByLabelText(/^tools$/i), {
      target: { value: 'brocolli, sheet pan' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add tools/i }));

    expect(screen.getByText('brocolli')).toBeTruthy();
    expect(screen.getByText('sheet pan')).toBeTruthy();
    expect(toastMock).not.toHaveBeenCalledWith(expect.objectContaining({
      title: 'Corrected some entries',
    }));
  });

  it('clears setup recent inventory state after continuing past a scan step', () => {
    render(<UserProfiling onProfileComplete={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /get started/i }));
    fireEvent.click(screen.getByRole('button', { name: /enter manually/i }));
    fireEvent.change(screen.getByLabelText(/pantry items/i), {
      target: { value: 'ground beef, mayo, rice' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save ingredients/i }));

    expect(screen.getByText('ground beef').closest('.setup-chip')?.getAttribute('data-state')).toBe('recent');

    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /back/i }));

    expect(screen.getByText('ground beef').closest('.setup-chip')?.getAttribute('data-state')).toBe('saved');

    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /add tools/i }));
    fireEvent.click(screen.getByRole('button', { name: /enter manually/i }));
    fireEvent.change(screen.getByLabelText(/^tools$/i), {
      target: { value: 'sheet pan' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add tools/i }));

    expect(screen.getByText('sheet pan').closest('.setup-chip')?.getAttribute('data-state')).toBe('recent');

    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /back/i }));

    expect(screen.getByText('sheet pan').closest('.setup-chip')?.getAttribute('data-state')).toBe('saved');
  });

  it('cancels oversized pantry and kitchen upload batches without partial analysis', () => {
    const analyzeImageMock = vi.mocked(analyzeImage);
    const { container } = render(<UserProfiling onProfileComplete={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /get started/i }));

    const pantryUpload = container.querySelector('#pantry-setup-upload') as HTMLInputElement;
    fireEvent.change(pantryUpload, { target: { files: makeImageFiles(21) } });

    expect(analyzeImageMock).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Too many photos',
      description: expect.stringContaining('up to 20 photos per refresh'),
      variant: 'destructive',
    }));

    fireEvent.click(screen.getByRole('button', { name: /enter manually/i }));
    fireEvent.change(screen.getByLabelText(/pantry items/i), {
      target: { value: 'ground beef, mayo, rice' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save ingredients/i }));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /add tools/i }));

    const kitchenUpload = container.querySelector('#kitchen-setup-upload') as HTMLInputElement;
    fireEvent.change(kitchenUpload, { target: { files: makeImageFiles(21) } });

    expect(analyzeImageMock).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Too many photos',
      description: expect.stringContaining('up to 20 photos per refresh'),
      variant: 'destructive',
    }));
  });

  it('does not count unsupported setup files toward the 20-photo refresh cap', async () => {
    vi.mocked(analyzeImage).mockResolvedValue({ ingredients: [] });
    const { container } = render(<UserProfiling onProfileComplete={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /get started/i }));

    const pantryUpload = container.querySelector('#pantry-setup-upload') as HTMLInputElement;
    fireEvent.change(pantryUpload, {
      target: {
        files: [
          ...makeHeicFiles(20),
          new File(['not an image'], 'notes.txt', { type: 'text/plain' }),
        ],
      },
    });

    await waitFor(() => {
      expect(analyzeImage).toHaveBeenCalledTimes(20);
    });
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Some photos were skipped',
      description: expect.stringContaining('Unsupported files do not count'),
    }));
    expect(toastMock).not.toHaveBeenCalledWith(expect.objectContaining({
      title: 'Too many photos',
    }));
  });

  it('processes setup upload batches with bounded concurrency', async () => {
    const resolvers: Array<(value: { ingredients: string[] }) => void> = [];
    const resolved = new Set<number>();
    vi.mocked(analyzeImage).mockImplementation(() => new Promise((resolve) => {
      resolvers.push(resolve);
    }));
    const { container } = render(<UserProfiling onProfileComplete={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /get started/i }));

    const pantryUpload = container.querySelector('#pantry-setup-upload') as HTMLInputElement;
    fireEvent.change(pantryUpload, {
      target: { files: makeHeicFiles(SCAN_ANALYSIS_CONCURRENCY + 1) },
    });

    await waitFor(() => {
      expect(analyzeImage).toHaveBeenCalledTimes(SCAN_ANALYSIS_CONCURRENCY);
    });

    const resolveAt = (index: number) => {
      if (!resolved.has(index)) {
        resolved.add(index);
        resolvers[index]({ ingredients: [`setup item ${index + 1}`] });
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
      expect(screen.getByText('setup item 1')).toBeTruthy();
    });
  });

  it('cancels an active tools upload when backing out of the scanner', async () => {
    let abortSignal: AbortSignal | undefined;
    vi.mocked(analyzeImage).mockImplementation((_image, _isHEIC, options) => {
      abortSignal = options?.signal;
      return new Promise<never>(() => undefined);
    });

    const { container } = render(<UserProfiling onProfileComplete={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /get started/i }));
    fireEvent.click(screen.getByRole('button', { name: /enter manually/i }));
    fireEvent.change(screen.getByLabelText(/pantry items/i), {
      target: { value: 'ground beef, mayo, rice' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save ingredients/i }));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /add tools/i }));

    const kitchenUpload = container.querySelector('#kitchen-setup-upload') as HTMLInputElement;
    fireEvent.change(kitchenUpload, {
      target: { files: [new File(['image'], 'kitchen.heic', { type: 'image/heic' })] },
    });

    await waitFor(() => {
      expect(analyzeImage).toHaveBeenCalledTimes(1);
    });
    expect(analyzeImage).toHaveBeenCalledWith(expect.any(String), true, expect.objectContaining({
      scanType: 'kitchen',
    }));
    expect((screen.getByRole('button', { name: /skip for now/i }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: /back/i }));

    expect(abortSignal?.aborted).toBe(true);
    expect(screen.getByRole('heading', { name: /any kitchen tools to add/i })).toBeTruthy();
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Scan canceled',
      description: 'No new items were added from that scan.',
    }));
  });

  it('shows scan-limit feedback without adding partial batch results', async () => {
    vi.mocked(analyzeImage).mockRejectedValue(new Error('429: {"message":"Too many requests. Try again later."}'));
    const { container } = render(<UserProfiling onProfileComplete={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /get started/i }));

    const pantryUpload = container.querySelector('#pantry-setup-upload') as HTMLInputElement;
    fireEvent.change(pantryUpload, {
      target: { files: [new File(['image'], 'pantry.heic', { type: 'image/heic' })] },
    });

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Scan limit reached',
        description: expect.stringContaining('Wait a minute'),
        variant: 'destructive',
      }));
    });
    expect(analyzeImage).toHaveBeenCalledWith(expect.any(String), true, expect.objectContaining({
      scanType: 'pantry',
    }));
    expect(screen.queryByText(/your pantry list/i)).toBeNull();
  });

  it('skips repeated pantry scan labels and tells the user nothing new was added', async () => {
    vi.mocked(analyzeImage)
      .mockResolvedValueOnce({ ingredients: ['Rice'] })
      .mockResolvedValueOnce({ ingredients: ['rice'] });
    const { container } = render(<UserProfiling onProfileComplete={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /get started/i }));

    const pantryUpload = container.querySelector('#pantry-setup-upload') as HTMLInputElement;
    fireEvent.change(pantryUpload, {
      target: { files: [new File(['image'], 'pantry-1.heic', { type: 'image/heic' })] },
    });

    await waitFor(() => {
      expect(screen.getByText('rice')).toBeTruthy();
    });

    fireEvent.change(pantryUpload, {
      target: { files: [new File(['image'], 'pantry-2.heic', { type: 'image/heic' })] },
    });

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Already saved',
        description: 'No new pantry items were added from that scan. 1 saved item was found again.',
      }));
    });
    expect(screen.getAllByText('rice')).toHaveLength(1);
  });

  it('skips repeated tools scan labels while adding genuinely new tools', async () => {
    vi.mocked(analyzeImage)
      .mockResolvedValueOnce({ equipment: ['Chef Knife'] })
      .mockResolvedValueOnce({ equipment: ["chef's knife"] })
      .mockResolvedValueOnce({ equipment: ['chef-knife', 'Cutting Board'] });
    const { container } = render(<UserProfiling onProfileComplete={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /get started/i }));
    fireEvent.click(screen.getByRole('button', { name: /enter manually/i }));
    fireEvent.change(screen.getByLabelText(/pantry items/i), {
      target: { value: 'ground beef, mayo, rice' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save ingredients/i }));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /add tools/i }));

    const kitchenUpload = container.querySelector('#kitchen-setup-upload') as HTMLInputElement;
    fireEvent.change(kitchenUpload, {
      target: { files: [new File(['image'], 'kitchen-1.heic', { type: 'image/heic' })] },
    });

    await waitFor(() => {
      expect(screen.getByText('chef knife')).toBeTruthy();
    });

    fireEvent.change(kitchenUpload, {
      target: { files: [new File(['image'], 'kitchen-2.heic', { type: 'image/heic' })] },
    });

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Already saved',
        description: 'No new tools were added from that scan. 1 saved item was found again.',
      }));
    });
    expect(screen.getAllByText('chef knife')).toHaveLength(1);

    fireEvent.change(kitchenUpload, {
      target: { files: [new File(['image'], 'kitchen-3.heic', { type: 'image/heic' })] },
    });

    await waitFor(() => {
      expect(screen.getByText('cutting board')).toBeTruthy();
    });
    expect(screen.getAllByText('chef knife')).toHaveLength(1);
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Tools scan added items',
      description: expect.stringContaining('1 saved item was found again'),
    }));
  });

  it('requires at least three pantry ingredients before continuing', () => {
    render(<UserProfiling onProfileComplete={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /get started/i }));
    fireEvent.click(screen.getByRole('button', { name: /enter manually/i }));

    expect(screen.getByText(/separate pantry items with commas/i)).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/pantry items/i), {
      target: { value: 'ground beef. mayo' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save ingredients/i }));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
      title: "There's gotta be more in your pantry!",
      description: 'Please have at least 3 ingredients to proceed.',
      variant: 'destructive',
    }));
    expect(screen.getByRole('heading', { name: /start with pantry staples/i })).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/pantry items/i), {
      target: { value: 'rice' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save ingredients/i }));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(screen.getByRole('heading', { name: /any kitchen tools to add/i })).toBeTruthy();
  });

  it('cycles pantry manual placeholders across setup mounts', () => {
    const firstRender = render(<UserProfiling onProfileComplete={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /get started/i }));
    fireEvent.click(screen.getByRole('button', { name: /enter manually/i }));

    const firstInput = screen.getByLabelText(/pantry items/i) as HTMLInputElement;
    expect(firstInput.placeholder).toBe('raw chicken, broccoli, spaghetti');

    fireEvent.click(screen.getByRole('button', { name: /enter manually/i }));
    fireEvent.click(screen.getByRole('button', { name: /enter manually/i }));
    expect((screen.getByLabelText(/pantry items/i) as HTMLInputElement).placeholder).toBe(firstInput.placeholder);

    firstRender.unmount();

    render(<UserProfiling onProfileComplete={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /get started/i }));
    fireEvent.click(screen.getByRole('button', { name: /enter manually/i }));

    expect((screen.getByLabelText(/pantry items/i) as HTMLInputElement).placeholder).toBe(
      'parmesan, sumac, chili crisp',
    );
  });
});
