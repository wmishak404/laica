import {
  authUsers,
  users,
  type AuthUser,
  type User,
  type UpsertUser,
  type InsertUser,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations for Replit Auth
  getUser(id: string): Promise<AuthUser | undefined>;
  upsertUser(user: UpsertUser): Promise<AuthUser>;
  updateUserProfile(id: string, profile: Partial<AuthUser>): Promise<AuthUser>;
  
  // Local authentication operations
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createLocalUser(user: InsertUser): Promise<User>;
  getLocalUser(id: number): Promise<User | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations for Replit Auth
  async getUser(id: string): Promise<AuthUser | undefined> {
    const [user] = await db.select().from(authUsers).where(eq(authUsers.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<AuthUser> {
    const [user] = await db
      .insert(authUsers)
      .values(userData)
      .onConflictDoUpdate({
        target: authUsers.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserProfile(id: string, profile: Partial<AuthUser>): Promise<AuthUser> {
    const [user] = await db
      .update(authUsers)
      .set({
        ...profile,
        updatedAt: new Date(),
      })
      .where(eq(authUsers.id, id))
      .returning();
    return user;
  }

  // Local authentication operations
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createLocalUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async getLocalUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
}

export const storage = new DatabaseStorage();
