import { apiRequest } from './queryClient';
import { isRateLimitError, isAPIError } from './rateLimitHandler';

export interface VoiceSettings {
  voiceId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

export interface CookingVoice {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface VoicesResponse {
  cookingVoices: CookingVoice[];
  allVoices: any[];
}

export class ElevenLabsClient {
  private audioContext: AudioContext | null = null;
  private lastSynthesisText: string = '';
  private lastSynthesisTime: number = 0;
  private synthesisThrottleMs: number = 1000; // Prevent duplicate calls within 1 second
  
  constructor() {
    // Initialize AudioContext on first use for better browser compatibility
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      this.audioContext = new AudioContext();
    }
  }

  async synthesizeSpeech(text: string, settings: VoiceSettings = {}): Promise<ArrayBuffer> {
    const now = Date.now();
    
    // Prevent duplicate synthesis calls for the same text within throttle window
    if (text === this.lastSynthesisText && (now - this.lastSynthesisTime) < this.synthesisThrottleMs) {
      throw new Error('Duplicate synthesis request throttled');
    }
    
    this.lastSynthesisText = text;
    this.lastSynthesisTime = now;
    
    const response = await fetch('/api/speech/synthesize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        ...settings,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${response.status}: ${errorText}`);
    }

    return await response.arrayBuffer();
  }

  async playAudio(audioBuffer: ArrayBuffer): Promise<void> {
    if (!this.audioContext) {
      throw new Error('AudioContext not available');
    }

    try {
      // Resume audio context if it's suspended (browser policy)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const audioData = await this.audioContext.decodeAudioData(audioBuffer);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioData;
      source.connect(this.audioContext.destination);
      
      return new Promise((resolve, reject) => {
        source.onended = () => resolve();
        source.addEventListener('error', () => reject(new Error('Audio playback failed')));
        source.start();
      });
    } catch (error) {
      console.error('Audio playback error:', error);
      throw error;
    }
  }

  async speakText(text: string, settings: VoiceSettings = {}): Promise<void> {
    try {
      const audioBuffer = await this.synthesizeSpeech(text, settings);
      await this.playAudio(audioBuffer);
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      
      // Check if it's a rate limit error and fall back to browser TTS
      if (isRateLimitError(error as Error) || isAPIError(error as Error)) {
        console.log('Falling back to browser TTS due to API limits');
        await browserTTSClient.speak(text);
        return;
      }
      
      throw error;
    }
  }

  async getVoices(): Promise<VoicesResponse> {
    const response = await apiRequest('GET', '/api/speech/voices');
    return await response.json();
  }
}

// Create a singleton instance
export const elevenLabsClient = new ElevenLabsClient();

// Browser TTS fallback
export class BrowserTTSClient {
  speak(text: string, options: { rate?: number; pitch?: number; volume?: number } = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate || 0.9;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 0.8;

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`));

      speechSynthesis.speak(utterance);
    });
  }
}

export const browserTTSClient = new BrowserTTSClient();

// Default voice settings for cooking
export const COOKING_VOICE_SETTINGS: VoiceSettings = {
  voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel - warm and clear
  stability: 0.6,
  similarityBoost: 0.7,
  style: 0.2,
  useSpeakerBoost: true,
};