// Dish-identity live prompt probe for the recipe-suggestions prompt path.
//
// Drives real gpt-4.1 calls with the request payloads of the committed public
// dish-identity fixtures, then scores outputs with the shared deterministic
// dish-name identity rules. Calls OpenAI directly and never writes eval rows,
// so runs stay out of ai_interactions.
//
//   npm run env:run -- npm run eval:dish-identity            # working-tree prompt
//   ARM=both RUNS=4 npm run env:run -- npm run eval:dish-identity
//   ARM=baseline BASE_REF=origin/main npm run env:run -- npm run eval:dish-identity
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";
import OpenAI from "openai";
import { checkDishIdentity, type DishIdentityViolation } from "../server/eval-dish-identity";
import { loadPublicEvalFixtures } from "../server/eval-fixtures";
import { normalizeRecipeSuggestionsResponse } from "../server/recipe-suggestion-normalizer";
import { recipeSuggestionsResponseSchema } from "../server/ai-response-schemas";

const MODEL = "gpt-4.1"; // matches MODEL_COMPLEX in server/openai.ts
const RUNS = Number(process.env.RUNS ?? 4);
const ARM = process.env.ARM ?? "candidate";
const BASE_REF = process.env.BASE_REF ?? "origin/main";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

type PromptArm = { name: string; systemPrompt: string; reinforcement: string };

function extractPromptArm(name: string, source: string): PromptArm {
  const startMarker = "DEFAULT_RECIPE_SUGGESTIONS_PROMPT = `";
  const start = source.indexOf(startMarker);
  if (start === -1) throw new Error(`${name}: recipe suggestions prompt marker not found`);
  const bodyStart = start + startMarker.length;
  const end = source.indexOf("`;", bodyStart);
  if (end === -1) throw new Error(`${name}: recipe suggestions prompt terminator not found`);

  const reinforcementMatch = source.match(/Please suggest 3 meal ideas I can make primarily with what I already have\.\s*\n\s*([^`]+)`/);
  if (!reinforcementMatch) throw new Error(`${name}: user-message reinforcement line not found`);

  return {
    name,
    systemPrompt: source.slice(bodyStart, end),
    reinforcement: reinforcementMatch[1].trim(),
  };
}

async function loadArms(): Promise<PromptArm[]> {
  const arms: PromptArm[] = [];
  if (ARM === "baseline" || ARM === "both") {
    const source = execFileSync("git", ["show", `${BASE_REF}:server/openai.ts`], { encoding: "utf8" });
    arms.push(extractPromptArm(`baseline(${BASE_REF})`, source));
  }
  if (ARM === "candidate" || ARM === "both") {
    arms.push(extractPromptArm("candidate(working-tree)", await fs.readFile("server/openai.ts", "utf8")));
  }
  if (arms.length === 0) throw new Error(`Unknown ARM "${ARM}"; use candidate, baseline, or both.`);
  return arms;
}

type Scenario = { id: string; ingredients: string[]; preferences: string };

async function loadScenarios(): Promise<Scenario[]> {
  const fixtures = await loadPublicEvalFixtures();
  const scenarios: Scenario[] = [];
  const seen = new Set<string>();

  for (const fixture of fixtures) {
    if (fixture.surface !== "chef_it_up_suggestions" && fixture.surface !== "recipe_suggestions") continue;
    if (!fixture.labels.dish_identity) continue;
    const ingredients = Array.isArray(fixture.request.ingredients)
      ? (fixture.request.ingredients as unknown[]).filter((item): item is string => typeof item === "string")
      : [];
    const preferences = typeof fixture.request.preferences === "string" ? fixture.request.preferences : "";
    if (ingredients.length === 0 || !preferences) continue;

    const key = `${ingredients.join("|")}::${preferences}`;
    if (seen.has(key)) continue;
    seen.add(key);
    scenarios.push({ id: fixture.id, ingredients, preferences });
  }

  if (scenarios.length === 0) throw new Error("No dish-identity fixtures with usable request payloads found.");
  return scenarios;
}

async function generateOnce(arm: PromptArm, scenario: Scenario, attempt = 1): Promise<{ recipes: Array<Record<string, unknown>>; shapeOk: boolean; shapeIssue?: string; error?: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: arm.systemPrompt },
        {
          role: "user",
          content: `I have these ingredients in my pantry: ${scenario.ingredients.join(", ")}.
          My preferences: ${scenario.preferences}.
          Please suggest 3 meal ideas I can make primarily with what I already have.
          ${arm.reinforcement}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const normalized = normalizeRecipeSuggestionsResponse(JSON.parse(response.choices[0].message.content || "{}"));
    const parsed = recipeSuggestionsResponseSchema.safeParse(normalized);
    const recipes = parsed.success
      ? parsed.data.recipes
      : Array.isArray((normalized as { recipes?: unknown }).recipes)
        ? ((normalized as { recipes: Array<Record<string, unknown>> }).recipes)
        : [];
    const firstIssue = parsed.success ? undefined : parsed.error.issues[0];
    return {
      recipes,
      shapeOk: parsed.success,
      shapeIssue: firstIssue ? `${firstIssue.path.join(".") || "$"}: ${firstIssue.message}` : undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (attempt === 1 && message.includes("429")) {
      await sleep(20_000);
      return generateOnce(arm, scenario, attempt + 1);
    }
    return { recipes: [], shapeOk: false, error: message };
  }
}

async function main() {
  const arms = await loadArms();
  const scenarios = await loadScenarios();
  console.log(`Dish-identity probe: ${arms.map((arm) => arm.name).join(" vs ")} | model=${MODEL} | runs/scenario=${RUNS}`);
  console.log(`Scenarios (${scenarios.length}, from public dish-identity fixtures): ${scenarios.map((scenario) => scenario.id).join(", ")}`);

  const summary: Record<string, { recipes: number; violatingRecipes: number; ruleHits: number; definerListedAsOptional: number; shapeFailures: number; errors: number }> = {};

  for (const arm of arms) {
    const totals = { recipes: 0, violatingRecipes: 0, ruleHits: 0, definerListedAsOptional: 0, shapeFailures: 0, errors: 0 };

    for (const scenario of scenarios) {
      const names: string[] = [];
      const violations: DishIdentityViolation[] = [];
      let violatingRecipes = 0;
      let shapeFailures = 0;
      let errors = 0;
      const shapeIssues = new Set<string>();

      for (let run = 0; run < RUNS; run++) {
        const result = await generateOnce(arm, scenario);
        if (result.error) errors += 1;
        if (!result.shapeOk && !result.error) {
          shapeFailures += 1;
          if (result.shapeIssue) shapeIssues.add(result.shapeIssue);
        }
        names.push(...result.recipes.map((recipe) => String(recipe.recipeName ?? "")));
        const runViolations = checkDishIdentity(result.recipes);
        violations.push(...runViolations);
        violatingRecipes += new Set(runViolations.map((violation) => violation.recipeName)).size;
      }

      totals.recipes += names.length;
      totals.violatingRecipes += violatingRecipes;
      totals.ruleHits += violations.length;
      totals.definerListedAsOptional += violations.filter((violation) => violation.definerListedAsOptional).length;
      totals.shapeFailures += shapeFailures;
      totals.errors += errors;

      console.log(`\n[${arm.name}] ${scenario.id} — ${names.length} recipes / ${RUNS} runs, ${violatingRecipes} violating recipes (${violations.length} rule hits), ${shapeFailures} shape failures, ${errors} errors`);
      console.log(`  names: ${names.join(" | ")}`);
      for (const violation of violations) {
        console.log(`  VIOLATION ${violation.ruleId}: "${violation.recipeName}"${violation.definerListedAsOptional ? " (defining ingredient listed as optional)" : ""}`);
      }
      if (shapeIssues.size > 0) {
        console.log(`  shape issues: ${[...shapeIssues].join(" | ")}`);
      }
    }

    summary[arm.name] = totals;
    console.log(`\n[${arm.name}] TOTAL: ${totals.violatingRecipes} violating recipes / ${totals.recipes} recipes (${totals.ruleHits} rule hits, ${totals.definerListedAsOptional} with the definer listed as optional), ${totals.shapeFailures} shape failures, ${totals.errors} errors`);
  }

  console.log(`\nRESULT_JSON ${JSON.stringify({ model: MODEL, runsPerScenario: RUNS, scenarios: scenarios.map((scenario) => scenario.id), summary })}`);
  process.exit(0);
}

main().catch((error) => {
  console.error("dish-identity probe failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
