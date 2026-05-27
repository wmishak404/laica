import type { RequestHandler } from "express";
import helmet, { type HelmetOptions } from "helmet";

const productionContentSecurityPolicy: NonNullable<HelmetOptions["contentSecurityPolicy"]> = {
  useDefaults: true,
  directives: {
    "default-src": ["'self'"],
    "script-src": ["'self'", "https://replit.com", "https://www.google.com", "https://www.gstatic.com"],
    "script-src-attr": ["'none'"],
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "connect-src": [
      "'self'",
      "https://*.googleapis.com",
      "https://accounts.google.com",
      "https://*.firebaseapp.com",
      "https://*.firebaseio.com",
      "https://*.firebasestorage.app",
    ],
    "frame-src": ["'self'", "https://accounts.google.com", "https://*.firebaseapp.com", "https://www.google.com"],
    "frame-ancestors": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
  },
};

export function getSecurityHeaderOptions(nodeEnv = process.env.NODE_ENV): HelmetOptions {
  const isProduction = nodeEnv === "production";

  return {
    contentSecurityPolicy: isProduction ? productionContentSecurityPolicy : false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    strictTransportSecurity: isProduction
      ? {
          maxAge: 15_552_000,
          includeSubDomains: true,
        }
      : false,
  };
}

export function createSecurityHeaders(nodeEnv = process.env.NODE_ENV): RequestHandler {
  return helmet(getSecurityHeaderOptions(nodeEnv));
}

export function getPublicErrorMessage(status: number, message?: string): string {
  if (status >= 500) {
    return "Internal Server Error";
  }

  return message || "Unexpected error";
}
