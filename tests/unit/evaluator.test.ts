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
  buildEvalReportArtifact,
  formatEvalReportArtifactMarkdown,
} from "../../server/evaluator";

describe("INIT-004 criteria-aware eval queue selection", () => {
  it("keeps rows with eval criteria and skips unsupported operational feature rows", () => {
    const interactions = [
      { id: 1, featureType: "recipe_suggestions" },
      { id: 2, featureType: "chef_it_up_suggestions" },
      { id: 3, featureType: "slop_bowl_suggestions" },
      { id: 4, featureType: "live_cooking_step_previews" },
      { id: 5, featureType: "ingredient_detection" },
      { id: 6, featureType: "future_unreviewed_feature" },
    ];

    expect(hasEvalCriteria("chef_it_up_suggestions")).toBe(true);
    expect(hasEvalCriteria("live_cooking_step_previews")).toBe(true);
    expect(hasEvalCriteria("ingredient_detection")).toBe(false);

    const result = selectEvaluableInteractionsForBatch(interactions);

    expect(result.evaluableInteractions.map((interaction) => interaction.id)).toEqual([1, 2, 3, 4]);
    expect(result.skipped).toBe(2);
  });

  it("summarizes pending eval queue eligibility by feature", () => {
    const interactions = [
      { id: 1, featureType: "recipe_suggestions" },
      { id: 2, featureType: "chef_it_up_suggestions" },
      { id: 3, featureType: "ingredient_detection" },
      { id: 4, featureType: "tts" },
      { id: 5, featureType: "cooking_steps" },
      { id: 6, featureType: "live_cooking_step_previews" },
    ];

    const summary = buildPendingEvalQueueSummary(interactions);

    expect(summary.total).toBe(6);
    expect(summary.eligibleTotal).toBe(4);
    expect(summary.skippedTotal).toBe(2);
    expect(summary.byFeature).toEqual({
      recipe_suggestions: 1,
      chef_it_up_suggestions: 1,
      ingredient_detection: 1,
      tts: 1,
      cooking_steps: 1,
      live_cooking_step_previews: 1,
    });
    expect(summary.eligibleByFeature).toEqual({
      recipe_suggestions: 1,
      chef_it_up_suggestions: 1,
      cooking_steps: 1,
      live_cooking_step_previews: 1,
    });
    expect(summary.skippedByFeature).toEqual({
      ingredient_detection: 1,
      tts: 1,
    });
  });

  it("normalizes legacy recipe-generation surface ids in queue summaries", () => {
    const interactions = [
      { id: 1, featureType: "pantry_recipes" },
      { id: 2, featureType: "slop_bowl" },
      { id: 3, featureType: "future_unreviewed_feature" },
    ];

    const summary = buildPendingEvalQueueSummary(interactions);

    expect(hasEvalCriteria("pantry_recipes")).toBe(true);
    expect(hasEvalCriteria("slop_bowl")).toBe(true);
    expect(summary.eligibleTotal).toBe(2);
    expect(summary.skippedTotal).toBe(1);
    expect(summary.byFeature).toEqual({
      chef_it_up_suggestions: 1,
      slop_bowl_suggestions: 1,
      future_unreviewed_feature: 1,
    });
    expect(summary.eligibleByFeature).toEqual({
      chef_it_up_suggestions: 1,
      slop_bowl_suggestions: 1,
    });
  });

  it("reports completed evals by eval surface and prompt-version provenance", () => {
    const summary = buildEvalReportSummary([
      {
        featureType: "chef_it_up_suggestions",
        promptVersionId: 12,
        evalPassed: false,
        evalScore: 40,
        evalErrorModes: ["dietary_violation", "pantry_mismatch"],
      },
      {
        featureType: "chef_it_up_suggestions",
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
      chef_it_up_suggestions: { total: 2, passed: 1, failed: 1 },
      recipe_suggestions: { total: 1, passed: 1, failed: 0 },
    });
    expect(summary.featureReports.chef_it_up_suggestions).toMatchObject({
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
    expect(summary.featureReports.chef_it_up_suggestions.promptVersions).toEqual([
      {
        featureType: "chef_it_up_suggestions",
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
        featureType: "chef_it_up_suggestions",
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

  it("normalizes legacy completed eval rows into canonical feature reports", () => {
    const summary = buildEvalReportSummary([
      {
        featureType: "pantry_recipes",
        promptVersionId: 12,
        evalPassed: false,
        evalScore: 40,
        evalErrorModes: ["pantry_mismatch"],
      },
      {
        featureType: "slop_bowl",
        promptVersionId: null,
        evalPassed: true,
        evalScore: 90,
        evalErrorModes: [],
      },
    ]);

    expect(summary.byFeature).toEqual({
      chef_it_up_suggestions: { total: 1, passed: 0, failed: 1 },
      slop_bowl_suggestions: { total: 1, passed: 1, failed: 0 },
    });
    expect(summary.featureReports.chef_it_up_suggestions.total).toBe(1);
    expect(summary.featureReports.slop_bowl_suggestions.total).toBe(1);
    expect(summary.promptVersionReports.map((report) => report.featureType)).toEqual([
      "chef_it_up_suggestions",
      "slop_bowl_suggestions",
    ]);
  });

  it("builds a report artifact with bounded admin-safe rows", () => {
    const longOutput = "out".repeat(600);
    const artifact = buildEvalReportArtifact([
      {
        id: 11,
        featureType: "chef_it_up_suggestions",
        promptVersionId: 7,
        evalPassed: false,
        evalErrorModes: ["dietary_violation"],
        evalReasoning: "Fails pantry alignment and language guardrails.",
        outputData: longOutput,
      },
    ], {
      sourceClass: "synthetic fixture validation",
      runType: "provider-backed judge smoke",
      outputFormat: "json",
    });

    expect(artifact.requestedSourceClass).toBe("synthetic fixture validation");
    expect(artifact.requestedRunType).toBe("provider-backed judge smoke");
    expect(artifact.rows).toHaveLength(1);
    expect(artifact.rows[0]).toMatchObject({
      dataItemId: 11,
      featureType: "chef_it_up_suggestions",
      sourceClass: "synthetic fixture validation",
      promptRuntimeVersion: "prompt_version_7",
      judgeDecision: "FAIL",
      criteria: ["wrong_cuisine", "dietary_violation", "pantry_mismatch", "optional_ingredient_required", "dish_identity_mismatch", "skill_mismatch"],
      humanVerdict: "TBD",
    });
    expect(artifact.rows[0].outputUnderTest.length).toBeLessThanOrEqual(1200);
    expect(artifact.rows[0].outputUnderTest).not.toBe(longOutput);
    expect(artifact.criterionAggregate).toEqual({
      wrong_cuisine: { total: 1, passed: 0, failed: 1 },
      dietary_violation: { total: 1, passed: 0, failed: 1 },
      pantry_mismatch: { total: 1, passed: 0, failed: 1 },
      optional_ingredient_required: { total: 1, passed: 0, failed: 1 },
      dish_identity_mismatch: { total: 1, passed: 0, failed: 1 },
      skill_mismatch: { total: 1, passed: 0, failed: 1 },
    });
    expect(artifact.metrics.passRate).toBe(0);
    expect(artifact.metrics.tpr.status).toBe("unavailable");
    expect(artifact.metrics.tnr.status).toBe("unavailable");
  });

  it("renders report artifacts in a row-first markdown shape", () => {
    const markdown = formatEvalReportArtifactMarkdown(
      buildEvalReportArtifact(
        [
          {
            id: 44,
            featureType: "recipe_suggestions",
            evalPassed: true,
            evalReasoning: "Pass",
            outputData: "good output",
          },
        ],
        {
          sourceClass: "real-usage sample",
          runType: "provider-backed judge smoke",
          outputFormat: "markdown",
        },
      ),
    );

    expect(markdown).toContain("# Eval Report");
    expect(markdown).toContain("## Run Results");
    expect(markdown).toContain("| 44 | real-usage sample | recipe_suggestions");
    expect(markdown).toContain("## Criterion Aggregate (Pass/Fail)");
    expect(markdown).toContain("## Judge Metrics");
    expect(markdown).toContain("## Provider Input Inventory");
    expect(markdown).toContain("| Feature | Samples |");
    expect(markdown).toContain("No raw interaction payloads");
    expect(markdown.indexOf("## Judge Metrics")).toBeLessThan(markdown.indexOf("## Provider Input Inventory"));
  });
});
