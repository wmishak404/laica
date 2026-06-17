/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  synthesizeSpeech: vi.fn(),
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
    synthesizeSpeech: mocks.synthesizeSpeech,
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
    mocks.synthesizeSpeech.mockResolvedValue(new ArrayBuffer(8));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
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

  it('restores the saved guest step tray without reinitializing cooking steps', async () => {
    window.localStorage.setItem('laica_cooking_session:guest:guest-user-id', JSON.stringify({
      recipeName: 'Guest Rice Bowl',
      recipeId: 'meal-1',
      currentStepIndex: 99,
      timer: 0,
      isTimerRunning: false,
      savedAt: Date.now(),
      steps: [
        {
          id: 1,
          instruction: 'Warm the rice and beans.',
          tips: 'Stir gently.',
          visualCues: 'Steam rises.',
          commonMistakes: 'Do not scorch the rice.',
          safetyLevel: 'minor',
        },
        {
          id: 2,
          instruction: 'Finish with lime.',
          tips: 'Taste before serving.',
          visualCues: 'Rice looks glossy.',
          commonMistakes: 'Do not overmix.',
          safetyLevel: 'minor',
        },
      ],
      ingredients: [{ name: 'rice' }, { name: 'beans' }],
      profileFingerprint: 'current-profile',
    }));

    render(
      <LiveCooking
        selectedMeal={selectedMeal}
        scheduledTime=""
        onBackToPlanning={vi.fn()}
        profileFingerprint="current-profile"
      />,
    );

    expect(await screen.findByText('Finish with lime.')).toBeTruthy();
    expect(screen.getByText('Step 2 of 2')).toBeTruthy();
    expect(mocks.fetchCookingSteps).not.toHaveBeenCalled();
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

  it('does not create another durable session when linked users restore a saved step tray', async () => {
    mocks.authUser = {
      id: 'linked-user-id',
      email: 'cook@example.com',
    };
    window.localStorage.setItem('laica_cooking_session:linked:linked-user-id', JSON.stringify({
      recipeName: 'Guest Rice Bowl',
      recipeId: 'meal-1',
      currentStepIndex: 1,
      timer: 0,
      isTimerRunning: false,
      savedAt: Date.now(),
      steps: [
        {
          id: 1,
          instruction: 'Warm the rice and beans.',
          tips: 'Stir gently.',
          visualCues: 'Steam rises.',
          commonMistakes: 'Do not scorch the rice.',
          safetyLevel: 'minor',
        },
        {
          id: 2,
          instruction: 'Finish with lime.',
          tips: 'Taste before serving.',
          visualCues: 'Rice looks glossy.',
          commonMistakes: 'Do not overmix.',
          safetyLevel: 'minor',
        },
      ],
      ingredients: [{ name: 'rice' }, { name: 'beans' }],
      profileFingerprint: 'current-profile',
    }));

    render(
      <LiveCooking
        selectedMeal={selectedMeal}
        scheduledTime=""
        onBackToPlanning={vi.fn()}
        profileFingerprint="current-profile"
      />,
    );

    expect(await screen.findByText('Finish with lime.')).toBeTruthy();
    expect(mocks.fetchCookingSteps).not.toHaveBeenCalled();
    expect(mocks.startCookingSession).not.toHaveBeenCalled();
  });

  it('drops saved step trays when the profile fingerprint no longer matches', async () => {
    window.localStorage.setItem('laica_cooking_session:guest:guest-user-id', JSON.stringify({
      recipeName: 'Guest Rice Bowl',
      recipeId: 'meal-1',
      currentStepIndex: 1,
      timer: 0,
      isTimerRunning: false,
      savedAt: Date.now(),
      steps: [
        {
          id: 1,
          instruction: 'Stale step from the old pantry.',
          tips: 'Old tip.',
          visualCues: 'Old cue.',
          commonMistakes: 'Old mistake.',
          safetyLevel: 'minor',
        },
      ],
      ingredients: [{ name: 'old pantry item' }],
      profileFingerprint: 'old-profile',
    }));

    render(
      <LiveCooking
        selectedMeal={selectedMeal}
        scheduledTime=""
        onBackToPlanning={vi.fn()}
        profileFingerprint="current-profile"
      />,
    );

    expect(await screen.findByText('Warm the rice and beans.')).toBeTruthy();
    expect(screen.queryByText('Stale step from the old pantry.')).toBeNull();
    expect(mocks.fetchCookingSteps).toHaveBeenCalledTimes(1);
    const rewrittenSession = JSON.parse(window.localStorage.getItem('laica_cooking_session:guest:guest-user-id') || '{}');
    expect(rewrittenSession.profileFingerprint).toBe('current-profile');
    expect(rewrittenSession.steps?.[0]?.instruction).toBe('Warm the rice and beans.');
  });

  it('stops queued cooking audio when leaving before speech playback starts', async () => {
    vi.useFakeTimers();

    let resolveSpeech: (buffer: ArrayBuffer) => void = () => undefined;
    mocks.synthesizeSpeech.mockReturnValueOnce(new Promise<ArrayBuffer>((resolve) => {
      resolveSpeech = resolve;
    }));
    const browserSpeechCancel = vi.fn();
    vi.stubGlobal('speechSynthesis', {
      speaking: true,
      pending: true,
      cancel: browserSpeechCancel,
    });
    const AudioContextMock = vi.fn();
    vi.stubGlobal('AudioContext', AudioContextMock);
    const onBackToPlanning = vi.fn();

    render(
      <LiveCooking
        selectedMeal={selectedMeal}
        scheduledTime=""
        onBackToPlanning={onBackToPlanning}
      />,
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText('Warm the rice and beans.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /repeat step/i }));

    await act(async () => {
      vi.advanceTimersByTime(900);
      await Promise.resolve();
    });

    expect(mocks.synthesizeSpeech).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /back to planning/i }));
    resolveSpeech(new ArrayBuffer(8));

    await act(async () => {
      await Promise.resolve();
      vi.advanceTimersByTime(500);
      await Promise.resolve();
    });

    expect(onBackToPlanning).toHaveBeenCalledTimes(1);
    expect(browserSpeechCancel).toHaveBeenCalled();
    expect(AudioContextMock).not.toHaveBeenCalled();
  });
});
