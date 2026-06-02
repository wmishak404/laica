import { describe, expect, it } from "vitest";
import {
  OPERATIONAL_MESSAGE_PHRASES,
  VOICE_RECORDING_SILENCE_CONFIG,
  calculateTimeDomainVolume,
  isOperationalMessage,
} from "@/lib/voiceRecording";

describe("voice recording utilities", () => {
  it("identifies operational assistant messages that should not be spoken", () => {
    for (const phrase of OPERATIONAL_MESSAGE_PHRASES) {
      expect(isOperationalMessage(`${phrase}...`)).toBe(true);
    }
  });

  it("does not flag conversational cooking guidance as operational", () => {
    expect(isOperationalMessage("Here's how to properly saute the garlic")).toBe(false);
    expect(isOperationalMessage("You can substitute olive oil for butter")).toBe(false);
    expect(isOperationalMessage("What's the best way to process garlic?")).toBe(false);
    expect(isOperationalMessage("")).toBe(false);
  });

  it("keeps the shipped silence-detection timing patient enough for natural speech", () => {
    expect(VOICE_RECORDING_SILENCE_CONFIG).toEqual({
      silenceThreshold: 3,
      silenceDurationMs: 2000,
      initialDelayMs: 1500,
      maxRecordingTimeMs: 15000,
      minRecordingTimeMs: 2000,
      autoStopTimeMs: 8000,
      audioLevelPollMs: 100,
    });
    expect(VOICE_RECORDING_SILENCE_CONFIG.minRecordingTimeMs).toBeGreaterThanOrEqual(2000);
    expect(VOICE_RECORDING_SILENCE_CONFIG.maxRecordingTimeMs).toBeGreaterThan(
      VOICE_RECORDING_SILENCE_CONFIG.autoStopTimeMs,
    );
  });

  it("calculates centered time-domain audio as silence", () => {
    const silentSamples = new Uint8Array([128, 128, 128, 128]);

    expect(calculateTimeDomainVolume(silentSamples)).toBe(0);
  });

  it("calculates high-amplitude time-domain samples above the silence threshold", () => {
    const loudSamples = new Uint8Array([0, 255, 0, 255]);

    expect(calculateTimeDomainVolume(loudSamples)).toBeGreaterThan(
      VOICE_RECORDING_SILENCE_CONFIG.silenceThreshold,
    );
  });
});
