// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createReadStream } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import OpenAI, { APIError, toFile } from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { actionModelOutputSchema } from "../../shared/cooking-actions";
import { insertFeedbackSchema, insertUserSettingsSchema, updateUserProfileSchema } from "../../shared/schema";
import { FEEDBACK_TEXT_MAX_LENGTH } from "../../shared/feedback";
import { classifyAiError } from "../../server/aiErrorClassifier";

vi.unmock("openai");

describe("provider and request schema compatibility", () => {
  it("serializes the action response contract through the installed SDK", () => {
    const format = zodResponseFormat(actionModelOutputSchema, "cooking_action_proposal_v1");
    const schema = format.json_schema.schema;

    expect(format.type).toBe("json_schema");
    expect(format.json_schema.strict).toBe(true);
    expect(schema).toMatchObject({
      type: "object",
      additionalProperties: false,
      required: ["type", "text", "timer"],
      properties: {
        type: { enum: ["advice", "clarification", "timer_proposal"] },
        text: { type: "string", maxLength: 2000 },
        timer: { anyOf: expect.arrayContaining([
          { type: "null" },
          expect.objectContaining({
            type: "object",
            additionalProperties: false,
            required: ["kind", "version", "parameters"],
            properties: expect.objectContaining({
              parameters: expect.objectContaining({
                type: "object",
                additionalProperties: false,
                required: ["durationSeconds"],
                properties: { durationSeconds: { type: "integer", minimum: 1, maximum: 86400 } },
              }),
            }),
          }),
        ]) },
      },
    });
    expect(actionModelOutputSchema.safeParse({ type: "advice", text: "Stir gently.", timer: null }).success).toBe(true);
    expect(actionModelOutputSchema.safeParse({ type: "timer_proposal", text: "Start timer.", timer: null }).success).toBe(false);
    expect(actionModelOutputSchema.safeParse({ type: "advice", text: "Stir gently.", timer: null, authority: "execute" }).success).toBe(false);
  });

  it("preserves audio bytes and media metadata through the installed SDK file helper", async () => {
    const bytes = Buffer.from([1, 2, 3, 4]);
    const file = await toFile(bytes, "recording.webm", { type: "audio/webm" });

    expect(file.name).toBe("recording.webm");
    expect(file.type).toBe("audio/webm");
    expect(Buffer.from(await file.arrayBuffer())).toEqual(bytes);
  });

  it("uploads the transcription route's file stream and returns plain text through the installed SDK", async () => {
    const bytes = Buffer.from([82, 73, 70, 70, 1, 2, 3, 4]);
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "laica-sdk-audio-test-"));
    let audioStream: ReturnType<typeof createReadStream> | undefined;
    const fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const request = new Request(input, init);
      expect(request.url).toBe("https://provider.example.test/v1/audio/transcriptions");
      expect(request.method).toBe("POST");
      expect(request.headers.get("content-type")).toContain("multipart/form-data; boundary=");
      const form = await request.formData();
      expect(form.get("model")).toBe("whisper-1");
      expect(form.get("language")).toBe("en");
      expect(form.get("response_format")).toBe("text");
      const file = form.get("file");
      expect(file).toBeInstanceOf(File);
      expect((file as File).name).toBe("audio.wav");
      expect(Buffer.from(await (file as File).arrayBuffer())).toEqual(bytes);
      return new Response("Stir gently.", { headers: { "content-type": "text/plain" } });
    });

    try {
      const audioPath = path.join(tempDir, "audio.wav");
      await writeFile(audioPath, bytes, { flag: "wx" });
      audioStream = createReadStream(audioPath);
      const client = new OpenAI({ apiKey: "synthetic-key", baseURL: "https://provider.example.test/v1", fetch, maxRetries: 0 });
      const transcription = await client.audio.transcriptions.create({
        file: audioStream, model: "whisper-1", language: "en", response_format: "text",
      });

      expect(transcription).toBe("Stir gently.");
      expect(fetch).toHaveBeenCalledTimes(1);
    } finally {
      audioStream?.destroy();
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("preserves retry metadata from the installed SDK error type", () => {
    const error = new APIError(429, { code: "rate_limit_exceeded" }, "Rate limited", new Headers({ "retry-after": "45" }));

    expect(classifyAiError(error, { vendor: "openai" })).toMatchObject({
      errorClass: "rate_limit", errorCode: "rate_limit_exceeded", httpStatus: 429, retryAfterSeconds: 45, vendor: "openai",
    });
  });

  it("preserves feedback boundaries and partial owner-free profile updates", () => {
    const feedback = insertFeedbackSchema.omit({ authUserId: true });
    expect(feedback.parse({ currentPage: " /cook ", feedbackText: " Useful guidance. ", authUserId: "ignored" })).toEqual({
      currentPage: "/cook", feedbackText: "Useful guidance.",
    });
    expect(feedback.safeParse({ currentPage: "/cook", feedbackText: "x".repeat(FEEDBACK_TEXT_MAX_LENGTH) }).success).toBe(true);
    const oversized = feedback.safeParse({ currentPage: "/cook", feedbackText: "x".repeat(FEEDBACK_TEXT_MAX_LENGTH + 1) });
    expect(oversized.success).toBe(false);
    if (!oversized.success) {
      expect(oversized.error.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: "too_big", path: ["feedbackText"] })]));
    }
    const settings = insertUserSettingsSchema.omit({ authUserId: true }).partial();
    expect(settings.parse({ captionSize: 20, authUserId: "ignored" })).toEqual({ captionSize: 20 });
    expect(settings.parse({})).toEqual({});
    expect(updateUserProfileSchema.parse({ dietaryRestrictions: ["vegetarian"] })).toEqual({ dietaryRestrictions: ["vegetarian"] });
    expect(updateUserProfileSchema.safeParse({ dietaryRestrictions: "vegetarian" }).success).toBe(false);
  });
});
