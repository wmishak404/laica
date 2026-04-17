import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { registerAdminRoutes } from "./admin-routes";
import { storage } from "./storage";
import { verifyFirebaseToken, type FirebaseUser } from "./firebaseAuth";
import { getRecipeSuggestions, getCookingSteps, getGroceryList, getIngredientAlternatives, getCookingAssistance, analyzeIngredientImage, getSlopBowlRecipe } from "./openai";
import { synthesizeSpeech, getAvailableVoices, COOKING_VOICES } from "./elevenlabs";
import { 
  updateUserProfileSchema, 
  insertUserSettingsSchema, 
  insertCookingSessionSchema,
  insertFeedbackSchema,
} from "@shared/schema";
import { db } from "./db";
import { feedback } from "@shared/schema";
import { z } from "zod";
import heicConvert from "heic-convert";
import multer from "multer";
import fs from "fs/promises";
import fsSync from "fs";
import OpenAI from "openai";

// OpenAI client for transcription
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Multer for handling file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit for audio files
});

// Firebase/Google authentication middleware only
const isAuthenticated: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return verifyFirebaseToken(req, res, next);
  }
  return res.status(401).json({ message: "Unauthorized" });
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getDaysAgo(dateValue: Date | string | null | undefined): number {
  if (!dateValue) {
    return 0;
  }

  const parsedDate = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return 0;
  }

  return Math.max(0, Math.floor((Date.now() - parsedDate.getTime()) / MS_PER_DAY));
}

function getCuisineFromRecipeSnapshot(recipeSnapshot: unknown): string {
  if (!recipeSnapshot || typeof recipeSnapshot !== "object") {
    return "unknown";
  }

  const cuisine = (recipeSnapshot as { cuisine?: unknown }).cuisine;
  return typeof cuisine === "string" && cuisine.trim().length > 0 ? cuisine : "unknown";
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Firebase/Google authentication routes
  app.post('/api/auth/google', verifyFirebaseToken, async (req: any, res) => {
    try {
      const firebaseUser: FirebaseUser = req.firebaseUser;
      
      // Create or update user in our database
      const userData = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        firstName: firebaseUser.displayName?.split(' ')[0] || '',
        lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
        profileImageUrl: firebaseUser.photoURL || '',
        authProvider: 'google',
        firebaseUid: firebaseUser.uid,
      };
      
      const user = await storage.upsertUser(userData);
      res.json(user);
    } catch (error) {
      console.error("Error with Google authentication:", error);
      res.status(500).json({ message: "Failed to authenticate with Google" });
    }
  });



  // Auth user route (Google only)
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const firebaseUser: FirebaseUser = req.firebaseUser;
      const user = await storage.getUser(firebaseUser.uid);
      if (user) {
        return res.json(user);
      }
      return res.status(404).json({ message: "User not found" });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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

  app.post('/api/recipes/slop-bowl', isAuthenticated, async (req: any, res) => {
    try {
      const firebaseUser: FirebaseUser = req.firebaseUser;
      const userId = firebaseUser.uid;
      const schema = z.object({
        pantryOverride: z.array(z.string().trim().min(1)).optional(),
        feedback: z.string().trim().min(1).optional(),
        previousRecipe: z.string().trim().min(1).optional(),
      });

      const { pantryOverride, feedback, previousRecipe } = schema.parse(req.body);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const ingredients = pantryOverride ?? user.pantryIngredients ?? [];
      if (ingredients.length === 0) {
        return res.status(400).json({ message: "Add pantry ingredients before generating a Slop Bowl" });
      }

      if (!user.cookingSkill || !user.weeklyTime) {
        return res.status(400).json({ message: "Complete your cooking skill and weekly time profile before generating a Slop Bowl" });
      }

      const sessions = await storage.getUserCookingSessions(userId, 10);
      const recentMeals = sessions.map((session) => ({
        recipeName: session.recipeName,
        cuisine: getCuisineFromRecipeSnapshot(session.recipeSnapshot),
        daysAgo: getDaysAgo(session.completedAt ?? session.startedAt),
        rating: session.userRating ?? null,
      }));

      const recipe = await getSlopBowlRecipe({
        ingredients,
        cookingSkill: user.cookingSkill,
        dietaryRestrictions: user.dietaryRestrictions ?? [],
        weeklyTime: user.weeklyTime,
        kitchenEquipment: user.kitchenEquipment ?? [],
        recentMeals,
        feedback,
        previousRecipe,
      });

      res.json({ recipe });
    } catch (error) {
      console.error("Error generating Slop Bowl recipe:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid Slop Bowl request" });
      }
      res.status(500).json({ error: "Failed to generate Slop Bowl recipe" });
    }
  });

  // Cooking steps endpoint
  app.post('/api/cooking/steps', async (req, res) => {
    try {
      const schema = z.object({
        recipeName: z.string(),
        ingredients: z.array(z.string()).optional(),
        equipment: z.array(z.string()).optional(),
        description: z.string().optional(),
      });
      
      const { recipeName, ingredients, equipment, description } = schema.parse(req.body);
      const steps = await getCookingSteps(recipeName, ingredients, equipment, description);
      res.json(steps);
    } catch (error) {
      console.error('Error in cooking steps:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid cooking steps request' });
      }
      res.status(500).json({ error: 'Failed to get cooking steps' });
    }
  });

  // Grocery list endpoint (temporarily disabled for future release)
  /* 
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
  */

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
      
      // Remove data URL prefix if present
      if (processedImage.includes('data:image')) {
        processedImage = processedImage.split(',')[1];
      }
      
      // Validate base64 format
      if (!processedImage || processedImage.length === 0) {
        return res.status(400).json({ error: 'Invalid image data provided' });
      }
      
      // Convert HEIC to JPEG if needed
      if (isHEIC) {
        try {
          const imageBuffer = Buffer.from(processedImage, 'base64');
          const outputBuffer = await heicConvert({
            buffer: imageBuffer,
            format: 'JPEG',
            quality: 0.8
          });
          processedImage = (outputBuffer as Buffer).toString('base64');
        } catch (conversionError) {
          console.error('HEIC conversion failed:', conversionError);
          return res.status(400).json({ error: 'Failed to convert HEIC image. Please try a different format.' });
        }
      }
      
      // Validate base64 after processing
      try {
        Buffer.from(processedImage, 'base64');
      } catch (base64Error) {
        console.error('Invalid base64 format:', base64Error);
        return res.status(400).json({ error: 'Invalid image format. Please upload a valid image file.' });
      }
      
      const analysis = await analyzeIngredientImage(processedImage);
      res.json(analysis);
    } catch (error) {
      console.error('Error in image analysis:', error);
      res.status(500).json({ error: 'Failed to analyze image' });
    }
  });

  // ElevenLabs voice synthesis routes
  app.post('/api/speech/synthesize', async (req, res) => {
    try {
      const schema = z.object({
        text: z.string().min(1),
        voiceId: z.string().optional(),
        stability: z.number().min(0).max(1).optional(),
        similarityBoost: z.number().min(0).max(1).optional(),
        style: z.number().min(0).max(1).optional(),
        useSpeakerBoost: z.boolean().optional(),
      });
      
      const { text, voiceId, stability, similarityBoost, style, useSpeakerBoost } = schema.parse(req.body);
      
      const audioBuffer = await synthesizeSpeech(text, {
        voiceId,
        stability,
        similarityBoost,
        style,
        useSpeakerBoost,
      });
      
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000',
      });
      
      res.send(audioBuffer);
    } catch (error) {
      console.error('Error in speech synthesis:', error);
      res.status(500).json({ error: 'Failed to synthesize speech' });
    }
  });

  // Get available voices
  app.get('/api/speech/voices', async (req, res) => {
    try {
      res.json({
        cookingVoices: COOKING_VOICES,
        allVoices: await getAvailableVoices(),
      });
    } catch (error) {
      console.error('Error fetching voices:', error);
      res.status(500).json({ error: 'Failed to fetch voices' });
    }
  });

  // Speech transcription route using OpenAI Whisper
  app.post('/api/speech/transcribe', upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Audio file is required' });
      }

      console.log('Received audio file for transcription:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      // Create a temporary file from the uploaded audio
      const tempFilePath = `/tmp/audio_${Date.now()}.wav`;
      await fs.writeFile(tempFilePath, req.file.buffer);

      try {
        // Use OpenAI Whisper API for transcription
        const transcription = await openai.audio.transcriptions.create({
          file: fsSync.createReadStream(tempFilePath) as any,
          model: "whisper-1",
          language: "en", // Can be made configurable
          response_format: "text"
        });

        console.log('Transcription result:', transcription);

        res.json({ 
          transcription: transcription.trim(),
          success: true 
        });

      } finally {
        // Clean up temp file
        await fs.unlink(tempFilePath).catch(console.warn);
      }

    } catch (error) {
      console.error('Transcription error:', error);
      res.status(500).json({ 
        error: 'Failed to transcribe audio',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // User Profile Management Routes
  
  // Get user profile with settings and cooking history
  app.get('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const firebaseUser: FirebaseUser = req.firebaseUser;
      const userId = firebaseUser.uid;
      
      // Get user data
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get user settings
      const settings = await storage.getUserSettings(userId);
      
      // Get recent cooking sessions
      const sessions = await storage.getUserCookingSessions(userId, 5);
      
      res.json({
        user,
        settings,
        recentSessions: sessions
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  // Update user profile (pantry, equipment, preferences)
  app.put('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const firebaseUser: FirebaseUser = req.firebaseUser;
      const userId = firebaseUser.uid;
      const profileData = updateUserProfileSchema.parse(req.body);
      
      const updatedUser = await storage.updateUserProfile(userId, profileData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });

  // Update user settings (voice, camera, etc.)
  app.put('/api/user/settings', isAuthenticated, async (req: any, res) => {
    try {
      const firebaseUser: FirebaseUser = req.firebaseUser;
      const userId = firebaseUser.uid;
      const settingsData = insertUserSettingsSchema.partial().parse(req.body);
      
      const updatedSettings = await storage.upsertUserSettings({
        authUserId: userId,
        ...settingsData
      });
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating user settings:", error);
      res.status(500).json({ message: "Failed to update user settings" });
    }
  });

  // Cooking Session Management Routes
  
  // Start a new cooking session
  app.post('/api/cooking/session/start', isAuthenticated, async (req: any, res) => {
    try {
      const firebaseUser: FirebaseUser = req.firebaseUser;
      const userId = firebaseUser.uid;
      const recipeIngredientSchema = z.object({
        name: z.string(),
        quantity: z.string().optional(),
        forSteps: z.array(z.number()).optional(),
      });
      const recipeStepSchema = z.object({
        id: z.number().optional(),
        instruction: z.string(),
        duration: z.union([z.string(), z.number()]).optional(),
        tips: z.string().optional(),
        visualCues: z.string().optional(),
        commonMistakes: z.string().optional(),
        safetyLevel: z.string().optional(),
      });
      const recipeSnapshotSchema = z.object({
        recipeName: z.string(),
        description: z.string(),
        cookTime: z.number(),
        difficulty: z.string(),
        cuisine: z.string().default("unknown"),
        pantryMatch: z.number(),
        missingIngredients: z.array(z.string()).default([]),
        pantryIngredientsUsed: z.array(z.string()).default([]),
        additionalIngredientsNeeded: z.array(z.string()).default([]),
        overview: z.string().optional(),
        instructions: z.array(z.string()).default([]),
        ingredients: z.array(recipeIngredientSchema).default([]),
        isFusion: z.boolean().default(false),
        steps: z.array(recipeStepSchema).default([]),
      }).optional();

      const schema = z.object({
        recipeName: z.string(),
        recipeDescription: z.string().optional(),
        recipeSnapshot: recipeSnapshotSchema,
        ingredientsUsed: z.array(z.string()).optional(),
        totalSteps: z.number(),
      });
      
      const sessionData = schema.parse(req.body);
      const ingredientsUsed = sessionData.ingredientsUsed
        ?? sessionData.recipeSnapshot?.pantryIngredientsUsed
        ?? sessionData.recipeSnapshot?.ingredients.map((ingredient) => ingredient.name)
        ?? [];
      
      const session = await storage.createCookingSession({
        authUserId: userId,
        ...sessionData,
        ingredientsUsed,
        completedSteps: 0,
        completed: false,
      });
      
      res.json(session);
    } catch (error) {
      console.error("Error starting cooking session:", error);
      res.status(500).json({ message: "Failed to start cooking session" });
    }
  });

  // Update cooking session progress
  app.put('/api/cooking/session/:id', isAuthenticated, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const schema = z.object({
        completedSteps: z.number().optional(),
        completed: z.boolean().optional(),
        ingredientsRemaining: z.array(z.string()).optional(),
        cookingDuration: z.number().optional(),
        userRating: z.number().min(1).max(5).optional(),
        userNotes: z.string().optional(),
      });
      
      const updateData = schema.parse(req.body);
      
      const session = await storage.updateCookingSession(sessionId, updateData);
      res.json(session);
    } catch (error) {
      console.error("Error updating cooking session:", error);
      res.status(500).json({ message: "Failed to update cooking session" });
    }
  });

  // Complete cooking session and update pantry
  app.post('/api/cooking/session/:id/complete', isAuthenticated, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const firebaseUser: FirebaseUser = req.firebaseUser;
      const userId = firebaseUser.uid;
      
      const schema = z.object({
        ingredientsRemaining: z.array(z.string()),
        userRating: z.number().min(1).max(5).optional(),
        userNotes: z.string().optional(),
        cookingDuration: z.number(),
        completedSteps: z.number(),
      });
      
      const completionData = schema.parse(req.body);
      
      // Update session as completed
      const session = await storage.updateCookingSession(sessionId, {
        ...completionData,
        completed: true,
      });
      
      // Update user's pantry with remaining ingredients
      await storage.updateUserProfile(userId, {
        pantryIngredients: completionData.ingredientsRemaining,
      });
      
      res.json(session);
    } catch (error) {
      console.error("Error completing cooking session:", error);
      res.status(500).json({ message: "Failed to complete cooking session" });
    }
  });

  // Get user's cooking session history
  app.get('/api/cooking/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const firebaseUser: FirebaseUser = req.firebaseUser;
      const userId = firebaseUser.uid;
      const limit = Math.min(parseInt(req.query.limit as string) || 200, 200);
      
      const sessions = await storage.getUserCookingSessions(userId, limit);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching cooking sessions:", error);
      res.status(500).json({ message: "Failed to fetch cooking sessions" });
    }
  });

  // Get active cooking session (if any)
  app.get('/api/cooking/session/active', isAuthenticated, async (req: any, res) => {
    try {
      const firebaseUser: FirebaseUser = req.firebaseUser;
      const userId = firebaseUser.uid;
      const session = await storage.getActiveCookingSession(userId);
      res.json(session || null);
    } catch (error) {
      console.error("Error fetching active cooking session:", error);
      res.status(500).json({ message: "Failed to fetch active cooking session" });
    }
  });

  // Delete a single cooking session (ownership-verified)
  app.delete('/api/cooking/session/:id', isAuthenticated, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const firebaseUser: FirebaseUser = req.firebaseUser;
      const userId = firebaseUser.uid;
      
      const deleted = await storage.deleteCookingSession(sessionId, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Session not found or not owned by user" });
      }
      res.json({ message: "Session deleted" });
    } catch (error) {
      console.error("Error deleting cooking session:", error);
      res.status(500).json({ message: "Failed to delete cooking session" });
    }
  });

  // Delete all cooking sessions for the authenticated user
  app.delete('/api/cooking/sessions/all', isAuthenticated, async (req: any, res) => {
    try {
      const firebaseUser: FirebaseUser = req.firebaseUser;
      const userId = firebaseUser.uid;
      
      const count = await storage.deleteAllCookingSessions(userId);
      res.json({ message: `Deleted ${count} sessions`, count });
    } catch (error) {
      console.error("Error deleting all cooking sessions:", error);
      res.status(500).json({ message: "Failed to delete cooking sessions" });
    }
  });

  // Clear/reset user pantry (for pantry rescan)
  app.post('/api/user/pantry/reset', isAuthenticated, async (req: any, res) => {
    try {
      const firebaseUser: FirebaseUser = req.firebaseUser;
      const userId = firebaseUser.uid;
      
      // Clear pantry ingredients
      const updatedUser = await storage.updateUserProfile(userId, {
        pantryIngredients: [],
      });
      
      res.json({ 
        message: "Pantry reset successfully", 
        pantryIngredients: updatedUser.pantryIngredients 
      });
    } catch (error) {
      console.error("Error resetting pantry:", error);
      res.status(500).json({ message: "Failed to reset pantry" });
    }
  });

  // Feedback submission endpoint
  app.post('/api/feedback', async (req, res) => {
    try {
      const feedbackData = insertFeedbackSchema.parse(req.body);
      
      // Optional: add user ID if authenticated (not required per user specs)
      let authUserId = null;
      if (req.headers.authorization) {
        try {
          const token = req.headers.authorization.replace('Bearer ', '');
          
          // Manually decode the JWT token for user ID
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            const userId = payload.sub || payload.user_id || payload.uid;
            if (userId) {
              authUserId = userId;
            }
          }
        } catch {
          // Ignore auth errors - feedback can be anonymous
        }
      }
      
      // Insert feedback into database
      const newFeedback = await db.insert(feedback).values({
        ...feedbackData,
        authUserId,
      }).returning();
      
      res.json({ 
        success: true, 
        message: "Feedback received successfully",
        id: newFeedback[0].id 
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      res.status(500).json({ message: "Failed to submit feedback" });
    }
  });

  registerAdminRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
