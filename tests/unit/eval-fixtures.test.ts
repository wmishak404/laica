import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  isEvalFixtureArtifactValid,
  loadPublicEvalFixtures,
  listEvalFeatureTypesForFixtures,
  validateEvalFixture,
} from "../../server/eval-fixtures";
import { promptFeatureTypeSchema } from "../../server/ai-feature-types";

function recipe(name: string, cookTime = 30) {
  return {
    recipeName: name,
    description: `${name} description`,
    difficulty: "Easy",
    cookTime,
    pantryIngredientsUsed: ["rice", "eggs"],
    additionalIngredientsNeeded: [],
    overview: `${name} comes together quickly.`,
    instructions: ["Cook the pantry ingredients together until done."],
    cuisine: "Pantry",
    isFusion: false,
  };
}

function baseFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: "synthetic-pantry-pass",
    surface: "chef_it_up_suggestions",
    privacyClass: "synthetic",
    roles: ["regression"],
    sourceRefs: ["eff022-thai-korean-broth-anchor"],
    request: {
      preferences: "Time available: 30 minutes or less. Preferred cuisines: Thai.",
      ingredients: ["rice", "eggs", "fish sauce"],
    },
    constraints: {
      maxTimeMinutes: 30,
      cuisines: ["Thai"],
      skill: "intermediate",
      dietaryRestrictions: [],
      equipment: [],
    },
    output: JSON.stringify({
      recipes: [recipe("Rice Bowl", 30), recipe("Egg Rice", 35), recipe("Pantry Fried Rice", 45)],
    }),
    outputProvenance: {
      kind: "synthetic",
      promptVersion: "default",
    },
    labels: {
      structure_contract: "pass",
      suggestion_count: "pass",
      max_time_adherence: "pass",
    },
    ...overrides,
  };
}

function stepPreviewFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: "synthetic-step-preview-pass",
    surface: "live_cooking_step_previews",
    privacyClass: "synthetic",
    roles: ["regression"],
    sourceRefs: ["live-cooking-step-preview-label-seed-2026-07-07"],
    request: {
      recipe: {
        recipeName: "Fried Rice",
        ingredients: ["water", "rice", "vegetables"],
      },
    },
    constraints: {
      maxWords: 5,
      preferredMaxWords: 4,
      maxCharacters: 24,
    },
    output: JSON.stringify({
      recipe: {
        recipeName: "Fried Rice",
        ingredients: ["water", "rice", "vegetables"],
      },
      renderingConstraints: {
        maxWords: 5,
        preferredMaxWords: 4,
        maxCharacters: 24,
      },
      siblingLabelsBeforeRendering: ["Bring 4 Cups", "Season Fried Rice"],
      siblingLabelsAfterRendering: ["Boil Water", "Season Fried Rice"],
      previews: [
        {
          stepIndex: 0,
          instruction: "Bring water to a boil.",
          providerActionLabel: "Bring 4 Cups",
          clientNormalizedProviderLabel: null,
          clientFallbackLabel: "Boil Water",
          renderedPreviewLabel: "Boil Water",
        },
        {
          stepIndex: 1,
          instruction: "Season the fried rice.",
          providerActionLabel: "Season Fried Rice",
          clientNormalizedProviderLabel: "Season Fried Rice",
          clientFallbackLabel: null,
          renderedPreviewLabel: "Season Fried Rice",
        },
      ],
    }),
    outputProvenance: {
      kind: "synthetic",
      promptVersion: "pr-260-review-seed",
    },
    labels: {
      structure_contract: "pass",
      step_preview_word_count: "pass",
      step_preview_measurement_free: "pass",
      step_preview_distinctness: "pass",
      step_preview_provider_label_quality: "fail",
      step_preview_rendered_label_quality: "pass",
    },
    ...overrides,
  };
}

describe("INIT-004 eval fixture foundation", () => {
  it("separates eval/reporting feature ids from prompt-managed feature ids", () => {
    expect(listEvalFeatureTypesForFixtures()).toContain("chef_it_up_suggestions");
    expect(listEvalFeatureTypesForFixtures()).toContain("slop_bowl_suggestions");
    expect(listEvalFeatureTypesForFixtures()).toContain("live_cooking_step_previews");
    expect(listEvalFeatureTypesForFixtures()).not.toContain("pantry_recipes");
    expect(listEvalFeatureTypesForFixtures()).not.toContain("slop_bowl");
    expect(promptFeatureTypeSchema.safeParse("slop_bowl_suggestions").success).toBe(false);
    expect(promptFeatureTypeSchema.safeParse("live_cooking_step_previews").success).toBe(false);
    expect(promptFeatureTypeSchema.safeParse("recipe_suggestions").success).toBe(true);
  });

  it("accepts legacy fixture surface ids and normalizes them to canonical ids", () => {
    const pantryResult = validateEvalFixture(baseFixture({ surface: "pantry_recipes" }));
    const slopBowlResult = validateEvalFixture({
      ...baseFixture({
        id: "legacy-slop-bowl-pass",
        surface: "slop_bowl",
        output: JSON.stringify({
          recipe: {
            ...recipe("Rice Bowl"),
            cuisine: "Pantry",
            pantryMatch: 95,
          },
        }),
        labels: { structure_contract: "pass" },
      }),
    });

    expect(pantryResult.fixture?.surface).toBe("chef_it_up_suggestions");
    expect(slopBowlResult.fixture?.surface).toBe("slop_bowl_suggestions");
    expect(pantryResult.passed).toBe(true);
    expect(slopBowlResult.passed).toBe(true);
  });

  it("accepts a public pantry recipe fixture with valid current recipes[] output", () => {
    const result = validateEvalFixture(baseFixture());

    expect(result.passed).toBe(true);
    expect(result.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "structure_contract", status: "pass" }),
      expect.objectContaining({ id: "suggestion_count", status: "pass" }),
      expect.objectContaining({ id: "max_time_adherence", status: "pass" }),
      expect.objectContaining({ id: "privacy_scan", status: "pass" }),
    ]));
  });

  it("fails malformed recipe JSON before suggestion-count or max-time claims", () => {
    const result = validateEvalFixture(baseFixture({
      output: "{\"recipes\":[",
      labels: { structure_contract: "fail" },
    }));

    expect(result.passed).toBe(false);
    expect(result.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "structure_contract", status: "fail" }),
      expect.objectContaining({ id: "suggestion_count", status: "not_applicable" }),
      expect.objectContaining({ id: "max_time_adherence", status: "not_applicable" }),
      expect.objectContaining({ id: "label_expectations", status: "pass" }),
    ]));
    expect(isEvalFixtureArtifactValid(result)).toBe(true);
  });

  it("fails recipe fixtures with the wrong suggestion count", () => {
    const result = validateEvalFixture(baseFixture({
      output: JSON.stringify({ recipes: [recipe("Only One")] }),
    }));

    expect(result.passed).toBe(false);
    expect(result.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "suggestion_count", status: "fail" }),
    ]));
  });

  it("uses the accepted +15 minute max-time band", () => {
    const boundaryPass = validateEvalFixture(baseFixture({
      output: JSON.stringify({
        recipes: [recipe("Thirty", 30), recipe("Forty Five", 45), recipe("Also Forty Five", 45)],
      }),
    }));
    const trueNegative = validateEvalFixture(baseFixture({
      output: JSON.stringify({
        recipes: [recipe("Thirty", 30), recipe("Sixty", 60), recipe("Forty Five", 45)],
      }),
    }));

    expect(boundaryPass.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "max_time_adherence", status: "pass" }),
    ]));
    expect(trueNegative.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "max_time_adherence", status: "fail" }),
    ]));
  });

  it("rejects raw private fixtures and obvious private identifiers from public artifacts", () => {
    const privateResult = validateEvalFixture(baseFixture({ privacyClass: "raw_private" }));
    const emailResult = validateEvalFixture(baseFixture({
      request: {
        preferences: "Cook for test@example.com",
        ingredients: ["rice"],
      },
    }));

    expect(privateResult.passed).toBe(false);
    expect(privateResult.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "privacy_class", status: "fail" }),
    ]));
    expect(emailResult.passed).toBe(false);
    expect(emailResult.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "privacy_scan", status: "fail" }),
    ]));
  });

  it("validates Slop Bowl and cooking-step response contracts", () => {
    const slopResult = validateEvalFixture(baseFixture({
      id: "synthetic-slop-bowl",
      surface: "slop_bowl_suggestions",
      request: { ingredients: ["rice", "eggs", "soy sauce"] },
      output: JSON.stringify({
        recipe: {
          ...recipe("Slop Bowl"),
          pantryMatch: 90,
        },
      }),
      labels: { structure_contract: "pass" },
    }));
    const cookingStepsResult = validateEvalFixture(baseFixture({
      id: "synthetic-cooking-steps",
      surface: "cooking_steps",
      request: { recipeName: "Rice Bowl" },
      output: JSON.stringify({
        recipe: { recipeName: "Rice Bowl" },
        steps: [{ instruction: "Cook rice until tender." }],
      }),
      labels: { structure_contract: "pass" },
    }));

    expect(slopResult.passed).toBe(true);
    expect(cookingStepsResult.passed).toBe(true);
  });

  it("validates Live Cooking step-preview label shape and rendered-label checks", () => {
    const rescuedResult = validateEvalFixture(stepPreviewFixture());
    const renderedFailure = validateEvalFixture(stepPreviewFixture({
      id: "synthetic-step-preview-fail",
      output: JSON.stringify({
        recipe: { recipeName: "Fried Rice" },
        renderingConstraints: { maxWords: 5, maxCharacters: 24 },
        siblingLabelsBeforeRendering: ["Bring 4 Cups", "Cook Vegetables", "Cook Vegetables"],
        siblingLabelsAfterRendering: ["Bring 4 Cups", "Cook Vegetables", "Cook Vegetables"],
        previews: [
          {
            stepIndex: 0,
            instruction: "Bring four cups of water to a boil.",
            providerActionLabel: "Bring 4 Cups",
            clientNormalizedProviderLabel: "Bring 4 Cups",
            renderedPreviewLabel: "Bring 4 Cups",
          },
          {
            stepIndex: 1,
            instruction: "Cook vegetables until softened.",
            providerActionLabel: "Cook Vegetables",
            clientNormalizedProviderLabel: "Cook Vegetables",
            renderedPreviewLabel: "Cook Vegetables",
          },
          {
            stepIndex: 2,
            instruction: "Season the vegetables as a distinct milestone.",
            providerActionLabel: "Cook Vegetables",
            clientNormalizedProviderLabel: "Cook Vegetables",
            renderedPreviewLabel: "Cook Vegetables",
          },
        ],
      }),
      labels: {
        structure_contract: "pass",
        step_preview_word_count: "pass",
        step_preview_measurement_free: "fail",
        step_preview_distinctness: "fail",
        step_preview_rendered_label_quality: "fail",
      },
    }));

    expect(rescuedResult.passed).toBe(true);
    expect(rescuedResult.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "structure_contract", status: "pass" }),
      expect.objectContaining({ id: "step_preview_word_count", status: "pass" }),
      expect.objectContaining({ id: "step_preview_measurement_free", status: "pass" }),
      expect.objectContaining({ id: "step_preview_distinctness", status: "pass" }),
    ]));
    expect(renderedFailure.passed).toBe(false);
    expect(renderedFailure.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "step_preview_measurement_free", status: "fail" }),
      expect.objectContaining({ id: "step_preview_distinctness", status: "fail" }),
      expect.objectContaining({ id: "label_expectations", status: "pass" }),
    ]));
    expect(isEvalFixtureArtifactValid(renderedFailure)).toBe(true);
  });

  it("loads and sorts committed public fixture files", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "laica-eval-fixtures-"));
    await fs.writeFile(path.join(dir, "b.json"), JSON.stringify(baseFixture({ id: "synthetic-b" })));
    await fs.writeFile(path.join(dir, "a.json"), JSON.stringify(baseFixture({ id: "synthetic-a" })));
    await fs.writeFile(path.join(dir, "README.md"), "ignored");

    const fixtures = await loadPublicEvalFixtures(dir);

    expect(fixtures.map((fixture) => fixture.id)).toEqual(["synthetic-a", "synthetic-b"]);
  });

  it("loads committed public synthetic fixtures, including expected deterministic failures", async () => {
    const fixtures = await loadPublicEvalFixtures();

    expect(fixtures.map((fixture) => fixture.id)).toEqual([
      "chef-it-up-suggestions-beginner-complexity",
      "chef-it-up-suggestions-dietary-halal-pork",
      "chef-it-up-suggestions-max-time-30-to-60",
      "chef-it-up-suggestions-optional-extras-required",
      "cooking-steps-chicken-doneness",
      "cooking-steps-generated-context",
      "cooking-steps-missing-lid-alternative",
      "cooking-steps-raw-beef-doneness",
      "live-cooking-step-previews-client-rescue",
      "live-cooking-step-previews-duplicate-labels",
      "live-cooking-step-previews-incomplete-phrase",
      "live-cooking-step-previews-measurement-fragment",
      "live-cooking-step-previews-multi-ingredient-incomplete-label",
      "live-cooking-step-previews-rendered-fragments",
      "live-cooking-step-previews-singular-plural-agreement",
      "live-cooking-step-previews-stale-final-garnish-label",
      "live-cooking-step-previews-wrong-milestone",
      "openai-max-time-25-to-30",
      "slop-bowl-suggestions-current-shape",
    ]);
    expect(fixtures.find((fixture) => fixture.id === "chef-it-up-suggestions-max-time-30-to-60")?.labels.max_time_adherence).toBe("fail");
    expect(fixtures.find((fixture) => fixture.id === "cooking-steps-raw-beef-doneness")?.labels.food_safety).toBe("fail");
    expect(fixtures.find((fixture) => fixture.id === "cooking-steps-missing-lid-alternative")?.labels.equipment_fit).toBe("fail");
    expect(fixtures.find((fixture) => fixture.id === "chef-it-up-suggestions-dietary-halal-pork")?.labels.dietary_compliance).toBe("fail");
    expect(fixtures.find((fixture) => fixture.id === "chef-it-up-suggestions-optional-extras-required")?.labels.optional_ingredient_contract).toBe("fail");
    expect(fixtures.find((fixture) => fixture.id === "chef-it-up-suggestions-beginner-complexity")?.labels.skill_fit).toBe("fail");
    expect(fixtures.find((fixture) => fixture.id === "live-cooking-step-previews-measurement-fragment")?.labels.step_preview_measurement_free).toBe("fail");
    expect(fixtures.find((fixture) => fixture.id === "live-cooking-step-previews-multi-ingredient-incomplete-label")?.labels.step_preview_plain_english).toBe("fail");
    expect(fixtures.find((fixture) => fixture.id === "live-cooking-step-previews-multi-ingredient-incomplete-label")?.labels.step_preview_milestone_fit).toBe("fail");
    expect(fixtures.find((fixture) => fixture.id === "live-cooking-step-previews-duplicate-labels")?.labels.step_preview_distinctness).toBe("fail");
    expect(fixtures.find((fixture) => fixture.id === "live-cooking-step-previews-singular-plural-agreement")?.labels.step_preview_plain_english).toBe("fail");
    expect(fixtures.find((fixture) => fixture.id === "live-cooking-step-previews-stale-final-garnish-label")?.labels.step_preview_milestone_fit).toBe("fail");
    expect(fixtures.find((fixture) => fixture.id === "live-cooking-step-previews-rendered-fragments")?.labels.step_preview_measurement_free).toBe("fail");
    expect(fixtures.find((fixture) => fixture.id === "live-cooking-step-previews-rendered-fragments")?.labels.step_preview_distinctness).toBe("fail");
  });

  it("rejects public fixture artifacts when deterministic labels contradict observed checks", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "laica-eval-fixtures-"));
    await fs.writeFile(path.join(dir, "mismatch.json"), JSON.stringify(baseFixture({
      id: "synthetic-mismatch",
      output: "{\"recipes\":[",
      labels: { structure_contract: "pass" },
    })));

    await expect(loadPublicEvalFixtures(dir)).rejects.toThrow(/label_expectations/);
  });

  it("keeps fixture stores out of live generation runtime modules", async () => {
    const runtimeFiles = [
      "server/openai.ts",
      "server/routes.ts",
      "server/prompt-manager.ts",
    ];

    for (const file of runtimeFiles) {
      const source = await fs.readFile(file, "utf8");
      expect(source).not.toContain("docs/evals/fixtures");
      expect(source).not.toContain("LAICA_PRIVATE_EVAL_DIR");
    }
  });
});
