import type { Request, RequestHandler } from "express";
import { applicationDefault, cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

class FirebaseAuthConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FirebaseAuthConfigError";
  }
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

function getAdminAuth() {
  if (getApps().length === 0) {
    const serviceAccount = parseServiceAccount();
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || serviceAccount?.projectId;

    initializeApp({
      credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
      ...(projectId ? { projectId } : {}),
    });
  }

  return getAuth();
}

function firebaseUserFromDecodedToken(decodedToken: DecodedIdToken): FirebaseUser {
  return {
    uid: decodedToken.uid,
    email: decodedToken.email || null,
    displayName: decodedToken.name || null,
    photoURL: decodedToken.picture || null,
    emailVerified: decodedToken.email_verified || false,
  };
}

function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring("Bearer ".length).trim();
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
    const firebaseUser = await getFirebaseUserFromRequest(req);
    if (!firebaseUser) {
      return res.status(401).json({ message: "No Firebase token provided" });
    }

    (req as any).firebaseUser = firebaseUser;
    next();
  } catch (error) {
    if (error instanceof FirebaseAuthConfigError) {
      console.error("Firebase Admin configuration error:", error.message);
      return res.status(500).json({ message: "Firebase authentication is not configured" });
    }

    console.warn("Firebase token verification failed");
    return res.status(401).json({ message: "Invalid Firebase token" });
  }
};
