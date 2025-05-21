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
          content: "You are a culinary expert that provides recipe suggestions based on user preferences and available ingredients. Respond with JSON containing 3 recipe suggestions."
        },
        {
          role: "user",
          content: `Suggest 3 recipes that match these preferences: ${preferences}${ingredients ? ` using some of these ingredients if possible: ${ingredients.join(", ")}` : ""}`
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

export async function getCookingSteps(recipeName: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a culinary expert that provides detailed step-by-step cooking instructions. Respond with JSON containing an array of steps with clear instructions."
        },
        {
          role: "user",
          content: `Provide detailed step-by-step cooking instructions for: ${recipeName}`
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

export async function getGroceryList(recipes: string[]) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a grocery list generator that helps organize shopping based on recipes. Group items by category (produce, protein, pantry, etc.) and provide quantity. Respond with a JSON object."
        },
        {
          role: "user",
          content: `Generate a grocery list for these recipes: ${recipes.join(", ")}`
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
          content: "You are a vision system that identifies ingredients and food in images. Respond with JSON that includes the detected items and any useful information about them."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Identify the ingredients or food in this image. Provide details about what you see."
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
