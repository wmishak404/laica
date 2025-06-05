import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { registerUser, loginUser } from "./localAuth";
import { getRecipeSuggestions, getCookingSteps, getGroceryList, getIngredientAlternatives, getCookingAssistance, analyzeIngredientImage } from "./openai";
import { z } from "zod";
import heicConvert from "heic-convert";

// Local authentication middleware
const isLocalAuthenticated: RequestHandler = (req, res, next) => {
  if (req.session && (req.session as any).localUserId) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

// Combined authentication middleware
const isAnyAuthenticated: RequestHandler = async (req, res, next) => {
  // Check local auth first
  if (req.session && (req.session as any).localUserId) {
    return next();
  }
  
  // Check Replit auth
  return isAuthenticated(req, res, next);
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Local authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const schema = z.object({
        username: z.string().min(3).max(50),
        email: z.string().email(),
        password: z.string().min(6),
      });
      
      const userData = schema.parse(req.body);
      const result = await registerUser(userData);
      
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ success: false, message: 'Invalid input data' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const schema = z.object({
        username: z.string(),
        password: z.string(),
      });
      
      const credentials = schema.parse(req.body);
      const result = await loginUser(credentials);
      
      if (result.success && result.user) {
        // Store user ID in session
        (req.session as any).localUserId = result.user.id;
        res.json(result);
      } else {
        res.status(401).json(result);
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ success: false, message: 'Invalid input data' });
    }
  });

  app.post('/api/auth/local-logout', (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
          return res.status(500).json({ message: 'Failed to logout' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
      });
    } else {
      res.json({ message: 'Already logged out' });
    }
  });

  // Combined auth user route
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // Check local auth first
      if (req.session && (req.session as any).localUserId) {
        const userId = (req.session as any).localUserId;
        const user = await storage.getLocalUser(userId);
        if (user) {
          const { password, ...userWithoutPassword } = user;
          return res.json({ ...userWithoutPassword, authType: 'local' });
        }
      }
      
      // Check Replit auth
      const authCheck = await new Promise<boolean>((resolve) => {
        isAuthenticated(req, res, () => resolve(true));
        res.on('finish', () => resolve(false));
      });
      
      if (authCheck && req.user?.claims?.sub) {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        if (user) {
          return res.json({ ...user, authType: 'oauth' });
        }
      }
      
      return res.status(401).json({ message: "Unauthorized" });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User profile routes
  app.patch('/api/user/profile', isAnyAuthenticated, async (req: any, res) => {
    try {
      // Handle local user profile update
      if (req.session && (req.session as any).localUserId) {
        // Local users store profile in preferences field
        const userId = (req.session as any).localUserId;
        const user = await storage.getLocalUser(userId);
        if (user) {
          // Update preferences field with profile data
          const updatedPreferences = { ...(user.preferences as any), ...req.body };
          // Note: We'd need to add updateLocalUserPreferences method to storage
          return res.json({ message: 'Local profile update not implemented yet' });
        }
      }
      
      // Handle OAuth user profile update
      if (req.user?.claims?.sub) {
        const userId = req.user.claims.sub;
        const updatedUser = await storage.updateUserProfile(userId, req.body);
        return res.json(updatedUser);
      }
      
      return res.status(401).json({ message: "Unauthorized" });
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
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

  // Image analysis endpoint with HEIC conversion support
  app.post('/api/vision/analyze', async (req, res) => {
    try {
      const schema = z.object({
        image: z.string(),
        isHEIC: z.boolean().optional()
      });
      
      const { image, isHEIC } = schema.parse(req.body);
      let processedImage = image;
      
      // Convert HEIC to JPEG if needed
      if (isHEIC) {
        try {
          const imageBuffer = Buffer.from(image, 'base64');
          const outputBuffer = await heicConvert({
            buffer: imageBuffer,
            format: 'JPEG',
            quality: 0.8
          });
          processedImage = outputBuffer.toString('base64');
        } catch (conversionError) {
          console.error('HEIC conversion failed:', conversionError);
          return res.status(400).json({ error: 'Failed to convert HEIC image. Please try a different format.' });
        }
      }
      
      const analysis = await analyzeIngredientImage(processedImage);
      res.json(analysis);
    } catch (error) {
      console.error('Error in image analysis:', error);
      res.status(500).json({ error: 'Failed to analyze image' });
    }
  });



  const httpServer = createServer(app);
  return httpServer;
}
