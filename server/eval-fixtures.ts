import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import {
  cookingStepsResponseSchema,
  recipeSuggestionsResponseSchema,
  slopBowlResponseSchema,
} from "./ai-response-schemas";
import {
  evalFeatureTypeSchema,
  LEGACY_EVAL_FEATURE_TYPES,
  normalizeEvalFeatureType,
  type EvalFeatureType,
} from "./ai-feature-types";
import { checkDishIdentity, formatDishIdentityViolations } from "./eval-dish-identity";

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
  "dish_identity",
  "cuisine_fit",
  "inspired_or_fusion_labeling",
  "recipe_usefulness",
  "food_safety",
  "skill_fit",
  "equipment_fit",
  "cooking_step_sequence",
  "step_preview_word_count",
  "step_preview_measurement_free",
  "step_preview_distinctness",
  "step_preview_plain_english",
  "step_preview_milestone_fit",
  "step_preview_provider_label_quality",
  "step_preview_rendered_label_quality",
]);
type CriterionLabel = z.infer<typeof criterionLabelSchema>;
const criterionCheckIds = new Set<string>(criterionLabelSchema.options);
const legacyEvalFeatureTypeSchema = z.enum(LEGACY_EVAL_FEATURE_TYPES);
const evalFixtureSurfaceSchema = z
  .union([evalFeatureTypeSchema, legacyEvalFeatureTypeSchema])
  .transform((surface) => normalizeEvalFeatureType(surface) ?? (surface as EvalFeatureType));

export const evalFixtureSchema = z.object({
  id: fixtureIdSchema,
  surface: evalFixtureSurfaceSchema,
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

const stepPreviewRenderingConstraintsSchema = z.object({
  maxWords: z.number().int().positive().default(5),
  maxCharacters: z.number().int().positive().optional(),
  preferredMaxWords: z.number().int().positive().optional(),
}).passthrough().default({ maxWords: 5 });

const liveCookingStepPreviewOutputSchema = z.object({
  recipe: z.object({
    recipeName: z.string().min(1),
    description: z.string().optional(),
    ingredients: z.array(z.string()).optional(),
  }).passthrough(),
  renderingConstraints: stepPreviewRenderingConstraintsSchema,
  siblingLabelsBeforeRendering: z.array(z.string()).min(1),
  siblingLabelsAfterRendering: z.array(z.string()).min(1),
  previews: z.array(z.object({
    stepIndex: z.number().int().nonnegative(),
    instruction: z.string().min(1),
    providerActionLabel: z.string().nullable().optional(),
    clientNormalizedProviderLabel: z.string().nullable().optional(),
    clientFallbackLabel: z.string().nullable().optional(),
    renderedPreviewLabel: z.string().min(1),
  }).passthrough()).min(1),
}).passthrough();

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

function labelWordCount(label: string): number {
  return label.trim().split(/\s+/).filter(Boolean).length;
}

function normalizeLabelForComparison(label: string): string {
  return label.trim().replace(/\s+/g, " ").toLowerCase();
}

function containsMeasurementOrQuantity(label: string): boolean {
  return /(?:\d|[¼½¾⅓⅔⅛⅜⅝⅞]|\b(?:cups?|tablespoons?|tbsp|teaspoons?|tsp|ounces?|oz|grams?|kilograms?|kg|pounds?|lbs?|milliliters?|ml|liters?|quarts?|qt|pints?|pt)\b)/i.test(label);
}

function validateRecipeSurface(fixture: EvalFixture): EvalFixtureCheck[] {
  const parsed = parseOutputJson(fixture);
  if (parsed.error) {
    return [
      check("structure_contract", "fail", parsed.error),
      check("suggestion_count", "not_applicable", "Suggestion count cannot be checked without valid JSON."),
      check("max_time_adherence", "not_applicable", "Max-time check requires valid recipe suggestions."),
      check("dish_identity", "not_applicable", "Dish-identity check requires valid recipe suggestions."),
    ];
  }

  const schemaResult = recipeSuggestionsResponseSchema.safeParse(parsed.value);
  if (!schemaResult.success) {
    return [
      check("structure_contract", "fail", schemaResult.error.issues[0]?.message ?? "Invalid recipe suggestion shape."),
      check("suggestion_count", "fail", "Recipe suggestion fixtures must contain exactly three recipes."),
      check("max_time_adherence", "not_applicable", "Max-time check requires valid recipe suggestions."),
      check("dish_identity", "not_applicable", "Dish-identity check requires valid recipe suggestions."),
    ];
  }

  const checks = [
    check("structure_contract", "pass", "Recipe suggestion output matches the current recipes[] contract."),
    check("suggestion_count", "pass", "Recipe suggestion output contains exactly three recipes."),
  ];

  const maxTimeMinutes = fixture.constraints.maxTimeMinutes;
  if (typeof maxTimeMinutes !== "number") {
    checks.push(check("max_time_adherence", "not_applicable", "Fixture has no bounded max-time constraint."));
  } else {
    const allowedMinutes = maxTimeMinutes + 15;
    const slowRecipes = schemaResult.data.recipes.filter((recipe) => recipe.cookTime > allowedMinutes);
    checks.push(
      slowRecipes.length === 0
        ? check("max_time_adherence", "pass", `All recipe cook times are <= ${allowedMinutes} minutes.`)
        : check("max_time_adherence", "fail", `${slowRecipes.length} recipe(s) exceed ${allowedMinutes} minutes.`),
    );
  }

  checks.push(dishIdentityCheck(schemaResult.data.recipes));

  return checks;
}

function dishIdentityCheck(recipes: Array<Record<string, unknown>>): EvalFixtureCheck {
  const violations = checkDishIdentity(recipes);
  return violations.length === 0
    ? check("dish_identity", "pass", "Every dish name is satisfied by pantryIngredientsUsed defining ingredients.")
    : check("dish_identity", "fail", `Dish-name identity violations: ${formatDishIdentityViolations(violations)}.`);
}

function validateSlopBowlSurface(fixture: EvalFixture): EvalFixtureCheck[] {
  const parsed = parseOutputJson(fixture);
  if (parsed.error) {
    return [check("structure_contract", "fail", parsed.error)];
  }

  const schemaResult = slopBowlResponseSchema.safeParse(parsed.value);
  if (!schemaResult.success) {
    return [check("structure_contract", "fail", schemaResult.error.issues[0]?.message ?? "Invalid Slop Bowl shape.")];
  }

  return [
    check("structure_contract", "pass", "Slop Bowl output matches the { recipe } contract."),
    dishIdentityCheck([schemaResult.data.recipe]),
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

function validateLiveCookingStepPreviewSurface(fixture: EvalFixture): EvalFixtureCheck[] {
  const parsed = parseOutputJson(fixture);
  if (parsed.error) {
    return [
      check("structure_contract", "fail", parsed.error),
      check("step_preview_word_count", "not_applicable", "Step-preview checks require valid JSON."),
      check("step_preview_measurement_free", "not_applicable", "Step-preview checks require valid JSON."),
      check("step_preview_distinctness", "not_applicable", "Step-preview checks require valid JSON."),
    ];
  }

  const schemaResult = liveCookingStepPreviewOutputSchema.safeParse(parsed.value);
  if (!schemaResult.success) {
    return [
      check("structure_contract", "fail", schemaResult.error.issues[0]?.message ?? "Invalid Live Cooking step-preview shape."),
      check("step_preview_word_count", "not_applicable", "Step-preview checks require a valid preview output shape."),
      check("step_preview_measurement_free", "not_applicable", "Step-preview checks require a valid preview output shape."),
      check("step_preview_distinctness", "not_applicable", "Step-preview checks require a valid preview output shape."),
    ];
  }

  const output = schemaResult.data;
  const renderedLabels = output.previews.map((preview) => preview.renderedPreviewLabel);
  const structureIssues: string[] = [];
  if (output.siblingLabelsAfterRendering.length !== output.previews.length) {
    structureIssues.push("siblingLabelsAfterRendering must include one label per preview");
  }
  if (output.siblingLabelsBeforeRendering.length !== output.previews.length) {
    structureIssues.push("siblingLabelsBeforeRendering must include one label per preview");
  }
  if (
    output.siblingLabelsAfterRendering.length === output.previews.length
    && output.siblingLabelsAfterRendering.some((label, index) => label !== renderedLabels[index])
  ) {
    structureIssues.push("siblingLabelsAfterRendering must match the final rendered preview labels in preview order");
  }

  if (structureIssues.length > 0) {
    return [
      check("structure_contract", "fail", structureIssues.join("; ")),
      check("step_preview_word_count", "not_applicable", "Step-preview checks require aligned sibling label lists."),
      check("step_preview_measurement_free", "not_applicable", "Step-preview checks require aligned sibling label lists."),
      check("step_preview_distinctness", "not_applicable", "Step-preview checks require aligned sibling label lists."),
    ];
  }

  const maxWords = output.renderingConstraints.maxWords;
  const maxCharacters = output.renderingConstraints.maxCharacters;
  const overWordLimit = renderedLabels.filter((label) => labelWordCount(label) > maxWords);
  const overCharacterLimit = typeof maxCharacters === "number"
    ? renderedLabels.filter((label) => label.length > maxCharacters)
    : [];
  const labelsWithMeasurements = renderedLabels.filter(containsMeasurementOrQuantity);
  const normalizedLabels = renderedLabels.map(normalizeLabelForComparison);
  const duplicateLabels = Array.from(new Set(
    normalizedLabels.filter((label, index) => normalizedLabels.indexOf(label) !== index),
  ));

  return [
    check("structure_contract", "pass", "Live Cooking step-preview output captures recipe context, source labels, rendered labels, sibling label lists, and card constraints."),
    overWordLimit.length === 0 && overCharacterLimit.length === 0
      ? check("step_preview_word_count", "pass", `All rendered preview labels fit the ${maxWords}-word${maxCharacters ? ` and ${maxCharacters}-character` : ""} limit.`)
      : check(
        "step_preview_word_count",
        "fail",
        [
          overWordLimit.length > 0 ? `${overWordLimit.length} label(s) exceed ${maxWords} words` : null,
          overCharacterLimit.length > 0 ? `${overCharacterLimit.length} label(s) exceed ${maxCharacters} characters` : null,
        ].filter(Boolean).join("; "),
      ),
    labelsWithMeasurements.length === 0
      ? check("step_preview_measurement_free", "pass", "Rendered preview labels avoid quantities and measurements.")
      : check("step_preview_measurement_free", "fail", `Rendered preview labels include quantities or measurements: ${labelsWithMeasurements.join(", ")}`),
    duplicateLabels.length === 0
      ? check("step_preview_distinctness", "pass", "Rendered sibling preview labels are distinct.")
      : check("step_preview_distinctness", "fail", `Rendered sibling preview labels repeat: ${duplicateLabels.join(", ")}`),
  ];
}

function validateSurfaceContract(fixture: EvalFixture): EvalFixtureCheck[] {
  if (!fixture.output) {
    return [check("structure_contract", hasResolvedLabel(fixture) ? "fail" : "not_applicable", "Fixture has no output yet.")];
  }

  switch (fixture.surface) {
    case "recipe_suggestions":
    case "chef_it_up_suggestions":
      return validateRecipeSurface(fixture);
    case "slop_bowl_suggestions":
      return validateSlopBowlSurface(fixture);
    case "cooking_steps":
      return validateCookingStepsSurface(fixture);
    case "live_cooking_step_previews":
      return validateLiveCookingStepPreviewSurface(fixture);
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
