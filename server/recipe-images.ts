import crypto from "node:crypto";
import type { Request, Response } from "express";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { recipeImageCache, type InsertRecipeImageCache, type RecipeImageCache } from "@shared/schema";

const IMAGE_ROUTE_PREFIX = "/api/recipe-images";
const DEFAULT_PROVIDER = "openai";
const DEFAULT_MODEL = "gpt-image-2";
const DEFAULT_QUALITY = "low";
const DEFAULT_OUTPUT_SIZE = "1024x1024";
const DEFAULT_OUTPUT_FORMAT = "jpeg";
const DEFAULT_OUTPUT_COMPRESSION = 70;
const DEFAULT_STYLE_VERSION = "phase-3-1-v1";
const IMAGE_OBJECT_PREFIX = "recipe-images";
const PENDING_STALE_MS = 2 * 60 * 1000;
const DEFAULT_IMAGE_GENERATION_TIMEOUT_MS = 115_000;
const DEFAULT_IMAGE_JUDGE_TIMEOUT_MS = 45_000;
const CACHE_KEY_PATTERN = /^[a-f0-9]{64}$/;

type RecipeImageProvider = "openai" | "gemini";
type RecipeImageOutputFormat = "png" | "jpeg" | "webp";
type RecipeImageStatus = "pending" | "ready" | "failed" | "rejected";

export interface RecipeImageFingerprint {
  schemaVersion: "recipe-image-fingerprint-v1";
  titleKey: string;
  cuisineKey: string;
  coreIngredientKeys: string[];
}

interface RecipeImageConfig {
  enabled: boolean;
  provider: RecipeImageProvider;
  model: string;
  quality: string;
  outputSize: string;
  outputFormat: RecipeImageOutputFormat;
  outputCompression: number;
  styleVersion: string;
  mimeType: string;
}

interface RecipeImageDescriptor {
  recipeIndex: number;
  recipe: RecipeImageRecipeInput;
  fingerprint: RecipeImageFingerprint;
  cacheKey: string;
  objectKey: string;
  imageUrl: string;
}

interface RecipeImageAccuracyResult {
  approved: boolean;
  score: number;
  reasons: string[];
  observedIngredients?: string[];
  observedDishForm?: string;
}

export type RecipeImageResolveResponse =
  | {
      status: "ready";
      images: Array<{
        recipeIndex: number;
        imageUrl: string;
        cacheKey: string;
      }>;
    }
  | {
      status: "pending";
    }
  | {
      status: "unavailable";
      reason?: string;
    };

interface RecipeImageResolveOptions {
  consumeGenerationRateLimit?: () => boolean | Promise<boolean>;
}

const trimmedIngredientSchema = z.string().trim().min(1).max(120);

export const recipeImageRecipeSchema = z
  .object({
    recipeName: z.string().trim().min(1).max(200),
    cuisine: z.string().trim().max(120).optional(),
    pantryIngredientsUsed: z.array(trimmedIngredientSchema).max(24).optional(),
    ingredients: z.array(trimmedIngredientSchema).max(24).optional(),
    additionalIngredientsNeeded: z.array(trimmedIngredientSchema).max(12).optional(),
    missingIngredients: z.array(trimmedIngredientSchema).max(12).optional(),
    overview: z.string().trim().max(1000).optional(),
    description: z.string().trim().max(1000).optional(),
  })
  .passthrough()
  .superRefine((recipe, ctx) => {
    const coreIngredients = getRecipeCoreIngredients(recipe);
    if (coreIngredients.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one core pantry ingredient is required for recipe image matching",
        path: ["pantryIngredientsUsed"],
      });
    }
  });

export const recipeImageResolveRequestSchema = z.object({
  recipes: z.array(recipeImageRecipeSchema).length(3),
});

export type RecipeImageRecipeInput = z.infer<typeof recipeImageRecipeSchema>;
export type RecipeImageResolveInput = z.infer<typeof recipeImageResolveRequestSchema>;

const activeImageBatches = new Set<string>();

function getPositiveIntegerEnv(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name] || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getIntegerEnvInRange(name: string, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(process.env[name] || "", 10);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

function isEnabledEnv(value: string | undefined): boolean {
  return value === "1" || value?.toLowerCase() === "true" || value?.toLowerCase() === "yes";
}

function getRecipeImageOutputFormat(value: string | undefined): RecipeImageOutputFormat {
  const normalized = (value || DEFAULT_OUTPUT_FORMAT).toLowerCase();
  if (normalized === "png" || normalized === "webp" || normalized === "jpeg") {
    return normalized;
  }

  return DEFAULT_OUTPUT_FORMAT;
}

function getRecipeImageMimeType(outputFormat: RecipeImageOutputFormat): string {
  if (outputFormat === "jpeg") return "image/jpeg";
  if (outputFormat === "webp") return "image/webp";
  return "image/png";
}

function getRecipeImageObjectExtension(outputFormat: RecipeImageOutputFormat): string {
  return outputFormat === "jpeg" ? "jpg" : outputFormat;
}

function getRecipeImageConfig(): RecipeImageConfig {
  const provider = (process.env.RECIPE_IMAGE_PROVIDER || DEFAULT_PROVIDER).toLowerCase();
  const outputFormat = getRecipeImageOutputFormat(process.env.RECIPE_IMAGE_OUTPUT_FORMAT);

  return {
    enabled: isEnabledEnv(process.env.RECIPE_IMAGE_GENERATION_ENABLED),
    provider: provider === "gemini" ? "gemini" : "openai",
    model: process.env.RECIPE_IMAGE_MODEL || DEFAULT_MODEL,
    quality: process.env.RECIPE_IMAGE_QUALITY || DEFAULT_QUALITY,
    outputSize: process.env.RECIPE_IMAGE_OUTPUT_SIZE || DEFAULT_OUTPUT_SIZE,
    outputFormat,
    outputCompression: getIntegerEnvInRange(
      "RECIPE_IMAGE_OUTPUT_COMPRESSION",
      DEFAULT_OUTPUT_COMPRESSION,
      0,
      100,
    ),
    styleVersion: process.env.RECIPE_IMAGE_STYLE_VERSION || DEFAULT_STYLE_VERSION,
    mimeType: getRecipeImageMimeType(outputFormat),
  };
}

function getStorageRuntimeMissingReason(): string | null {
  if (
    process.env.REPL_ID ||
    process.env.REPLIT_APP_STORAGE_BUCKET_ID ||
    process.env.REPLIT_ENVIRONMENT ||
    process.env.REPLIT_DEPLOYMENT
  ) {
    return null;
  }

  return "storage_unconfigured";
}

function getGenerationUnavailableReason(config: RecipeImageConfig): string | null {
  if (!config.enabled) {
    return "disabled";
  }
  if (config.provider !== "openai") {
    return "provider_unavailable";
  }
  if (!process.env.OPENAI_API_KEY) {
    return "openai_unconfigured";
  }

  return getStorageRuntimeMissingReason();
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entryValue]) => [key, stableValue(entryValue)]),
    );
  }

  return value;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(stableValue(value));
}

export function normalizeRecipeImageText(value: string | undefined | null): string {
  return (value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueSortedTextKeys(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => normalizeRecipeImageText(value)).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right));
}

function getRecipeCoreIngredients(recipe: {
  pantryIngredientsUsed?: string[];
  ingredients?: string[];
}): string[] {
  const pantryIngredients = Array.isArray(recipe.pantryIngredientsUsed)
    ? recipe.pantryIngredientsUsed
    : [];
  if (pantryIngredients.length > 0) {
    return pantryIngredients;
  }

  return Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
}

export function createRecipeImageFingerprint(recipe: RecipeImageRecipeInput): RecipeImageFingerprint {
  return {
    schemaVersion: "recipe-image-fingerprint-v1",
    titleKey: normalizeRecipeImageText(recipe.recipeName),
    cuisineKey: normalizeRecipeImageText(recipe.cuisine || "pantry-first"),
    coreIngredientKeys: uniqueSortedTextKeys(getRecipeCoreIngredients(recipe)),
  };
}

export function recipeImageFingerprintsMatch(left: unknown, right: RecipeImageFingerprint): boolean {
  return stableStringify(left) === stableStringify(right);
}

export function buildRecipeImageCacheKey(
  fingerprint: RecipeImageFingerprint,
  config: Pick<RecipeImageConfig, "provider" | "model" | "quality" | "outputSize" | "outputFormat" | "outputCompression" | "styleVersion"> = getRecipeImageConfig(),
): string {
  const payload = {
    cacheSchema: "recipe-image-cache-v1",
    provider: config.provider,
    model: config.model,
    quality: config.quality,
    outputSize: config.outputSize,
    outputFormat: config.outputFormat,
    outputCompression: config.outputCompression,
    styleVersion: config.styleVersion,
    fingerprint,
  };

  return crypto.createHash("sha256").update(stableStringify(payload)).digest("hex");
}

export function buildRecipeImageDescriptor(
  recipe: RecipeImageRecipeInput,
  recipeIndex: number,
  config: RecipeImageConfig = getRecipeImageConfig(),
): RecipeImageDescriptor {
  const fingerprint = createRecipeImageFingerprint(recipe);
  const cacheKey = buildRecipeImageCacheKey(fingerprint, config);

  return {
    recipeIndex,
    recipe,
    fingerprint,
    cacheKey,
    objectKey: `${IMAGE_OBJECT_PREFIX}/${config.styleVersion}/${cacheKey}.${getRecipeImageObjectExtension(config.outputFormat)}`,
    imageUrl: `${IMAGE_ROUTE_PREFIX}/${cacheKey}`,
  };
}

function rowIsReadyForDescriptor(row: RecipeImageCache | undefined, descriptor: RecipeImageDescriptor): row is RecipeImageCache {
  return Boolean(
    row &&
      row.status === "ready" &&
      row.imageUrl &&
      row.objectKey &&
      recipeImageFingerprintsMatch(row.recipeFingerprint, descriptor.fingerprint),
  );
}

function rowIsTerminalFailure(row: RecipeImageCache | undefined): boolean {
  return row?.status === "failed" || row?.status === "rejected";
}

function rowIsPendingStale(row: RecipeImageCache | undefined): boolean {
  if (!row || row.status !== "pending") {
    return false;
  }

  const updatedAt = row.updatedAt instanceof Date ? row.updatedAt : row.updatedAt ? new Date(row.updatedAt) : null;
  if (!updatedAt || Number.isNaN(updatedAt.getTime())) {
    return true;
  }

  return Date.now() - updatedAt.getTime() > PENDING_STALE_MS;
}

async function selectRowsByCacheKey(cacheKeys: string[]): Promise<Map<string, RecipeImageCache>> {
  if (cacheKeys.length === 0) {
    return new Map();
  }

  const rows = await db
    .select()
    .from(recipeImageCache)
    .where(inArray(recipeImageCache.cacheKey, cacheKeys));

  return new Map(rows.map((row) => [row.cacheKey, row]));
}

async function touchOrCreatePendingRows(
  descriptors: RecipeImageDescriptor[],
  config: RecipeImageConfig,
): Promise<void> {
  const timestamp = new Date();
  await db
    .insert(recipeImageCache)
    .values(
      descriptors.map((descriptor) => ({
        cacheKey: descriptor.cacheKey,
        recipeFingerprint: descriptor.fingerprint,
        provider: config.provider,
        model: config.model,
        quality: config.quality,
        outputSize: config.outputSize,
        styleVersion: config.styleVersion,
        status: "pending" satisfies RecipeImageStatus,
        objectKey: descriptor.objectKey,
        imageUrl: descriptor.imageUrl,
        mimeType: config.mimeType,
        lastRequestedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      })),
    )
    .onConflictDoUpdate({
      target: recipeImageCache.cacheKey,
      set: {
        lastRequestedAt: timestamp,
        updatedAt: timestamp,
      },
    });
}

async function updateRecipeImageRow(
  cacheKey: string,
  values: Partial<InsertRecipeImageCache>,
): Promise<void> {
  await db
    .update(recipeImageCache)
    .set({
      ...values,
      updatedAt: new Date(),
    })
    .where(eq(recipeImageCache.cacheKey, cacheKey));
}

function buildRecipeImagePrompt(descriptor: RecipeImageDescriptor): string {
  const recipe = descriptor.recipe;
  const coreIngredients = getRecipeCoreIngredients(recipe);
  const optionalIngredients = recipe.additionalIngredientsNeeded || recipe.missingIngredients || [];
  const overview = recipe.overview || recipe.description || "";

  return [
    "Create one realistic square food thumbnail for a recipe suggestion card.",
    "Use the same neutral editorial style for every recipe: overhead three-quarter crop, natural kitchen light, plated or bowled serving, no people, no logos, no packaging, no text labels, no exaggerated garnish.",
    "Accuracy is more important than beauty. The image must match the dish title and make the core ingredients visually plausible.",
    "Do not introduce a different protein, dish form, sauce, or dominant ingredient that is not supported by the recipe.",
    `Recipe title: ${recipe.recipeName}`,
    `Cuisine or flavor direction: ${recipe.cuisine || "pantry-first"}`,
    `Core pantry ingredients to represent: ${coreIngredients.join(", ")}`,
    optionalIngredients.length > 0
      ? `Optional extras that must not dominate the image: ${optionalIngredients.join(", ")}`
      : "Optional extras: none",
    overview ? `Recipe overview: ${overview}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function fetchJsonWithTimeout<T>(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = typeof (json as { error?: { message?: unknown } }).error?.message === "string"
        ? (json as { error: { message: string } }).error.message
        : `OpenAI request failed with status ${response.status}`;
      const code = typeof (json as { error?: { code?: unknown } }).error?.code === "string"
        ? (json as { error: { code: string } }).error.code
        : "provider_error";
      throw new RecipeImageProviderError(message, code, json);
    }

    return json as T;
  } finally {
    clearTimeout(timeout);
  }
}

class RecipeImageProviderError extends Error {
  public readonly code: string;
  public readonly details: unknown;

  constructor(message: string, code: string, details?: unknown) {
    super(message);
    this.name = "RecipeImageProviderError";
    this.code = code;
    this.details = details;
  }
}

async function generateOpenAiRecipeImage(
  descriptor: RecipeImageDescriptor,
  config: RecipeImageConfig,
): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await fetchJsonWithTimeout<{
    data?: Array<{ b64_json?: string }>;
  }>(
    "https://api.openai.com/v1/images/generations",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        prompt: buildRecipeImagePrompt(descriptor),
        quality: config.quality,
        size: config.outputSize,
        output_format: config.outputFormat,
        ...(config.outputFormat === "png" ? {} : { output_compression: config.outputCompression }),
        n: 1,
      }),
    },
    getPositiveIntegerEnv("RECIPE_IMAGE_PROVIDER_TIMEOUT_MS", DEFAULT_IMAGE_GENERATION_TIMEOUT_MS),
  );

  const base64Image = response.data?.[0]?.b64_json;
  if (!base64Image) {
    throw new Error("OpenAI image response did not include image data");
  }

  return Buffer.from(base64Image, "base64");
}

function parseAccuracyResult(rawContent: string | null | undefined): RecipeImageAccuracyResult {
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(rawContent || "{}") as Record<string, unknown>;
  } catch {
    return {
      approved: false,
      score: 0,
      reasons: ["Judge did not return valid JSON"],
    };
  }

  const score = typeof parsed.score === "number" ? parsed.score : 0;
  const reasons = Array.isArray(parsed.reasons)
    ? parsed.reasons.filter((reason): reason is string => typeof reason === "string")
    : [];
  const observedIngredients = Array.isArray(parsed.observedIngredients)
    ? parsed.observedIngredients.filter((ingredient): ingredient is string => typeof ingredient === "string")
    : undefined;

  return {
    approved: Boolean(parsed.approved) && score >= 0.75,
    score,
    reasons,
    observedIngredients,
    observedDishForm: typeof parsed.observedDishForm === "string" ? parsed.observedDishForm : undefined,
  };
}

async function judgeRecipeImageAccuracy(
  descriptor: RecipeImageDescriptor,
  imageBytes: Buffer,
  mimeType: string,
): Promise<RecipeImageAccuracyResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      approved: false,
      score: 0,
      reasons: ["OPENAI_API_KEY is not configured for image accuracy judging"],
    };
  }

  const recipe = descriptor.recipe;
  const coreIngredients = getRecipeCoreIngredients(recipe);
  const optionalIngredients = recipe.additionalIngredientsNeeded || recipe.missingIngredients || [];

  const response = await fetchJsonWithTimeout<{
    choices?: Array<{ message?: { content?: string | null } }>;
  }>(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.RECIPE_IMAGE_JUDGE_MODEL || "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a strict food image accuracy judge. Return JSON only with approved, score, reasons, observedIngredients, and observedDishForm.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: [
                  "Compare this image to the recipe suggestion.",
                  "Reject if the image shows the wrong protein, wrong dish form, missing key ingredients, dominant optional ingredients, visible text/brands, or a safety/dietary contradiction.",
                  "Reject if the image looks like a different named dish than the title.",
                  `Recipe title: ${recipe.recipeName}`,
                  `Cuisine: ${recipe.cuisine || "pantry-first"}`,
                  `Core ingredients: ${coreIngredients.join(", ")}`,
                  optionalIngredients.length > 0
                    ? `Optional ingredients that should not dominate: ${optionalIngredients.join(", ")}`
                    : "Optional ingredients: none",
                  `Overview: ${recipe.overview || recipe.description || ""}`,
                  "Use a 0-1 score. Approve only when score is at least 0.75.",
                ].join("\n"),
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageBytes.toString("base64")}`,
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    },
    getPositiveIntegerEnv("RECIPE_IMAGE_JUDGE_TIMEOUT_MS", DEFAULT_IMAGE_JUDGE_TIMEOUT_MS),
  );

  return parseAccuracyResult(response.choices?.[0]?.message?.content);
}

async function getObjectStorageClient() {
  const { Client } = await import("@replit/object-storage");
  const bucketId = process.env.REPLIT_APP_STORAGE_BUCKET_ID;
  return new Client(bucketId ? { bucketId } : undefined);
}

async function uploadRecipeImageObject(objectKey: string, imageBytes: Buffer): Promise<void> {
  const client = await getObjectStorageClient();
  const result = await client.uploadFromBytes(objectKey, imageBytes, { compress: false });
  if (!result.ok) {
    throw new Error(result.error.message || "Failed to upload recipe image to App Storage");
  }
}

async function downloadRecipeImageObject(objectKey: string): Promise<Buffer> {
  const client = await getObjectStorageClient();
  const result = await client.downloadAsBytes(objectKey, { decompress: false });
  if (!result.ok) {
    const error = new Error(result.error.message || "Failed to download recipe image from App Storage") as Error & {
      statusCode?: number;
    };
    error.statusCode = result.error.statusCode;
    throw error;
  }

  return result.value[0];
}

async function generateAndApproveDescriptor(
  descriptor: RecipeImageDescriptor,
  config: RecipeImageConfig,
): Promise<void> {
  try {
    const imageBytes = await generateOpenAiRecipeImage(descriptor, config);
    const accuracyResult = await judgeRecipeImageAccuracy(descriptor, imageBytes, config.mimeType);
    if (!accuracyResult.approved) {
      await updateRecipeImageRow(descriptor.cacheKey, {
        status: "rejected",
        accuracyResult,
        failureReason: "accuracy_rejected",
      });
      return;
    }

    await uploadRecipeImageObject(descriptor.objectKey, imageBytes);
    await updateRecipeImageRow(descriptor.cacheKey, {
      status: "ready",
      objectKey: descriptor.objectKey,
      imageUrl: descriptor.imageUrl,
      mimeType: config.mimeType,
      accuracyResult,
      failureReason: null,
      generatedAt: new Date(),
    });
  } catch (error) {
    const failureReason = error instanceof RecipeImageProviderError
      ? error.code
      : error instanceof Error
        ? error.message
        : "unknown_failure";
    const normalizedFailureReason = failureReason.toLowerCase();
    const rejectedByPolicy =
      normalizedFailureReason.includes("moderation") ||
      normalizedFailureReason.includes("policy") ||
      normalizedFailureReason.includes("safety");

    await updateRecipeImageRow(descriptor.cacheKey, {
      status: rejectedByPolicy ? "rejected" : "failed",
      failureReason,
      accuracyResult: {
        approved: false,
        score: 0,
        reasons: [failureReason],
      },
    });
  }
}

function getDescriptorsNeedingGeneration(
  descriptors: RecipeImageDescriptor[],
  rowsBeforeStart: Map<string, RecipeImageCache>,
): RecipeImageDescriptor[] {
  return descriptors.filter((descriptor) => {
    const row = rowsBeforeStart.get(descriptor.cacheKey);
    return !rowIsReadyForDescriptor(row, descriptor) && !rowIsTerminalFailure(row) && (!row || rowIsPendingStale(row));
  });
}

async function generateRecipeImageBatch(
  descriptors: RecipeImageDescriptor[],
  rowsBeforeStart: Map<string, RecipeImageCache>,
  config: RecipeImageConfig,
): Promise<void> {
  const toGenerate = getDescriptorsNeedingGeneration(descriptors, rowsBeforeStart);
  await Promise.all(toGenerate.map((descriptor) => generateAndApproveDescriptor(descriptor, config)));
}

function startRecipeImageBatch(
  descriptors: RecipeImageDescriptor[],
  rowsBeforeStart: Map<string, RecipeImageCache>,
  config: RecipeImageConfig,
): void {
  const batchKey = descriptors.map((descriptor) => descriptor.cacheKey).join(":");
  if (activeImageBatches.has(batchKey)) {
    return;
  }

  activeImageBatches.add(batchKey);
  void generateRecipeImageBatch(descriptors, rowsBeforeStart, config)
    .catch((error) => {
      console.warn(
        "[recipe-images] Background image generation failed:",
        error instanceof Error ? error.message : error,
      );
    })
    .finally(() => {
      activeImageBatches.delete(batchKey);
    });
}

function readyResponseFromDescriptors(
  descriptors: RecipeImageDescriptor[],
  rowMap: Map<string, RecipeImageCache>,
): RecipeImageResolveResponse | null {
  const readyImages = descriptors.map((descriptor) => {
    const row = rowMap.get(descriptor.cacheKey);
    if (!rowIsReadyForDescriptor(row, descriptor)) {
      return null;
    }

    return {
      recipeIndex: descriptor.recipeIndex,
      imageUrl: row.imageUrl || descriptor.imageUrl,
      cacheKey: descriptor.cacheKey,
    };
  });

  if (readyImages.every(Boolean)) {
    return {
      status: "ready",
      images: readyImages as Array<{ recipeIndex: number; imageUrl: string; cacheKey: string }>,
    };
  }

  return null;
}

export async function resolveRecipeImagesForRequest(
  rawInput: unknown,
  options: RecipeImageResolveOptions = {},
): Promise<RecipeImageResolveResponse> {
  const input = recipeImageResolveRequestSchema.parse(rawInput);
  const config = getRecipeImageConfig();
  const descriptors = input.recipes.map((recipe, index) =>
    buildRecipeImageDescriptor(recipe, index, config),
  );
  const cacheKeys = descriptors.map((descriptor) => descriptor.cacheKey);
  const existingRows = await selectRowsByCacheKey(cacheKeys);
  const readyResponse = readyResponseFromDescriptors(descriptors, existingRows);

  if (readyResponse) {
    return readyResponse;
  }

  if (descriptors.some((descriptor) => rowIsTerminalFailure(existingRows.get(descriptor.cacheKey)))) {
    return { status: "unavailable", reason: "image_set_not_approved" };
  }

  const unavailableReason = getGenerationUnavailableReason(config);
  if (unavailableReason) {
    return { status: "unavailable", reason: unavailableReason };
  }

  const descriptorsNeedingGeneration = getDescriptorsNeedingGeneration(descriptors, existingRows);
  if (descriptorsNeedingGeneration.length > 0 && options.consumeGenerationRateLimit) {
    const allowed = await options.consumeGenerationRateLimit();
    if (!allowed) {
      return { status: "unavailable", reason: "rate_limited" };
    }
  }

  await touchOrCreatePendingRows(descriptors, config);
  startRecipeImageBatch(descriptors, existingRows, config);

  return { status: "pending" };
}

export async function serveRecipeImageCacheObject(req: Request, res: Response): Promise<void> {
  const cacheKey = req.params.cacheKey;
  if (!CACHE_KEY_PATTERN.test(cacheKey)) {
    res.status(404).json({ message: "Recipe image not found" });
    return;
  }

  const [row] = await db
    .select()
    .from(recipeImageCache)
    .where(eq(recipeImageCache.cacheKey, cacheKey))
    .limit(1);

  if (!row || row.status !== "ready" || !row.objectKey) {
    res.status(404).json({ message: "Recipe image not found" });
    return;
  }

  try {
    const imageBytes = await downloadRecipeImageObject(row.objectKey);
    res.set({
      "Cache-Control": "public, max-age=604800, immutable",
      "Content-Type": row.mimeType || getRecipeImageMimeType(DEFAULT_OUTPUT_FORMAT),
      "X-Content-Type-Options": "nosniff",
    });
    res.send(imageBytes);
  } catch (error) {
    const statusCode = typeof (error as { statusCode?: unknown }).statusCode === "number"
      ? (error as { statusCode: number }).statusCode
      : 503;
    res.status(statusCode === 404 ? 404 : 503).json({ message: "Recipe image unavailable" });
  }
}
