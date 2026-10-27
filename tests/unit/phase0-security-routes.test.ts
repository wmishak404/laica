import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import fsSync from "fs";
import { resetRateLimitBucketsForTest } from "../../server/rate-limit";
import { requestHttp } from "./http-test-client";

const mocks = vi.hoisted(() => ({
  storage: {
    getUser: vi.fn(),
    getUserSettings: vi.fn(),
    getUserCookingSessions: vi.fn(),
    getCookingSession: vi.fn(),
    updateCookingSession: vi.fn(),
    upsertUserSettings: vi.fn(),
  },
  getRecipeSuggestions: vi.fn(),
  synthesizeSpeech: vi.fn(),
  createTranscription: vi.fn(),
}));

vi.mock("../../server/firebaseAuth", () => ({
  verifyFirebaseToken: vi.fn((req, _res, next) => {
    const rawAuthorization = Array.isArray(req.headers.authorization)
      ? req.headers.authorization[0]
      : req.headers.authorization;
    const token = typeof rawAuthorization === "string"
      ? rawAuthorization.replace(/^Bearer\s+/i, "")
      : "";
    const uid = token.startsWith("same-ip-user-") || token.startsWith("transcription-user-")
      ? token
      : "owner-user";

    req.firebaseUser = {
      uid,
      email: "owner@example.com",
      displayName: "Owner User",
      photoURL: null,
      emailVerified: true,
    };
    next();
  }),
  getFirebaseUserFromRequest: vi.fn(),
}));

vi.mock("../../server/storage", () => ({
  storage: mocks.storage,
}));

vi.mock("../../server/openai", () => ({
  getRecipeSuggestions: mocks.getRecipeSuggestions,
  getCookingSteps: vi.fn(),
  getGroceryList: vi.fn(),
  getIngredientAlternatives: vi.fn(),
  getCookingAssistance: vi.fn(),
  analyzeIngredientImage: vi.fn(),
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
  default: vi.fn(function MockOpenAI() {
    return {
      audio: {
        transcriptions: {
          create: mocks.createTranscription,
        },
      },
    };
  }),
}));

async function startTestServer() {
  const { registerRoutes } = await import("../../server/routes");
  const app = express();
  app.use(express.json());

  const server = await registerRoutes(app);
  return server;
}

type MultipartPart = {
  name: string;
  filename?: string;
  mimetype?: string;
  content: string;
};

function multipartBody(boundary: string, parts: MultipartPart[]) {
  return parts.map((part) => [
    `--${boundary}`,
    `Content-Disposition: form-data; name="${part.name}"${part.filename ? `; filename="${part.filename}"` : ""}`,
    ...(part.mimetype ? [`Content-Type: ${part.mimetype}`] : []),
    "",
    part.content,
    "",
  ].join("\r\n")).join("") + `--${boundary}--\r\n`;
}

const audioPart: MultipartPart = {
  name: "audio",
  filename: "question.wav",
  mimetype: "audio/wav",
  content: "mock audio bytes",
};

describe("Phase 0 protected routes", () => {
  afterEach(() => {
    resetRateLimitBucketsForTest();
    vi.clearAllMocks();
  });

  it("requires auth before recipe suggestion generation", async () => {
    const server = await startTestServer();

    const response = await requestHttp(server, {
      method: "POST",
      path: "/api/recipes/suggestions",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferences: "quick dinner" }),
    });

    expect(response.status).toBe(401);
    expect(mocks.getRecipeSuggestions).not.toHaveBeenCalled();
  });

  it("accepts longer recipe suggestion preferences after staple context is added", async () => {
    mocks.getRecipeSuggestions.mockResolvedValueOnce({ recipes: [] });
    const server = await startTestServer();

    const response = await requestHttp(server, {
      method: "POST",
      path: "/api/recipes/suggestions",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({
        preferences: "x".repeat(750),
        ingredients: ["rice", "eggs"],
      }),
    });

    expect(response.status).toBe(200);
    expect(mocks.getRecipeSuggestions).toHaveBeenCalledWith("x".repeat(750), ["rice", "eggs"]);
  });

  it("accepts longer pantry recipe preferences after staple context is added", async () => {
    mocks.getRecipeSuggestions.mockResolvedValueOnce({ recipes: [] });
    const server = await startTestServer();

    const response = await requestHttp(server, {
      method: "POST",
      path: "/api/recipes/pantry",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({
        preferences: "x".repeat(750),
        ingredients: ["rice", "eggs"],
      }),
    });

    expect(response.status).toBe(200);
    expect(mocks.getRecipeSuggestions).toHaveBeenCalledWith("x".repeat(750), ["rice", "eggs"], {
      evalFeatureType: "chef_it_up_suggestions",
    });
  });

  it("keeps normal recipe generation scoped to per-user limits instead of shared IP limits", async () => {
    mocks.getRecipeSuggestions.mockResolvedValue({ recipes: [] });
    const server = await startTestServer();

    for (let index = 0; index < 101; index += 1) {
      const response = await requestHttp(server, {
        method: "POST",
        path: "/api/recipes/suggestions",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer same-ip-user-${index}`,
        },
        body: JSON.stringify({
          preferences: "quick dinner",
          ingredients: ["rice", "eggs"],
        }),
      });

      expect(response.status).toBe(200);
    }

    expect(mocks.getRecipeSuggestions).toHaveBeenCalledTimes(101);
  });

  it("blocks pantry recipe generation when the pantry ingredient list is empty", async () => {
    const server = await startTestServer();

    const response = await requestHttp(server, {
      method: "POST",
      path: "/api/recipes/pantry",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({
        preferences: "quick dinner",
        ingredients: [],
      }),
    });

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      code: "EMPTY_PANTRY",
      message: "Your pantry is empty. Add or scan pantry items before I can suggest recipes.",
    });
    expect(mocks.getRecipeSuggestions).not.toHaveBeenCalled();
  });

  it("returns a typed 400 when recipe suggestion preferences exceed the route contract", async () => {
    const server = await startTestServer();

    const response = await requestHttp(server, {
      method: "POST",
      path: "/api/recipes/suggestions",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({
        preferences: "x".repeat(1001),
        ingredients: ["rice", "eggs"],
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: "PREFERENCES_TOO_LONG",
      message: "Invalid recipe suggestions request",
    });
    expect(mocks.getRecipeSuggestions).not.toHaveBeenCalled();
  });

  it("returns a typed 400 when pantry recipe preferences exceed the route contract", async () => {
    const server = await startTestServer();

    const response = await requestHttp(server, {
      method: "POST",
      path: "/api/recipes/pantry",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({
        preferences: "x".repeat(1001),
        ingredients: ["rice", "eggs"],
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: "PREFERENCES_TOO_LONG",
      message: "Invalid pantry recipe request",
    });
    expect(mocks.getRecipeSuggestions).not.toHaveBeenCalled();
  });

  it("returns a typed 400 for invalid cooking step requests", async () => {
    const server = await startTestServer();

    const response = await requestHttp(server, {
      method: "POST",
      path: "/api/cooking/steps",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({ recipeName: "" }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: "INVALID_REQUEST",
      message: "Invalid cooking steps request",
    });
  });

  it("ignores request-body authUserId when updating user settings", async () => {
    mocks.storage.upsertUserSettings.mockResolvedValueOnce({ authUserId: "owner-user" });
    const server = await startTestServer();

    const response = await requestHttp(server, {
      method: "PUT",
      path: "/api/user/settings",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({
        authUserId: "victim-user",
        voiceEnabled: false,
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("private, no-store, max-age=0");
    expect(response.headers["pragma"]).toBe("no-cache");
    expect(response.headers["vary"]).toContain("Authorization");
    expect(mocks.storage.upsertUserSettings).toHaveBeenCalledTimes(1);

    const [calledUserId, calledSettings] = mocks.storage.upsertUserSettings.mock.calls[0]!;
    expect(calledUserId).toBe("owner-user");
    expect(calledSettings).toEqual({ voiceEnabled: false });
    expect(calledSettings).not.toHaveProperty("authUserId");
  });

  it("sets private cache headers on authenticated profile responses", async () => {
    mocks.storage.getUser.mockResolvedValueOnce({
      id: "owner-user",
      email: "owner@example.com",
    });
    mocks.storage.getUserSettings.mockResolvedValueOnce({
      authUserId: "owner-user",
      voiceEnabled: true,
    });
    mocks.storage.getUserCookingSessions.mockResolvedValueOnce([]);
    const server = await startTestServer();

    const response = await requestHttp(server, {
      method: "GET",
      path: "/api/user/profile",
      headers: { Authorization: "Bearer test-token" },
    });

    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("private, no-store, max-age=0");
    expect(response.headers["pragma"]).toBe("no-cache");
    expect(response.headers["vary"]).toContain("Authorization");
  });

  it("sets private cache headers on authenticated cooking-session history responses", async () => {
    mocks.storage.getUserCookingSessions.mockResolvedValueOnce([]);
    const server = await startTestServer();

    const response = await requestHttp(server, {
      method: "GET",
      path: "/api/cooking/sessions?limit=5",
      headers: { Authorization: "Bearer test-token" },
    });

    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("private, no-store, max-age=0");
    expect(response.headers["pragma"]).toBe("no-cache");
    expect(response.headers["vary"]).toContain("Authorization");
  });

  it("does not mark authenticated speech synthesis responses as publicly cacheable", async () => {
    mocks.synthesizeSpeech.mockResolvedValueOnce(Buffer.from("audio"));
    const server = await startTestServer();

    const response = await requestHttp(server, {
      method: "POST",
      path: "/api/speech/synthesize",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({ text: "hello from test" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("private, no-store, max-age=0");
    expect(response.headers["pragma"]).toBe("no-cache");
    expect(response.headers["vary"]).toContain("Authorization");
  });

  describe("transcription upload contract", () => {
    const boundary = "laica-upload-contract";
    const headers = {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      Authorization: "Bearer test-token",
    };

    beforeEach(() => {
      vi.stubEnv("OPENAI_API_KEY", "test-key");
      mocks.createTranscription.mockResolvedValue("A clear question.");
      vi.spyOn(fsSync, "createReadStream").mockReturnValue({ path: "mock-audio-stream" } as any);
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it.each(["before", "after"])("accepts no text fields %s the audio file", async (position) => {
      const server = await startTestServer();
      const field: MultipartPart = { name: "unused", content: "unused text" };
      const parts = position === "before" ? [field, audioPart] : [audioPart, field];
      const response = await requestHttp(server, {
        method: "POST",
        path: "/api/speech/transcribe",
        headers,
        body: multipartBody(boundary, parts),
      });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Invalid audio upload" });
      expect(mocks.createTranscription).not.toHaveBeenCalled();
      expect(fsSync.createReadStream).not.toHaveBeenCalled();
    });

    it.each([
      { label: "duplicate audio files", parts: [audioPart, audioPart] },
      { label: "an unexpected file field", parts: [{ ...audioPart, name: "other" }] },
    ])("accepts only one audio file: $label", async ({ parts }) => {
      const server = await startTestServer();
      const response = await requestHttp(server, {
        method: "POST",
        path: "/api/speech/transcribe",
        headers,
        body: multipartBody(boundary, parts),
      });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Invalid audio upload" });
      expect(mocks.createTranscription).not.toHaveBeenCalled();
      expect(fsSync.createReadStream).not.toHaveBeenCalled();
    });

    it.each([
      { label: "just below", bytes: 10 * 1024 * 1024 - 1, status: 200 },
      { label: "at", bytes: 10 * 1024 * 1024, status: 200 },
      { label: "above", bytes: 10 * 1024 * 1024 + 1, status: 413 },
    ])("preserves the upload byte boundary $label the limit", async ({ bytes, status }) => {
      const server = await startTestServer();
      const response = await requestHttp(server, {
        method: "POST",
        path: "/api/speech/transcribe",
        headers,
        body: multipartBody(boundary, [{ ...audioPart, content: "x".repeat(bytes) }]),
      });

      expect(response.status).toBe(status);
      if (status === 200) {
        expect(await response.json()).toEqual({ transcription: "A clear question.", success: true });
        expect(mocks.createTranscription).toHaveBeenCalledOnce();
      } else {
        expect(await response.json()).toEqual({
          error: "Audio file exceeds the 10 MB limit.",
        });
        expect(mocks.createTranscription).not.toHaveBeenCalled();
        expect(fsSync.createReadStream).not.toHaveBeenCalled();
      }
    });

    it.each([
      { label: "a missing boundary", contentType: "multipart/form-data", body: "invalid upload" },
      {
        label: "an incomplete body",
        contentType: headers["Content-Type"],
        body: multipartBody(boundary, [audioPart]).replace(`--${boundary}--\r\n`, ""),
      },
      {
        label: "an invalid part header",
        contentType: headers["Content-Type"],
        body: `--${boundary}\r\ninvalid header\r\n\r\ncontent\r\n--${boundary}--\r\n`,
      },
    ])("returns a controlled response for $label", async ({ contentType, body }) => {
      const server = await startTestServer();
      const response = await requestHttp(server, {
        method: "POST",
        path: "/api/speech/transcribe",
        headers: { ...headers, "Content-Type": contentType },
        body,
      });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Invalid audio upload" });
      expect(mocks.createTranscription).not.toHaveBeenCalled();
      expect(fsSync.createReadStream).not.toHaveBeenCalled();
    });

    it("authenticates before parsing an upload", async () => {
      const server = await startTestServer();
      const response = await requestHttp(server, {
        method: "POST",
        path: "/api/speech/transcribe",
        headers: { "Content-Type": "multipart/form-data" },
        body: "invalid upload",
      });

      expect(response.status).toBe(401);
      expect(mocks.createTranscription).not.toHaveBeenCalled();
    });

    it("handles an ordinary upload after rejected uploads on the same server", async () => {
      const server = await startTestServer();
      for (const parts of [
        [{ name: "unused", content: "unused text" }],
        [audioPart, audioPart],
        [{ ...audioPart, mimetype: "text/plain" }],
      ]) {
        const rejected = await requestHttp(server, {
          method: "POST",
          path: "/api/speech/transcribe",
          headers,
          body: multipartBody(boundary, parts),
        });
        expect(rejected.status).toBe(400);
      }
      expect(mocks.createTranscription).not.toHaveBeenCalled();

      const response = await requestHttp(server, {
        method: "POST",
        path: "/api/speech/transcribe",
        headers,
        body: multipartBody(boundary, [audioPart]),
      });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ transcription: "A clear question.", success: true });
      expect(mocks.createTranscription).toHaveBeenCalledOnce();
    });
  });

  it("keeps transcription unavailable instead of blocking server startup when OPENAI_API_KEY is missing", async () => {
    const originalOpenAIKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    try {
      const server = await startTestServer();
      const boundary = "laica-test-boundary";
      const body = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="audio"; filename="audio.wav"',
        "Content-Type: audio/wav",
        "",
        "fake audio bytes",
        `--${boundary}--`,
        "",
      ].join("\r\n");

      const response = await requestHttp(server, {
        method: "POST",
        path: "/api/speech/transcribe",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          Authorization: "Bearer test-token",
        },
        body,
      });

      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({
        error: "Speech transcription is unavailable",
      });
    } finally {
      if (typeof originalOpenAIKey === "string") {
        process.env.OPENAI_API_KEY = originalOpenAIKey;
      } else {
        delete process.env.OPENAI_API_KEY;
      }
    }
  });

  it("rejects unsupported transcription upload types before provider calls", async () => {
    const originalOpenAIKey = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "test-key";

    try {
      const server = await startTestServer();
      const boundary = "laica-test-boundary";
      const body = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="audio"; filename="not-audio.txt"',
        "Content-Type: text/plain",
        "",
        "not audio bytes",
        `--${boundary}--`,
        "",
      ].join("\r\n");

      const response = await requestHttp(server, {
        method: "POST",
        path: "/api/speech/transcribe",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          Authorization: "Bearer test-token",
        },
        body,
      });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Unsupported audio file type" });
      expect(mocks.createTranscription).not.toHaveBeenCalled();
    } finally {
      if (typeof originalOpenAIKey === "string") {
        process.env.OPENAI_API_KEY = originalOpenAIKey;
      } else {
        delete process.env.OPENAI_API_KEY;
      }
    }
  });

  it("keeps transcription scoped to per-user limits instead of shared IP limits", async () => {
    const originalOpenAIKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    try {
      const server = await startTestServer();
      const boundary = "laica-test-boundary";
      const body = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="audio"; filename="audio.wav"',
        "Content-Type: audio/wav",
        "",
        "fake audio bytes",
        `--${boundary}--`,
        "",
      ].join("\r\n");

      for (let index = 0; index < 201; index += 1) {
        const response = await requestHttp(server, {
          method: "POST",
          path: "/api/speech/transcribe",
          headers: {
            "Content-Type": `multipart/form-data; boundary=${boundary}`,
            Authorization: `Bearer transcription-user-${index}`,
          },
          body,
        });

        expect(response.status).toBe(503);
        expect(await response.json()).toEqual({
          error: "Speech transcription is unavailable",
        });
      }
    } finally {
      if (typeof originalOpenAIKey === "string") {
        process.env.OPENAI_API_KEY = originalOpenAIKey;
      } else {
        delete process.env.OPENAI_API_KEY;
      }
    }
  });

  it("does not expose raw transcription provider errors to clients", async () => {
    const originalOpenAIKey = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "test-key";
    vi.spyOn(fsSync, "createReadStream").mockReturnValue({ path: "mock-audio-stream" } as any);
    mocks.createTranscription.mockRejectedValueOnce(new Error("sensitive provider detail"));

    try {
      const server = await startTestServer();
      const boundary = "laica-test-boundary";
      const body = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="audio"; filename="audio.wav"',
        "Content-Type: audio/wav",
        "",
        "fake audio bytes",
        `--${boundary}--`,
        "",
      ].join("\r\n");

      const response = await requestHttp(server, {
        method: "POST",
        path: "/api/speech/transcribe",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          Authorization: "Bearer test-token",
        },
        body,
      });

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: "Failed to transcribe audio" });
      expect(response.text).not.toContain("sensitive provider detail");
    } finally {
      if (typeof originalOpenAIKey === "string") {
        process.env.OPENAI_API_KEY = originalOpenAIKey;
      } else {
        delete process.env.OPENAI_API_KEY;
      }
    }
  });

  it("rejects cross-user cooking-session mutation", async () => {
    mocks.storage.getCookingSession.mockResolvedValueOnce({
      id: 42,
      authUserId: "other-user",
    });
    const server = await startTestServer();

    const response = await requestHttp(server, {
      method: "PUT",
      path: "/api/cooking/session/42",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({ completedSteps: 1 }),
    });

    expect(response.status).toBe(403);
    expect(mocks.storage.updateCookingSession).not.toHaveBeenCalled();
  });
});
