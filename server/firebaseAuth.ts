// Firebase Admin SDK would be used for production token verification
// For development/testing, we use a simplified approach
import type { RequestHandler } from 'express';

// Initialize Firebase Admin (for server-side token verification)
// Note: In production, you would use a service account key
// For development, we'll verify tokens directly with the Firebase client SDK
let adminAuth: any = null;

try {
  // In development, we can't easily use service account keys in Replit
  // So we'll implement client-side token verification instead
} catch (error) {
  console.log('Firebase Admin not initialized - using client-side verification');
}

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export const verifyFirebaseToken: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No Firebase token provided' });
  }

  const idToken = authHeader.substring(7);

  try {
    // For development, we'll decode the JWT payload manually
    // Note: This is not secure for production - you should verify the signature
    const payload = JSON.parse(atob(idToken.split('.')[1]));
    
    console.log('Firebase token payload:', payload);
    
    // Firebase ID tokens use 'sub' for user ID, not 'uid'
    if (!payload.sub) {
      return res.status(401).json({ message: 'Invalid token payload - missing sub' });
    }

    // Add Firebase user info to request
    (req as any).firebaseUser = {
      uid: payload.sub,
      email: payload.email || null,
      displayName: payload.name || null,
      photoURL: payload.picture || null,
      emailVerified: payload.email_verified || false,
    };

    next();
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    return res.status(401).json({ message: 'Invalid Firebase token' });
  }
};

// For production use, implement proper Firebase Admin verification:
/*
export const verifyFirebaseTokenProduction: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No Firebase token provided' });
  }

  const idToken = authHeader.substring(7);

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    (req as any).firebaseUser = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      displayName: decodedToken.name || null,
      photoURL: decodedToken.picture || null,
      emailVerified: decodedToken.email_verified || false,
    };

    next();
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    return res.status(401).json({ message: 'Invalid Firebase token' });
  }
};
*/