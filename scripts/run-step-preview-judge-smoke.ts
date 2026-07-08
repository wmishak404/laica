import OpenAI from "openai";
import {
  formatJudgeSmokeMarkdownReport,
  loadStepPreviewJudgeSmokeFixtures,
  runFixtureJudgeSmoke,
  writeJudgeSmokeReport,
} from "../server/eval-judge-smoke";

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function readRepeatedArg(name: string): string[] {
  const values: string[] = [];
  for (let index = 0; index < process.argv.length; index++) {
    if (process.argv[index] === name && process.argv[index + 1]) {
      values.push(process.argv[index + 1]);
    }
  }
  return values;
}

const runsPerFixture = Number.parseInt(readArg("--runs") ?? "3", 10);
const model = readArg("--model") ?? process.env.LAICA_EVAL_JUDGE_MODEL ?? "o4-mini";
const outputPath = readArg("--out");
const fixtureIds = readRepeatedArg("--fixture");

if (!Number.isFinite(runsPerFixture) || runsPerFixture < 1 || runsPerFixture > 10) {
  throw new Error("--runs must be an integer from 1 to 10.");
}

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required. Run through `npm run env:run -- npm run eval:step-preview-judge-smoke -- --runs 3` when using encrypted local secrets.");
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const fixtures = await loadStepPreviewJudgeSmokeFixtures(fixtureIds.length > 0 ? fixtureIds : undefined);
const report = await runFixtureJudgeSmoke({
  fixtures,
  runsPerFixture,
  model,
  judge: async ({ prompt }) => {
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 600,
    });
    return response.choices[0]?.message?.content ?? "";
  },
});

if (outputPath) {
  await writeJudgeSmokeReport(outputPath, report);
  console.log(`Wrote Live Cooking step-preview judge smoke report to ${outputPath}`);
} else {
  console.log(formatJudgeSmokeMarkdownReport(report));
}
