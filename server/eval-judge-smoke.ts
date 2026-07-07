import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { EVAL_CRITERIA } from "./eval-criteria";
import type { EvalFixture } from "./eval-fixtures";
import { loadPublicEvalFixtures } from "./eval-fixtures";

export const STEP_PREVIEW_JUDGE_SMOKE_FIXTURE_IDS = [
  "live-cooking-step-previews-client-rescue",
  "live-cooking-step-previews-measurement-fragment",
  "live-cooking-step-previews-wrong-milestone",
  "live-cooking-step-previews-incomplete-phrase",
  "live-cooking-step-previews-singular-plural-agreement",
  "live-cooking-step-previews-duplicate-labels",
] as const;

const judgeExpectationSchema = z.object({
  expectedPassed: z.boolean(),
  expectedErrorModes: z.array(z.string()).default([]),
  notes: z.string().optional(),
}).passthrough();

const judgeVerdictSchema = z.object({
  passed: z.boolean(),
  score: z.number().min(0).max(100),
  errorModes: z.array(z.string()),
  reasoning: z.string().min(1),
}).passthrough();

export type JudgeExpectation = z.infer<typeof judgeExpectationSchema>;
export type JudgeVerdict = z.infer<typeof judgeVerdictSchema>;

export type JudgeSmokeFixture = EvalFixture & {
  judgeExpectations?: JudgeExpectation;
};

export type JudgeSmokeRun = {
  fixtureId: string;
  runIndex: number;
  valid: boolean;
  verdict?: JudgeVerdict;
  rawResponse: string;
  parseError?: string;
  expectedPassed?: boolean;
  expectedErrorModes: string[];
  missingExpectedErrorModes: string[];
  unexpectedErrorModes: string[];
};

export type JudgeSmokeReport = {
  surface: "live_cooking_step_previews";
  calibrationStatus: "uncalibrated";
  generatedAt: string;
  model: string;
  runsPerFixture: number;
  fixtures: Array<{
    id: string;
    expectedPassed?: boolean;
    expectedErrorModes: string[];
    notes?: string;
  }>;
  runs: JudgeSmokeRun[];
  summary: {
    fixtures: number;
    totalRuns: number;
    validResponses: number;
    invalidResponses: number;
    expectedPassMatches: number;
    expectedErrorModeMatches: number;
  };
};

export type FixtureJudge = (input: {
  fixture: JudgeSmokeFixture;
  prompt: string;
  runIndex: number;
}) => Promise<string>;

function getJudgeExpectation(fixture: JudgeSmokeFixture): JudgeExpectation | undefined {
  const parsed = judgeExpectationSchema.safeParse(fixture.judgeExpectations);
  return parsed.success ? parsed.data : undefined;
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort();
}

function extractJsonObject(rawResponse: string): string {
  const trimmed = rawResponse.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

export function parseJudgeVerdict(rawResponse: string): { verdict?: JudgeVerdict; error?: string } {
  try {
    const parsedJson = JSON.parse(extractJsonObject(rawResponse));
    const parsedVerdict = judgeVerdictSchema.safeParse(parsedJson);
    if (!parsedVerdict.success) {
      return { error: parsedVerdict.error.issues[0]?.message ?? "Invalid judge verdict shape." };
    }
    return { verdict: parsedVerdict.data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export function buildFixtureJudgePrompt(fixture: JudgeSmokeFixture): string {
  if (fixture.surface !== "live_cooking_step_previews") {
    throw new Error(`Step-preview judge smoke only supports live_cooking_step_previews fixtures, got ${fixture.surface}.`);
  }

  const criteria = EVAL_CRITERIA.live_cooking_step_previews;
  const errorModeList = criteria.errorModes
    .map((mode) => `- **${mode.id}** [${mode.severity}]: ${mode.description}`)
    .join("\n");

  return `${criteria.evaluatorInstructions}

## Error Modes to Check
${errorModeList}

## Fixture Context
${JSON.stringify({
    fixtureId: fixture.id,
    sourceRefs: fixture.sourceRefs,
    request: fixture.request,
    constraints: fixture.constraints,
    outputProvenance: fixture.outputProvenance,
  }, null, 2)}

## Model Response Artifact
${fixture.output}

## Instructions
Evaluate only the Live Cooking step-preview/action-label artifact. Do not judge recipe quality, broad cooking-step safety, or whether the client should have rendered a different UI. Return a JSON object with exactly these fields:
- "passed": boolean - true only if no high or medium severity error modes are present in the final rendered labels
- "score": integer 0-100 - 100 = all labels are excellent hands-busy recall cards, 0 = unusable
- "errorModes": array of error mode IDs that were detected
- "reasoning": string - 2-3 sentences that distinguish raw provider-label failures from final rendered-label failures when relevant

Return only valid JSON. No explanation outside the JSON.`;
}

export async function loadStepPreviewJudgeSmokeFixtures(
  fixtureIds: readonly string[] = STEP_PREVIEW_JUDGE_SMOKE_FIXTURE_IDS,
): Promise<JudgeSmokeFixture[]> {
  const fixtures = await loadPublicEvalFixtures();
  const fixtureById = new Map(fixtures.map((fixture) => [fixture.id, fixture as JudgeSmokeFixture]));
  const missingIds = fixtureIds.filter((id) => !fixtureById.has(id));
  if (missingIds.length > 0) {
    throw new Error(`Missing step-preview judge smoke fixture(s): ${missingIds.join(", ")}`);
  }

  return fixtureIds.map((id) => fixtureById.get(id)!);
}

export async function runFixtureJudgeSmoke(options: {
  fixtures: JudgeSmokeFixture[];
  judge: FixtureJudge;
  runsPerFixture: number;
  model: string;
  generatedAt?: string;
}): Promise<JudgeSmokeReport> {
  const runsPerFixture = Math.max(1, Math.floor(options.runsPerFixture));
  const runs: JudgeSmokeRun[] = [];

  for (const fixture of options.fixtures) {
    const expectation = getJudgeExpectation(fixture);
    const expectedErrorModes = expectation?.expectedErrorModes ?? [];
    const prompt = buildFixtureJudgePrompt(fixture);

    for (let index = 1; index <= runsPerFixture; index++) {
      const rawResponse = await options.judge({ fixture, prompt, runIndex: index });
      const parsed = parseJudgeVerdict(rawResponse);
      const actualModes = parsed.verdict ? uniqueSorted(parsed.verdict.errorModes) : [];
      const expectedModes = uniqueSorted(expectedErrorModes);

      runs.push({
        fixtureId: fixture.id,
        runIndex: index,
        valid: Boolean(parsed.verdict),
        verdict: parsed.verdict,
        rawResponse,
        parseError: parsed.error,
        expectedPassed: expectation?.expectedPassed,
        expectedErrorModes: expectedModes,
        missingExpectedErrorModes: expectedModes.filter((mode) => !actualModes.includes(mode)),
        unexpectedErrorModes: actualModes.filter((mode) => !expectedModes.includes(mode)),
      });
    }
  }

  const validRuns = runs.filter((run) => run.valid);
  const expectedPassComparable = validRuns.filter((run) => typeof run.expectedPassed === "boolean");
  const expectedModeComparable = validRuns.filter((run) => run.expectedErrorModes.length > 0);

  return {
    surface: "live_cooking_step_previews",
    calibrationStatus: "uncalibrated",
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    model: options.model,
    runsPerFixture,
    fixtures: options.fixtures.map((fixture) => {
      const expectation = getJudgeExpectation(fixture);
      return {
        id: fixture.id,
        expectedPassed: expectation?.expectedPassed,
        expectedErrorModes: expectation?.expectedErrorModes ?? [],
        notes: expectation?.notes,
      };
    }),
    runs,
    summary: {
      fixtures: options.fixtures.length,
      totalRuns: runs.length,
      validResponses: validRuns.length,
      invalidResponses: runs.length - validRuns.length,
      expectedPassMatches: expectedPassComparable.filter((run) => run.verdict?.passed === run.expectedPassed).length,
      expectedErrorModeMatches: expectedModeComparable.filter((run) =>
        run.missingExpectedErrorModes.length === 0 && run.unexpectedErrorModes.length === 0,
      ).length,
    },
  };
}

function listForReport(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "-";
}

export function formatJudgeSmokeMarkdownReport(report: JudgeSmokeReport): string {
  const lines = [
    `# Live Cooking Step Preview Judge Smoke - ${report.generatedAt}`,
    "",
    "**Calibration status:** uncalibrated. This report is judge-behavior smoke evidence only; it is not product-quality truth until Wilson labels and TPR/TNR exist.",
    "",
    "## Summary",
    "",
    `- Surface: \`${report.surface}\``,
    `- Model: \`${report.model}\``,
    `- Fixtures: ${report.summary.fixtures}`,
    `- Runs per fixture: ${report.runsPerFixture}`,
    `- Total runs: ${report.summary.totalRuns}`,
    `- Valid JSON verdicts: ${report.summary.validResponses}`,
    `- Invalid verdicts: ${report.summary.invalidResponses}`,
    `- Expected pass/fail matches: ${report.summary.expectedPassMatches}`,
    `- Expected error-mode exact matches: ${report.summary.expectedErrorModeMatches}`,
    "",
    "## Fixture Expectations",
    "",
    "| Fixture | Expected passed | Expected error modes | Notes |",
    "|---|---:|---|---|",
    ...report.fixtures.map((fixture) =>
      `| \`${fixture.id}\` | ${typeof fixture.expectedPassed === "boolean" ? String(fixture.expectedPassed) : "-"} | ${listForReport(fixture.expectedErrorModes)} | ${fixture.notes ?? "-"} |`,
    ),
    "",
    "## Runs",
    "",
    "| Fixture | Run | Valid | Passed | Score | Error modes | Missing expected | Unexpected | Reasoning / parse error |",
    "|---|---:|---:|---:|---:|---|---|---|---|",
    ...report.runs.map((run) =>
      `| \`${run.fixtureId}\` | ${run.runIndex} | ${String(run.valid)} | ${run.verdict ? String(run.verdict.passed) : "-"} | ${run.verdict?.score ?? "-"} | ${listForReport(run.verdict?.errorModes ?? [])} | ${listForReport(run.missingExpectedErrorModes)} | ${listForReport(run.unexpectedErrorModes)} | ${(run.verdict?.reasoning ?? run.parseError ?? "").replace(/\|/g, "\\|")} |`,
    ),
    "",
  ];

  return `${lines.join("\n")}\n`;
}

export async function writeJudgeSmokeReport(filePath: string, report: JudgeSmokeReport): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, formatJudgeSmokeMarkdownReport(report));
}
