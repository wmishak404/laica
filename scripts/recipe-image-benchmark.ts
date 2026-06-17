import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../server/db";
import {
  resolveRecipeImagesForRequest,
  resolveSelectedRecipeImageForRequest,
} from "../server/recipe-images";
import { recipeImageCache } from "../shared/schema";

const selectedFixture = {
  recipeName: "Beef and Kimchi Rice Bowl with Spinach",
  cuisine: "Korean",
  pantryIngredientsUsed: ["beef", "kimchi", "rice", "spinach"],
  ingredients: ["beef", "kimchi", "rice", "spinach"],
  additionalIngredientsNeeded: ["green onions", "sesame oil"],
  description: "A warm rice bowl with beef, kimchi, and spinach.",
};

const batchFixtures = [
  selectedFixture,
  {
    recipeName: "Dashi-Braised Leeks and Tofu with Steamed Rice",
    cuisine: "Japanese",
    pantryIngredientsUsed: ["leeks", "tofu", "dashi packets", "white rice"],
    ingredients: ["leeks", "tofu", "dashi packets", "white rice"],
    additionalIngredientsNeeded: ["sesame oil"],
    description: "A gentle dashi tofu bowl with leeks and rice.",
  },
  {
    recipeName: "Spinach Egg Skillet with Lemon",
    cuisine: "Pantry-first",
    pantryIngredientsUsed: ["spinach", "eggs", "lemon"],
    ingredients: ["spinach", "eggs", "lemon"],
    additionalIngredientsNeeded: ["olive oil"],
    description: "A simple skillet of eggs and spinach brightened with lemon.",
  },
];

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function configureBenchmarkEnv() {
  const provider = getArg("provider");
  const model = getArg("model");
  const outputSize = getArg("output-size");
  const styleVersion = getArg("style-version") || `benchmark-${Date.now()}`;

  if (provider) process.env.RECIPE_IMAGE_PROVIDER = provider;
  if (model) process.env.RECIPE_IMAGE_MODEL = model;
  if (outputSize) process.env.RECIPE_IMAGE_OUTPUT_SIZE = outputSize;
  process.env.RECIPE_IMAGE_GENERATION_ENABLED = "true";
  process.env.RECIPE_IMAGE_STYLE_VERSION = styleVersion;

  return {
    provider: process.env.RECIPE_IMAGE_PROVIDER || "openai",
    model: process.env.RECIPE_IMAGE_MODEL || "(provider default)",
    outputSize: process.env.RECIPE_IMAGE_OUTPUT_SIZE || "(provider default)",
    styleVersion,
  };
}

async function readCacheRows(cacheKeys: string[]) {
  if (cacheKeys.length === 0) return [];

  return db
    .select()
    .from(recipeImageCache)
    .where(inArray(recipeImageCache.cacheKey, cacheKeys));
}

async function readLatestRowsForBenchmark(config: ReturnType<typeof configureBenchmarkEnv>) {
  return db
    .select()
    .from(recipeImageCache)
    .where(and(
      eq(recipeImageCache.provider, config.provider),
      eq(recipeImageCache.model, config.model),
      eq(recipeImageCache.outputSize, config.outputSize),
      eq(recipeImageCache.styleVersion, config.styleVersion),
    ))
    .orderBy(desc(recipeImageCache.createdAt))
    .limit(5);
}

function getResultReason(result: Awaited<ReturnType<typeof resolveSelectedRecipeImageForRequest>>): string | undefined {
  return result.status === "unavailable" ? result.reason : undefined;
}

async function pollSelected(maxMs: number, config: ReturnType<typeof configureBenchmarkEnv>) {
  const startedAt = Date.now();
  let lastResult = await resolveSelectedRecipeImageForRequest({ recipe: selectedFixture });

  while (lastResult.status === "pending" && Date.now() - startedAt < maxMs) {
    await sleep(2_000);
    lastResult = await resolveSelectedRecipeImageForRequest({ recipe: selectedFixture });
  }

  const cacheKeys = lastResult.status === "ready" ? [lastResult.image.cacheKey] : [];
  const rows = cacheKeys.length > 0
    ? await readCacheRows(cacheKeys)
    : await readLatestRowsForBenchmark(config);

  return {
    scope: "selected",
    status: lastResult.status,
    reason: getResultReason(lastResult),
    elapsedMs: Date.now() - startedAt,
    cacheKeys,
    rows,
  };
}

async function pollBatch(maxMs: number, config: ReturnType<typeof configureBenchmarkEnv>) {
  const startedAt = Date.now();
  let lastResult = await resolveRecipeImagesForRequest({ recipes: batchFixtures });

  while (lastResult.status === "pending" && Date.now() - startedAt < maxMs) {
    await sleep(2_000);
    lastResult = await resolveRecipeImagesForRequest({ recipes: batchFixtures });
  }

  const cacheKeys = lastResult.status === "ready"
    ? lastResult.images.map((image) => image.cacheKey)
    : [];
  const rows = cacheKeys.length > 0
    ? await readCacheRows(cacheKeys)
    : await readLatestRowsForBenchmark(config);

  return {
    scope: "batch",
    status: lastResult.status,
    reason: lastResult.status === "unavailable" ? lastResult.reason : undefined,
    elapsedMs: Date.now() - startedAt,
    cacheKeys,
    rows,
  };
}

function summarizeRows(rows: Awaited<ReturnType<typeof readCacheRows>>) {
  return rows.map((row) => ({
    cacheKey: row.cacheKey,
    status: row.status,
    failureReason: row.failureReason,
    accuracyResult: row.accuracyResult,
    generatedAt: row.generatedAt,
  }));
}

async function main() {
  const config = configureBenchmarkEnv();
  const maxSelectedMs = Number.parseInt(getArg("selected-max-ms") || "15000", 10);
  const maxBatchMs = Number.parseInt(getArg("batch-max-ms") || "120000", 10);

  console.log(JSON.stringify({
    event: "recipe_image_benchmark_start",
    config,
    maxSelectedMs,
    maxBatchMs,
  }, null, 2));

  const selectedResult = await pollSelected(maxSelectedMs, config);
  console.log(JSON.stringify({
    event: "recipe_image_benchmark_result",
    scope: selectedResult.scope,
    status: selectedResult.status,
    reason: selectedResult.reason,
    elapsedMs: selectedResult.elapsedMs,
    rows: summarizeRows(selectedResult.rows),
  }, null, 2));

  const runBatch = getArg("batch") !== "false";
  if (runBatch) {
    const batchResult = await pollBatch(maxBatchMs, config);
    console.log(JSON.stringify({
      event: "recipe_image_benchmark_result",
      scope: batchResult.scope,
      status: batchResult.status,
      reason: batchResult.reason,
      elapsedMs: batchResult.elapsedMs,
      rows: summarizeRows(batchResult.rows),
    }, null, 2));
  }

}

main().catch((error) => {
  console.error(JSON.stringify({
    event: "recipe_image_benchmark_error",
    message: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exitCode = 1;
});
