/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NativeCamera } from '../../client/src/components/ui/native-camera';

describe('NativeCamera', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('keeps camera off until the user turns it on', async () => {
    const stop = vi.fn();
    const getUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop }],
    });

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });
    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });

    render(
      <NativeCamera
        onImageCapture={vi.fn()}
        onError={vi.fn()}
        showUploadButton={false}
      />,
    );

    expect(screen.getByText('Camera is off')).toBeTruthy();
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /upload/i })).toBeNull();

    fireEvent.click(screen.getByRole('switch', { name: /turn on camera/i }));

    await waitFor(() => {
      expect(getUserMedia).toHaveBeenCalledTimes(1);
    });
  });

  it('surfaces a clear error when live camera is unavailable', async () => {
    const onError = vi.fn();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: undefined,
    });

    render(
      <NativeCamera
        onImageCapture={vi.fn()}
        onError={onError}
        showUploadButton={false}
      />,
    );

    fireEvent.click(screen.getByRole('switch', { name: /turn on camera/i }));

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        'Live camera is not available in this browser. Upload a photo or enter items manually.',
      );
    });
    expect(screen.getByText(/camera is not available/i)).toBeTruthy();
  });
});
