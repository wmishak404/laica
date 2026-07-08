import { describe, expect, it } from "vitest";
import {
  buildFixtureJudgePrompt,
  formatJudgeSmokeMarkdownReport,
  parseJudgeVerdict,
  runFixtureJudgeSmoke,
  STEP_PREVIEW_JUDGE_SMOKE_FIXTURE_IDS,
  type JudgeSmokeFixture,
} from "../../server/eval-judge-smoke";

function fixture(overrides: Partial<JudgeSmokeFixture> = {}): JudgeSmokeFixture {
  return {
    id: "live-cooking-step-previews-measurement-fragment",
    surface: "live_cooking_step_previews",
    privacyClass: "synthetic",
    roles: ["regression", "calibration-probe"],
    sourceRefs: ["live-cooking-step-preview-label-seed-2026-07-07"],
    request: {
      recipe: { recipeName: "Rice", ingredients: ["water", "rice"] },
      steps: ["Bring four cups of water to a boil."],
    },
    constraints: {
      maxWords: 5,
      maxCharacters: 24,
    },
    output: JSON.stringify({
      recipe: { recipeName: "Rice", ingredients: ["water", "rice"] },
      renderingConstraints: { maxWords: 5, maxCharacters: 24 },
      siblingLabelsBeforeRendering: ["Bring 4 Cups"],
      siblingLabelsAfterRendering: ["Bring 4 Cups"],
      previews: [
        {
          stepIndex: 0,
          instruction: "Bring four cups of water to a boil.",
          providerActionLabel: "Bring 4 Cups",
          clientNormalizedProviderLabel: "Bring 4 Cups",
          renderedPreviewLabel: "Bring 4 Cups",
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
      step_preview_measurement_free: "fail",
      step_preview_distinctness: "pass",
    },
    judgeExpectations: {
      expectedPassed: false,
      expectedErrorModes: ["measurement_or_quantity_label"],
      notes: "Measurement fragment should fail.",
    },
    ...overrides,
  };
}

describe("Live Cooking step-preview judge smoke runner", () => {
  it("uses a balanced default fixture id list for smoke reports", () => {
    expect(STEP_PREVIEW_JUDGE_SMOKE_FIXTURE_IDS).toEqual([
      "live-cooking-step-previews-client-rescue",
      "live-cooking-step-previews-measurement-fragment",
      "live-cooking-step-previews-wrong-milestone",
      "live-cooking-step-previews-incomplete-phrase",
      "live-cooking-step-previews-multi-ingredient-incomplete-label",
      "live-cooking-step-previews-singular-plural-agreement",
      "live-cooking-step-previews-stale-final-garnish-label",
      "live-cooking-step-previews-duplicate-labels",
    ]);
  });

  it("builds a fixture judge prompt without leaking human labels or expected modes", () => {
    const prompt = buildFixtureJudgePrompt(fixture());

    expect(prompt).toContain("measurement_or_quantity_label");
    expect(prompt).toContain("Bring 4 Cups");
    expect(prompt).toContain("Simmer 15 Minutes");
    expect(prompt).toContain("Slice Cucumber Thin");
    expect(prompt).toContain("Evenly");
    expect(prompt).toContain("live-cooking-step-previews-measurement-fragment");
    expect(prompt).not.toContain("judgeExpectations");
    expect(prompt).not.toContain("step_preview_measurement_free");
    expect(prompt).not.toContain("Measurement fragment should fail");
  });

  it("parses strict and fenced judge verdict JSON", () => {
    expect(parseJudgeVerdict(JSON.stringify({
      passed: false,
      score: 30,
      errorModes: ["measurement_or_quantity_label"],
      reasoning: "The label uses a quantity.",
    })).verdict).toMatchObject({
      passed: false,
      score: 30,
      errorModes: ["measurement_or_quantity_label"],
    });

    expect(parseJudgeVerdict(`\`\`\`json
{"passed":true,"score":90,"errorModes":[],"reasoning":"Final labels are usable."}
\`\`\``).verdict).toMatchObject({ passed: true, score: 90 });

    expect(parseJudgeVerdict("not-json").error).toBeTruthy();
  });

  it("runs repeated mocked judge calls and summarizes expected-mode matches", async () => {
    const report = await runFixtureJudgeSmoke({
      fixtures: [fixture()],
      runsPerFixture: 2,
      model: "mock-judge",
      generatedAt: "2026-07-07T21:30:00.000Z",
      judge: async () => JSON.stringify({
        passed: false,
        score: 40,
        errorModes: ["measurement_or_quantity_label"],
        reasoning: "The final label is a measurement fragment.",
      }),
    });

    expect(report.summary).toEqual({
      fixtures: 1,
      totalRuns: 2,
      validResponses: 2,
      invalidResponses: 0,
      expectedPassMatches: 2,
      expectedErrorModeMatches: 2,
    });
    expect(report.runs).toHaveLength(2);
    expect(report.runs[0]).toMatchObject({
      fixtureId: "live-cooking-step-previews-measurement-fragment",
      expectedPassed: false,
      missingExpectedErrorModes: [],
      unexpectedErrorModes: [],
    });
  });

  it("formats an uncalibrated markdown report for Wilson review", async () => {
    const report = await runFixtureJudgeSmoke({
      fixtures: [fixture()],
      runsPerFixture: 1,
      model: "mock-judge",
      generatedAt: "2026-07-07T21:30:00.000Z",
      judge: async () => JSON.stringify({
        passed: false,
        score: 40,
        errorModes: ["measurement_or_quantity_label"],
        reasoning: "The final label is a measurement fragment.",
      }),
    });

    const markdown = formatJudgeSmokeMarkdownReport(report);

    expect(markdown).toContain("Calibration status");
    expect(markdown).toContain("uncalibrated");
    expect(markdown).toContain("Expected error-mode exact matches: 1");
    expect(markdown).toContain("live-cooking-step-previews-measurement-fragment");
  });
});
