import path from "node:path";
import {
  loadPublicEvalFixtures,
  PUBLIC_EVAL_FIXTURE_DIR,
} from "../server/eval-fixtures";

const fixtureDirLabel = path.relative(process.cwd(), PUBLIC_EVAL_FIXTURE_DIR);

try {
  const fixtures = await loadPublicEvalFixtures();

  if (fixtures.length === 0) {
    throw new Error(`No public eval fixtures found in ${fixtureDirLabel}.`);
  }

  const surfaceCounts = fixtures.reduce<Record<string, number>>((counts, fixture) => {
    counts[fixture.surface] = (counts[fixture.surface] ?? 0) + 1;
    return counts;
  }, {});
  const surfaceSummary = Object.entries(surfaceCounts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([surface, count]) => `${surface}=${count}`)
    .join(", ");
  const fixturesWithFailLabels = fixtures.filter((fixture) =>
    Object.values(fixture.labels).some((label) => label === "fail"),
  );

  console.log(`Validated ${fixtures.length} public eval fixture(s) in ${fixtureDirLabel}.`);
  console.log(`Surfaces: ${surfaceSummary}`);
  console.log(`Fixtures with resolved fail labels: ${fixturesWithFailLabels.length}`);
  console.log(`Fixture ids: ${fixtures.map((fixture) => fixture.id).join(", ")}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
