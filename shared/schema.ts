import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Legacy users table (keeping existing structure)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  preferences: jsonb("preferences"),
  createdAt: timestamp("created_at").defaultNow(),
});

// New auth users table for Replit Auth
export const authUsers = pgTable("auth_users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  
  // Cooking app specific fields
  cookingSkill: varchar("cooking_skill"),
  dietaryRestrictions: text("dietary_restrictions").array(),
  weeklyTime: varchar("weekly_time"),
  pantryIngredients: text("pantry_ingredients").array(),
  kitchenEquipment: text("kitchen_equipment").array(),
  favoriteChefs: text("favorite_chefs").array(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  cookTime: integer("cook_time").notNull(), // in minutes
  difficulty: text("difficulty").notNull(),
  servings: integer("servings").notNull(),
  rating: integer("rating"),
  steps: jsonb("steps").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ingredients = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull(),
  name: text("name").notNull(),
  quantity: text("quantity").notNull(),
  unit: text("unit"),
  category: text("category"),
});

export const groceryLists = pgTable("grocery_lists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  authUserId: varchar("auth_user_id"),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const groceryItems = pgTable("grocery_items", {
  id: serial("id").primaryKey(),
  listId: integer("list_id").notNull(),
  name: text("name").notNull(),
  quantity: text("quantity").notNull(),
  unit: text("unit"),
  category: text("category").notNull(),
  price: text("price"),
  purchased: boolean("purchased").default(false),
});

// Cooking sessions table to track user cooking history
export const cookingSessions = pgTable("cooking_sessions", {
  id: serial("id").primaryKey(),
  authUserId: varchar("auth_user_id").notNull(),
  recipeName: text("recipe_name").notNull(),
  recipeDescription: text("recipe_description"),
  ingredientsUsed: text("ingredients_used").array(),
  ingredientsRemaining: text("ingredients_remaining").array(),
  cookingDuration: integer("cooking_duration"), // in minutes
  completedSteps: integer("completed_steps"),
  totalSteps: integer("total_steps"),
  completed: boolean("completed").default(false),
  userRating: integer("user_rating"), // 1-5 stars
  userNotes: text("user_notes"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// User settings table for preferences and app settings
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  authUserId: varchar("auth_user_id").notNull().unique(),
  voiceEnabled: boolean("voice_enabled").default(true),
  useElevenLabs: boolean("use_eleven_labs").default(true),
  voiceStability: integer("voice_stability").default(60), // 0-100
  voiceSimilarity: integer("voice_similarity").default(70), // 0-100
  captionSize: integer("caption_size").default(16), // pixels
  cameraMode: varchar("camera_mode").default('front'), // 'front' or 'back'
  lastActiveRecipe: text("last_active_recipe"),
  lastActiveStep: integer("last_active_step"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  groceryLists: many(groceryLists),
}));

export const authUsersRelations = relations(authUsers, ({ many, one }) => ({
  groceryLists: many(groceryLists),
  cookingSessions: many(cookingSessions),
  settings: one(userSettings),
}));

export const recipesRelations = relations(recipes, ({ many }) => ({
  ingredients: many(ingredients),
}));

export const ingredientsRelations = relations(ingredients, ({ one }) => ({
  recipe: one(recipes, {
    fields: [ingredients.recipeId],
    references: [recipes.id],
  }),
}));

export const groceryListsRelations = relations(groceryLists, ({ one, many }) => ({
  user: one(users, {
    fields: [groceryLists.userId],
    references: [users.id],
  }),
  authUser: one(authUsers, {
    fields: [groceryLists.authUserId],
    references: [authUsers.id],
  }),
  items: many(groceryItems),
}));

export const groceryItemsRelations = relations(groceryItems, ({ one }) => ({
  list: one(groceryLists, {
    fields: [groceryItems.listId],
    references: [groceryLists.id],
  }),
}));

export const cookingSessionsRelations = relations(cookingSessions, ({ one }) => ({
  authUser: one(authUsers, {
    fields: [cookingSessions.authUserId],
    references: [authUsers.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  authUser: one(authUsers, {
    fields: [userSettings.authUserId],
    references: [authUsers.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users);

export const upsertUserSchema = createInsertSchema(authUsers).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertRecipeSchema = createInsertSchema(recipes).pick({
  name: true,
  description: true,
  imageUrl: true,
  cookTime: true,
  difficulty: true, 
  servings: true,
  rating: true,
  steps: true,
});

export const insertIngredientSchema = createInsertSchema(ingredients).pick({
  recipeId: true,
  name: true,
  quantity: true,
  unit: true,
  category: true,
});

export const insertGroceryListSchema = createInsertSchema(groceryLists).pick({
  userId: true,
  name: true,
});

export const insertGroceryItemSchema = createInsertSchema(groceryItems).pick({
  listId: true,
  name: true,
  quantity: true,
  unit: true,
  category: true,
  price: true,
  purchased: true,
});

export const insertCookingSessionSchema = createInsertSchema(cookingSessions).pick({
  authUserId: true,
  recipeName: true,
  recipeDescription: true,
  ingredientsUsed: true,
  ingredientsRemaining: true,
  cookingDuration: true,
  completedSteps: true,
  totalSteps: true,
  completed: true,
  userRating: true,
  userNotes: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).pick({
  authUserId: true,
  voiceEnabled: true,
  useElevenLabs: true,
  voiceStability: true,
  voiceSimilarity: true,
  captionSize: true,
  cameraMode: true,
  lastActiveRecipe: true,
  lastActiveStep: true,
});

export const updateUserProfileSchema = createInsertSchema(authUsers).pick({
  cookingSkill: true,
  dietaryRestrictions: true,
  weeklyTime: true,
  pantryIngredients: true,
  kitchenEquipment: true,
  favoriteChefs: true,
}).partial();

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type AuthUser = typeof authUsers.$inferSelect;
export type UpsertUser = z.infer<typeof upsertUserSchema>;

export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;

export type Ingredient = typeof ingredients.$inferSelect;
export type InsertIngredient = z.infer<typeof insertIngredientSchema>;

export type GroceryList = typeof groceryLists.$inferSelect;
export type InsertGroceryList = z.infer<typeof insertGroceryListSchema>;

export type GroceryItem = typeof groceryItems.$inferSelect;
export type InsertGroceryItem = z.infer<typeof insertGroceryItemSchema>;

export type CookingSession = typeof cookingSessions.$inferSelect;
export type InsertCookingSession = z.infer<typeof insertCookingSessionSchema>;

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;

export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
