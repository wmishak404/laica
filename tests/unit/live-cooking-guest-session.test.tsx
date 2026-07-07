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
  classifyAiRequestError: () => ({
    title: 'Request did not finish',
    description: "I couldn't finish that request right now. Try again shortly.",
  }),
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

const multiStepResponse = {
  steps: [
    {
      instruction: 'Warm the rice and beans.',
      tips: 'Stir gently.',
      visualCues: 'Steam rises.',
      commonMistakes: 'Do not scorch the rice.',
      safetyLevel: 'minor',
      duration: 60,
    },
    {
      instruction: 'Fold in salsa.',
      tips: 'Keep the heat low.',
      visualCues: 'Salsa coats the rice.',
      commonMistakes: 'Do not boil the salsa.',
      safetyLevel: 'minor',
      duration: 60,
    },
    {
      instruction: 'Finish with lime.',
      tips: 'Taste before serving.',
      visualCues: 'Rice looks glossy.',
      commonMistakes: 'Do not overmix.',
      safetyLevel: 'minor',
      duration: 60,
    },
  ],
  recipe: {
    ingredients: [{ name: 'rice' }, { name: 'beans' }],
  },
};

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
};

function createDeferred<T>(): Deferred<T> {
  let resolve: (value: T) => void = () => undefined;
  let reject: (error: unknown) => void = () => undefined;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

function installAudioMocks() {
  const speechCancel = vi.fn();
  const sources: Array<{
    buffer: unknown;
    connect: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    onended: (() => void) | null;
  }> = [];
  const tracks = [{ stop: vi.fn() }];
  const stream = { getTracks: vi.fn(() => tracks) };
  const audioContext = {
    state: 'running',
    destination: {},
    resume: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    decodeAudioData: vi.fn().mockResolvedValue({}),
    createBufferSource: vi.fn(() => {
      const source = {
        buffer: null as unknown,
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        onended: null as (() => void) | null,
      };
      sources.push(source);
      return source;
    }),
    createAnalyser: vi.fn(() => ({
      fftSize: 0,
      smoothingTimeConstant: 0,
      frequencyBinCount: 1,
      getByteTimeDomainData: vi.fn((array: Uint8Array) => {
        array[0] = 128;
      }),
    })),
    createMediaStreamSource: vi.fn(() => ({
      connect: vi.fn(),
    })),
  };
  const AudioContextMock = vi.fn(function AudioContextConstructor() {
    return audioContext;
  });

  vi.stubGlobal('speechSynthesis', {
    speaking: false,
    pending: false,
    cancel: speechCancel,
  });
  vi.stubGlobal('AudioContext', AudioContextMock);
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: vi.fn().mockResolvedValue(stream),
    },
  });

  class MockMediaRecorder {
    public state: 'inactive' | 'recording' = 'inactive';
    public ondataavailable: ((event: { data: Blob }) => void) | null = null;
    public onstop: (() => void | Promise<void>) | null = null;

    constructor(public readonly mediaStream: unknown) {}

    start() {
      this.state = 'recording';
    }

    stop() {
      this.state = 'inactive';
      this.onstop?.();
    }
  }

  vi.stubGlobal('MediaRecorder', MockMediaRecorder);

  return { speechCancel, sources, audioContext, AudioContextMock, stream, tracks };
}

async function flushPromises() {
  await act(async () => {
    for (let index = 0; index < 6; index += 1) {
      await Promise.resolve();
    }
  });
}

async function clickReadyCheckStart(name: RegExp = /^start cooking$/i) {
  await flushPromises();
  expect(screen.getByText('Ready to cook?')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name }));
  await flushPromises();
}

async function renderCookingGuide() {
  render(
    <LiveCooking
      selectedMeal={selectedMeal}
      scheduledTime=""
      onBackToPlanning={vi.fn()}
    />,
  );
  await clickReadyCheckStart();
  expect(screen.getByText('Warm the rice and beans.')).toBeTruthy();
}

async function advanceSpeechDelay(milliseconds = 900) {
  await flushPromises();
  act(() => {
    vi.advanceTimersByTime(milliseconds);
  });
  await flushPromises();
}

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
    mocks.completeCookingSession.mockResolvedValue({ id: 123 });
    mocks.synthesizeSpeech.mockResolvedValue(new ArrayBuffer(8));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('waits for Ready Check before generating cooking steps', async () => {
    render(
      <LiveCooking
        selectedMeal={selectedMeal}
        scheduledTime=""
        onBackToPlanning={vi.fn()}
      />,
    );

    expect(await screen.findByText('Ready to cook?')).toBeTruthy();
    expect(mocks.fetchCookingSteps).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /start cooking/i }));

    await screen.findByText('Warm the rice and beans.');
    await waitFor(() => expect(mocks.fetchCookingSteps).toHaveBeenCalledWith('Guest Rice Bowl', {
      ingredients: ['rice', 'beans'],
      equipment: ['skillet'],
      description: 'A quick guest recipe',
    }));
  });

  it('passes acknowledged missing ingredients while keeping one Start cooking action', async () => {
    render(
      <LiveCooking
        selectedMeal={{
          ...selectedMeal,
          missingIngredients: [' cilantro ', 'lime'],
        }}
        scheduledTime=""
        onBackToPlanning={vi.fn()}
      />,
    );

    expect(await screen.findByText('Ready to cook?')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /cook anyway/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /cook silently/i })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /^start cooking$/i }));

    await screen.findByText('Warm the rice and beans.');
    expect(mocks.fetchCookingSteps).toHaveBeenCalledWith('Guest Rice Bowl', {
      ingredients: ['rice', 'beans'],
      equipment: ['skillet'],
      description: 'A quick guest recipe',
      acknowledgedMissingIngredients: ['cilantro', 'lime'],
    });
  });

  it('does not create durable cooking sessions for anonymous guests', async () => {
    render(
      <LiveCooking
        selectedMeal={selectedMeal}
        scheduledTime=""
        onBackToPlanning={vi.fn()}
      />,
    );

    await clickReadyCheckStart();
    await screen.findByText('Warm the rice and beans.');

    expect(mocks.startCookingSession).not.toHaveBeenCalled();
  });

  it('keeps the current step and compact guidance visible in the cooking cockpit', async () => {
    mocks.fetchCookingSteps.mockResolvedValue(multiStepResponse);

    render(
      <LiveCooking
        selectedMeal={selectedMeal}
        scheduledTime=""
        onBackToPlanning={vi.fn()}
      />,
    );

    await clickReadyCheckStart();

    expect(screen.getByTestId('current-step-panel').className).toContain('sticky');
    expect(screen.queryByRole('heading', { name: /coach feed/i })).toBeNull();
    expect(screen.getByTestId('step-guidance-panel')).toBeTruthy();
    expect(screen.getByTestId('step-preview-strip')).toHaveTextContent('Warm Rice Beans');
    expect(screen.getByTestId('step-preview-strip')).toHaveTextContent('Fold Salsa');
    expect(screen.getByText('Steam rises.')).toBeTruthy();
    expect(screen.getByText('Stir gently.')).toBeTruthy();
    expect(screen.getByText('Do not scorch the rice.')).toBeTruthy();
  });

  it('uses action-forward labels for step previews', async () => {
    mocks.fetchCookingSteps.mockResolvedValue({
      steps: [
        {
          instruction: 'Bring 4 cups of water to a boil in a medium saucepan or large pot.',
          tips: 'Use a kettle to pre-boil your water for speed.',
          visualCues: 'You should see a rolling boil.',
          commonMistakes: 'Do not add the packet before boiling.',
          safetyLevel: 'minor',
          duration: 120,
        },
        {
          instruction: 'Add the dashi packet and simmer for 2 minutes.',
          tips: 'Stir once to dissolve.',
          visualCues: 'The broth turns amber.',
          commonMistakes: 'Do not boil hard after adding dashi.',
          safetyLevel: 'minor',
          duration: 120,
        },
      ],
    });

    render(
      <LiveCooking
        selectedMeal={selectedMeal}
        scheduledTime=""
        onBackToPlanning={vi.fn()}
      />,
    );

    await clickReadyCheckStart();

    const previewStrip = screen.getByTestId('step-preview-strip');
    expect(previewStrip).toHaveTextContent('Boil Water');
    expect(previewStrip).toHaveTextContent('Add Dashi Packet');
    expect(previewStrip).not.toHaveTextContent('Bring 4 Cups');
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

    await clickReadyCheckStart();
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

    await clickReadyCheckStart();
    expect(await screen.findByText('Warm the rice and beans.')).toBeTruthy();
    expect(screen.queryByText('Stale step from the old pantry.')).toBeNull();
    expect(mocks.fetchCookingSteps).toHaveBeenCalledTimes(1);
    const rewrittenSession = JSON.parse(window.localStorage.getItem('laica_cooking_session:guest:guest-user-id') || '{}');
    expect(rewrittenSession.profileFingerprint).toBe('current-profile');
    expect(rewrittenSession.steps?.[0]?.instruction).toBe('Warm the rice and beans.');
  });

  it('keeps failed cooking-step generation inline and retries without using generic steps first', async () => {
    mocks.fetchCookingSteps
      .mockRejectedValueOnce(new Error('provider unavailable'))
      .mockResolvedValueOnce(multiStepResponse);

    render(
      <LiveCooking
        selectedMeal={selectedMeal}
        scheduledTime=""
        onBackToPlanning={vi.fn()}
      />,
    );

    await clickReadyCheckStart();
    expect(await screen.findByText('Cooking guide needs another try')).toBeTruthy();
    expect(screen.getByText(/try again shortly/i)).toBeTruthy();
    expect(screen.queryByText('Prepare ingredients for Guest Rice Bowl')).toBeNull();
    expect(mocks.toast).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(await screen.findByText('Warm the rice and beans.')).toBeTruthy();
    expect(mocks.fetchCookingSteps).toHaveBeenCalledTimes(2);
  });

  it('uses the basic backup guide only after the cook chooses it', async () => {
    mocks.fetchCookingSteps.mockResolvedValueOnce({
      steps: [],
      recipe: { ingredients: [] },
    });

    render(
      <LiveCooking
        selectedMeal={selectedMeal}
        scheduledTime=""
        onBackToPlanning={vi.fn()}
      />,
    );

    await clickReadyCheckStart();
    expect(await screen.findByText('Cooking guide needs another try')).toBeTruthy();
    expect(screen.queryByText('Prepare ingredients for Guest Rice Bowl')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /use basic steps/i }));

    expect(await screen.findByText('Prepare ingredients for Guest Rice Bowl')).toBeTruthy();
    expect(screen.getByTestId('text-transcription-full').textContent).toContain('basic backup guide');
    expect(mocks.fetchCookingSteps).toHaveBeenCalledTimes(1);
  });

  it('keeps placeholder cooking steps in recovery and does not start a linked session', async () => {
    mocks.authUser = {
      id: 'linked-user-id',
      email: 'cook@example.com',
    };
    mocks.fetchCookingSteps.mockResolvedValueOnce({
      steps: [
        '   ',
        { instruction: 'Step 1' },
        { instruction: 'TBD' },
        { instruction: 'Follow the recipe instructions.' },
      ],
      recipe: { ingredients: [{ name: 'rice' }] },
    });

    render(
      <LiveCooking
        selectedMeal={selectedMeal}
        scheduledTime=""
        onBackToPlanning={vi.fn()}
      />,
    );

    await clickReadyCheckStart();
    expect(await screen.findByText('Cooking guide needs another try')).toBeTruthy();
    expect(screen.getByText(/usable cooking steps/i)).toBeTruthy();
    expect(screen.queryByText('Step 1')).toBeNull();
    expect(screen.queryByText('Follow the recipe instructions.')).toBeNull();
    expect(mocks.startCookingSession).not.toHaveBeenCalled();
  });

  it('requires Ready Check before regenerating saved placeholder steps', async () => {
    window.localStorage.setItem('laica_cooking_session:guest:guest-user-id', JSON.stringify({
      recipeName: 'Guest Rice Bowl',
      recipeId: 'meal-1',
      currentStepIndex: 0,
      timer: 0,
      isTimerRunning: false,
      savedAt: Date.now(),
      steps: [
        {
          id: 1,
          instruction: 'Step 1',
          tips: '',
          visualCues: '',
          commonMistakes: '',
          safetyLevel: 'minor',
        },
      ],
      ingredients: [{ name: 'rice' }],
      profileFingerprint: 'current-profile',
    }));
    mocks.fetchCookingSteps.mockResolvedValueOnce(multiStepResponse);

    render(
      <LiveCooking
        selectedMeal={selectedMeal}
        scheduledTime=""
        onBackToPlanning={vi.fn()}
        profileFingerprint="current-profile"
      />,
    );

    expect(await screen.findByText('Ready to cook?')).toBeTruthy();
    expect(screen.queryByText('Step 1')).toBeNull();
    expect(mocks.fetchCookingSteps).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /start cooking/i }));

    expect(await screen.findByText('Warm the rice and beans.')).toBeTruthy();
    expect(screen.queryByText('Step 1')).toBeNull();
    expect(mocks.fetchCookingSteps).toHaveBeenCalledTimes(1);
  });

  it('finishes linked cooking sessions without inventing a rating or pantry update', async () => {
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

    await clickReadyCheckStart();
    expect(await screen.findByText('Warm the rice and beans.')).toBeTruthy();
    await waitFor(() => expect(mocks.startCookingSession).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: /finish/i }));

    await waitFor(() => expect(mocks.completeCookingSession).toHaveBeenCalledTimes(1));
    const completionPayload = mocks.completeCookingSession.mock.calls[0][0].completionData;
    expect(completionPayload).toEqual(expect.objectContaining({
      ingredientsRemaining: [],
      completedSteps: 1,
      cookingDuration: expect.any(Number),
    }));
    expect(completionPayload).not.toHaveProperty('userRating');
    expect(completionPayload).not.toHaveProperty('userNotes');
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Nice, dinner's ready.",
      description: "Saved to your cooking history. Pantry cleanup comes next.",
    }));
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

    await clickReadyCheckStart();
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

  it('keeps captions opt-in and persists the visible CC toggle', async () => {
    render(
      <LiveCooking
        selectedMeal={selectedMeal}
        scheduledTime=""
        onBackToPlanning={vi.fn()}
      />,
    );

    await clickReadyCheckStart();
    expect(await screen.findByText('Warm the rice and beans.')).toBeTruthy();
    expect(screen.queryByTestId('transcription-box')).toBeNull();
    expect(screen.getByTestId('text-transcription-full').className).toContain('sr-only');
    expect(screen.getByTestId('button-toggle-captions')).toHaveTextContent('CC');
    expect(screen.getByRole('button', { name: /show captions/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /show captions/i }));

    expect(screen.getByTestId('transcription-box')).toBeTruthy();
    expect(window.localStorage.getItem('laica_captions_visible')).toBe('true');
    expect(screen.getByRole('button', { name: /hide captions/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /hide captions/i }));

    expect(screen.queryByTestId('transcription-box')).toBeNull();
    expect(window.localStorage.getItem('laica_captions_visible')).toBe('false');
  });

  it('falls back to hidden captions when the saved captions preference is malformed', async () => {
    window.localStorage.setItem('laica_captions_visible', 'not-json');

    render(
      <LiveCooking
        selectedMeal={selectedMeal}
        scheduledTime=""
        onBackToPlanning={vi.fn()}
      />,
    );

    await clickReadyCheckStart();
    expect(await screen.findByText('Warm the rice and beans.')).toBeTruthy();
    expect(screen.queryByTestId('transcription-box')).toBeNull();
    expect(screen.getByRole('button', { name: /show captions/i })).toBeTruthy();
    expect(window.localStorage.getItem('laica_captions_visible')).toBeNull();
  });

  describe('speech arbitration acceptance', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      mocks.fetchCookingSteps.mockResolvedValue(multiStepResponse);
      mocks.synthesizeSpeech.mockResolvedValue(new ArrayBuffer(8));
    });

    it('plays the first step audio after the welcome/setup transcript without skipping Step 1 speech', async () => {
      const audio = installAudioMocks();

      await renderCookingGuide();
      await advanceSpeechDelay();

      const transcript = screen.getByTestId('text-transcription-full').textContent;
      expect(transcript).toContain("Let's start with step 1: Warm the rice and beans.");
      expect(mocks.synthesizeSpeech).toHaveBeenCalledTimes(1);
      expect(mocks.synthesizeSpeech).toHaveBeenLastCalledWith(transcript, {});
      expect(audio.sources[0].start).toHaveBeenCalledTimes(1);
    });

    it('interrupts current step audio on Next and speaks the next step transcript instead', async () => {
      const audio = installAudioMocks();

      await renderCookingGuide();
      await advanceSpeechDelay();

      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      const transcript = screen.getByTestId('text-transcription-full').textContent;

      expect(audio.sources[0].stop).toHaveBeenCalledTimes(1);
      expect(transcript).toBe('Step 2: Fold in salsa. Keep the heat low.');

      await advanceSpeechDelay();

      expect(mocks.synthesizeSpeech).toHaveBeenCalledTimes(2);
      expect(mocks.synthesizeSpeech).toHaveBeenLastCalledWith(transcript, {});
      expect(audio.sources[1].start).toHaveBeenCalledTimes(1);
    });

    it('interrupts current step audio on Previous and speaks the previous step transcript instead', async () => {
      const audio = installAudioMocks();

      await renderCookingGuide();
      await advanceSpeechDelay();
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await advanceSpeechDelay();

      fireEvent.click(screen.getByRole('button', { name: /previous/i }));
      const transcript = screen.getByTestId('text-transcription-full').textContent;

      expect(audio.sources[1].stop).toHaveBeenCalledTimes(1);
      expect(transcript).toBe('Back to step 1: Warm the rice and beans.');

      await advanceSpeechDelay();

      expect(mocks.synthesizeSpeech).toHaveBeenCalledTimes(3);
      expect(mocks.synthesizeSpeech).toHaveBeenLastCalledWith(transcript, {});
      expect(audio.sources[2].start).toHaveBeenCalledTimes(1);
    });

    it('cancels active and pending audio when another speech-bearing action starts', async () => {
      const audio = installAudioMocks();
      const staleRepeatSpeech = createDeferred<ArrayBuffer>();
      const timerSpeech = createDeferred<ArrayBuffer>();
      mocks.synthesizeSpeech
        .mockReturnValueOnce(staleRepeatSpeech.promise)
        .mockReturnValueOnce(timerSpeech.promise);

      await renderCookingGuide();

      fireEvent.click(screen.getByRole('button', { name: /repeat step/i }));
      await advanceSpeechDelay();
      expect(mocks.synthesizeSpeech).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole('button', { name: /start 1 min timer/i }));
      staleRepeatSpeech.resolve(new ArrayBuffer(8));
      await flushPromises();

      expect(audio.sources).toHaveLength(0);

      await advanceSpeechDelay();
      const transcript = screen.getByTestId('text-transcription-full').textContent;
      expect(transcript).toBe("Timer set for 1 minutes. I'll let you know when time is up!");
      expect(mocks.synthesizeSpeech).toHaveBeenCalledTimes(2);
      expect(mocks.synthesizeSpeech).toHaveBeenLastCalledWith(transcript, {});

      timerSpeech.resolve(new ArrayBuffer(8));
      await flushPromises();
      expect(audio.sources).toHaveLength(1);
      expect(audio.sources[0].start).toHaveBeenCalledTimes(1);
    });

    it('stops active and pending step audio before Ask a question begins recording', async () => {
      const audio = installAudioMocks();

      await renderCookingGuide();
      await advanceSpeechDelay();

      fireEvent.click(screen.getByRole('button', { name: /ask a question/i }));
      await flushPromises();

      expect(audio.sources[0].stop).toHaveBeenCalledTimes(1);
      expect(audio.speechCancel).toHaveBeenCalled();
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
      expect(screen.getByText(/listening/i)).toBeTruthy();
    });

    it('stops active and pending audio immediately when Mute is pressed', async () => {
      const audio = installAudioMocks();

      await renderCookingGuide();
      await advanceSpeechDelay();

      fireEvent.click(screen.getByRole('button', { name: /mute audio/i }));

      expect(audio.sources[0].stop).toHaveBeenCalledTimes(1);
      expect(audio.speechCancel).toHaveBeenCalled();
      expect(screen.getByRole('button', { name: /turn audio on/i })).toBeTruthy();
    });

    it('keeps Muted state across step navigation and prevents automatic step audio', async () => {
      installAudioMocks();

      await renderCookingGuide();
      fireEvent.click(screen.getByRole('button', { name: /mute audio/i }));
      mocks.synthesizeSpeech.mockClear();

      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await advanceSpeechDelay();

      expect(screen.getByRole('button', { name: /turn audio on/i })).toBeTruthy();
      expect(screen.getByTestId('text-transcription-full').textContent).toBe('Step 2: Fold in salsa. Keep the heat low.');
      expect(mocks.synthesizeSpeech).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole('button', { name: /previous/i }));
      await advanceSpeechDelay();

      expect(screen.getByRole('button', { name: /turn audio on/i })).toBeTruthy();
      expect(screen.getByTestId('text-transcription-full').textContent).toBe('Back to step 1: Warm the rice and beans.');
      expect(mocks.synthesizeSpeech).not.toHaveBeenCalled();
    });

    it('does not auto-play after unmuting until the user presses Repeat Step', async () => {
      installAudioMocks();

      await renderCookingGuide();
      fireEvent.click(screen.getByRole('button', { name: /mute audio/i }));
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      mocks.synthesizeSpeech.mockClear();

      fireEvent.click(screen.getByRole('button', { name: /turn audio on/i }));
      await advanceSpeechDelay(1200);

      expect(screen.getByRole('button', { name: /mute audio/i })).toBeTruthy();
      expect(mocks.synthesizeSpeech).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole('button', { name: /repeat step/i }));
      await advanceSpeechDelay();

      const transcript = screen.getByTestId('text-transcription-full').textContent;
      expect(transcript).toBe('Step 2: Fold in salsa. Keep the heat low.');
      expect(mocks.synthesizeSpeech).toHaveBeenCalledTimes(1);
      expect(mocks.synthesizeSpeech).toHaveBeenLastCalledWith(transcript, {});
    });

    it('speaks exactly the visible transcript text for step, repeat, timer, and assistant responses', async () => {
      installAudioMocks();

      await renderCookingGuide();
      await advanceSpeechDelay();
      expect(mocks.synthesizeSpeech).toHaveBeenLastCalledWith(
        screen.getByTestId('text-transcription-full').textContent,
        {},
      );

      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await advanceSpeechDelay();
      expect(mocks.synthesizeSpeech).toHaveBeenLastCalledWith(
        screen.getByTestId('text-transcription-full').textContent,
        {},
      );

      fireEvent.click(screen.getByRole('button', { name: /repeat step/i }));
      await advanceSpeechDelay();
      expect(mocks.synthesizeSpeech).toHaveBeenLastCalledWith(
        screen.getByTestId('text-transcription-full').textContent,
        {},
      );

      fireEvent.click(screen.getByRole('button', { name: /start 1 min timer/i }));
      await advanceSpeechDelay();
      expect(mocks.synthesizeSpeech).toHaveBeenLastCalledWith(
        screen.getByTestId('text-transcription-full').textContent,
        {},
      );
    });

    it('ignores late-resolving synthesis from an interrupted step or action', async () => {
      const audio = installAudioMocks();
      const staleSpeech = createDeferred<ArrayBuffer>();
      const nextSpeech = createDeferred<ArrayBuffer>();
      mocks.synthesizeSpeech
        .mockReturnValueOnce(staleSpeech.promise)
        .mockReturnValueOnce(nextSpeech.promise);

      await renderCookingGuide();
      await advanceSpeechDelay();
      expect(mocks.synthesizeSpeech).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      staleSpeech.resolve(new ArrayBuffer(8));
      await flushPromises();

      expect(audio.sources).toHaveLength(0);

      await advanceSpeechDelay();
      const transcript = screen.getByTestId('text-transcription-full').textContent;
      expect(mocks.synthesizeSpeech).toHaveBeenCalledTimes(2);
      expect(mocks.synthesizeSpeech).toHaveBeenLastCalledWith(transcript, {});

      nextSpeech.resolve(new ArrayBuffer(8));
      await flushPromises();
      expect(audio.sources).toHaveLength(1);
      expect(audio.sources[0].start).toHaveBeenCalledTimes(1);
    });

    it('handles rapid Next/Previous/Repeat taps with only the final requested transcript spoken', async () => {
      installAudioMocks();

      await renderCookingGuide();

      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      fireEvent.click(screen.getByRole('button', { name: /previous/i }));
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      fireEvent.click(screen.getByRole('button', { name: /repeat step/i }));

      await advanceSpeechDelay();

      const transcript = screen.getByTestId('text-transcription-full').textContent;
      expect(transcript).toBe('Step 2: Fold in salsa. Keep the heat low.');
      expect(mocks.synthesizeSpeech).toHaveBeenCalledTimes(1);
      expect(mocks.synthesizeSpeech).toHaveBeenLastCalledWith(transcript, {});
    });

    it('lets timer completion audio interrupt step audio without leaving stale playback queued', async () => {
      const audio = installAudioMocks();

      await renderCookingGuide();
      await advanceSpeechDelay();

      fireEvent.click(screen.getByRole('button', { name: /start 1 min timer/i }));
      await advanceSpeechDelay();

      expect(audio.sources[1].start).toHaveBeenCalledTimes(1);

      for (let index = 0; index < 60; index += 1) {
        await act(async () => {
          vi.advanceTimersByTime(1000);
          await Promise.resolve();
        });
      }

      expect(audio.sources[1].stop).toHaveBeenCalledTimes(1);

      await advanceSpeechDelay();

      const transcript = screen.getByTestId('text-transcription-full').textContent;
      expect(transcript).toBe("Time's up! Check your cooking and let me know how it looks.");
      expect(mocks.synthesizeSpeech).toHaveBeenLastCalledWith(transcript, {});
      expect(audio.sources.at(-1)?.start).toHaveBeenCalledTimes(1);
    });
  });
});
