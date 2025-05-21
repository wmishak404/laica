import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getRecipeSuggestions, getCookingSteps, getGroceryList, getIngredientAlternatives, getCookingAssistance, analyzeIngredientImage } from "./openai";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Recipe suggestions endpoint
  app.post('/api/recipes/suggestions', async (req, res) => {
    try {
      const schema = z.object({
        preferences: z.string(),
        ingredients: z.array(z.string()).optional()
      });
      
      const { preferences, ingredients } = schema.parse(req.body);
      const suggestions = await getRecipeSuggestions(preferences, ingredients);
      res.json(suggestions);
    } catch (error) {
      console.error('Error in recipe suggestions:', error);
      res.status(500).json({ error: 'Failed to get recipe suggestions' });
    }
  });
  
  // Pantry-based recipe suggestions endpoint
  app.post('/api/recipes/pantry', async (req, res) => {
    try {
      const schema = z.object({
        ingredients: z.array(z.string()),
        preferences: z.string().optional(),
        timeAvailable: z.string().optional()
      });
      
      const { ingredients, preferences, timeAvailable } = schema.parse(req.body);
      // Convert timeAvailable to a preference string if provided
      const enhancedPreferences = preferences 
        ? (timeAvailable ? `${preferences}, ready in ${timeAvailable}` : preferences)
        : (timeAvailable ? `Ready in ${timeAvailable}` : '');
        
      const suggestions = await getRecipeSuggestions(enhancedPreferences, ingredients);
      res.json(suggestions);
    } catch (error) {
      console.error('Error in pantry recipe suggestions:', error);
      res.status(500).json({ error: 'Failed to get pantry-based recipe suggestions' });
    }
  });

  // Cooking steps endpoint
  app.post('/api/cooking/steps', async (req, res) => {
    try {
      const schema = z.object({
        recipeName: z.string()
      });
      
      const { recipeName } = schema.parse(req.body);
      const steps = await getCookingSteps(recipeName);
      res.json(steps);
    } catch (error) {
      console.error('Error in cooking steps:', error);
      res.status(500).json({ error: 'Failed to get cooking steps' });
    }
  });

  // Grocery list endpoint
  app.post('/api/grocery/list', async (req, res) => {
    try {
      const schema = z.object({
        recipes: z.array(z.string())
      });
      
      const { recipes } = schema.parse(req.body);
      const groceryList = await getGroceryList(recipes);
      res.json(groceryList);
    } catch (error) {
      console.error('Error in grocery list:', error);
      res.status(500).json({ error: 'Failed to generate grocery list' });
    }
  });

  // Ingredient alternatives endpoint
  app.post('/api/ingredients/alternatives', async (req, res) => {
    try {
      const schema = z.object({
        ingredient: z.string(),
        reason: z.string()
      });
      
      const { ingredient, reason } = schema.parse(req.body);
      const alternatives = await getIngredientAlternatives(ingredient, reason);
      res.json(alternatives);
    } catch (error) {
      console.error('Error in ingredient alternatives:', error);
      res.status(500).json({ error: 'Failed to get ingredient alternatives' });
    }
  });

  // Cooking assistance endpoint
  app.post('/api/cooking/assistance', async (req, res) => {
    try {
      const schema = z.object({
        step: z.string(),
        question: z.string().optional()
      });
      
      const { step, question } = schema.parse(req.body);
      const assistance = await getCookingAssistance(step, question);
      res.send(assistance);
    } catch (error) {
      console.error('Error in cooking assistance:', error);
      res.status(500).json({ error: 'Failed to get cooking assistance' });
    }
  });

  // Image analysis endpoint
  app.post('/api/vision/analyze', async (req, res) => {
    try {
      const schema = z.object({
        image: z.string()
      });
      
      const { image } = schema.parse(req.body);
      const analysis = await analyzeIngredientImage(image);
      res.json(analysis);
    } catch (error) {
      console.error('Error in image analysis:', error);
      res.status(500).json({ error: 'Failed to analyze image' });
    }
  });

  // Recipe endpoints
  app.get('/api/recipes', async (req, res) => {
    try {
      const recipes = await storage.getRecipes();
      res.json(recipes);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      res.status(500).json({ error: 'Failed to fetch recipes' });
    }
  });

  app.get('/api/recipes/:id', async (req, res) => {
    try {
      const schema = z.object({
        id: z.string().transform(val => parseInt(val, 10))
      });
      
      const { id } = schema.parse(req.params);
      const recipe = await storage.getRecipe(id);
      
      if (!recipe) {
        return res.status(404).json({ error: 'Recipe not found' });
      }
      
      res.json(recipe);
    } catch (error) {
      console.error('Error fetching recipe:', error);
      res.status(500).json({ error: 'Failed to fetch recipe' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
