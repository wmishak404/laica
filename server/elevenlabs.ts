import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

if (!process.env.ELEVENLABS_API_KEY) {
  throw new Error("ELEVENLABS_API_KEY environment variable is required");
}

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

export interface VoiceOptions {
  voiceId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

export async function synthesizeSpeech(
  text: string,
  options: VoiceOptions = {}
): Promise<Buffer> {
  try {
    const {
      voiceId = "21m00Tcm4TlvDq8ikWAM", // Default Rachel voice - warm and clear
      stability = 0.5,
      similarityBoost = 0.5,
      style = 0.0,
      useSpeakerBoost = true,
    } = options;

    const audio = await elevenlabs.textToSpeech.convert(voiceId, {
      text,
      modelId: "eleven_turbo_v2_5", // Fast and high-quality
      voiceSettings: {
        stability,
        similarityBoost,
        style,
        useSpeakerBoost,
      },
    });

    // Convert audio stream to buffer
    const reader = audio.getReader();
    const chunks: Uint8Array[] = [];
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    return Buffer.concat(chunks.map(chunk => Buffer.from(chunk)));
  } catch (error) {
    console.error("ElevenLabs TTS Error:", error);
    throw new Error("Failed to synthesize speech with ElevenLabs");
  }
}

export async function getAvailableVoices() {
  try {
    const voices = await elevenlabs.voices.getAll();
    return voices.voices?.map((voice: any) => ({
      id: voice.voice_id,
      name: voice.name,
      category: voice.category,
      description: voice.description,
      previewUrl: voice.preview_url,
    })) || [];
  } catch (error) {
    console.error("Error fetching ElevenLabs voices:", error);
    throw new Error("Failed to fetch available voices");
  }
}

// Predefined cooking-friendly voices with descriptions
export const COOKING_VOICES = [
  {
    id: "21m00Tcm4TlvDq8ikWAM", // Rachel
    name: "Rachel",
    description: "Warm and clear - perfect for cooking instructions",
    category: "professional"
  },
  {
    id: "AZnzlk1XvdvUeBnXmlld", // Domi
    name: "Domi", 
    description: "Confident and encouraging - great for motivation",
    category: "professional"
  },
  {
    id: "EXAVITQu4vr4xnSDxMaL", // Bella
    name: "Bella",
    description: "Friendly and approachable - like a cooking friend",
    category: "professional"
  },
  {
    id: "ErXwobaYiN019PkySvjV", // Antoni
    name: "Antoni",
    description: "Calm and reassuring - perfect for step-by-step guidance",
    category: "professional"
  }
];