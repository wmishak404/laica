import type { Request, RequestHandler, Response } from "express";
import { rateLimit } from "express-rate-limit";
import { SCAN_IMAGES_PER_DAY } from "@shared/scan-policy";

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
type RateLimitWindow = "short" | "hour" | "day";

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

const buckets = new Map<string, Bucket>();

function envLimit(key: RateLimitKey, window: RateLimitWindow, fallback: number): number {
  const envKey = `RATE_LIMIT_${key}_${window}`.replace(/[A-Z]/g, (match) => `_${match}`).toUpperCase();
  const rawValue = process.env[envKey];
  const parsed = rawValue ? Number.parseInt(rawValue, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getClientIp(req: Request): string {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

export function getUserRateLimitKey(req: Request): string {
  return (req as any).firebaseUser?.uid || getClientIp(req);
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

export function consumeRateLimit(
  { name, windowMs, max, keyGenerator }: RateLimitOptions,
  req: Request,
  res: Response,
  count = 1,
): boolean {
  const safeCount = Number.isInteger(count) && count > 0 ? count : 1;
  const now = Date.now();
  const key = `${name}:${keyGenerator(req)}`;
  const existing = buckets.get(key);
  const bucket = existing && existing.resetAt > now ? existing : { count: 0, resetAt: now + windowMs };

  bucket.count += safeCount;
  buckets.set(key, bucket);

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

export function createRateLimit(options: RateLimitOptions): RequestHandler {
  return (req, res, next) => {
    if (!consumeRateLimit(options, req, res)) {
      return;
    }
    next();
  };
}

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;

const standardRateLimitResponse = {
  code: "RATE_LIMITED",
  message: "Too many requests. Try again later.",
};

export const appRequestLimit = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: envLimit("app", "short", 1000),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: standardRateLimitResponse,
});

export const apiRequestLimit = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: envLimit("api", "short", 300),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: standardRateLimitResponse,
});

export const feedbackIpLimit = createRateLimit({
  name: "feedback:ip",
  windowMs: ONE_HOUR,
  max: envLimit("feedback", "hour", 10),
  keyGenerator: getClientIp,
});

const visionUserShortOptions = {
  name: "vision:user:15m",
  windowMs: FIFTEEN_MINUTES,
  max: envLimit("vision", "short", SCAN_IMAGES_PER_DAY),
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
  max: envLimit("vision", "day", SCAN_IMAGES_PER_DAY),
  keyGenerator: getVisionUserRateLimitKey,
};

export const visionUserDayLimit = createRateLimit(visionUserDayOptions);

export function consumeVisionImageRateLimits(req: Request, res: Response, imageCount = 1): boolean {
  return (
    consumeRateLimit(visionIpShortOptions, req, res, imageCount) &&
    consumeRateLimit(visionUserShortOptions, req, res, imageCount) &&
    consumeRateLimit(visionUserDayOptions, req, res, imageCount)
  );
}

export const recipeUserHourLimit = createRateLimit({
  name: "recipe:user:hour",
  windowMs: ONE_HOUR,
  max: envLimit("recipe", "hour", 10),
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
  max: envLimit("recipe", "day", 30),
  keyGenerator: getUserRateLimitKey,
});

export const slopBowlUserHourLimit = createRateLimit({
  name: "slop-bowl:user:hour",
  windowMs: ONE_HOUR,
  max: envLimit("slopBowl", "hour", 8),
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
  max: envLimit("slopBowl", "day", 25),
  keyGenerator: getUserRateLimitKey,
});

export const aiUserHourLimit = createRateLimit({
  name: "ai:user:hour",
  windowMs: ONE_HOUR,
  max: envLimit("ai", "hour", 20),
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
  max: envLimit("ai", "day", 80),
  keyGenerator: getUserRateLimitKey,
});

export const voiceUserHourLimit = createRateLimit({
  name: "voice:user:hour",
  windowMs: ONE_HOUR,
  max: envLimit("voice", "hour", 20),
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
  max: envLimit("voice", "day", 100),
  keyGenerator: getUserRateLimitKey,
});

export const speechUserHourLimit = createRateLimit({
  name: "speech:user:hour",
  windowMs: ONE_HOUR,
  max: envLimit("speech", "hour", 30),
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
  max: envLimit("speech", "day", 120),
  keyGenerator: getUserRateLimitKey,
});
