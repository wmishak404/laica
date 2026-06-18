import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { db } from "../server/db";
import { buildRecipeImageDescriptor } from "../server/recipe-images";
import { recipeImageCache } from "../shared/schema";

const fixtureSchema = z.object({
  recipeName: z.string().trim().min(1),
  cuisine: z.string().trim().min(1).optional(),
  pantryIngredientsUsed: z.array(z.string().trim().min(1)).min(1),
  accuracyResult: z.record(z.unknown()).optional(),
});

const fixtureListSchema = z.array(fixtureSchema);

function getDefaultFixturePath(): string {
  const currentFile = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(currentFile), "recipe-image-cache-fixtures.json");
}

async function objectExists(objectKey: string): Promise<boolean> {
  const { Client } = await import("@replit/object-storage");
  const bucketId = process.env.REPLIT_APP_STORAGE_BUCKET_ID;
  const client = new Client(bucketId ? { bucketId } : undefined);
  const result = await client.exists(objectKey);
  if (!result.ok) {
    throw new Error(result.error.message || `Unable to verify App Storage object ${objectKey}`);
  }

  return result.value;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const fixturePathArg = process.argv.find((arg) => arg.startsWith("--fixtures="));
  const fixturePath = fixturePathArg
    ? path.resolve(fixturePathArg.replace("--fixtures=", ""))
    : getDefaultFixturePath();

  const fixtureJson = JSON.parse(await fs.readFile(fixturePath, "utf8"));
  const fixtures = fixtureListSchema.parse(fixtureJson);
  const timestamp = new Date();

  for (const [index, fixture] of fixtures.entries()) {
    const descriptor = buildRecipeImageDescriptor({
      recipeName: fixture.recipeName,
      cuisine: fixture.cuisine,
      pantryIngredientsUsed: fixture.pantryIngredientsUsed,
    }, index);

    console.log(`${fixture.recipeName}`);
    console.log(`  cacheKey: ${descriptor.cacheKey}`);
    console.log(`  objectKey: ${descriptor.objectKey}`);

    if (!apply) {
      continue;
    }

    if (!(await objectExists(descriptor.objectKey))) {
      throw new Error(
        `Missing App Storage object for ${fixture.recipeName}. Upload the approved image to ${descriptor.objectKey} before seeding.`,
      );
    }

    await db
      .insert(recipeImageCache)
      .values({
        cacheKey: descriptor.cacheKey,
        recipeFingerprint: descriptor.fingerprint,
        provider: process.env.RECIPE_IMAGE_PROVIDER || "openai",
        model: process.env.RECIPE_IMAGE_MODEL || "gpt-image-2",
        quality: process.env.RECIPE_IMAGE_QUALITY || "low",
        outputSize: process.env.RECIPE_IMAGE_OUTPUT_SIZE || "1024x1024",
        styleVersion: process.env.RECIPE_IMAGE_STYLE_VERSION || "phase-3-1-v1",
        status: "ready",
        objectKey: descriptor.objectKey,
        imageUrl: descriptor.imageUrl,
        mimeType: "image/png",
        accuracyResult: fixture.accuracyResult ?? {
          approved: true,
          score: 1,
          reasons: ["Curated fixture approved before seeding."],
        },
        generatedAt: timestamp,
        lastRequestedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .onConflictDoUpdate({
        target: recipeImageCache.cacheKey,
        set: {
          recipeFingerprint: descriptor.fingerprint,
          status: "ready",
          objectKey: descriptor.objectKey,
          imageUrl: descriptor.imageUrl,
          mimeType: "image/png",
          accuracyResult: fixture.accuracyResult ?? {
            approved: true,
            score: 1,
            reasons: ["Curated fixture approved before seeding."],
          },
          generatedAt: timestamp,
          lastRequestedAt: timestamp,
          updatedAt: timestamp,
        },
      });
  }

  if (!apply) {
    console.log("Dry run complete. Re-run with --apply after uploading approved objects to the printed keys.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
