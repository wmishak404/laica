import { randomUUID } from "crypto";
import type { RequestHandler } from "express";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      requestStartedAt?: number;
    }
  }
}

export const requestIdMiddleware: RequestHandler = (req, res, next) => {
  const requestId = randomUUID();

  req.requestId = requestId;
  req.requestStartedAt = Date.now();
  res.setHeader("X-Request-Id", requestId);

  next();
};
