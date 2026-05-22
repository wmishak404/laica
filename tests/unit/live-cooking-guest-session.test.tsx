/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LiveCooking from '../../client/src/components/cooking/live-cooking';

const mocks = vi.hoisted(() => ({
  authUser: {
    id: 'guest-user-id',
    email: null,
    isAnonymous: true,
  } as { id: string; email: string | null; isAnonymous?: boolean },
  fetchCookingSteps: vi.fn(),
  startCookingSession: vi.fn(),
  updateCookingSession: vi.fn(),
  completeCookingSession: vi.fn(),
  toast: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  isGuestUser: (user: { isAnonymous?: boolean } | null | undefined) => Boolean(user?.isAnonymous),
  useAuth: () => ({ user: mocks.authUser }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock('@/hooks/useCookingSession', () => ({
  useStartCookingSession: () => ({ mutateAsync: mocks.startCookingSession }),
  useUpdateCookingSession: () => ({ mutateAsync: mocks.updateCookingSession }),
  useCompleteCookingSession: () => ({ mutateAsync: mocks.completeCookingSession }),
}));

vi.mock('@/lib/openai', () => ({
  fetchCookingSteps: mocks.fetchCookingSteps,
  fetchCookingAssistance: vi.fn(),
}));

vi.mock('@/lib/rateLimitHandler', () => ({
  withAiErrorHandling: async (callback: () => Promise<unknown>) => callback(),
}));

vi.mock('@/lib/elevenlabs', () => ({
  COOKING_VOICE_SETTINGS: {},
  elevenLabsClient: {
    synthesizeSpeech: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
  },
  browserTTSClient: {
    speak: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/lib/audioUtils', () => ({
  AudioProcessor: {
    compressAudio: vi.fn(),
  },
}));

vi.mock('@/lib/usageTracker', () => ({
  UsageTracker: {
    getUsageStats: () => ({
      totalTranscriptions: 0,
      dailyUsage: 0,
      totalCost: 0,
    }),
    checkUsageLimits: () => ({
      withinLimits: true,
      limitsExceeded: [],
      warnings: [],
      remainingUsage: { dailyMinutes: 60 },
    }),
    recordUsage: vi.fn(),
  },
}));

const selectedMeal = {
  id: 'meal-1',
  recipeName: 'Guest Rice Bowl',
  description: 'A quick guest recipe',
  cookTime: 20,
  difficulty: 'Easy',
  cuisine: 'Pantry',
  pantryMatch: 90,
  missingIngredients: [],
  ingredients: ['rice', 'beans'],
  equipment: ['skillet'],
};

describe('LiveCooking guest session boundary', () => {
  beforeEach(() => {
    mocks.authUser = {
      id: 'guest-user-id',
      email: null,
      isAnonymous: true,
    };
    mocks.fetchCookingSteps.mockResolvedValue({
      steps: [{
        instruction: 'Warm the rice and beans.',
        tips: 'Stir gently.',
        visualCues: 'Steam rises.',
        commonMistakes: 'Do not scorch the rice.',
        safetyLevel: 'minor',
      }],
      recipe: {
        ingredients: [{ name: 'rice' }, { name: 'beans' }],
      },
    });
    mocks.startCookingSession.mockResolvedValue({ id: 123 });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('does not create durable cooking sessions for anonymous guests', async () => {
    render(
      <LiveCooking
        selectedMeal={selectedMeal}
        scheduledTime=""
        onBackToPlanning={vi.fn()}
      />,
    );

    await screen.findByText('Warm the rice and beans.');
    await waitFor(() => expect(mocks.fetchCookingSteps).toHaveBeenCalledWith('Guest Rice Bowl', {
      ingredients: ['rice', 'beans'],
      equipment: ['skillet'],
      description: 'A quick guest recipe',
    }));

    expect(mocks.startCookingSession).not.toHaveBeenCalled();
  });

  it('keeps durable cooking sessions for linked users', async () => {
    mocks.authUser = {
      id: 'linked-user-id',
      email: 'cook@example.com',
    };

    render(
      <LiveCooking
        selectedMeal={selectedMeal}
        scheduledTime=""
        onBackToPlanning={vi.fn()}
      />,
    );

    await screen.findByText('Warm the rice and beans.');
    await waitFor(() => expect(mocks.startCookingSession).toHaveBeenCalledTimes(1));
  });
});
