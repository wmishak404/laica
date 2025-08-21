import { initializeApp } from "firebase/app";
import { getAuth, signInWithRedirect, signInWithPopup, GoogleAuthProvider, getRedirectResult, onAuthStateChanged, signOut, type User } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google provider for additional scopes
googleProvider.addScope('email');
googleProvider.addScope('profile');

export interface FirebaseAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export class FirebaseAuthService {
  // Sign in with Google using popup (better for desktop)
  static async signInWithGooglePopup(): Promise<FirebaseAuthUser | null> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return this.formatUser(result.user);
    } catch (error) {
      console.error('Google sign-in with popup failed:', error);
      throw error;
    }
  }

  // Sign in with Google using redirect (better for mobile)
  static async signInWithGoogleRedirect(): Promise<void> {
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (error) {
      console.error('Google sign-in with redirect failed:', error);
      throw error;
    }
  }

  // Handle redirect result on page load
  static async handleRedirectResult(): Promise<FirebaseAuthUser | null> {
    try {
      const result = await getRedirectResult(auth);
      return result?.user ? this.formatUser(result.user) : null;
    } catch (error) {
      console.error('Error handling redirect result:', error);
      throw error;
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  }

  // Get current user
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Listen to auth state changes
  static onAuthStateChanged(callback: (user: FirebaseAuthUser | null) => void) {
    return onAuthStateChanged(auth, (user: User | null) => {
      callback(user ? this.formatUser(user) : null);
    });
  }

  // Format Firebase user for our app
  private static formatUser(user: User): FirebaseAuthUser {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
    };
  }

  // Get ID token for backend authentication
  static async getIdToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    
    try {
      return await user.getIdToken();
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  }
}