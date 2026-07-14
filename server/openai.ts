import OpenAI from "openai";
import { compositions } from "./prompts/composer";
import { getActivePrompt, getActivePromptVersion } from "./prompt-manager";
import { normalizeVisionAnalysisResult } from "./vision/analysis-result";
import { filterDetectedEquipment } from "./vision/equipment-filter";
import { db } from "./db";
import { aiInteractions } from "@shared/schema";
import {
  normalizeAdditionalIngredientsNeeded,
  normalizeRecipeSuggestionsResponse,
} from "./recipe-suggestion-normalizer";
import {
  DEFAULT_PLANNING_TIME_VALUE,
  getPlanningTimeMinutes,
  getPlanningTimePrompt,
  normalizePlanningTimeValue,
  type PlanningTimeValue,
} from "@shared/planning";
import { normalizeCookingStepsResponse, slopBowlRecipeSchema } from "./ai-response-schemas";
import { lt } from "drizzle-orm";
import { redactAiOutput, redactForAiLog, sanitizePromptInput } from "./ai-privacy";
import { throwOpenAIProviderError } from "./ai-errors";
import type { EvalFeatureType } from "./ai-feature-types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });
const MODEL_COMPLEX = "gpt-4.1";
const MODEL_ASSISTANCE = "gpt-4.1-mini";
const MODEL_UTILITY = "gpt-4o-mini";

export interface SlopBowlRecentMeal {
  recipeName: string;
  cuisine: string;
  daysAgo: number;
  rating: number | null;
}

interface SlopBowlInput {
  ingredients: string[];
  cookingSkill: string;
  dietaryRestrictions: string[];
  kitchenEquipment: string[];
  recentMeals: SlopBowlRecentMeal[];
  planningTimeAvailable?: PlanningTimeValue;
  feedback?: string;
  previousRecipe?: string;
}

type RecipeSuggestionEvalFeature = Extract<EvalFeatureType, "recipe_suggestions" | "chef_it_up_suggestions">;

interface RecipeSuggestionOptions {
  evalFeatureType?: RecipeSuggestionEvalFeature;
}

interface InteractionLogOptions {
  promptVersionId?: number | null;
}

let lastAiInteractionPruneAt = 0;
const AI_INTERACTION_RETENTION_DAYS = 90;
const AI_INTERACTION_PRUNE_INTERVAL_MS = 24 * 60 * 60 * 1000;

function pruneOldAiInteractions(): void {
  const now = Date.now();
  if (now - lastAiInteractionPruneAt < AI_INTERACTION_PRUNE_INTERVAL_MS) {
    return;
  }

  lastAiInteractionPruneAt = now;
  const cutoff = new Date(now - AI_INTERACTION_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  db.delete(aiInteractions)
    .where(lt(aiInteractions.createdAt, cutoff))
    .catch(err => console.error("[eval-log] Failed to prune old interactions:", err));
}

// ─────────────────────────────────────────────────────────────────────────────
// Interaction logger — fire-and-forget, never blocks the user response.
// ─────────────────────────────────────────────────────────────────────────────
function logInteraction(
  featureType: EvalFeatureType,
  inputData: object,
  outputData: string,
  options: InteractionLogOptions = {},
): void {
  pruneOldAiInteractions();
  db.insert(aiInteractions)
    .values({
      featureType,
      inputData: redactForAiLog(inputData),
      outputData: redactAiOutput(outputData),
      promptVersionId: options.promptVersionId ?? null,
      evalStatus: 'pending',
    })
    .catch(err => console.error(`[eval-log] Failed to log ${featureType} interaction:`, err));
}

// ─────────────────────────────────────────────────────────────────────────────
// Default system prompts — used when no active DB version exists for a feature.
// These are the source of truth until an eval session produces an improved version.
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_RECIPE_SUGGESTIONS_PROMPT = `You are a pantry-first culinary expert that helps people use ingredients they already have at home.  You prioritize using what's in their kitchen rather than suggesting recipes that require many additional ingredients.

# Information

User will send you a list of 
  - Pantry ingredients
  - Current cuisine preference
  - Cooking proficiency (beginner, intermediate, expert)
  - Maximum time they have cooking
  - Dietary Restrictions
  - Nutritional preference
  - Kitchen equipment

# Output

Respond with JSON containing exactly 3 practical recipe suggestions that prioritize the user's pantry.
Each recipe should include:
  - recipeName: The recipe name
  - description: A brief description
  - difficulty: Easy, Medium, or Hard
  - cookTime: Estimated cooking time in minutes. Give an answer in intervals of 15 minutes and always round up.
  - pantryIngredientsUsed: Array of ingredients from their pantry that are used for this recipe.
  - additionalIngredientsNeeded: Optional enhancements that would improve the dish if the user happens to have them or wants to add them (keep this minimal; do not make the recipe depend on shopping). The recipe must still work if every item in this list is skipped. Return bare ingredient names only; do not include labels like "optional", "(optional)", or "if around" inside item strings.
  - overview: Brief overview of the cooking process in 1-3 sentences. Tone should be friendly and concise.
  - instructions: Step by step instructions on how to cook this recipe.
  - isFusion: Boolean indicating if this recipe combines culinary traditions from multiple cuisines (e.g., Korean-Mexican tacos, Italian-Asian ramen, Indian-French fusion). Only mark as true if the recipe intentionally blends techniques, flavors, or ingredients from distinctly different culinary traditions.

## Guidelines for choosing a recipe suggestion

1. Recipe must follow stated dietary restriction. For example, if the user states gluten free, review any ingredients that has any possibility of a trace of gluten. If there are ingredients that might have a slight chance it has gluten, do not recommend the recipe and suggest another one.
2. In the case of dietary restriction, limit more on restrictions of that could cause health concerns (e.g. peanut allergies, celiac for gluten), religious or cultural reasons (e.g. no traces of pork for Halal). Do not mix this limitation with nutritional preferences (e.g. low carb).
3. Treat cuisine preference as a flavor direction, not permission to invent a shopping list. If pantry ingredients cannot support a strict cuisine recipe, prefer a pantry-first or clearly fusion recipe over adding several missing cuisine staples.
4. Return a quiet range across the three suggestions without labeling the tiers: one pantry-strict or near pantry-strict idea, one pantry-flexible idea, and one cuisine-leaning idea. The cuisine-leaning idea may include a short optional list, but the dish must still work without shopping.
5. If the user confirms specific staples, you may treat those as pantry ingredients. If the user was asked about staples and did not confirm them, do not assume they are available.
6. The core recipe must be cookable from pantryIngredientsUsed alone. If a missing ingredient is essential to the dish's identity, structure, or cooking method, choose a different recipe instead of putting that ingredient in additionalIngredientsNeeded.

## Guidelines for "instructions"

1. Do not encourage burning delicate aromatics (e.g., garlic or spices added too early or over high heat), ensuring proper sauté order and temperature control.
2. Avoid overcrowding the pan when searing is required, which leads to steaming instead of browning and diminished flavor development.
3. Include tasting steps during cooking, enabling seasoning adjustments and catching errors early.
4. Ensure ingredients (like meat or baked goods) are rested or set aside appropriately, preventing dryness and texture issues.
5. Recommend using correctly sharpened knives and safe cutting techniques, promoting precision and user safety.
6. Instruct proper preheating of cooking surfaces (pans, oven, grill) to reach optimal cooking temperatures before adding food.
7. Steps must only be possible if kitchen equipment is available.
8. Do not suggest harmful steps on cooking (e.g. putting your hands in the pan for too long, unsafe knife cutting steps, use a guard when using a mandoline to cut thin vegetables)
9. When giving instructions on cooking meats, be precise on what users need to ensure for minimum safety requirements for doneness. (for example, chicken has to be cooked until there's no pink in the flesh, beef can be medium rare which is still pink in the center). Do not encourage overcooking of meats.
10. Instructions must work without any additionalIngredientsNeeded items. If mentioning one of those items, phrase it only as an optional finishing touch or swap, never as a required step.

## Guidelines for "additionalIngredientsNeeded"

1. Keep this minimal and only include ingredients that bring a useful enhancement to the dish but are not required.
2. Do not recommend the recipe as a whole at all if these ingredients are absolutely essential to the dish and recommend another. (For example, do not recommend Chicken Parmiggiana if chicken or tomatoes are not part of the pantry). If the ingredient is a good addition but not necessary, keep recommending this recipe.
3. Exclude pantry essentials like salt, black pepper, water, and generic neutral cooking oil if they are not captured from the user's input.
4. Do not globally assume cuisine-specific staples such as olive oil, soy sauce, sesame oil, fish sauce, garam masala, parmesan, or canned tomatoes. These can appear only as optional enhancements unless the pantry or confirmed-staple context includes them.
5. Keep additionalIngredientsNeeded to 0-3 items per recipe.
6. Return ingredient names only in additionalIngredientsNeeded. Do not include words like "optional", "if around", or "if available" because the field is already displayed as optional in the UI.
7. Never use additionalIngredientsNeeded for required ingredients. If the recipe depends on an ingredient, that ingredient must already be available in the pantry or confirmed staples, otherwise choose another recipe.`;

const DEFAULT_SLOP_BOWL_PROMPT = `You are Laica's Slop Bowl recipe generator. Create exactly one bowl-style meal from the user's pantry and profile.

Return JSON with exactly these fields:
{
  "recipeName": "Name of the bowl",
  "description": "1-2 sentence description",
  "cookTime": 30,
  "difficulty": "Easy/Medium/Hard",
  "cuisine": "Cuisine or flavor direction",
  "pantryIngredientsUsed": ["ingredient"],
  "additionalIngredientsNeeded": ["ingredient"],
  "overview": "Short overview of how the bowl comes together",
  "instructions": ["Step 1", "Step 2"],
  "isFusion": false,
  "pantryMatch": 85
}

Rules:
1. Make one coherent meal that belongs in a bowl, but do not force rigid base/protein/toppings/sauce categories.
2. Maximize the pantry ingredients already available and keep additionalIngredientsNeeded minimal.
3. Respect dietary restrictions strictly, including allergy, medical, and religious restrictions.
4. Respect the available kitchen equipment. Do not require tools the user does not have.
5. Keep the recipe realistic for the user's cooking skill and planning time budget.
6. Avoid exact repeats from the last 7 days. If the most recent meal has a known cuisine, vary away from that cuisine when reasonable.
7. Use ratings as directional feedback: lean toward highly rated meals and away from poorly rated meals.
8. If a recent meal has cuisine "unknown", only use it to avoid repeating the recipe name.
9. If feedback is provided, incorporate it directly.
10. If previousRecipe is provided, do not generate that recipe again.
11. instructions must be a flat array of practical, sequential cooking steps for a home cook.
12. additionalIngredientsNeeded is for optional enhancements only. The bowl and its instructions must work if every item in this list is skipped.
13. additionalIngredientsNeeded should exclude salt, pepper, water, and neutral cooking oil.
14. additionalIngredientsNeeded is displayed as optional in the UI, so return bare ingredient names only and do not include words like "optional", "if around", or "if available" inside item strings.
15. Never use additionalIngredientsNeeded for required ingredients. If the bowl depends on an ingredient, that ingredient must already be available in the pantry, otherwise choose another bowl.
16. pantryMatch should be a 0-100 score estimating how much of the dish comes from the pantry.`;

const DEFAULT_COOKING_STEPS_PROMPT = `You are a home-cooking expert that provides realistic step-by-step instructions for everyday cooks.
          You focus on practical tips for home kitchens (not professional techniques).
          
          Return JSON in this format:
          {
            "recipe": {
              "recipeName": "Full recipe name",
              "servings": "Number of servings",
              "prepTime": "Prep time in minutes",
              "cookTime": "Cook time in minutes",
              "difficulty": "Easy/Medium/Hard",
              "ingredients": [
                { "name": "Ingredient name", "quantity": "Amount", "forSteps": [1, 3] }
              ]
            },
            "steps": [
              {
                "number": 1,
                "actionLabel": "2-4 word action label",
                "instruction": "Clear step instruction",
                "timing": "Estimated time in minutes",
                "tips": "Practical home cooking advice",
                "visualCues": "What to look for visually",
                "commonMistakes": "Mistake to avoid"
              }
            ],
            "variations": [
              "Simple variations using pantry substitutes"
            ]
          }`;

const DEFAULT_COOKING_ASSISTANCE_PROMPT = `You are a helpful cooking assistant providing guidance during the cooking process. Keep responses concise, helpful and a neutral tone (i.e. not too encouraging or enthusiastic, but also not too discouraging to the point they would not like to continue anymore.)`;

function formatRecentMeals(recentMeals: SlopBowlRecentMeal[]): string {
  if (recentMeals.length === 0) {
    return "No recent meals recorded.";
  }

  return recentMeals
    .map((meal) => {
      const cuisine = meal.cuisine === "unknown" ? "cuisine unknown" : `${meal.cuisine} cuisine`;
      const rating = meal.rating === null ? "not rated" : `rated ${meal.rating}/5`;
      const timing = meal.daysAgo === 0 ? "today" : `${meal.daysAgo} day(s) ago`;
      return `- ${meal.recipeName} (${cuisine}, ${timing}, ${rating})`;
    })
    .join("\n");
}

export async function getSlopBowlRecipe(input: SlopBowlInput) {
  try {
    const sanitizedInput = sanitizePromptInput(input);
    const planningTimeAvailable = normalizePlanningTimeValue(
      sanitizedInput.planningTimeAvailable || DEFAULT_PLANNING_TIME_VALUE,
    );
    const maxCookTime = getPlanningTimeMinutes(planningTimeAvailable);
    const planningTimePrompt = getPlanningTimePrompt(planningTimeAvailable);
    const inputData = {
      ...sanitizedInput,
      planningTimeAvailable,
      maxCookTime,
      planningTimePrompt,
      feedback: sanitizedInput.feedback || null,
      previousRecipe: sanitizedInput.previousRecipe || null,
    };

    const response = await openai.chat.completions.create({
      model: MODEL_COMPLEX,
      messages: [
        {
          role: "system",
          content: DEFAULT_SLOP_BOWL_PROMPT,
        },
        {
          role: "user",
          content: [
            `Pantry ingredients: ${sanitizedInput.ingredients.join(", ")}.`,
            `Cooking skill: ${sanitizedInput.cookingSkill}.`,
            `Dietary restrictions: ${sanitizedInput.dietaryRestrictions.length > 0 ? sanitizedInput.dietaryRestrictions.join(", ") : "none"}.`,
            maxCookTime === null
              ? "No strict cook-time cap; keep the bowl realistic for a home cook and avoid needless complexity."
              : `Target a recipe that takes ${maxCookTime} minutes or less unless the ingredients clearly need less time.`,
            `User's planning time setting: ${planningTimePrompt}.`,
            `Available kitchen equipment: ${sanitizedInput.kitchenEquipment.length > 0 ? sanitizedInput.kitchenEquipment.join(", ") : "not specified; stay within a basic home kitchen setup"}.`,
            `Recent meals:\n${formatRecentMeals(sanitizedInput.recentMeals)}`,
            sanitizedInput.feedback ? `User feedback on the last suggestion: ${sanitizedInput.feedback}` : null,
            sanitizedInput.previousRecipe ? `Do not repeat this previous recipe: ${sanitizedInput.previousRecipe}` : null,
            "Any additionalIngredientsNeeded must be optional enhancements only; the bowl and instructions must still work if the user skips them.",
            "Generate exactly one Slop Bowl recipe now.",
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
      response_format: { type: "json_object" },
    });

    const parsedResult = slopBowlRecipeSchema.parse(
      JSON.parse(response.choices[0].message.content || "{}"),
    );
    const result = {
      ...parsedResult,
      additionalIngredientsNeeded: normalizeAdditionalIngredientsNeeded(parsedResult.additionalIngredientsNeeded),
    };
    logInteraction("slop_bowl_suggestions", inputData, JSON.stringify(result));
    return result;
  } catch (error) {
    console.error("Error getting Slop Bowl recipe:", error);
    throwOpenAIProviderError(error, "Failed to get Slop Bowl recipe");
  }
}

export async function getRecipeSuggestions(
  preferences: string,
  ingredients?: string[],
  options: RecipeSuggestionOptions = {},
) {
  try {
    const activePrompt = await getActivePromptVersion('recipe_suggestions');
    const systemPrompt = activePrompt?.systemPrompt || DEFAULT_RECIPE_SUGGESTIONS_PROMPT;
    const sanitizedPreferences = sanitizePromptInput(preferences);
    const sanitizedIngredients = sanitizePromptInput(ingredients || []);
    const inputData = { preferences: sanitizedPreferences, ingredients: sanitizedIngredients };

    const response = await openai.chat.completions.create({
      model: MODEL_COMPLEX,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `I have these ingredients in my pantry: ${sanitizedIngredients.length > 0 ? sanitizedIngredients.join(", ") : "basic staples only"}.
          My preferences: ${sanitizedPreferences}.
          Please suggest 3 meal ideas I can make primarily with what I already have.
          Any additionalIngredientsNeeded must be optional enhancements only; each recipe and its instructions must still work if the user skips them.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = normalizeRecipeSuggestionsResponse(JSON.parse(response.choices[0].message.content || "{}"));
    logInteraction(options.evalFeatureType ?? 'recipe_suggestions', inputData, JSON.stringify(result), {
      promptVersionId: activePrompt?.id ?? null,
    });
    return result;
  } catch (error) {
    console.error("Error getting recipe suggestions:", error);
    throwOpenAIProviderError(error, "Failed to get recipe suggestions");
  }
}

export async function getCookingSteps(
  recipeName: string,
  ingredients?: string[],
  equipment?: string[],
  description?: string,
  acknowledgedMissingIngredients?: string[],
) {
  try {
    const systemPrompt = await getActivePrompt('cooking_steps') || DEFAULT_COOKING_STEPS_PROMPT;
    const sanitizedRecipeName = sanitizePromptInput(recipeName);
    const sanitizedIngredients = sanitizePromptInput(ingredients || []);
    const sanitizedEquipment = sanitizePromptInput(equipment || []);
    const sanitizedDescription = sanitizePromptInput(description || "");
    const sanitizedAcknowledgedMissingIngredients = sanitizePromptInput(acknowledgedMissingIngredients || []);
    const inputData = {
      recipeName: sanitizedRecipeName,
      ingredients: sanitizedIngredients,
      equipment: sanitizedEquipment,
      description: sanitizedDescription || null,
      acknowledgedMissingIngredients: sanitizedAcknowledgedMissingIngredients,
    };

    const userPrompt = [
      `I want to cook ${sanitizedRecipeName}.`,
      sanitizedDescription ? `Description: ${sanitizedDescription}` : null,
      sanitizedIngredients.length > 0 ? `Using these ingredients: ${sanitizedIngredients.join(", ")}` : null,
      sanitizedEquipment.length > 0 ? `Available equipment: ${sanitizedEquipment.join(", ")}` : null,
      sanitizedAcknowledgedMissingIngredients.length > 0
        ? `The cook acknowledged they may skip these optional ingredients: ${sanitizedAcknowledgedMissingIngredients.join(", ")}. Adapt the steps so the recipe works without requiring them.`
        : null,
      "Please provide detailed home cooking instructions with visual cues I can look for at each step.",
      "For Live Cooking, each step must be one glanceable cookable action or milestone, not a paragraph. Split prep, heating, adding, cooking, draining, and serving into separate steps when they are distinct actions.",
      "Keep each instruction to one short sentence when possible. If an action needs sub-detail, keep it concise and do not combine unrelated actions into one step.",
      "For each step include actionLabel: a 2-4 word verb-first label for the step rail and mobile headline; use 5 words only if needed to complete the meaning. It should fit in a small preview card and work as a quick recall card for a cook mid-step.",
      "Name the real cooking action, not measurements or the first setup phrase. Use grammatical plain-English kitchen phrasing with needed nouns, prepositions, and adverbs.",
      "Keep ingredient grammar correct. Preserve plural ingredient wording when the step uses or prepares multiple items: Prep Leeks, Prep Carrots, Slice Green Onions. Do not singularize plural ingredients into labels like Prep Leek when the cook is handling leeks.",
      "Use correction relationships when choosing actionLabel: if a label would be measurement-driven like Bring 4 Cups, name the action/result instead, e.g. Boil Water; if a label would only name setup like Heat Oil Butter but the step cooks vegetables, name the actual milestone, e.g. Cook Leek & Spinach; if a label is ungrammatical like Push Vegetables Side, use the idiomatic kitchen phrase, e.g. Push Vegetables Aside; if a label omits the object like Add Cold Cooked, include the noun, e.g. Add Cold Rice.",
      "Do not use stale generic labels like Cook Vegetables for final garnish, off-heat, seasoning, serving, or plating steps. If a final step says to turn off heat, stir in green onions or herbs, and serve, use Garnish or Garnish & Serve instead of Cook Vegetables.",
      "Do not repeat the same actionLabel for different steps in one recipe. If multiple steps involve the same ingredient group, distinguish the milestone or result, such as Cook Vegetables, Add Cold Rice, Mix Fried Rice, Season Fried Rice, Garnish, and Serve Fried Rice.",
      "For fried rice or similar dishes, if cold cooked rice is best but the cook may only have warm rice, give a practical workaround such as spreading warm rice out to steam off and cool briefly before frying. Do not imply cold rice is a missing required ingredient unless the recipe truly cannot work.",
      "Focus on practical techniques for a home kitchen, not professional chef methods.",
    ]
      .filter(Boolean)
      .join("\n");

    const response = await openai.chat.completions.create({
      model: MODEL_COMPLEX,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: userPrompt,
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = normalizeCookingStepsResponse(JSON.parse(response.choices[0].message.content || "{}"));
    logInteraction('cooking_steps', inputData, JSON.stringify(result));
    return result;
  } catch (error) {
    console.error("Error getting cooking steps:", error);
    throwOpenAIProviderError(error, "Failed to get cooking steps");
  }
}

export async function getGroceryList(recipes: string[], pantryItems?: string[]) {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL_UTILITY,
      messages: [
        {
          role: "system",
          content: `You are a smart grocery list generator that helps users minimize food waste and save money.
          You create efficient shopping lists by:
          1. Excluding ingredients users already have in their pantry
          2. Grouping items by store section (produce, protein, dairy, pantry goods, etc.)
          3. Suggesting cost-effective options
          4. Noting when ingredients can be used across multiple recipes
          
          Respond with JSON in this format:
          {
            "categories": [
              {
                "name": "Category name",
                "items": [
                  { 
                    "name": "Item name", 
                    "quantity": "Amount needed", 
                    "usedIn": ["Recipe names this is used in"],
                    "estimatedCost": "Approximate cost (low/medium/high)",
                    "note": "Optional buying tip or substitution suggestion"
                  }
                ]
              }
            ],
            "estimatedTotalCost": "Approximate total cost",
            "savingTips": ["2-3 money-saving tips specific to this shopping list"]
          }`
        },
        {
          role: "user",
          content: `I want to make these recipes: ${recipes.join(", ")}
          
          ${pantryItems && pantryItems.length > 0 ? 
            `I already have these ingredients in my pantry: ${pantryItems.join(", ")}` : 
            "I have a few basic staples like salt, pepper, and cooking oil."
          }
          
          Please generate an efficient grocery list that minimizes waste and unnecessary purchases.`
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error generating grocery list:", error);
    throwOpenAIProviderError(error, "Failed to generate grocery list");
  }
}

export async function getIngredientAlternatives(ingredient: string, reason: string) {
  try {
    const sanitizedIngredient = sanitizePromptInput(ingredient);
    const sanitizedReason = sanitizePromptInput(reason);
    const response = await openai.chat.completions.create({
      model: MODEL_UTILITY,
      messages: [
        {
          role: "system",
          content: "You are a culinary expert that suggests ingredient alternatives. Respond with JSON containing alternative ingredients."
        },
        {
          role: "user",
          content: `Suggest 3 alternatives for ${sanitizedIngredient} that are ${sanitizedReason}`
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error getting ingredient alternatives:", error);
    throwOpenAIProviderError(error, "Failed to get ingredient alternatives");
  }
}

export async function getCookingAssistance(step: string, question?: string) {
  try {
    const systemPrompt = await getActivePrompt('cooking_assistance') || DEFAULT_COOKING_ASSISTANCE_PROMPT;
    const sanitizedStep = sanitizePromptInput(step);
    const sanitizedQuestion = question ? sanitizePromptInput(question) : undefined;
    const userContent = question
      ? `Provide cooking assistance for this step: ${sanitizedStep} The user asked: ${sanitizedQuestion}`
      : `Provide cooking assistance for this step: ${sanitizedStep}`;
    const inputData = { step: sanitizedStep, question: sanitizedQuestion || null };

    const response = await openai.chat.completions.create({
      model: MODEL_ASSISTANCE,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ]
    });

    const result = response.choices[0].message.content || "";
    logInteraction('cooking_assistance', inputData, result);
    return result;
  } catch (error) {
    console.error("Error getting cooking assistance:", error);
    throwOpenAIProviderError(error, "Failed to get cooking assistance");
  }
}

export async function analyzeIngredientImage(base64Image: string) {
  try {
    // Detect image format from base64 data
    let mimeType = 'image/jpeg'; // default
    
    // Check the first few bytes to determine format
    const imageBuffer = Buffer.from(base64Image, 'base64');
    const header = imageBuffer.toString('hex', 0, 4).toLowerCase();
    
    if (header.startsWith('ffd8')) {
      mimeType = 'image/jpeg';
    } else if (header.startsWith('8950')) {
      mimeType = 'image/png';
    } else if (header.startsWith('4749')) {
      mimeType = 'image/gif';
    } else if (header.startsWith('5249')) {
      mimeType = 'image/webp';
    }

    console.info("[vision] analyzing image", {
      mimeType,
      sizeKb: Math.round(imageBuffer.length / 1024),
    });

    const response = await openai.chat.completions.create({
      model: MODEL_COMPLEX,
      messages: [
        {
          role: "system",
          content: compositions.equipmentAnalysis.system()
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: compositions.equipmentAnalysis.user()
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = normalizeVisionAnalysisResult(JSON.parse(response.choices[0].message.content || "{}"));

    if (Array.isArray(result.equipment)) {
      result.equipment = filterDetectedEquipment(result.equipment);
    }
    
    return result;
  } catch (error) {
    console.error("Error analyzing ingredient image:", error);
    throwOpenAIProviderError(error, "Failed to analyze ingredient image");
  }
}
