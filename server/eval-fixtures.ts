import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import {
  cookingStepsResponseSchema,
  recipeSuggestionsResponseSchema,
  slopBowlResponseSchema,
} from "./ai-response-schemas";
import { evalFeatureTypeSchema, type EvalFeatureType } from "./ai-feature-types";

export const PUBLIC_EVAL_FIXTURE_DIR = path.resolve(process.cwd(), "docs/evals/fixtures");

const fixtureIdSchema = z.string().regex(/^[a-z0-9][a-z0-9-]*$/);
const labelValueSchema = z.enum([
  "pass",
  "fail",
  "not_applicable",
  "pending",
  "blocked_on_product_rule",
]);
const criterionLabelSchema = z.enum([
  "structure_contract",
  "suggestion_count",
  "max_time_adherence",
  "dietary_compliance",
  "pantry_grounding",
  "optional_ingredient_contract",
  "cuisine_fit",
  "inspired_or_fusion_labeling",
  "recipe_usefulness",
  "food_safety",
  "skill_fit",
  "equipment_fit",
  "cooking_step_sequence",
]);
type CriterionLabel = z.infer<typeof criterionLabelSchema>;
const criterionCheckIds = new Set<string>(criterionLabelSchema.options);

export const evalFixtureSchema = z.object({
  id: fixtureIdSchema,
  surface: evalFeatureTypeSchema,
  privacyClass: z.enum(["synthetic", "redacted", "raw_private"]),
  roles: z.array(z.enum(["regression", "calibration-probe", "positive-guard"])).default([]),
  sourceRefs: z.array(fixtureIdSchema).default([]),
  derivedFrom: fixtureIdSchema.optional(),
  request: z.record(z.unknown()),
  constraints: z.object({
    maxTimeMinutes: z.number().int().nonnegative().nullable().optional(),
    cuisines: z.array(z.string()).optional(),
    skill: z.string().optional(),
    dietaryRestrictions: z.array(z.string()).optional(),
    equipment: z.array(z.string()).optional(),
  }).passthrough().default({}),
  output: z.string().optional(),
  outputProvenance: z.object({
    kind: z.enum(["captured", "synthetic", "redacted", "authored-regression"]),
    model: z.string().optional(),
    promptVersion: z.string().optional(),
    capturedAt: z.string().optional(),
  }).passthrough().optional(),
  labels: z.record(criterionLabelSchema, labelValueSchema).default({}),
  labelProvenance: z.object({
    labeledBy: z.string().optional(),
    labeledAt: z.string().optional(),
  }).passthrough().optional(),
  notes: z.string().optional(),
}).passthrough();

export type EvalFixture = z.infer<typeof evalFixtureSchema>;

export type EvalFixtureCheck = {
  id: string;
  status: "pass" | "fail" | "not_applicable";
  message: string;
};

export type EvalFixtureValidation = {
  fixture?: EvalFixture;
  checks: EvalFixtureCheck[];
  passed: boolean;
};

function check(id: string, status: EvalFixtureCheck["status"], message: string): EvalFixtureCheck {
  return { id, status, message };
}

function parseOutputJson(fixture: EvalFixture): { value?: unknown; error?: string } {
  if (!fixture.output) {
    return { error: "Fixture has no output string." };
  }

  try {
    return { value: JSON.parse(fixture.output) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Invalid JSON output." };
  }
}

function hasResolvedLabel(fixture: EvalFixture): boolean {
  return Object.values(fixture.labels).some((label) => label !== "pending");
}

function labelMatchesCheck(label: string | undefined, status: EvalFixtureCheck["status"]): boolean {
  if (!label || label === "pending" || label === "blocked_on_product_rule") {
    return true;
  }
  return label === status;
}

function checkLabelExpectations(fixture: EvalFixture, checks: EvalFixtureCheck[]): EvalFixtureCheck {
  const mismatches = checks
    .filter((item) => criterionCheckIds.has(item.id))
    .filter((item) => !labelMatchesCheck(fixture.labels[item.id as CriterionLabel], item.status));

  return mismatches.length === 0
    ? check("label_expectations", "pass", "Resolved deterministic labels match observed fixture checks.")
    : check(
      "label_expectations",
      "fail",
      `Resolved labels do not match observed checks: ${mismatches
        .map((item) => `${item.id} labeled ${fixture.labels[item.id as CriterionLabel]} but observed ${item.status}`)
        .join("; ")}`,
    );
}

function collectPrivacyLeaks(value: unknown, pathParts: string[] = []): string[] {
  const pathLabel = pathParts.join(".") || "$";
  const leaks: string[] = [];

  if (Array.isArray(value)) {
    value.forEach((item, index) => leaks.push(...collectPrivacyLeaks(item, [...pathParts, String(index)])));
    return leaks;
  }

  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (/^(authUserId|firebaseUid|requestId|request_id|user_id|email|authorization|token|cookie|session)$/i.test(key)) {
        leaks.push(`${pathLabel}.${key}`);
      }
      leaks.push(...collectPrivacyLeaks(nested, [...pathParts, key]));
    }
    return leaks;
  }

  if (typeof value !== "string") {
    return leaks;
  }

  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(value)) {
    leaks.push(`${pathLabel}:email`);
  }
  if (/(?:sk-[A-Za-z0-9_-]{16,}|AIza[0-9A-Za-z_-]{20,}|Bearer\s+[A-Za-z0-9._-]+)/.test(value)) {
    leaks.push(`${pathLabel}:secret-like-token`);
  }

  return leaks;
}

function validateRecipeSurface(fixture: EvalFixture): EvalFixtureCheck[] {
  const parsed = parseOutputJson(fixture);
  if (parsed.error) {
    return [
      check("structure_contract", "fail", parsed.error),
      check("suggestion_count", "not_applicable", "Suggestion count cannot be checked without valid JSON."),
      check("max_time_adherence", "not_applicable", "Max-time check requires valid recipe suggestions."),
    ];
  }

  const schemaResult = recipeSuggestionsResponseSchema.safeParse(parsed.value);
  if (!schemaResult.success) {
    return [
      check("structure_contract", "fail", schemaResult.error.issues[0]?.message ?? "Invalid recipe suggestion shape."),
      check("suggestion_count", "fail", "Recipe suggestion fixtures must contain exactly three recipes."),
      check("max_time_adherence", "not_applicable", "Max-time check requires valid recipe suggestions."),
    ];
  }

  const checks = [
    check("structure_contract", "pass", "Recipe suggestion output matches the current recipes[] contract."),
    check("suggestion_count", "pass", "Recipe suggestion output contains exactly three recipes."),
  ];

  const maxTimeMinutes = fixture.constraints.maxTimeMinutes;
  if (typeof maxTimeMinutes !== "number") {
    checks.push(check("max_time_adherence", "not_applicable", "Fixture has no bounded max-time constraint."));
    return checks;
  }

  const allowedMinutes = maxTimeMinutes + 15;
  const slowRecipes = schemaResult.data.recipes.filter((recipe) => recipe.cookTime > allowedMinutes);
  checks.push(
    slowRecipes.length === 0
      ? check("max_time_adherence", "pass", `All recipe cook times are <= ${allowedMinutes} minutes.`)
      : check("max_time_adherence", "fail", `${slowRecipes.length} recipe(s) exceed ${allowedMinutes} minutes.`),
  );

  return checks;
}

function validateSlopBowlSurface(fixture: EvalFixture): EvalFixtureCheck[] {
  const parsed = parseOutputJson(fixture);
  if (parsed.error) {
    return [check("structure_contract", "fail", parsed.error)];
  }

  const schemaResult = slopBowlResponseSchema.safeParse(parsed.value);
  return [
    schemaResult.success
      ? check("structure_contract", "pass", "Slop Bowl output matches the { recipe } contract.")
      : check("structure_contract", "fail", schemaResult.error.issues[0]?.message ?? "Invalid Slop Bowl shape."),
  ];
}

function validateCookingStepsSurface(fixture: EvalFixture): EvalFixtureCheck[] {
  const parsed = parseOutputJson(fixture);
  if (parsed.error) {
    return [check("structure_contract", "fail", parsed.error)];
  }

  const schemaResult = cookingStepsResponseSchema.safeParse(parsed.value);
  return [
    schemaResult.success
      ? check("structure_contract", "pass", "Cooking-steps output includes recipe context and at least one step.")
      : check("structure_contract", "fail", schemaResult.error.issues[0]?.message ?? "Invalid cooking-steps shape."),
  ];
}

function validateSurfaceContract(fixture: EvalFixture): EvalFixtureCheck[] {
  if (!fixture.output) {
    return [check("structure_contract", hasResolvedLabel(fixture) ? "fail" : "not_applicable", "Fixture has no output yet.")];
  }

  switch (fixture.surface) {
    case "recipe_suggestions":
    case "pantry_recipes":
      return validateRecipeSurface(fixture);
    case "slop_bowl":
      return validateSlopBowlSurface(fixture);
    case "cooking_steps":
      return validateCookingStepsSurface(fixture);
    case "cooking_assistance":
      return [check("structure_contract", "not_applicable", "Cooking assistance is infrastructure-only for V1 reporting.")];
    default:
      return [check("structure_contract", "fail", `Unsupported eval surface: ${fixture.surface satisfies never}`)];
  }
}

export function validateEvalFixture(input: unknown, options: { publicArtifact?: boolean } = {}): EvalFixtureValidation {
  const publicArtifact = options.publicArtifact ?? true;
  const parsed = evalFixtureSchema.safeParse(input);
  if (!parsed.success) {
    return {
      checks: [check("fixture_schema", "fail", parsed.error.issues[0]?.message ?? "Invalid fixture schema.")],
      passed: false,
    };
  }

  const fixture = parsed.data;
  const checks: EvalFixtureCheck[] = [check("fixture_schema", "pass", "Fixture metadata matches the canonical schema.")];

  if (publicArtifact && fixture.privacyClass === "raw_private") {
    checks.push(check("privacy_class", "fail", "Public fixtures cannot use privacyClass raw_private."));
  } else {
    checks.push(check("privacy_class", "pass", "Fixture privacy class is allowed in this context."));
  }

  if (hasResolvedLabel(fixture) && !fixture.output) {
    checks.push(check("labeled_output_required", "fail", "Any non-pending label requires the exact output string."));
  } else {
    checks.push(check("labeled_output_required", "pass", "Output presence is consistent with label state."));
  }

  const leaks = collectPrivacyLeaks(fixture);
  checks.push(
    leaks.length === 0
      ? check("privacy_scan", "pass", "No obvious public-fixture privacy leaks found.")
      : check("privacy_scan", "fail", `Potential private identifiers or secrets found at: ${leaks.join(", ")}`),
  );

  const surfaceChecks = validateSurfaceContract(fixture);
  checks.push(...surfaceChecks);
  checks.push(checkLabelExpectations(fixture, surfaceChecks));

  return {
    fixture,
    checks,
    passed: checks.every((item) => item.status !== "fail"),
  };
}

function isExpectedCriterionFailure(validation: EvalFixtureValidation, item: EvalFixtureCheck): boolean {
  return Boolean(
    validation.fixture
      && item.status === "fail"
      && criterionCheckIds.has(item.id)
      && validation.fixture.labels[item.id as CriterionLabel] === "fail",
  );
}

export function isEvalFixtureArtifactValid(
  validation: EvalFixtureValidation,
): validation is EvalFixtureValidation & { fixture: EvalFixture } {
  return Boolean(
    validation.fixture
      && validation.checks.every((item) => item.status !== "fail" || isExpectedCriterionFailure(validation, item)),
  );
}

async function readJsonFile(filePath: string): Promise<unknown> {
  const text = await fs.readFile(filePath, "utf8");
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${filePath} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function loadPublicEvalFixtures(fixtureDir = PUBLIC_EVAL_FIXTURE_DIR): Promise<EvalFixture[]> {
  let entries;
  try {
    entries = await fs.readdir(fixtureDir, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const fixtures: EvalFixture[] = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) {
      continue;
    }

    const filePath = path.join(fixtureDir, entry.name);
    const candidate = await readJsonFile(filePath);
    const validation = validateEvalFixture(candidate, { publicArtifact: true });
    if (!isEvalFixtureArtifactValid(validation)) {
      const failures = validation.checks
        .filter((item) => item.status === "fail" && !isExpectedCriterionFailure(validation, item))
        .map((item) => `${item.id}: ${item.message}`)
        .join("; ");
      throw new Error(`${filePath} failed eval fixture validation: ${failures}`);
    }
    fixtures.push(validation.fixture);
  }

  return fixtures.sort((a, b) => a.id.localeCompare(b.id));
}

export function listEvalFeatureTypesForFixtures(): EvalFeatureType[] {
  return [...evalFeatureTypeSchema.options];
}
