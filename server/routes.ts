import express, { type Express, type RequestHandler } from "express";
import { createServer, type Server } from "http";
import { registerAdminRoutes } from "./admin-routes";
import { storage } from "./storage";
import { getFirebaseUserFromRequest, verifyFirebaseToken, type FirebaseUser } from "./firebaseAuth";
import { getRecipeSuggestions, getCookingSteps, getGroceryList, getIngredientAlternatives, getCookingAssistance, analyzeIngredientImage, getSlopBowlRecipe } from "./openai";
import { synthesizeSpeech, getAvailableVoices, COOKING_VOICES } from "./elevenlabs";
import {
  aiUserDayLimit,
  aiUserHourLimit,
  aiIpHourLimit,
  feedbackIpLimit,
  recipeIpHourLimit,
  recipeUserDayLimit,
  recipeUserHourLimit,
  slopBowlIpHourLimit,
  slopBowlUserDayLimit,
  slopBowlUserHourLimit,
  speechIpHourLimit,
  speechUserDayLimit,
  speechUserHourLimit,
  visionIpShortLimit,
  visionUserDayLimit,
  visionUserShortLimit,
  voiceIpHourLimit,
  voiceUserDayLimit,
  voiceUserHourLimit,
} from "./rate-limit";
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
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Firebase/Google authentication middleware only
const isAuthenticated: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return verifyFirebaseToken(req, res, next);
  }
  return res.status(401).json({ message: "Unauthorized" });
};

const visionJsonParser = express.json({ limit: "6mb" });
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const pantryItemSchema = z.string().trim().min(1).max(64);
const shortTextSchema = z.string().trim().min(1).max(280);

function parseSessionId(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

const requireCookingSessionOwnership: RequestHandler = async (req: any, res, next) => {
  try {
    const sessionId = parseSessionId(req.params.id);
    if (!sessionId) {
      return res.status(400).json({ message: "Invalid cooking session id" });
    }

    const firebaseUser: FirebaseUser = req.firebaseUser;
    const session = await storage.getCookingSession(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Cooking session not found" });
    }

    if (session.authUserId !== firebaseUser.uid) {
      return res.status(403).json({ message: "Cooking session does not belong to this user" });
    }

    req.cookingSession = session;
    next();
  } catch (error) {
    console.error("Error checking cooking session ownership:", error);
    res.status(500).json({ message: "Failed to verify cooking session ownership" });
  }
};

function normalizeImageBase64(image: string): string {
  const withoutPrefix = image.includes("data:image") ? image.split(",")[1] : image;
  return withoutPrefix.replace(/\s/g, "");
}

function decodeBase64Image(image: string): Buffer | null {
  if (!image || image.length % 4 === 1 || !/^[A-Za-z0-9+/]+={0,2}$/.test(image)) {
    return null;
  }

  const buffer = Buffer.from(image, "base64");
  if (buffer.length === 0) {
    return null;
  }

  const normalizedInput = image.replace(/=+$/, "");
  const normalizedEncoded = buffer.toString("base64").replace(/=+$/, "");
  return normalizedInput === normalizedEncoded ? buffer : null;
}

function tooLargeImageResponse(res: any) {
  return res.status(413).json({ error: "Image is too large. Please upload an image under 4 MB." });
}

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

async function getRecentCookingSessionsOrEmpty(userId: string, limit: number, context: string) {
  try {
    return await storage.getUserCookingSessions(userId, limit);
  } catch (error) {
    console.warn(
      `[${context}] Recent cooking sessions unavailable; continuing without history:`,
      error instanceof Error ? error.message : error,
    );
    return [];
  }
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
  app.post('/api/recipes/suggestions', isAuthenticated, recipeIpHourLimit, recipeUserHourLimit, recipeUserDayLimit, async (req, res) => {
    try {
      const schema = z.object({
        preferences: z.string().trim().min(1).max(500),
        ingredients: z.array(pantryItemSchema).optional()
      });
      
      const { preferences, ingredients } = schema.parse(req.body);
      const suggestions = await getRecipeSuggestions(preferences, ingredients);
      res.json(suggestions);
    } catch (error) {
      console.error('Error in recipe suggestions:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid recipe suggestions request' });
      }
      res.status(500).json({ error: 'Failed to get recipe suggestions' });
    }
  });
  
  // Pantry-based recipe suggestions endpoint
  app.post('/api/recipes/pantry', isAuthenticated, recipeIpHourLimit, recipeUserHourLimit, recipeUserDayLimit, async (req, res) => {
    try {
      const schema = z.object({
        ingredients: z.array(pantryItemSchema),
        preferences: z.string().trim().max(500).optional(),
        timeAvailable: z.string().trim().max(64).optional()
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid pantry recipe request' });
      }
      res.status(500).json({ error: 'Failed to get pantry-based recipe suggestions' });
    }
  });

  app.post('/api/recipes/slop-bowl', isAuthenticated, slopBowlIpHourLimit, slopBowlUserHourLimit, slopBowlUserDayLimit, async (req: any, res) => {
    try {
      const firebaseUser: FirebaseUser = req.firebaseUser;
      const userId = firebaseUser.uid;
      const schema = z.object({
        pantryOverride: z.array(pantryItemSchema).optional(),
        feedback: shortTextSchema.optional(),
        previousRecipe: z.string().trim().min(1).max(200).optional(),
      });

      const { pantryOverride, feedback, previousRecipe } = schema.parse(req.body);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const ingredients = pantryOverride ?? user.pantryIngredients ?? [];
      const distinctIngredients = Array.from(
        new Set(ingredients.map((ingredient) => ingredient.trim().toLowerCase()).filter(Boolean))
      );

      if (distinctIngredients.length < 3) {
        return res.status(422).json({
          code: "SLOP_BOWL_TOO_FEW_INGREDIENTS",
          message: "Add at least 3 ingredients before generating a Slop Bowl.",
        });
      }

      if (!user.cookingSkill || !user.weeklyTime) {
        return res.status(400).json({ message: "Complete your cooking skill and weekly time profile before generating a Slop Bowl" });
      }

      const sessions = await getRecentCookingSessionsOrEmpty(userId, 10, "slop-bowl");
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
  app.post('/api/cooking/steps', isAuthenticated, aiIpHourLimit, aiUserHourLimit, aiUserDayLimit, async (req, res) => {
    try {
      const schema = z.object({
        recipeName: z.string().trim().min(1).max(200),
        ingredients: z.array(pantryItemSchema).optional(),
        equipment: z.array(pantryItemSchema).optional(),
        description: z.string().trim().max(1000).optional(),
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
  app.post('/api/ingredients/alternatives', isAuthenticated, aiIpHourLimit, aiUserHourLimit, aiUserDayLimit, async (req, res) => {
    try {
      const schema = z.object({
        ingredient: pantryItemSchema,
        reason: shortTextSchema
      });
      
      const { ingredient, reason } = schema.parse(req.body);
      const alternatives = await getIngredientAlternatives(ingredient, reason);
      res.json(alternatives);
    } catch (error) {
      console.error('Error in ingredient alternatives:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid ingredient alternatives request' });
      }
      res.status(500).json({ error: 'Failed to get ingredient alternatives' });
    }
  });

  // Cooking assistance endpoint
  app.post('/api/cooking/assistance', isAuthenticated, voiceIpHourLimit, voiceUserHourLimit, voiceUserDayLimit, async (req, res) => {
    try {
      const schema = z.object({
        step: z.string().trim().min(1).max(4000),
        question: z.string().trim().max(2000).optional()
      });
      
      const { step, question } = schema.parse(req.body);
      const assistance = await getCookingAssistance(step, question);
      res.send(assistance);
    } catch (error) {
      console.error('Error in cooking assistance:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid cooking assistance request' });
      }
      res.status(500).json({ error: 'Failed to get cooking assistance' });
    }
  });

  // Image analysis endpoint with HEIC conversion support
  app.post('/api/vision/analyze', isAuthenticated, visionIpShortLimit, visionUserShortLimit, visionUserDayLimit, visionJsonParser, async (req, res) => {
    try {
      const schema = z.object({
        image: z.string().min(1),
        isHEIC: z.boolean().optional()
      });
      
      const { image, isHEIC } = schema.parse(req.body);
      let processedImage = normalizeImageBase64(image);
      
      // Validate base64 format
      const imageBuffer = decodeBase64Image(processedImage);
      if (!imageBuffer) {
        return res.status(400).json({ error: 'Invalid image data provided' });
      }

      if (imageBuffer.length > MAX_IMAGE_BYTES) {
        return tooLargeImageResponse(res);
      }
      
      // Convert HEIC to JPEG if needed
      if (isHEIC) {
        try {
          const outputBuffer = await heicConvert({
            buffer: imageBuffer,
            format: 'JPEG',
            quality: 0.8
          });
          const convertedBuffer = outputBuffer as Buffer;
          if (convertedBuffer.length > MAX_IMAGE_BYTES) {
            return tooLargeImageResponse(res);
          }
          processedImage = convertedBuffer.toString('base64');
        } catch (conversionError) {
          console.error('HEIC conversion failed:', conversionError);
          return res.status(400).json({ error: 'Failed to convert HEIC image. Please try a different format.' });
        }
      }

      const analysis = await analyzeIngredientImage(processedImage);
      res.json(analysis);
    } catch (error) {
      console.error('Error in image analysis:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid image analysis request' });
      }
      res.status(500).json({ error: 'Failed to analyze image' });
    }
  });

  // ElevenLabs voice synthesis routes
  app.post('/api/speech/synthesize', isAuthenticated, speechIpHourLimit, speechUserHourLimit, speechUserDayLimit, async (req, res) => {
    try {
      const schema = z.object({
        text: z.string().min(1).max(4000),
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid speech synthesis request' });
      }
      res.status(500).json({ error: 'Failed to synthesize speech' });
    }
  });

  // Get available voices
  app.get('/api/speech/voices', isAuthenticated, speechIpHourLimit, speechUserHourLimit, speechUserDayLimit, async (req, res) => {
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
  app.post('/api/speech/transcribe', isAuthenticated, speechIpHourLimit, speechUserHourLimit, speechUserDayLimit, upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Audio file is required' });
      }

      console.info('Received audio file for transcription:', {
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

        res.json({ 
          transcription: transcription.trim().slice(0, 2000),
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
      const sessions = await getRecentCookingSessionsOrEmpty(userId, 5, "user-profile");
      
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
      const profileData = updateUserProfileSchema.extend({
        pantryIngredients: z.array(pantryItemSchema).optional(),
        kitchenEquipment: z.array(pantryItemSchema).optional(),
        dietaryRestrictions: z.array(pantryItemSchema).optional(),
        favoriteChefs: z.array(z.string().trim().min(1).max(100)).optional(),
      }).parse(req.body);
      
      const updatedUser = await storage.updateUserProfile(userId, profileData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user profile request" });
      }
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
  app.put('/api/cooking/session/:id', isAuthenticated, requireCookingSessionOwnership, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const schema = z.object({
        completedSteps: z.number().optional(),
        completed: z.boolean().optional(),
        ingredientsRemaining: z.array(pantryItemSchema).optional(),
        cookingDuration: z.number().optional(),
        userRating: z.number().min(1).max(5).optional(),
        userNotes: z.string().trim().max(280).optional(),
      });
      
      const updateData = schema.parse(req.body);
      
      const session = await storage.updateCookingSession(sessionId, updateData);
      res.json(session);
    } catch (error) {
      console.error("Error updating cooking session:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid cooking session update" });
      }
      res.status(500).json({ message: "Failed to update cooking session" });
    }
  });

  // Complete cooking session and update pantry
  app.post('/api/cooking/session/:id/complete', isAuthenticated, requireCookingSessionOwnership, async (req: any, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      
      const schema = z.object({
        ingredientsRemaining: z.array(pantryItemSchema),
        userRating: z.number().min(1).max(5).optional(),
        userNotes: z.string().trim().max(280).optional(),
        cookingDuration: z.number(),
        completedSteps: z.number(),
      });
      
      const completionData = schema.parse(req.body);
      
      // Update session as completed
      const session = await storage.updateCookingSession(sessionId, {
        ...completionData,
        completed: true,
      });

      res.json(session);
    } catch (error) {
      console.error("Error completing cooking session:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid cooking session completion" });
      }
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
  app.delete('/api/cooking/session/:id', isAuthenticated, requireCookingSessionOwnership, async (req: any, res) => {
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
  app.post('/api/feedback', feedbackIpLimit, async (req, res) => {
    try {
      const feedbackData = insertFeedbackSchema.extend({
        currentPage: z.string().trim().min(1).max(120),
        feedbackText: shortTextSchema,
      }).parse(req.body);
      
      // Optional: add user ID if authenticated (not required per user specs)
      let authUserId = null;
      if (req.headers.authorization) {
        try {
          const firebaseUser = await getFirebaseUserFromRequest(req);
          authUserId = firebaseUser?.uid ?? null;
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid feedback request" });
      }
      res.status(500).json({ message: "Failed to submit feedback" });
    }
  });

  registerAdminRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
