import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  preferences: jsonb("preferences"),
  createdAt: timestamp("created_at").defaultNow(),
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  groceryLists: many(groceryLists),
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
  items: many(groceryItems),
}));

export const groceryItemsRelations = relations(groceryItems, ({ one }) => ({
  list: one(groceryLists, {
    fields: [groceryItems.listId],
    references: [groceryLists.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  preferences: true,
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

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;

export type Ingredient = typeof ingredients.$inferSelect;
export type InsertIngredient = z.infer<typeof insertIngredientSchema>;

export type GroceryList = typeof groceryLists.$inferSelect;
export type InsertGroceryList = z.infer<typeof insertGroceryListSchema>;

export type GroceryItem = typeof groceryItems.$inferSelect;
export type InsertGroceryItem = z.infer<typeof insertGroceryItemSchema>;
