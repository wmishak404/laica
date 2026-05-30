import type { Request, RequestHandler, Response } from "express";
import { rateLimit } from "express-rate-limit";
import { SCAN_IMAGES_PER_DAY } from "@shared/scan-policy";
import { lt, sql } from "drizzle-orm";

type RateLimitKey =
  | "app"
  | "api"
  | "vision"
  | "recipe"
  | "slopBowl"
  | "ai"
  | "voice"
  | "speech"
  | "feedback";
type RateLimitWindow = "short" | "burst" | "hour" | "day";

interface RateLimitOptions {
  name: string;
  windowMs: number;
  max: number;
  keyGenerator: (req: Request) => string;
}

interface Bucket {
  count: number;
  resetAt: number;
}

export const RATE_LIMIT_BUCKET_CAP = 10_000;
const RATE_LIMIT_BUCKET_PRUNE_INTERVAL_MS = 60_000;
const DISTRIBUTED_RATE_LIMIT_PRUNE_INTERVAL_MS = 60 * 60 * 1000;
const DISTRIBUTED_RATE_LIMIT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

const buckets = new Map<string, Bucket>();
let lastBucketPruneAt = 0;
let lastDistributedPruneAt = 0;

type RateLimitDbDeps = {
  db: typeof import("./db").db;
  rateLimitBuckets: typeof import("@shared/schema").rateLimitBuckets;
};

let rateLimitDbDepsPromise: Promise<RateLimitDbDeps> | null = null;

function isDistributedRateLimitEnabled(nodeEnv = process.env.NODE_ENV): boolean {
  return nodeEnv === "production" && process.env.RATE_LIMIT_DISTRIBUTED !== "false";
}

async function loadRateLimitDbDeps(): Promise<RateLimitDbDeps> {
  if (!rateLimitDbDepsPromise) {
    rateLimitDbDepsPromise = Promise.all([import("./db"), import("@shared/schema")]).then(
      ([dbModule, schemaModule]) => ({
        db: dbModule.db,
        rateLimitBuckets: schemaModule.rateLimitBuckets,
      }),
    );
  }
  return rateLimitDbDepsPromise;
}

async function pruneDistributedBucketsIfNeeded(now: number): Promise<void> {
  if (now - lastDistributedPruneAt < DISTRIBUTED_RATE_LIMIT_PRUNE_INTERVAL_MS) {
    return;
  }

  lastDistributedPruneAt = now;
  const cutoff = new Date(now - DISTRIBUTED_RATE_LIMIT_RETENTION_MS);
  try {
    const { db, rateLimitBuckets } = await loadRateLimitDbDeps();
    await db.delete(rateLimitBuckets).where(lt(rateLimitBuckets.windowStart, cutoff));
  } catch (error) {
    console.warn("[rate-limit] Failed to prune distributed buckets:", error);
  }
}

async function consumeRateLimitDistributed(
  { name, windowMs, max, keyGenerator }: RateLimitOptions,
  req: Request,
  res: Response,
  count = 1,
): Promise<boolean> {
  const safeCount = Number.isInteger(count) && count > 0 ? count : 1;
  const now = Date.now();
  await pruneDistributedBucketsIfNeeded(now);

  const windowStartMs = now - (now % windowMs);
  const windowStart = new Date(windowStartMs);
  const resetAtMs = windowStartMs + windowMs;

  const bucketKey = `${name}:${keyGenerator(req)}`;

  try {
    const { db, rateLimitBuckets } = await loadRateLimitDbDeps();
    const timestamp = new Date();
    const [bucket] = await db
      .insert(rateLimitBuckets)
      .values({
        bucketKey,
        windowStart,
        windowMs,
        count: safeCount,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .onConflictDoUpdate({
        target: [rateLimitBuckets.bucketKey, rateLimitBuckets.windowStart, rateLimitBuckets.windowMs],
        set: {
          count: sql`${rateLimitBuckets.count} + ${safeCount}`,
          updatedAt: timestamp,
        },
      })
      .returning({ count: rateLimitBuckets.count });

    const used = bucket?.count ?? safeCount;
    const remaining = Math.max(0, max - used);
    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(resetAtMs / 1000)));

    if (used > max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((resetAtMs - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSeconds));
      res.status(429).json({
        code: "RATE_LIMITED",
        message: "Too many requests. Try again later.",
      });
      return false;
    }

    return true;
  } catch (error) {
    console.warn("[rate-limit] Distributed limiter failed; falling back to in-memory limiter:", error);
    return consumeRateLimit({ name, windowMs, max, keyGenerator }, req, res, safeCount);
  }
}

function toRateLimitEnvSegment(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

export function getRateLimitEnvKey(key: RateLimitKey, window: RateLimitWindow): string {
  return `RATE_LIMIT_${toRateLimitEnvSegment(key)}_${toRateLimitEnvSegment(window)}`;
}

export function getConfiguredRateLimit(key: RateLimitKey, window: RateLimitWindow, fallback: number): number {
  const envKey = getRateLimitEnvKey(key, window);
  const rawValue = process.env[envKey];
  const parsed = rawValue ? Number.parseInt(rawValue, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getClientIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

export function getUserRateLimitKey(req: Request): string {
  const firebaseUser = (req as any).firebaseUser;
  if (firebaseUser?.isAnonymous) {
    return getClientIp(req);
  }

  return firebaseUser?.uid || getClientIp(req);
}

function getVisionScanContext(req: Request): string {
  const rawContext = req.headers["x-laica-scan-type"];
  const context = Array.isArray(rawContext) ? rawContext[0] : rawContext;

  if (context === "pantry" || context === "kitchen") {
    return context;
  }

  return "generic";
}

export function getVisionUserRateLimitKey(req: Request): string {
  return `${getUserRateLimitKey(req)}:${getVisionScanContext(req)}`;
}

export function getVisionIpRateLimitKey(req: Request): string {
  return `${getClientIp(req)}:${getVisionScanContext(req)}`;
}

function pruneExpiredBuckets(now: number): void {
  for (const [key, bucket] of Array.from(buckets.entries())) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

function pruneBucketsIfNeeded(now: number): void {
  if (now - lastBucketPruneAt < RATE_LIMIT_BUCKET_PRUNE_INTERVAL_MS) {
    return;
  }

  pruneExpiredBuckets(now);
  lastBucketPruneAt = now;
}

function enforceBucketCap(now: number): void {
  if (buckets.size <= RATE_LIMIT_BUCKET_CAP) {
    return;
  }

  pruneExpiredBuckets(now);

  while (buckets.size > RATE_LIMIT_BUCKET_CAP) {
    const oldestKey = buckets.keys().next().value;
    if (!oldestKey) {
      return;
    }
    buckets.delete(oldestKey);
  }
}

export function consumeRateLimit(
  { name, windowMs, max, keyGenerator }: RateLimitOptions,
  req: Request,
  res: Response,
  count = 1,
): boolean {
  const safeCount = Number.isInteger(count) && count > 0 ? count : 1;
  const now = Date.now();
  pruneBucketsIfNeeded(now);

  const key = `${name}:${keyGenerator(req)}`;
  const existing = buckets.get(key);
  const bucket = existing && existing.resetAt > now ? existing : { count: 0, resetAt: now + windowMs };

  bucket.count += safeCount;
  buckets.delete(key);
  buckets.set(key, bucket);
  enforceBucketCap(now);

  const remaining = Math.max(0, max - bucket.count);
  res.setHeader("X-RateLimit-Limit", String(max));
  res.setHeader("X-RateLimit-Remaining", String(remaining));
  res.setHeader("X-RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

  if (bucket.count > max) {
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    res.setHeader("Retry-After", String(retryAfterSeconds));
    res.status(429).json({
      code: "RATE_LIMITED",
      message: "Too many requests. Try again later.",
    });
    return false;
  }

  return true;
}

export function resetRateLimitBucketsForTest(): void {
  buckets.clear();
  lastBucketPruneAt = 0;
}

export function getRateLimitBucketCountForTest(): number {
  return buckets.size;
}

export function createRateLimit(options: RateLimitOptions): RequestHandler {
  if (isDistributedRateLimitEnabled()) {
    return async (req, res, next) => {
      if (!(await consumeRateLimitDistributed(options, req, res))) {
        return;
      }
      next();
    };
  }
  return (req, res, next) => {
    if (!consumeRateLimit(options, req, res)) {
      return;
    }
    next();
  };
}

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;

const standardRateLimitResponse = {
  code: "RATE_LIMITED",
  message: "Too many requests. Try again later.",
};

export const appRequestLimit = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: getConfiguredRateLimit("app", "short", 1000),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: standardRateLimitResponse,
});

export const apiRequestLimit = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: getConfiguredRateLimit("api", "short", 300),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: standardRateLimitResponse,
});

export const feedbackIpLimit = createRateLimit({
  name: "feedback:ip",
  windowMs: ONE_HOUR,
  max: getConfiguredRateLimit("feedback", "hour", 10),
  keyGenerator: getClientIp,
});

const visionUserShortOptions = {
  name: "vision:user:15m",
  windowMs: FIFTEEN_MINUTES,
  max: getConfiguredRateLimit("vision", "short", SCAN_IMAGES_PER_DAY),
  keyGenerator: getVisionUserRateLimitKey,
};

export const visionUserShortLimit = createRateLimit(visionUserShortOptions);

const visionIpShortOptions = {
  name: "vision:ip:15m",
  windowMs: FIFTEEN_MINUTES,
  max: 60,
  keyGenerator: getVisionIpRateLimitKey,
};

export const visionIpShortLimit = createRateLimit(visionIpShortOptions);

const visionUserDayOptions = {
  name: "vision:user:day",
  windowMs: ONE_DAY,
  max: getConfiguredRateLimit("vision", "day", SCAN_IMAGES_PER_DAY),
  keyGenerator: getVisionUserRateLimitKey,
};

export const visionUserDayLimit = createRateLimit(visionUserDayOptions);

export async function consumeVisionImageRateLimits(
  req: Request,
  res: Response,
  imageCount = 1,
): Promise<boolean> {
  if (isDistributedRateLimitEnabled()) {
    return (
      (await consumeRateLimitDistributed(visionIpShortOptions, req, res, imageCount)) &&
      (await consumeRateLimitDistributed(visionUserShortOptions, req, res, imageCount)) &&
      (await consumeRateLimitDistributed(visionUserDayOptions, req, res, imageCount))
    );
  }

  return (
    consumeRateLimit(visionIpShortOptions, req, res, imageCount) &&
    consumeRateLimit(visionUserShortOptions, req, res, imageCount) &&
    consumeRateLimit(visionUserDayOptions, req, res, imageCount)
  );
}

export const recipeUserBurstLimit = createRateLimit({
  name: "recipe:user:30m",
  windowMs: THIRTY_MINUTES,
  max: getConfiguredRateLimit("recipe", "burst", 20),
  keyGenerator: getUserRateLimitKey,
});

export const recipeIpHourLimit = createRateLimit({
  name: "recipe:ip:hour",
  windowMs: ONE_HOUR,
  max: 100,
  keyGenerator: getClientIp,
});

export const recipeUserDayLimit = createRateLimit({
  name: "recipe:user:day",
  windowMs: ONE_DAY,
  max: getConfiguredRateLimit("recipe", "day", 30),
  keyGenerator: getUserRateLimitKey,
});

export const slopBowlUserHourLimit = createRateLimit({
  name: "slop-bowl:user:hour",
  windowMs: ONE_HOUR,
  max: getConfiguredRateLimit("slopBowl", "hour", 8),
  keyGenerator: getUserRateLimitKey,
});

export const slopBowlIpHourLimit = createRateLimit({
  name: "slop-bowl:ip:hour",
  windowMs: ONE_HOUR,
  max: 100,
  keyGenerator: getClientIp,
});

export const slopBowlUserDayLimit = createRateLimit({
  name: "slop-bowl:user:day",
  windowMs: ONE_DAY,
  max: getConfiguredRateLimit("slopBowl", "day", 25),
  keyGenerator: getUserRateLimitKey,
});

export const aiUserHourLimit = createRateLimit({
  name: "ai:user:hour",
  windowMs: ONE_HOUR,
  max: getConfiguredRateLimit("ai", "hour", 20),
  keyGenerator: getUserRateLimitKey,
});

export const aiIpHourLimit = createRateLimit({
  name: "ai:ip:hour",
  windowMs: ONE_HOUR,
  max: 200,
  keyGenerator: getClientIp,
});

export const aiUserDayLimit = createRateLimit({
  name: "ai:user:day",
  windowMs: ONE_DAY,
  max: getConfiguredRateLimit("ai", "day", 80),
  keyGenerator: getUserRateLimitKey,
});

export const voiceUserHourLimit = createRateLimit({
  name: "voice:user:hour",
  windowMs: ONE_HOUR,
  max: getConfiguredRateLimit("voice", "hour", 20),
  keyGenerator: getUserRateLimitKey,
});

export const voiceIpHourLimit = createRateLimit({
  name: "voice:ip:hour",
  windowMs: ONE_HOUR,
  max: 200,
  keyGenerator: getClientIp,
});

export const voiceUserDayLimit = createRateLimit({
  name: "voice:user:day",
  windowMs: ONE_DAY,
  max: getConfiguredRateLimit("voice", "day", 100),
  keyGenerator: getUserRateLimitKey,
});

export const speechUserHourLimit = createRateLimit({
  name: "speech:user:hour",
  windowMs: ONE_HOUR,
  max: getConfiguredRateLimit("speech", "hour", 30),
  keyGenerator: getUserRateLimitKey,
});

export const speechIpHourLimit = createRateLimit({
  name: "speech:ip:hour",
  windowMs: ONE_HOUR,
  max: 200,
  keyGenerator: getClientIp,
});

export const speechUserDayLimit = createRateLimit({
  name: "speech:user:day",
  windowMs: ONE_DAY,
  max: getConfiguredRateLimit("speech", "day", 120),
  keyGenerator: getUserRateLimitKey,
});
