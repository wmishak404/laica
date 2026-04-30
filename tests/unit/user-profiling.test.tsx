/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import UserProfiling from '../../client/src/components/cooking/user-profiling';

vi.mock('@/lib/openai', () => ({
  analyzeImage: vi.fn(),
}));

describe('UserProfiling setup flow', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
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
    expect(screen.getByRole('button', { name: /enter manually/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /scanning tips/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /back/i }));

    expect(screen.getByRole('heading', { name: /yes, chef/i })).toBeTruthy();
  });

  it('auto-advances from Cooking Skill after one selection', () => {
    const onProfileComplete = vi.fn();
    render(<UserProfiling onProfileComplete={onProfileComplete} />);

    fireEvent.click(screen.getByRole('button', { name: /get started/i }));
    fireEvent.click(screen.getByRole('button', { name: /enter manually/i }));
    fireEvent.change(screen.getByPlaceholderText(/ground beef, mayo, rice, packaged salad/i), {
      target: { value: 'ground beef, mayo' },
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
});
