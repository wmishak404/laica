import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { registerUser, loginUser } from "./localAuth";
import { getRecipeSuggestions, getCookingSteps, getGroceryList, getIngredientAlternatives, getCookingAssistance, analyzeIngredientImage } from "./openai";
import { synthesizeSpeech, getAvailableVoices, COOKING_VOICES } from "./elevenlabs";
import { 
  updateUserProfileSchema, 
  insertUserSettingsSchema, 
  insertCookingSessionSchema,
} from "@shared/schema";
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
      
      // Check Replit auth using middleware pattern
      return isAuthenticated(req, res, async () => {
        if (req.user?.claims?.sub) {
          const userId = req.user.claims.sub;
          const user = await storage.getUser(userId);
          if (user) {
            return res.json({ ...user, authType: 'oauth' });
          }
        }
        return res.status(401).json({ message: "Unauthorized" });
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to fetch user" });
      }
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
      const userId = req.user.claims.sub;
      
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const schema = z.object({
        recipeName: z.string(),
        recipeDescription: z.string().optional(),
        ingredientsUsed: z.array(z.string()),
        totalSteps: z.number(),
      });
      
      const sessionData = schema.parse(req.body);
      
      const session = await storage.createCookingSession({
        authUserId: userId,
        ...sessionData,
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
      const userId = req.user.claims.sub;
      
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
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 10;
      
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
      const userId = req.user.claims.sub;
      const session = await storage.getActiveCookingSession(userId);
      res.json(session || null);
    } catch (error) {
      console.error("Error fetching active cooking session:", error);
      res.status(500).json({ message: "Failed to fetch active cooking session" });
    }
  });

  // Clear/reset user pantry (for pantry rescan)
  app.post('/api/user/pantry/reset', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
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

  const httpServer = createServer(app);
  return httpServer;
}
