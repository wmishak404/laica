import {
  anonymousRecipeUsage,
  authUsers,
  users,
  cookingSessions,
  userSettings,
  type AuthUser,
  type AnonymousRecipeUsage,
  type User,
  type UpsertUser,
  type InsertUser,
  type CookingSession,
  type InsertCookingSession,
  type UserSettings,
  type InsertUserSettings,
  type UpdateUserProfile,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, lt, sql } from "drizzle-orm";

export interface AnonymousRecipeQuota {
  limit: number;
  used: number;
  remaining: number;
}

export interface AnonymousRecipeQuotaReservation {
  allowed: boolean;
  quota: AnonymousRecipeQuota;
}

export type UpsertUserSettingsInput = Partial<Omit<InsertUserSettings, "authUserId">>;

// Interface for storage operations
export interface IStorage {
  // User operations for Replit Auth
  getUser(id: string): Promise<AuthUser | undefined>;
  upsertUser(user: UpsertUser): Promise<AuthUser>;
  updateUserProfile(id: string, profile: UpdateUserProfile): Promise<AuthUser>;
  getAnonymousRecipeQuota(firebaseUid: string, limit: number): Promise<AnonymousRecipeQuota>;
  reserveAnonymousRecipeGeneration(firebaseUid: string, limit: number): Promise<AnonymousRecipeQuotaReservation>;
  refundAnonymousRecipeGeneration(firebaseUid: string, limit: number): Promise<AnonymousRecipeQuota>;
  
  // User settings operations
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  upsertUserSettings(userId: string, settings: UpsertUserSettingsInput): Promise<UserSettings>;
  updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<UserSettings>;
  
  // Cooking session operations
  createCookingSession(session: InsertCookingSession): Promise<CookingSession>;
  getCookingSession(id: number): Promise<CookingSession | undefined>;
  updateCookingSession(id: number, session: Partial<CookingSession>): Promise<CookingSession>;
  getUserCookingSessions(userId: string, limit?: number): Promise<CookingSession[]>;
  getActiveCookingSession(userId: string): Promise<CookingSession | undefined>;
  deleteCookingSession(id: number, userId: string): Promise<boolean>;
  deleteAllCookingSessions(userId: string): Promise<number>;
  
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
    try {
      // Use Drizzle's onConflictDoUpdate for proper upsert with Firebase user ID
      const [user] = await db
        .insert(authUsers)
        .values(userData)
        .onConflictDoUpdate({
          target: authUsers.id,
          set: {
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    } catch (error) {
      console.error('Upsert user error:', error);
      throw error;
    }
  }

  async updateUserProfile(id: string, profile: UpdateUserProfile): Promise<AuthUser> {
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

  private anonymousQuotaFromUsage(
    usage: Pick<AnonymousRecipeUsage, "successfulGenerations"> | undefined,
    limit: number,
  ): AnonymousRecipeQuota {
    const used = Math.max(0, usage?.successfulGenerations ?? 0);
    return {
      limit,
      used,
      remaining: Math.max(0, limit - used),
    };
  }

  async getAnonymousRecipeQuota(firebaseUid: string, limit: number): Promise<AnonymousRecipeQuota> {
    const [usage] = await db
      .select()
      .from(anonymousRecipeUsage)
      .where(eq(anonymousRecipeUsage.firebaseUid, firebaseUid))
      .limit(1);

    return this.anonymousQuotaFromUsage(usage, limit);
  }

  async reserveAnonymousRecipeGeneration(
    firebaseUid: string,
    limit: number,
  ): Promise<AnonymousRecipeQuotaReservation> {
    const now = new Date();
    const [usage] = await db
      .insert(anonymousRecipeUsage)
      .values({
        firebaseUid,
        successfulGenerations: 1,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: anonymousRecipeUsage.firebaseUid,
        set: {
          successfulGenerations: sql`${anonymousRecipeUsage.successfulGenerations} + 1`,
          updatedAt: now,
        },
        where: lt(anonymousRecipeUsage.successfulGenerations, limit),
      })
      .returning();

    if (!usage) {
      return {
        allowed: false,
        quota: await this.getAnonymousRecipeQuota(firebaseUid, limit),
      };
    }

    return {
      allowed: true,
      quota: this.anonymousQuotaFromUsage(usage, limit),
    };
  }

  async refundAnonymousRecipeGeneration(firebaseUid: string, limit: number): Promise<AnonymousRecipeQuota> {
    const [usage] = await db
      .update(anonymousRecipeUsage)
      .set({
        successfulGenerations: sql`greatest(${anonymousRecipeUsage.successfulGenerations} - 1, 0)`,
        updatedAt: new Date(),
      })
      .where(eq(anonymousRecipeUsage.firebaseUid, firebaseUid))
      .returning();

    return this.anonymousQuotaFromUsage(usage, limit);
  }

  // User settings operations
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.authUserId, userId));
    return settings;
  }

  async upsertUserSettings(userId: string, settingsData: UpsertUserSettingsInput): Promise<UserSettings> {
    const [settings] = await db
      .insert(userSettings)
      .values({ authUserId: userId, ...settingsData })
      .onConflictDoUpdate({
        target: userSettings.authUserId,
        set: {
          ...settingsData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return settings;
  }

  async updateUserSettings(userId: string, settingsData: Partial<UserSettings>): Promise<UserSettings> {
    const [settings] = await db
      .update(userSettings)
      .set({
        ...settingsData,
        updatedAt: new Date(),
      })
      .where(eq(userSettings.authUserId, userId))
      .returning();
    return settings;
  }

  // Cooking session operations
  async createCookingSession(sessionData: InsertCookingSession): Promise<CookingSession> {
    const [session] = await db
      .insert(cookingSessions)
      .values(sessionData)
      .returning();
    return session;
  }

  async getCookingSession(id: number): Promise<CookingSession | undefined> {
    const [session] = await db
      .select()
      .from(cookingSessions)
      .where(eq(cookingSessions.id, id))
      .limit(1);
    return session;
  }

  async updateCookingSession(id: number, sessionData: Partial<CookingSession>): Promise<CookingSession> {
    const [session] = await db
      .update(cookingSessions)
      .set({
        ...sessionData,
        completedAt: sessionData.completed ? new Date() : undefined,
      })
      .where(eq(cookingSessions.id, id))
      .returning();
    return session;
  }

  async getUserCookingSessions(userId: string, limit: number = 10): Promise<CookingSession[]> {
    const sessions = await db
      .select()
      .from(cookingSessions)
      .where(eq(cookingSessions.authUserId, userId))
      .orderBy(desc(cookingSessions.startedAt))
      .limit(limit);
    return sessions;
  }

  async getActiveCookingSession(userId: string): Promise<CookingSession | undefined> {
    const [session] = await db
      .select()
      .from(cookingSessions)
      .where(eq(cookingSessions.authUserId, userId))
      .orderBy(desc(cookingSessions.startedAt))
      .limit(1);
    return session?.completed === false ? session : undefined;
  }

  async deleteCookingSession(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(cookingSessions)
      .where(and(eq(cookingSessions.id, id), eq(cookingSessions.authUserId, userId)))
      .returning();
    return result.length > 0;
  }

  async deleteAllCookingSessions(userId: string): Promise<number> {
    const result = await db
      .delete(cookingSessions)
      .where(eq(cookingSessions.authUserId, userId))
      .returning();
    return result.length;
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
