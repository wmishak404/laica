import OpenAI from "openai";

// OpenAI is optional at startup. Construct the SDK only when a provider operation
// is requested, so missing credentials fail that operation rather than app import.
export function createOpenAIClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "", adminAPIKey: null });
}
