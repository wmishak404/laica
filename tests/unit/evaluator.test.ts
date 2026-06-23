import { describe, expect, it, vi } from "vitest";

vi.mock("../../server/db", () => ({
  db: {},
}));

vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(function OpenAI() {
    return {};
  }),
  toFile: vi.fn(),
}));

import {
  buildEvalReportSummary,
  buildPendingEvalQueueSummary,
  hasEvalCriteria,
  selectEvaluableInteractionsForBatch,
} from "../../server/evaluator";

describe("INIT-004 criteria-aware eval queue selection", () => {
  it("keeps rows with eval criteria and skips unsupported operational feature rows", () => {
    const interactions = [
      { id: 1, featureType: "recipe_suggestions" },
      { id: 2, featureType: "pantry_recipes" },
      { id: 3, featureType: "slop_bowl" },
      { id: 4, featureType: "ingredient_detection" },
      { id: 5, featureType: "future_unreviewed_feature" },
    ];

    expect(hasEvalCriteria("pantry_recipes")).toBe(true);
    expect(hasEvalCriteria("ingredient_detection")).toBe(false);

    const result = selectEvaluableInteractionsForBatch(interactions);

    expect(result.evaluableInteractions.map((interaction) => interaction.id)).toEqual([1, 2, 3]);
    expect(result.skipped).toBe(2);
  });

  it("summarizes pending eval queue eligibility by feature", () => {
    const interactions = [
      { id: 1, featureType: "recipe_suggestions" },
      { id: 2, featureType: "pantry_recipes" },
      { id: 3, featureType: "ingredient_detection" },
      { id: 4, featureType: "tts" },
      { id: 5, featureType: "cooking_steps" },
    ];

    const summary = buildPendingEvalQueueSummary(interactions);

    expect(summary.total).toBe(5);
    expect(summary.eligibleTotal).toBe(3);
    expect(summary.skippedTotal).toBe(2);
    expect(summary.byFeature).toEqual({
      recipe_suggestions: 1,
      pantry_recipes: 1,
      ingredient_detection: 1,
      tts: 1,
      cooking_steps: 1,
    });
    expect(summary.eligibleByFeature).toEqual({
      recipe_suggestions: 1,
      pantry_recipes: 1,
      cooking_steps: 1,
    });
    expect(summary.skippedByFeature).toEqual({
      ingredient_detection: 1,
      tts: 1,
    });
  });

  it("reports completed evals by eval surface and prompt-version provenance", () => {
    const summary = buildEvalReportSummary([
      {
        featureType: "pantry_recipes",
        promptVersionId: 12,
        evalPassed: false,
        evalScore: 40,
        evalErrorModes: ["dietary_violation", "pantry_mismatch"],
      },
      {
        featureType: "pantry_recipes",
        promptVersionId: 12,
        evalPassed: true,
        evalScore: 90,
        evalErrorModes: [],
      },
      {
        featureType: "recipe_suggestions",
        promptVersionId: null,
        evalPassed: true,
        evalScore: null,
        evalErrorModes: null,
      },
    ]);

    expect(summary.total).toBe(3);
    expect(summary.passed).toBe(2);
    expect(summary.failed).toBe(1);
    expect(summary).not.toHaveProperty("passRate");
    expect(summary).not.toHaveProperty("averageScore");
    expect(summary.errorModeBreakdown).toEqual({
      dietary_violation: 1,
      pantry_mismatch: 1,
    });
    expect(summary.byFeature).toEqual({
      pantry_recipes: { total: 2, passed: 1, failed: 1 },
      recipe_suggestions: { total: 1, passed: 1, failed: 0 },
    });
    expect(summary.featureReports.pantry_recipes).toMatchObject({
      total: 2,
      passed: 1,
      failed: 1,
      passRate: 0.5,
      averageScore: 65,
      errorModes: {
        dietary_violation: 1,
        pantry_mismatch: 1,
      },
    });
    expect(summary.featureReports.pantry_recipes.promptVersions).toEqual([
      {
        featureType: "pantry_recipes",
        promptVersionId: 12,
        total: 2,
        passed: 1,
        failed: 1,
        passRate: 0.5,
        averageScore: 65,
      },
    ]);
    expect(summary.promptVersionReports).toEqual([
      {
        featureType: "pantry_recipes",
        promptVersionId: 12,
        total: 2,
        passed: 1,
        failed: 1,
        passRate: 0.5,
        averageScore: 65,
      },
      {
        featureType: "recipe_suggestions",
        promptVersionId: null,
        total: 1,
        passed: 1,
        failed: 0,
        passRate: 1,
        averageScore: null,
      },
    ]);
  });
});
