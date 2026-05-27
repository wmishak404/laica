import type { Request, RequestHandler } from "express";
import { applicationDefault, cert, getApps, initializeApp, type App, type ServiceAccount } from "firebase-admin/app";
import { getAppCheck } from "firebase-admin/app-check";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  authProvider: string | null;
  isAnonymous: boolean;
}

class FirebaseAuthConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FirebaseAuthConfigError";
  }
}

class FirebaseAppCheckError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 401, code = "APP_CHECK_REQUIRED") {
    super(message);
    this.name = "FirebaseAppCheckError";
    this.status = status;
    this.code = code;
  }
}

function isEnabledFlag(value: string | undefined): boolean {
  return value === "1" || value?.toLowerCase() === "true" || value?.toLowerCase() === "yes";
}

export function isAnonymousAuthDisabled(): boolean {
  return isEnabledFlag(process.env.ANONYMOUS_AUTH_DISABLED);
}

export function isFirebaseAppCheckEnforced(): boolean {
  return isEnabledFlag(process.env.FIREBASE_APP_CHECK_ENFORCED);
}

function parseServiceAccount(): ServiceAccount | null {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const rawBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const source = rawJson || (rawBase64 ? Buffer.from(rawBase64, "base64").toString("utf8") : null);

  if (!source) {
    return null;
  }

  try {
    const parsed = JSON.parse(source) as Record<string, string>;
    const serviceAccount: ServiceAccount = {
      projectId: parsed.projectId || parsed.project_id,
      clientEmail: parsed.clientEmail || parsed.client_email,
      privateKey: parsed.privateKey || parsed.private_key,
    };

    if (typeof serviceAccount.privateKey === "string") {
      serviceAccount.privateKey = serviceAccount.privateKey.replace(/\\n/g, "\n");
    }
    return serviceAccount;
  } catch {
    throw new FirebaseAuthConfigError("Invalid Firebase service account JSON");
  }
}

function getAdminApp(): App {
  if (getApps().length === 0) {
    const serviceAccount = parseServiceAccount();
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || serviceAccount?.projectId;

    return initializeApp({
      credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
      ...(projectId ? { projectId } : {}),
    });
  }

  const existingApp = getApps()[0];
  if (!existingApp) {
    throw new FirebaseAuthConfigError("Firebase Admin app is not initialized");
  }

  return existingApp;
}

function getAdminAuth() {
  return getAuth(getAdminApp());
}

function getAdminAppCheck() {
  return getAppCheck(getAdminApp());
}

function firebaseUserFromDecodedToken(decodedToken: DecodedIdToken): FirebaseUser {
  const authProvider = decodedToken.firebase?.sign_in_provider || null;

  return {
    uid: decodedToken.uid,
    email: decodedToken.email || null,
    displayName: decodedToken.name || null,
    photoURL: decodedToken.picture || null,
    emailVerified: decodedToken.email_verified || false,
    authProvider,
    isAnonymous: authProvider === "anonymous",
  };
}

function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring("Bearer ".length).trim();
}

function getAppCheckToken(req: Request): string | null {
  const header = req.headers["x-firebase-appcheck"];
  const token = Array.isArray(header) ? header[0] : header;
  return typeof token === "string" && token.trim().length > 0 ? token.trim() : null;
}

async function verifyFirebaseAppCheckFromRequest(req: Request): Promise<void> {
  if (!isFirebaseAppCheckEnforced()) {
    return;
  }

  const appCheckToken = getAppCheckToken(req);
  if (!appCheckToken) {
    throw new FirebaseAppCheckError("Firebase App Check token is required");
  }

  try {
    await getAdminAppCheck().verifyToken(appCheckToken);
  } catch {
    throw new FirebaseAppCheckError("Invalid Firebase App Check token", 401, "APP_CHECK_INVALID");
  }
}

export async function getFirebaseUserFromRequest(req: Request): Promise<FirebaseUser | null> {
  const idToken = getBearerToken(req);
  if (!idToken) {
    return null;
  }

  const decodedToken = await getAdminAuth().verifyIdToken(idToken);
  return firebaseUserFromDecodedToken(decodedToken);
}

export const verifyFirebaseToken: RequestHandler = async (req, res, next) => {
  try {
    await verifyFirebaseAppCheckFromRequest(req);

    const firebaseUser = await getFirebaseUserFromRequest(req);
    if (!firebaseUser) {
      return res.status(401).json({ message: "No Firebase token provided" });
    }

    if (firebaseUser.isAnonymous && isAnonymousAuthDisabled()) {
      return res.status(403).json({
        code: "ANONYMOUS_ACCESS_DISABLED",
        message: "Guest cooking is temporarily unavailable. Continue with Google to keep cooking.",
      });
    }

    (req as any).firebaseUser = firebaseUser;
    next();
  } catch (error) {
    if (error instanceof FirebaseAuthConfigError) {
      console.error("Firebase Admin configuration error:", error.message);
      return res.status(500).json({ message: "Firebase authentication is not configured" });
    }

    if (error instanceof FirebaseAppCheckError) {
      return res.status(error.status).json({
        code: error.code,
        message: error.message,
      });
    }

    console.warn("Firebase token verification failed");
    return res.status(401).json({ message: "Invalid Firebase token" });
  }
};
