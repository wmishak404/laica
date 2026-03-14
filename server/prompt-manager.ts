import { db } from "./db";
import { promptVersions } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import type { FeatureType } from "./eval-criteria";

// ─────────────────────────────────────────────────────────────────────────────
// In-memory cache — avoids a DB hit on every single AI call.
// Invalidated when a prompt is activated or created.
// ─────────────────────────────────────────────────────────────────────────────
const cache: Record<string, { prompt: string; cachedAt: number }> = {};
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getActivePrompt(featureType: FeatureType): Promise<string | null> {
  const now = Date.now();
  const cached = cache[featureType];
  if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
    return cached.prompt;
  }

  try {
    const versions = await db
      .select()
      .from(promptVersions)
      .where(and(eq(promptVersions.featureType, featureType), eq(promptVersions.isActive, true)))
      .limit(1);

    if (versions.length === 0) return null;

    const prompt = versions[0].systemPrompt;
    cache[featureType] = { prompt, cachedAt: now };
    return prompt;
  } catch (err) {
    console.error(`[prompt-manager] Failed to load active prompt for ${featureType}:`, err);
    return null;
  }
}

export async function createPromptVersion(
  featureType: FeatureType,
  systemPrompt: string,
  versionNote: string,
  realExamplesUsed?: any[]
): Promise<number> {
  await db
    .update(promptVersions)
    .set({ isActive: false })
    .where(and(eq(promptVersions.featureType, featureType), eq(promptVersions.isActive, true)));

  const result = await db
    .insert(promptVersions)
    .values({
      featureType,
      systemPrompt,
      isActive: true,
      versionNote,
      realExamplesUsed: realExamplesUsed || [],
      activatedAt: new Date(),
    })
    .returning({ id: promptVersions.id });

  delete cache[featureType];
  return result[0].id;
}

export async function activatePromptVersion(id: number): Promise<void> {
  const version = await db
    .select()
    .from(promptVersions)
    .where(eq(promptVersions.id, id))
    .limit(1);

  if (version.length === 0) throw new Error(`Prompt version ${id} not found`);

  const featureType = version[0].featureType as FeatureType;

  await db
    .update(promptVersions)
    .set({ isActive: false })
    .where(and(eq(promptVersions.featureType, featureType), eq(promptVersions.isActive, true)));

  await db
    .update(promptVersions)
    .set({ isActive: true, activatedAt: new Date() })
    .where(eq(promptVersions.id, id));

  delete cache[featureType];
}

export async function getPromptVersionHistory(featureType: FeatureType) {
  return db
    .select()
    .from(promptVersions)
    .where(eq(promptVersions.featureType, featureType))
    .orderBy(promptVersions.createdAt);
}

export async function getAllActivePrompts() {
  return db.select().from(promptVersions).where(eq(promptVersions.isActive, true));
}
