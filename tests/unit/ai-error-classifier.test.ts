import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AIProviderQuotaError } from "../../server/ai-errors";
import { classifyAiError } from "../../server/aiErrorClassifier";

describe("classifyAiError", () => {
  it("classifies Zod errors as internal validation failures", () => {
    const error = new z.ZodError([]);

    expect(classifyAiError(error, { vendor: "openai" })).toEqual({
      errorClass: "validation",
      errorCode: "ZOD_VALIDATION",
      httpStatus: 400,
      retryAfterSeconds: null,
      vendor: "internal",
    });
  });

  it("classifies linked-account route preconditions without treating them as provider failures", () => {
    const error = Object.assign(new Error("sign in required"), {
      status: 403,
      code: "LINKED_ACCOUNT_REQUIRED",
    });

    expect(classifyAiError(error, { vendor: "openai" })).toMatchObject({
      errorClass: "product_precondition",
      errorCode: "LINKED_ACCOUNT_REQUIRED",
      httpStatus: 403,
      vendor: "internal",
    });
  });

  it("captures provider rate limits and caps Retry-After at the allowlisted horizon", () => {
    const error = Object.assign(new Error("provider rate limited"), {
      status: 429,
      code: "rate limit exceeded",
      headers: {
        "Retry-After": "7200",
      },
    });

    expect(classifyAiError(error, { vendor: "openai" })).toMatchObject({
      errorClass: "rate_limit",
      errorCode: "rate_limit_exceeded",
      httpStatus: 429,
      retryAfterSeconds: 3600,
      vendor: "openai",
    });
  });

  it("treats provider 401/403 errors as upstream auth failures", () => {
    const error = Object.assign(new Error("invalid provider key"), {
      status: 401,
      code: "invalid_api_key",
    });

    expect(classifyAiError(error, { vendor: "openai" })).toMatchObject({
      errorClass: "upstream_auth",
      errorCode: "invalid_api_key",
      httpStatus: 401,
      vendor: "openai",
    });
  });

  it("maps network-shaped provider failures without preserving raw messages", () => {
    const error = Object.assign(new Error("socket hang up while calling provider.example"), {
      code: "ECONNRESET",
    });

    expect(classifyAiError(error, { vendor: "whisper" })).toMatchObject({
      errorClass: "network",
      errorCode: "ECONNRESET",
      httpStatus: 503,
      vendor: "whisper",
    });
  });

  it("classifies provider quota exhaustion as upstream auth or billing posture", () => {
    expect(classifyAiError(new AIProviderQuotaError("OpenAI"), { vendor: "openai" })).toMatchObject({
      errorClass: "upstream_auth",
      errorCode: "AI_PROVIDER_QUOTA_EXHAUSTED",
      httpStatus: 503,
      vendor: "openai",
    });
  });
});
