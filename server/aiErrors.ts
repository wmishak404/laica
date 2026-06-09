import { createHash } from "crypto";
import type { Request } from "express";
import { classifyAiError, type AiErrorVendor } from "./aiErrorClassifier";

export type AiErrorFeature =
  | "recipe_suggestions"
  | "pantry_recipes"
  | "slop_bowl"
  | "cooking_steps"
  | "cooking_assistance"
  | "ingredient_detection"
  | "tts"
  | "tts_voices"
  | "transcription";

interface LogAiErrorInput {
  error: unknown;
  req: Request;
  route: string;
  feature: AiErrorFeature;
  vendor: AiErrorVendor;
  imageCount?: number | null;
}

function readFirebaseUser(req: Request): { uid?: unknown; isAnonymous?: unknown } | null {
  const candidate = (req as Request & { firebaseUser?: unknown }).firebaseUser;
  return candidate && typeof candidate === "object" ? candidate : null;
}

function readStringLength(value: unknown): number | null {
  return typeof value === "string" ? value.length : null;
}

function readArrayLength(value: unknown): number | null {
  return Array.isArray(value) ? value.length : null;
}

function getPreferenceLength(body: unknown): number | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  return readStringLength((body as { preferences?: unknown }).preferences);
}

function getIngredientCount(body: unknown): number | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const candidate = body as {
    ingredients?: unknown;
    pantryOverride?: unknown;
  };

  return readArrayLength(candidate.ingredients) ?? readArrayLength(candidate.pantryOverride);
}

function getImageCount(req: Request, override: number | null | undefined): number | null {
  if (typeof override === "number") {
    return override;
  }

  const body = req.body as { image?: unknown } | undefined;
  if (typeof body?.image === "string") {
    return 1;
  }

  return null;
}

function getAttemptNumber(req: Request): number {
  const header = req.header("X-Client-Attempt");
  const attemptNumber = Number.parseInt(header ?? "", 10);

  if (!Number.isFinite(attemptNumber) || attemptNumber < 1) {
    return 1;
  }

  return Math.min(10, attemptNumber);
}

function normalizeShape(value: unknown): unknown {
  if (Array.isArray(value)) {
    return {
      type: "array",
      length: value.length,
      itemShapes: value.slice(0, 3).map((item) => normalizeShape(item)),
    };
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((key) => [key, normalizeShape((value as Record<string, unknown>)[key])]),
    );
  }

  if (value === null) {
    return "null";
  }

  return typeof value;
}

function inputShapeHash(req: Request): string | null {
  const body = req.body;
  const file = (req as Request & { file?: unknown }).file;
  const shape = {
    body: typeof body === "undefined" ? null : normalizeShape(body),
    file: file ? { present: true } : null,
  };

  return createHash("sha256").update(JSON.stringify(shape)).digest("hex");
}

export function logAiError(input: LogAiErrorInput): void {
  const { error, req, route, feature, vendor, imageCount } = input;
  const classified = classifyAiError(error, { vendor });
  const firebaseUser = readFirebaseUser(req);
  const authUserId =
    firebaseUser && firebaseUser.isAnonymous !== true && typeof firebaseUser.uid === "string"
      ? firebaseUser.uid
      : null;
  const latencyMs = req.requestStartedAt ? Date.now() - req.requestStartedAt : null;

  const logPayload = {
    event: "ai_error",
    request_id: req.requestId ?? "missing-request-id",
    route,
    feature,
    vendor: classified.vendor,
    http_status: classified.httpStatus,
    error_class: classified.errorClass,
    error_code: classified.errorCode,
    is_authenticated: Boolean(firebaseUser),
    auth_user_id: authUserId,
    prompt_version_id: null,
    retry_after_secs: classified.retryAfterSeconds,
    preference_length: getPreferenceLength(req.body),
    ingredient_count: getIngredientCount(req.body),
    image_count: getImageCount(req, imageCount),
    latency_ms: latencyMs,
    attempt_number: getAttemptNumber(req),
    input_shape_hash: inputShapeHash(req),
  };

  console.error(JSON.stringify(logPayload));
}
