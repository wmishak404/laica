import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import fsSync from "fs";
import { requestHttp, type TestResponse } from "./http-test-client";

const mocks = vi.hoisted(() => {
  const createTranscription = vi.fn();
  const openaiConstructor = vi.fn(function MockOpenAI() {
    return {
      audio: {
        transcriptions: {
          create: createTranscription,
        },
      },
    };
  });

  return {
    firebaseUser: {
      uid: "provider-boundary-user",
      email: "provider@example.com",
      displayName: "Provider Boundary User",
      photoURL: null,
      emailVerified: true,
      authProvider: "google",
      isAnonymous: false,
    },
    getCookingSteps: vi.fn(),
    analyzeIngredientImage: vi.fn(),
    synthesizeSpeech: vi.fn(),
    createTranscription,
    openaiConstructor,
  };
});

vi.mock("../../server/firebaseAuth", () => ({
  verifyFirebaseToken: vi.fn((req, _res, next) => {
    req.firebaseUser = mocks.firebaseUser;
    next();
  }),
  getFirebaseUserFromRequest: vi.fn(),
}));

vi.mock("../../server/storage", () => ({
  storage: {},
}));

vi.mock("../../server/openai", () => ({
  getRecipeSuggestions: vi.fn(),
  getCookingSteps: mocks.getCookingSteps,
  getGroceryList: vi.fn(),
  getIngredientAlternatives: vi.fn(),
  getCookingAssistance: vi.fn(),
  analyzeIngredientImage: mocks.analyzeIngredientImage,
  getSlopBowlRecipe: vi.fn(),
}));

vi.mock("../../server/admin-routes", () => ({
  registerAdminRoutes: vi.fn(),
}));

vi.mock("../../server/elevenlabs", () => ({
  synthesizeSpeech: mocks.synthesizeSpeech,
  getAvailableVoices: vi.fn(),
  COOKING_VOICES: [],
}));

vi.mock("../../server/db", () => ({
  db: {},
}));

vi.mock("openai", () => ({
  default: mocks.openaiConstructor,
}));

const authHeaders = {
  "Content-Type": "application/json",
  Authorization: "Bearer test-token",
};

const sampleCookingStepsResponse = {
  steps: [
    {
      actionLabel: "Rinse Rice",
      instruction: "Rinse the rice until the water runs mostly clear.",
      duration: 3,
      tips: "Use a fine-mesh strainer if you have one.",
      visualCues: "The water changes from cloudy to mostly clear.",
      commonMistakes: "Skipping the rinse can make the rice gummy.",
      safetyTips: ["Keep fingertips away from the strainer edge."],
    },
    {
      actionLabel: "Simmer Rice & Eggs",
      instruction: "Simmer rice with eggs and scallions until fluffy.",
      duration: 18,
      tips: "Keep the lid closed while the rice steams.",
      visualCues: "Small steam holes appear on the rice surface.",
      commonMistakes: "Stirring too often releases steam.",
      safetyTips: ["Use a towel when lifting the hot lid."],
    },
  ],
  recipe: {
    ingredients: [
      { name: "rice", quantity: "1 cup", forSteps: [1, 2] },
      { name: "eggs", quantity: "2", forSteps: [2] },
    ],
  },
};

async function startTestServer() {
  const { registerRoutes } = await import("../../server/routes");
  const app = express();
  app.use(express.json());

  return await registerRoutes(app);
}

async function postJson(path: string, body: unknown, headers = authHeaders): Promise<TestResponse> {
  const server = await startTestServer();
  return await requestHttp(server, {
    method: "POST",
    path,
    headers,
    body: JSON.stringify(body),
  });
}

function multipartAudioBody(boundary: string, audioText = "mock audio bytes") {
  return [
    `--${boundary}`,
    'Content-Disposition: form-data; name="audio"; filename="question.wav"',
    "Content-Type: audio/wav",
    "",
    audioText,
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

describe("provider-boundary route happy paths", () => {
  let originalOpenAIKey: string | undefined;

  beforeEach(() => {
    originalOpenAIKey = process.env.OPENAI_API_KEY;
    mocks.getCookingSteps.mockResolvedValue(sampleCookingStepsResponse);
    mocks.synthesizeSpeech.mockResolvedValue(Buffer.from("mock audio"));
    mocks.analyzeIngredientImage.mockResolvedValue({
      ingredients: ["rice", "eggs"],
      equipment: ["saucepan"],
      confidence: 0.91,
    });
    mocks.createTranscription.mockResolvedValue("  Dice the onions more finely.  ");
  });

  afterEach(() => {
    if (typeof originalOpenAIKey === "string") {
      process.env.OPENAI_API_KEY = originalOpenAIKey;
    } else {
      delete process.env.OPENAI_API_KEY;
    }
    vi.clearAllMocks();
  });

  it("routes cooking-step generation through the mocked OpenAI helper", async () => {
    const response = await postJson("/api/cooking/steps", {
      recipeName: " Rice Bowl ",
      ingredients: [" rice ", "eggs"],
      equipment: [" saucepan "],
      description: "Use a gentle simmer.",
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(sampleCookingStepsResponse);
    expect(mocks.getCookingSteps).toHaveBeenCalledWith(
      "Rice Bowl",
      ["rice", "eggs"],
      ["saucepan"],
      "Use a gentle simmer.",
      undefined,
    );
  });

  it("passes acknowledged missing ingredients into cooking-step generation", async () => {
    const response = await postJson("/api/cooking/steps", {
      recipeName: "Rice Bowl",
      ingredients: ["rice", "eggs"],
      equipment: ["saucepan"],
      description: "Use a gentle simmer.",
      acknowledgedMissingIngredients: [" cilantro ", "lime"],
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(sampleCookingStepsResponse);
    expect(mocks.getCookingSteps).toHaveBeenCalledWith(
      "Rice Bowl",
      ["rice", "eggs"],
      ["saucepan"],
      "Use a gentle simmer.",
      ["cilantro", "lime"],
    );
  });

  it("accepts descriptive Chef It Up ingredient context for cooking steps", async () => {
    const descriptiveIngredient =
      "thinly sliced vegetable-and-tofu stir-fry filling with bell pepper, mushrooms, ginger, and soy";

    const response = await postJson("/api/cooking/steps", {
      recipeName: "Vegetable & Tofu Stir Fry Wraps",
      ingredients: [descriptiveIngredient],
      equipment: ["large nonstick skillet or wok"],
      description:
        "Wrap a savory tofu and vegetable stir fry in soft tortillas with a pantry-first sauce.",
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(sampleCookingStepsResponse);
    expect(mocks.getCookingSteps).toHaveBeenCalledWith(
      "Vegetable & Tofu Stir Fry Wraps",
      [descriptiveIngredient],
      ["large nonstick skillet or wok"],
      "Wrap a savory tofu and vegetable stir fry in soft tortillas with a pantry-first sauce.",
      undefined,
    );
  });

  it("rejects invalid cooking-step requests before provider calls", async () => {
    const response = await postJson("/api/cooking/steps", {
      recipeName: "",
      ingredients: ["rice"],
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: "INVALID_REQUEST",
      message: "Invalid cooking steps request",
    });
    expect(mocks.getCookingSteps).not.toHaveBeenCalled();
  });

  it("routes speech synthesis through the mocked ElevenLabs helper", async () => {
    const response = await postJson("/api/speech/synthesize", {
      text: "Read the next cooking step.",
      voiceId: "voice-test-1",
      stability: 0.7,
      similarityBoost: 0.8,
      style: 0.2,
      useSpeakerBoost: false,
    });

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("audio/mpeg");
    expect(response.headers["content-length"]).toBe("10");
    expect(response.headers["cache-control"]).toBe("private, no-store, max-age=0");
    expect(response.text).toBe("mock audio");
    expect(mocks.synthesizeSpeech).toHaveBeenCalledWith("Read the next cooking step.", {
      voiceId: "voice-test-1",
      stability: 0.7,
      similarityBoost: 0.8,
      style: 0.2,
      useSpeakerBoost: false,
    });
  });

  it("rejects invalid speech synthesis requests before provider calls", async () => {
    const response = await postJson("/api/speech/synthesize", {
      text: "",
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid speech synthesis request" });
    expect(mocks.synthesizeSpeech).not.toHaveBeenCalled();
  });

  it("routes speech transcription through the mocked OpenAI client", async () => {
    process.env.OPENAI_API_KEY = "test-openai-key";
    const server = await startTestServer();
    const boundary = "laica-provider-boundary";
    const fakeAudioStream = { path: "/tmp/audio_provider_boundary.wav" };
    const readStreamSpy = vi.spyOn(fsSync, "createReadStream").mockReturnValue(fakeAudioStream as any);

    const response = await requestHttp(server, {
      method: "POST",
      path: "/api/speech/transcribe",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        Authorization: "Bearer test-token",
      },
      body: multipartAudioBody(boundary),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      transcription: "Dice the onions more finely.",
      success: true,
    });
    expect(mocks.openaiConstructor).toHaveBeenCalledWith({ apiKey: "test-openai-key" });
    expect(String(readStreamSpy.mock.calls[0]?.[0])).toContain("laica-transcribe-");
    expect(String(readStreamSpy.mock.calls[0]?.[0])).toMatch(/audio\.wav$/);
    expect(String(readStreamSpy.mock.calls[0]?.[0])).not.toMatch(/audio_\d+\.wav$/);
    expect(mocks.createTranscription).toHaveBeenCalledWith(expect.objectContaining({
      file: fakeAudioStream,
      model: "whisper-1",
      language: "en",
      response_format: "text",
    }));
  });

  it("rejects transcription requests without audio before provider calls", async () => {
    process.env.OPENAI_API_KEY = "test-openai-key";
    const server = await startTestServer();

    const response = await requestHttp(server, {
      method: "POST",
      path: "/api/speech/transcribe",
      headers: {
        "Content-Type": "multipart/form-data; boundary=empty",
        Authorization: "Bearer test-token",
      },
      body: "--empty--\r\n",
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Audio file is required" });
    expect(mocks.openaiConstructor).not.toHaveBeenCalled();
    expect(mocks.createTranscription).not.toHaveBeenCalled();
  });

  it("routes vision analysis through the mocked OpenAI image helper", async () => {
    const jpegBase64 = Buffer.from([0xff, 0xd8, 0xff, 0xd9]).toString("base64");
    const response = await postJson("/api/vision/analyze", {
      image: `data:image/jpeg;base64,${jpegBase64}`,
      isHEIC: false,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ingredients: ["rice", "eggs"],
      equipment: ["saucepan"],
      confidence: 0.91,
    });
    expect(mocks.analyzeIngredientImage).toHaveBeenCalledWith(jpegBase64);
  });

  it("rejects invalid vision-analysis requests before provider calls", async () => {
    const response = await postJson("/api/vision/analyze", {
      isHEIC: false,
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid image analysis request" });
    expect(mocks.analyzeIngredientImage).not.toHaveBeenCalled();
  });
});
