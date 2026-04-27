import OpenAI from "openai";
import { z } from "zod";
import { compositions } from "./prompts/composer";
import { getActivePrompt } from "./prompt-manager";
import { filterDetectedEquipment } from "./vision/equipment-filter";
import { db } from "./db";
import { aiInteractions } from "@shared/schema";

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
  weeklyTime: string;
  kitchenEquipment: string[];
  recentMeals: SlopBowlRecentMeal[];
  feedback?: string;
  previousRecipe?: string;
}

const slopBowlRecipeSchema = z.object({
  recipeName: z.string(),
  description: z.string(),
  cookTime: z.coerce.number().int().nonnegative(),
  difficulty: z.string(),
  cuisine: z.string(),
  pantryIngredientsUsed: z.array(z.string()).default([]),
  additionalIngredientsNeeded: z.array(z.string()).default([]),
  overview: z.string(),
  instructions: z.array(z.string()).min(1),
  isFusion: z.boolean(),
  pantryMatch: z.coerce.number().min(0).max(100),
});

// ─────────────────────────────────────────────────────────────────────────────
// Interaction logger — fire-and-forget, never blocks the user response.
// ─────────────────────────────────────────────────────────────────────────────
function logInteraction(featureType: string, inputData: object, outputData: string): void {
  db.insert(aiInteractions)
    .values({ featureType, inputData, outputData, evalStatus: 'pending' })
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

Respond with JSON containing 3 practical recipe suggestions that can be made with minimal additional shopping.
Each recipe should include:
  - recipeName: The recipe name
  - description: A brief description
  - difficulty: Easy, Medium, or Hard
  - cookTime: Estimated cooking time in minutes. Give an answer in intervals of 15 minutes and always round up.
  - pantryIngredientsUsed: Array of ingredients from their pantry that are used for this recipe.
  - additionalIngredientsNeeded: Array of ingredients they might need to buy (keep this minimal).
  - overview: Brief overview of the cooking process in 1-3 sentences. Tone should be friendly and concise.
  - instructions: Step by step instructions on how to cook this recipe.
  - isFusion: Boolean indicating if this recipe combines culinary traditions from multiple cuisines (e.g., Korean-Mexican tacos, Italian-Asian ramen, Indian-French fusion). Only mark as true if the recipe intentionally blends techniques, flavors, or ingredients from distinctly different culinary traditions.

## Guidelines for choosing a recipe suggestion

1. Recipe must follow stated dietary restriction. For example, if the user states gluten free, review any ingredients that has any possibility of a trace of gluten. If there are ingredients that might have a slight chance it has gluten, do not recommend the recipe and suggest another one.
2. In the case of dietary restriction, limit more on restrictions of that could cause health concerns (e.g. peanut allergies, celiac for gluten), religious or cultural reasons (e.g. no traces of pork for Halal). Do not mix this limitation with nutritional preferences (e.g. low carb).
3. Despite the user having certain pantry ingredients in their kitchen, if it does not fit into the "Current cuisine preference" input at all, do not recommend recipes using that ingredient (e.g. kimchi is usually a staple Korean ingredient. This does not fit into Italian, French or Mexican cuisine, or how bagels and cream cheese does not fit well with Indian or Asian cuisine unless there is one ingredient or spice that fits). If you cannot come up with enough recipes that fit the "Current cuisine preference" input, recommend recipes that are fusion. If there are no fusion recipes at all, recommend more in additional IngredientsNeeded to complete the suggested recipe.

### Examples from open coding that should be avoided as an output of recipe suggestions:

#### Recipe Suggestiion Example 1
- Current cuisine preference: Indian
- pantryIngredients: "rotisserie chicken whole, thyme, button mushrooms, oyster mushrooms, morel mushrooms, beef buillon, vermouth, beef cubes, brioche, spring onions, arugula, garlic, onions, ketchup, worchestershire sauce, mayonaise, eggs, soy sauce, vinegar, frozen peas, arborio rice, shiitake mushrooms, olive oil, instant noodles, sesame oil, bok choy, bagels, toast, boursin garlic and chive cream cheese, smoked salmon, kale."
- recipe name: "Chicken and Mushroom Risotto", "Smoked Salmon Kale Noodles"
- additionalIngredientsNeeded: none 

##### Why Example 1 is a failed output
- These recipes in the recipe name output should not be recommended because it has nothing to do with Indian cuisine.
- It might be challenging for some ingredients that they have in the pantry to fit into a cuisine, so its OK to add ingredients in the additionalIngredientsNeeded to complete the recipe. But if the recipe is not fitting into the cuisine preference at all, do not recommend it.
- additionalIngredientsNeeded in this case can be "garam masala, turmeric, cumin, coriander, ginger, cinnamon, cardamom, cloves, bay leaves, curry powder, chili powderm or any other ingredients that can complete the Indian cuisine recipe.

##### Workaround example for Example 1
- pantryIngredientsUsed: "sesame oil, rotisserie chicken whole, beef buillon cubes, garlic, onions, kale, vinegar"
- recipeName: "Rotisserie Chicken and Kale Curry"
- additionalIngredientsNeeded: "garam masala, tomato paste, tomato, ginger"

#### Recipe Suggestion Example 2
- Current cuisine preference: Chinese
- pantryIngredients: "bacon, basil, butter, chickpeas, cream, cumin, garlic, lettuce, mushrooms, olive oil, onion, onion powder, paprika, parmesan, polenta, salmon fillet, smoked paprika"
- recipe name: "Mushroom Polenta with Garlic Butter"
- additionalIngredientsNeeded: none 

##### Why Example 2 is a failed output
- "Mushroom Polenta with Garlic Butter" has no ties to Chinese cuisine, and no additional ingredients are recommended to make it chinese.
- The recommended action if you run into this case is to either add additionalIngredientsNeeded to complete the recipe, or recommend a fusion recipe. Even when there is only 2 or 3 ingredients that have that can be used to meet the cuisine preference, recommend it.

#### Recipe Suggestion Example 3
- Current cuisine preference: Chinese
- pantryIngredients: "bacon, basil, butter, chickpeas, cream, cumin, garlic, lettuce, mushrooms, olive oil, onion, onion powder, paprika, parmesan, polenta, salmon fillet, smoked paprika"
- recipename: "Bacon and Basil Polenta with Creamy Parmesan"
- additionalIngredientsNeeded: none 

##### Why Example 3 is a failed output
- Same input at example 2 but showing you different failure examples of the smae input. 
- Again, despite really limited ingredients, "Bacon and Basil Polenta with Creamy Parmesan" is a completely different cuisine than Chinese. Especially parmesan which doesn't fit to target cuisine. This fits more to French, Italian or more European cuisines. This is still a failed output.
- The recommended action if you run into this case is to either add additionalIngredientsNeeded to complete the recipe, or recommend more fusion recipes

##### Workaround example for Example 3
- pantryIngredientsUsed: "salmon fillet, garlic, mushrooms, onion powder, onions"
- recipeName: "Salmon and Mushroom Stir Fry"
- additionalIngredientsNeeded: "soy sauce, mirin, sake"

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

## Guidelines for "additionalIngredientsNeeded"

1. Keep this minimal and only include when its brings a great addition to the dish, but not absolutely necessary.
2. Do not recommend the recipe as a whole at all if these ingredients are absolutely essential to the dish and recommend another. (For example, do not recommend Chicken Parmiggiana if chicken or tomatoes are not part of the pantry). If the ingredient is a good addition but not necessary, keep recommending this recipe.
3. Exclude pantry essentials like salt and black pepper if its not captured from the user's input.`;

const DEFAULT_SLOP_BOWL_PROMPT = `You are LAICA's Slop Bowl recipe generator. Create exactly one bowl-style meal from the user's pantry and profile.

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
5. Keep the recipe realistic for the user's cooking skill and time budget.
6. Avoid exact repeats from the last 7 days. If the most recent meal has a known cuisine, vary away from that cuisine when reasonable.
7. Use ratings as directional feedback: lean toward highly rated meals and away from poorly rated meals.
8. If a recent meal has cuisine "unknown", only use it to avoid repeating the recipe name.
9. If feedback is provided, incorporate it directly.
10. If previousRecipe is provided, do not generate that recipe again.
11. instructions must be a flat array of practical, sequential cooking steps for a home cook.
12. additionalIngredientsNeeded should exclude salt, pepper, water, and neutral cooking oil unless they are essential to the dish.
13. pantryMatch should be a 0-100 score estimating how much of the dish comes from the pantry.`;

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

function getMaxCookTime(weeklyTime: string): number {
  switch (weeklyTime) {
    case "1-2":
      return 30;
    case "3-5":
      return 60;
    case "6-10":
      return 90;
    case "10+":
      return 120;
    default:
      return 60;
  }
}

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
    const maxCookTime = getMaxCookTime(input.weeklyTime);
    const inputData = {
      ...input,
      maxCookTime,
      feedback: input.feedback || null,
      previousRecipe: input.previousRecipe || null,
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
            `Pantry ingredients: ${input.ingredients.join(", ")}.`,
            `Cooking skill: ${input.cookingSkill}.`,
            `Dietary restrictions: ${input.dietaryRestrictions.length > 0 ? input.dietaryRestrictions.join(", ") : "none"}.`,
            `Weekly cooking time preference: ${input.weeklyTime} hours. Target a recipe that takes ${maxCookTime} minutes or less.`,
            `Available kitchen equipment: ${input.kitchenEquipment.length > 0 ? input.kitchenEquipment.join(", ") : "not specified; stay within a basic home kitchen setup"}.`,
            `Recent meals:\n${formatRecentMeals(input.recentMeals)}`,
            input.feedback ? `User feedback on the last suggestion: ${input.feedback}` : null,
            input.previousRecipe ? `Do not repeat this previous recipe: ${input.previousRecipe}` : null,
            "Generate exactly one Slop Bowl recipe now.",
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = slopBowlRecipeSchema.parse(
      JSON.parse(response.choices[0].message.content || "{}"),
    );
    logInteraction("slop_bowl", inputData, JSON.stringify(result));
    return result;
  } catch (error) {
    console.error("Error getting Slop Bowl recipe:", error);
    throw new Error("Failed to get Slop Bowl recipe");
  }
}

export async function getRecipeSuggestions(preferences: string, ingredients?: string[]) {
  try {
    const systemPrompt = await getActivePrompt('recipe_suggestions') || DEFAULT_RECIPE_SUGGESTIONS_PROMPT;
    const inputData = { preferences, ingredients: ingredients || [] };

    const response = await openai.chat.completions.create({
      model: MODEL_COMPLEX,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `I have these ingredients in my pantry: ${ingredients ? ingredients.join(", ") : "basic staples only"}.
          My preferences: ${preferences}.
          Please suggest 3 meal ideas I can make primarily with what I already have.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    logInteraction('recipe_suggestions', inputData, JSON.stringify(result));
    return result;
  } catch (error) {
    console.error("Error getting recipe suggestions:", error);
    throw new Error("Failed to get recipe suggestions");
  }
}

export async function getCookingSteps(
  recipeName: string,
  ingredients?: string[],
  equipment?: string[],
  description?: string,
) {
  try {
    const systemPrompt = await getActivePrompt('cooking_steps') || DEFAULT_COOKING_STEPS_PROMPT;
    const inputData = {
      recipeName,
      ingredients: ingredients || [],
      equipment: equipment || [],
      description: description || null,
    };

    const userPrompt = [
      `I want to cook ${recipeName}.`,
      description ? `Description: ${description}` : null,
      ingredients && ingredients.length > 0 ? `Using these ingredients: ${ingredients.join(", ")}` : null,
      equipment && equipment.length > 0 ? `Available equipment: ${equipment.join(", ")}` : null,
      "Please provide detailed home cooking instructions with visual cues I can look for at each step.",
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

    const result = JSON.parse(response.choices[0].message.content || "{}");
    logInteraction('cooking_steps', inputData, JSON.stringify(result));
    return result;
  } catch (error) {
    console.error("Error getting cooking steps:", error);
    throw new Error("Failed to get cooking steps");
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
    throw new Error("Failed to generate grocery list");
  }
}

export async function getIngredientAlternatives(ingredient: string, reason: string) {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL_UTILITY,
      messages: [
        {
          role: "system",
          content: "You are a culinary expert that suggests ingredient alternatives. Respond with JSON containing alternative ingredients."
        },
        {
          role: "user",
          content: `Suggest 3 alternatives for ${ingredient} that are ${reason}`
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error getting ingredient alternatives:", error);
    throw new Error("Failed to get ingredient alternatives");
  }
}

export async function getCookingAssistance(step: string, question?: string) {
  try {
    const systemPrompt = await getActivePrompt('cooking_assistance') || DEFAULT_COOKING_ASSISTANCE_PROMPT;
    const userContent = question
      ? `Provide cooking assistance for this step: ${step} The user asked: ${question}`
      : `Provide cooking assistance for this step: ${step}`;
    const inputData = { step, question: question || null };

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
    throw new Error("Failed to get cooking assistance");
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

    console.log("\n=== OpenAI Vision API Call ===");
    console.log(`Image MIME Type: ${mimeType}`);
    console.log(`Image Size: ${Math.round(base64Image.length / 1024)}KB`);
    console.log(`System Prompt: ${compositions.equipmentAnalysis.system()}`);
    console.log(`User Prompt: ${compositions.equipmentAnalysis.user()}`);
    console.log("============================\n");

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

    const result = JSON.parse(response.choices[0].message.content || "{}");

    if (Array.isArray(result.equipment)) {
      result.equipment = filterDetectedEquipment(result.equipment);
    }
    
    console.log("\n=== OpenAI Vision API Response ===");
    console.log(`Raw Response: ${response.choices[0].message.content}`);
    console.log(`Parsed Result:`, result);
    console.log("==================================\n");

    return result;
  } catch (error) {
    console.error("Error analyzing ingredient image:", error);
    throw new Error("Failed to analyze ingredient image");
  }
}
