import OpenAI from "openai";
import { compositions } from "./prompts/composer";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

export async function getRecipeSuggestions(preferences: string, ingredients?: string[]) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a pantry-first culinary expert that helps people use ingredients they already have at home.  You prioritize using what's in their kitchen rather than suggesting recipes that require many additional ingredients.

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
  - name: The recipe name
  - description: A brief description
  - difficulty: Easy, Medium, or Hard
  - cookTime: Estimated cooking time in minutes. Give an answer in intervals of 15 minutes and always round up.
  - pantryIngredientsUsed: Array of ingredients from their pantry that are used for this recipe.
  - additionalIngredientsNeeded: Array of ingredients they might need to buy (keep this minimal).
  - overview: Brief overview of the cooking process in 1-3 sentences. Tone should be friendly and concise.
  - instructions: Step by step instructions on how to cook this recipe.

## Guidelines for choosing a recipe suggestion

1. Recipe must follow stated dietary restriction. For example, if the user states gluten free, review any ingredients that has any possibility of a trace of gluten. If there are ingredients that might have a slight chance it has gluten, do not recommend the recipe and suggest another one.
2. In the case of dietary restriction, limit more on restrictions of that could cause health concerns (e.g. peanut allergies, celiac for gluten), religious or cultural reasons (e.g. no traces of pork for Halal). Do not mix this limitation with nutritional preferences (e.g. low carb).

## Guidelines for "instructions"

1. Do not encourage burning delicate aromatics (e.g., garlic or spices added too early or over high heat), ensuring proper sauté order and temperature control.
2. Avoid overcrowding the pan when searing is required, which leads to steaming instead of browning and diminished flavor development.
3. Include tasting steps during cooking, enabling seasoning adjustments and catching errors early.
4. Ensure ingredients (like meat or baked goods) are rested or set aside appropriately, preventing dryness and texture issues.
5. Recommend using correctly sharpened knives and safe cutting techniques, promoting precision and user safety.
6. Instruct proper preheating of cooking surfaces (pans, oven, grill) to reach optimal cooking temperatures before adding food.
7. Steps must only be possible if kitchen equipment is available.

## Guidelines for "additionalIngredientsNeeded"

1. Keep this minimal and only include when its brings a great addition to the dish, but not absolutely necessary.
2. Do not recommend the recipe as a whole at all if these ingredients are absolutely essential to the dish and recommend another. (For example, do not recommend Chicken Parmiggiana if chicken or tomatoes are not part of the pantry). If the ingredient is a good addition but not necessary, keep recommending this recipe.
3. Exclude pantry essentials like salt and black pepper if its not captured from the user's input.`
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

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error getting recipe suggestions:", error);
    throw new Error("Failed to get recipe suggestions");
  }
}

export async function getCookingSteps(recipeName: string, ingredients?: string[]) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a home-cooking expert that provides realistic step-by-step instructions for everyday cooks.
          You focus on practical tips for home kitchens (not professional techniques).
          
          Return JSON in this format:
          {
            "recipe": {
              "name": "Full recipe name",
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
          }`
        },
        {
          role: "user",
          content: `I want to cook ${recipeName}${ingredients && ingredients.length > 0 ? 
            ` with these main ingredients: ${ingredients.join(", ")}` : 
            ""}.
            
            Please provide detailed home cooking instructions with visual cues I can look for at each step.
            Focus on practical techniques for a home kitchen, not professional chef methods.`
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error getting cooking steps:", error);
    throw new Error("Failed to get cooking steps");
  }
}

export async function getGroceryList(recipes: string[], pantryItems?: string[]) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
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
      model: "gpt-4o",
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
    let content = `Provide cooking assistance for this step: ${step}`;
    if (question) {
      content += ` The user asked: ${question}`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful cooking assistant providing guidance during the cooking process. Keep responses concise and helpful."
        },
        {
          role: "user",
          content
        }
      ]
    });

    return response.choices[0].message.content || "";
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

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
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

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error analyzing ingredient image:", error);
    throw new Error("Failed to analyze ingredient image");
  }
}
