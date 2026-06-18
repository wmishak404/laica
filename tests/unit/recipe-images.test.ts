import { describe, expect, it, vi } from "vitest";

vi.mock("../../server/db", () => ({
  db: {},
}));

import {
  buildGeminiRecipeImageRequest,
  buildRecipeImageCacheKey,
  buildRecipeImageDescriptor,
  createRecipeImageFingerprint,
  parseGeminiRecipeImageResponse,
  recipeImageFingerprintsMatch,
} from "../../server/recipe-images";

const recipeImageConfig = {
  enabled: false,
  provider: "openai" as const,
  model: "gpt-image-2",
  quality: "low",
  outputSize: "1024x1024",
  outputFormat: "png" as const,
  outputCompression: 70,
  styleVersion: "phase-3-1-v1",
  mimeType: "image/png",
};

describe("recipe image cache fingerprints", () => {
  it("builds stable cache keys for the same title and core ingredients", () => {
    const firstFingerprint = createRecipeImageFingerprint({
      recipeName: "Broccoli Beef Rice Bowl",
      cuisine: "Chinese",
      pantryIngredientsUsed: ["beef", "broccoli", "rice"],
    });
    const reorderedFingerprint = createRecipeImageFingerprint({
      recipeName: "  Broccoli   Beef Rice Bowl ",
      cuisine: "Chinese",
      pantryIngredientsUsed: ["rice", "broccoli", "beef"],
    });

    expect(firstFingerprint).toEqual(reorderedFingerprint);
    expect(buildRecipeImageCacheKey(firstFingerprint, recipeImageConfig)).toBe(
      buildRecipeImageCacheKey(reorderedFingerprint, recipeImageConfig),
    );
  });

  it("does not treat a title mismatch as a cache hit even when ingredients overlap", () => {
    const broccoliBeef = createRecipeImageFingerprint({
      recipeName: "Broccoli Beef Rice Bowl",
      cuisine: "Chinese",
      pantryIngredientsUsed: ["beef", "broccoli", "rice"],
    });
    const primeRib = createRecipeImageFingerprint({
      recipeName: "Prime Rib with Creamed Spinach",
      cuisine: "American",
      pantryIngredientsUsed: ["beef", "broccoli", "rice"],
    });

    expect(recipeImageFingerprintsMatch(broccoliBeef, primeRib)).toBe(false);
    expect(buildRecipeImageCacheKey(broccoliBeef, recipeImageConfig)).not.toBe(
      buildRecipeImageCacheKey(primeRib, recipeImageConfig),
    );
  });

  it("does not treat a core ingredient mismatch as a cache hit", () => {
    const tofuSkillet = createRecipeImageFingerprint({
      recipeName: "Spinach Tofu Skillet",
      cuisine: "Pantry-first",
      pantryIngredientsUsed: ["spinach", "tofu"],
    });
    const eggSkillet = createRecipeImageFingerprint({
      recipeName: "Spinach Tofu Skillet",
      cuisine: "Pantry-first",
      pantryIngredientsUsed: ["spinach", "eggs"],
    });

    expect(recipeImageFingerprintsMatch(tofuSkillet, eggSkillet)).toBe(false);
    expect(buildRecipeImageCacheKey(tofuSkillet, recipeImageConfig)).not.toBe(
      buildRecipeImageCacheKey(eggSkillet, recipeImageConfig),
    );
  });

  it("uses opaque object keys that do not include recipe titles or ingredients", () => {
    const descriptor = buildRecipeImageDescriptor({
      recipeName: "Broccoli Beef Rice Bowl",
      cuisine: "Chinese",
      pantryIngredientsUsed: ["beef", "broccoli", "rice"],
    }, 0, recipeImageConfig);

    expect(descriptor.objectKey).toMatch(/^recipe-images\/phase-3-1-v1\/[a-f0-9]{64}\.png$/);
    expect(descriptor.objectKey).not.toContain("broccoli");
    expect(descriptor.objectKey).not.toContain("beef");
    expect(descriptor.imageUrl).toBe(`/api/recipe-images/${descriptor.cacheKey}`);
  });
});

describe("Gemini recipe image provider helpers", () => {
  const geminiConfig = {
    ...recipeImageConfig,
    provider: "gemini" as const,
    model: "gemini-3.1-flash-image",
    outputSize: "512",
    outputFormat: "png" as const,
    mimeType: "image/png",
  };

  it("builds a compact Gemini image request with square 512 output for Gemini 3.1 Flash Image", () => {
    const descriptor = buildRecipeImageDescriptor({
      recipeName: "Beef and Kimchi Rice Bowl with Spinach",
      cuisine: "Korean",
      pantryIngredientsUsed: ["beef", "kimchi", "rice", "spinach"],
    }, 0, geminiConfig);

    const request = buildGeminiRecipeImageRequest(descriptor, geminiConfig);

    expect(request).toMatchObject({
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        responseFormat: {
          image: {
            aspectRatio: "1:1",
            imageSize: "512",
          },
        },
      },
    });
    expect(JSON.stringify(request)).toContain("No people");
    expect(JSON.stringify(request)).toContain("Beef and Kimchi Rice Bowl with Spinach");
  });

  it("does not send Gemini 3-only image size parameters to Gemini 2.5 Flash Image", () => {
    const config = {
      ...geminiConfig,
      model: "gemini-2.5-flash-image",
      outputSize: "1024x1024",
    };
    const descriptor = buildRecipeImageDescriptor({
      recipeName: "Spinach Egg Skillet",
      cuisine: "Pantry-first",
      pantryIngredientsUsed: ["eggs", "spinach"],
    }, 0, config);

    const request = buildGeminiRecipeImageRequest(descriptor, config);

    expect(request).toMatchObject({
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    });
    expect((request.generationConfig as { responseFormat?: unknown }).responseFormat).toBeUndefined();
  });

  it("parses Gemini inline image responses", () => {
    const imageBytes = Buffer.from("gemini-image-bytes");
    const parsed = parseGeminiRecipeImageResponse({
      candidates: [
        {
          content: {
            parts: [
              { text: "done" },
              {
                inlineData: {
                  mimeType: "image/png",
                  data: imageBytes.toString("base64"),
                },
              },
            ],
          },
        },
      ],
    });

    expect(parsed.mimeType).toBe("image/png");
    expect(parsed.imageBytes.equals(imageBytes)).toBe(true);
  });

  it("rejects Gemini responses without image data", () => {
    expect(() => parseGeminiRecipeImageResponse({ candidates: [] })).toThrow(
      "Gemini image response did not include image data",
    );
  });
});
