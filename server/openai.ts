import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

export async function getRecipeSuggestions(preferences: string, ingredients?: string[]) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a pantry-first culinary expert that helps people use ingredients they already have at home. 
          You prioritize using what's in their kitchen rather than suggesting recipes that require many additional ingredients.
          Respond with JSON containing 3 practical recipe suggestions that can be made with minimal additional shopping.
          Each recipe should include:
          - name: The recipe name
          - description: A brief description
          - difficulty: Easy, Medium, or Hard
          - cookTime: Estimated cooking time in minutes
          - pantryIngredientsUsed: Array of ingredients from their pantry that are used
          - additionalIngredientsNeeded: Array of ingredients they might need to buy (keep this minimal)
          - instructions: Brief overview of the cooking process in 2-3 sentences`
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
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a kitchen vision system that identifies ingredients, food items, and kitchen equipment in images. 
          
          For ingredients/food: Look for raw ingredients, prepared foods, spices, condiments, beverages, etc.
          For kitchen equipment: Look carefully for all cookware, appliances, and kitchen tools including:
          - Pots and pans of all sizes (small pots, large pots, saucepans, skillets, frying pans)
          - Dutch ovens (any color including red, blue, black, etc.)
          - Appliances (coffee machines, blenders, mixers, toasters, ovens, microwaves, refrigerators)
          - Knives: Be specific with knife types as this helps with cooking technique later:
            * Gyutou (Japanese chef's knife, often with wooden handles)
            * Santoku (Japanese all-purpose knife, usually shorter with flat edge)
            * Nakiri (Japanese vegetable knife, rectangular blade)
            * Petty knife (small utility knife)
            * Bread knife (serrated edge)
            * Cleaver (heavy, rectangular blade)
            * Paring knife (small, pointed blade)
            * Boning knife (thin, flexible blade)
          - Measuring equipment
          - Baking equipment
          - Any other kitchen implements
          
          IMPORTANT: For equipment items, always return simple string names, never object references.
          Respond with JSON containing separate arrays for "ingredients" and "equipment" with detailed item names as strings.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Carefully examine this image and identify ALL kitchen equipment, cookware, appliances, and food ingredients you can see. Be thorough and specific about sizes, colors, and types of items."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
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
