import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';

/**
 * Test Setup and Configuration
 * 
 * This file configures the testing environment for both unit and E2E tests
 */

// Global test setup
beforeAll(() => {
  // Setup test database if needed
  console.log('Setting up test environment...');
  
  // Mock environment variables for testing
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
});

afterAll(() => {
  // Cleanup after all tests
  console.log('Cleaning up test environment...');
});

beforeEach(() => {
  // Reset mocks before each test
  vi.clearAllMocks();
  
  // Clear localStorage
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
  
  // Reset any global state
  if (typeof window !== 'undefined') {
    // Reset any window properties that tests might modify
    delete (window as any).mockTTSCalls;
  }
});

afterEach(() => {
  // Cleanup after each test
  vi.restoreAllMocks();
});

// Mock Firebase for testing
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({}))
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
      getIdToken: vi.fn().mockResolvedValue('mock-token')
    },
    onAuthStateChanged: vi.fn((callback) => {
      callback({
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User'
      });
      return vi.fn(); // unsubscribe function
    })
  })),
  signInWithPopup: vi.fn().mockResolvedValue({
    user: {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User'
    }
  }),
  GoogleAuthProvider: vi.fn(() => ({})),
  signOut: vi.fn().mockResolvedValue(undefined)
}));

// Mock OpenAI for testing
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Mock AI response for cooking assistance'
            }
          }]
        })
      }
    },
    audio: {
      transcriptions: {
        create: vi.fn().mockResolvedValue({
          text: 'Mock transcription result'
        })
      }
    }
  }))
}));

// Mock ElevenLabs for testing
vi.mock('@/lib/elevenlabs', () => ({
  ElevenLabsClient: vi.fn().mockImplementation(() => ({
    synthesizeSpeech: vi.fn().mockResolvedValue(new ArrayBuffer(1024)),
    playAudio: vi.fn().mockResolvedValue(undefined),
    speakText: vi.fn().mockResolvedValue(undefined)
  })),
  browserTTSClient: {
    speak: vi.fn().mockResolvedValue(undefined)
  }
}));

// Global test utilities
export const createMockUser = () => ({
  id: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  profileImageUrl: 'https://example.com/avatar.jpg'
});

export const createMockRecipe = () => ({
  name: 'Test Recipe',
  ingredients: ['ingredient1', 'ingredient2'],
  steps: [
    {
      instruction: 'First step instruction',
      tips: 'Helpful tip for first step',
      duration: 300,
      visualCues: 'What to look for',
      commonMistakes: 'What to avoid',
      safetyTips: []
    }
  ],
  difficulty: 'Easy',
  totalTime: 30,
  servings: 2
});

export const waitForAudioPlayback = () => new Promise(resolve => setTimeout(resolve, 100));
export const waitForProcessing = () => new Promise(resolve => setTimeout(resolve, 500));