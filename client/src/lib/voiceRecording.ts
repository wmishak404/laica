export const OPERATIONAL_MESSAGE_PHRASES = [
  "Processing your question",
  "Recording cancelled",
  "Recording stopped",
  "Please try asking again",
  "Question didn't go through",
  "Question didn't get an answer",
  "Question timed out",
  "Voice question is not available",
  "Voice questions are temporarily limited",
  "I couldn't access your microphone",
  "I couldn't hear that clearly",
  "Microphone didn't start",
  "Request did not finish",
  "Connection issue",
  "Cooking requests paused",
  "Recording timed out",
] as const;

export const VOICE_RECORDING_SILENCE_CONFIG = {
  silenceThreshold: 3,
  silenceDurationMs: 2000,
  initialDelayMs: 1500,
  maxRecordingTimeMs: 15000,
  minRecordingTimeMs: 2000,
  autoStopTimeMs: 8000,
  audioLevelPollMs: 100,
} as const;

export function isOperationalMessage(text: string): boolean {
  return OPERATIONAL_MESSAGE_PHRASES.some((phrase) => text.includes(phrase));
}

export function calculateTimeDomainVolume(dataArray: Uint8Array): number {
  if (dataArray.length === 0) {
    return 0;
  }

  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const sample = (dataArray[i] - 128) / 128;
    sum += sample * sample;
  }

  return Math.sqrt(sum / dataArray.length) * 100;
}
