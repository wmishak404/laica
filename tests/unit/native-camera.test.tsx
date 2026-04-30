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
});
