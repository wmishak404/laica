/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  Toast,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';

beforeAll(() => {
  if (!window.PointerEvent) {
    window.PointerEvent = MouseEvent as typeof PointerEvent;
  }

  if (!HTMLElement.prototype.setPointerCapture) {
    Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
      configurable: true,
      value: vi.fn(),
    });
  }

  if (!HTMLElement.prototype.releasePointerCapture) {
    Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
      configurable: true,
      value: vi.fn(),
    });
  }

  if (!HTMLElement.prototype.hasPointerCapture) {
    Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
      configurable: true,
      value: vi.fn(() => false),
    });
  }
});

afterEach(() => {
  cleanup();
});

const renderToast = async () => {
  const onOpenChange = vi.fn();

  render(
    <ToastProvider duration={Infinity}>
      <Toast open onOpenChange={onOpenChange}>
        <ToastTitle>Swipe me</ToastTitle>
      </Toast>
      <ToastViewport />
    </ToastProvider>
  );

  const title = await screen.findByText('Swipe me');
  const toast = title.closest('li');
  expect(toast).not.toBeNull();

  return {
    onOpenChange,
    toast: toast as HTMLElement,
  };
};

const swipeToast = (
  toast: HTMLElement,
  end: { x: number; y: number }
) => {
  fireEvent.pointerDown(toast, {
    button: 0,
    clientX: 100,
    clientY: 100,
    pointerId: 1,
    pointerType: 'touch',
  });
  fireEvent.pointerMove(toast, {
    clientX: end.x,
    clientY: end.y,
    pointerId: 1,
    pointerType: 'touch',
  });
  fireEvent.pointerUp(toast, {
    clientX: end.x,
    clientY: end.y,
    pointerId: 1,
    pointerType: 'touch',
  });
};

describe('Toast swipe dismissal', () => {
  it.each([
    ['left', { x: 20, y: 100 }],
    ['up', { x: 100, y: 20 }],
    ['right', { x: 180, y: 100 }],
  ])('dismisses when swiped %s', async (_direction, end) => {
    const { onOpenChange, toast } = await renderToast();

    swipeToast(toast, end);

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('does not dismiss when swiped down', async () => {
    const { onOpenChange, toast } = await renderToast();

    swipeToast(toast, { x: 100, y: 180 });

    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
