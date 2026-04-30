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
    render(<UserProfiling onProfileComplete={vi.fn()} />);

    expect(screen.getByRole('heading', { name: /let's set up your kitchen/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /get started/i }));

    expect(screen.getByRole('heading', { name: /let's take note of what you have/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /back/i }));

    expect(screen.getByRole('heading', { name: /let's set up your kitchen/i })).toBeTruthy();
  });

  it('auto-advances from Cooking Skill after one selection', () => {
    render(<UserProfiling onProfileComplete={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /get started/i }));
    fireEvent.click(screen.getByRole('button', { name: /enter manually/i }));
    fireEvent.change(screen.getByPlaceholderText(/buns, mayo, tomatoes/i), {
      target: { value: 'buns, mayo' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save ingredients/i }));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /skip for now/i }));

    expect(screen.getByRole('heading', { name: /how comfortable are you cooking/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('radio', { name: /beginner/i }));

    expect(screen.getByRole('heading', { name: /anything i should avoid/i })).toBeTruthy();
  });
});
