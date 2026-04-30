/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { analyzeImage } from '@/lib/openai';
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

describe('UserProfiling setup flow', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    window.localStorage.clear();
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
    fireEvent.click(screen.getByRole('button', { name: /skip for now/i }));

    expect(screen.getByRole('heading', { name: /how comfortable are you with cooking/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('radio', { name: /beginner/i }));

    expect(screen.getByRole('heading', { name: /anything i should avoid/i })).toBeTruthy();
    expect(onProfileComplete).not.toHaveBeenCalled();

    const nextButton = screen.getByRole('button', { name: /next/i }) as HTMLButtonElement;
    expect(nextButton.disabled).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: /no restrictions/i }));
    expect(nextButton.disabled).toBe(false);
  });

  it('cancels oversized pantry and kitchen upload batches without partial analysis', () => {
    const analyzeImageMock = vi.mocked(analyzeImage);
    const { container } = render(<UserProfiling onProfileComplete={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /get started/i }));

    const pantryUpload = container.querySelector('#pantry-setup-upload') as HTMLInputElement;
    fireEvent.change(pantryUpload, { target: { files: makeImageFiles(9) } });

    expect(analyzeImageMock).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Too many photos',
      description: expect.stringContaining('up to 8 photos'),
      variant: 'destructive',
    }));

    fireEvent.click(screen.getByRole('button', { name: /enter manually/i }));
    fireEvent.change(screen.getByLabelText(/pantry items/i), {
      target: { value: 'ground beef, mayo, rice' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save ingredients/i }));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    const kitchenUpload = container.querySelector('#kitchen-setup-upload') as HTMLInputElement;
    fireEvent.change(kitchenUpload, { target: { files: makeImageFiles(7) } });

    expect(analyzeImageMock).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Too many photos',
      description: expect.stringContaining('up to 6 photos'),
      variant: 'destructive',
    }));
  });

  it('cancels an active kitchen upload when backing out of the step', async () => {
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
    expect(screen.getByRole('heading', { name: /start with pantry staples/i })).toBeTruthy();
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Scan canceled',
      description: 'No new items were added from that scan.',
    }));
  });

  it('shows scan-limit feedback without adding partial batch results', async () => {
    vi.mocked(analyzeImage).mockRejectedValue(new Error('429: {"message":"Too many requests. Please try again later."}'));
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
        description: 'No new pantry items were added from that scan.',
      }));
    });
    expect(screen.getAllByText('rice')).toHaveLength(1);
  });

  it('skips repeated kitchen scan labels while adding genuinely new tools', async () => {
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
        description: 'No new kitchen tools were added from that scan.',
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
      title: 'Kitchen scan added items',
      description: expect.stringContaining('1 already-saved item was skipped'),
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

    expect(screen.getByRole('heading', { name: /tell me what tools you use/i })).toBeTruthy();
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
