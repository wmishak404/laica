import { initializeApp, type FirebaseError } from "firebase/app";
import {
  getToken as getFirebaseAppCheckToken,
  initializeAppCheck,
  ReCaptchaV3Provider,
  type AppCheck,
} from "firebase/app-check";
import {
  getAuth,
  linkWithPopup,
  signInWithRedirect,
  signInWithPopup,
  signInWithCredential,
  signInWithCustomToken as firebaseSignInWithCustomToken,
  signInAnonymously,
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence,
  type AuthCredential,
  type User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
let appCheckInstance: AppCheck | null | undefined;

// Set persistence to LOCAL to work better with Safari
setPersistence(auth, browserLocalPersistence).catch(console.error);

export const googleProvider = new GoogleAuthProvider();

// Configure Google provider for additional scopes and account selection
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Force account selection prompt - allows users to choose different accounts
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

function getConfiguredAppCheck(): AppCheck | null {
  if (appCheckInstance !== undefined) {
    return appCheckInstance;
  }

  const siteKey = import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY;
  if (!siteKey) {
    appCheckInstance = null;
    return appCheckInstance;
  }

  const debugToken = import.meta.env.VITE_FIREBASE_APP_CHECK_DEBUG_TOKEN;
  if (import.meta.env.DEV && debugToken && typeof self !== "undefined") {
    (self as typeof self & { FIREBASE_APPCHECK_DEBUG_TOKEN?: string }).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
  }

  appCheckInstance = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });

  return appCheckInstance;
}

export interface FirebaseAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
}

export class FirebaseAuthService {
  // Detect if we're on iOS Safari specifically
  static isIOSSafari(): boolean {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);
    return isIOS && isSafari;
  }

  // Enhanced mobile detection
  static isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Sign in with Google using popup (better for desktop and iOS Safari fallback)
  static async signInWithGooglePopup(): Promise<FirebaseAuthUser | null> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return this.formatUser(result.user);
    } catch (error: any) {
      console.error('Google sign-in with popup failed:', error);
      
      // Handle specific iOS Safari issues
      if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked. Please enable popups and try again.');
      } else if (error.code === 'auth/unauthorized-domain') {
        throw new Error('Authentication not authorized for this domain. Please check Firebase configuration.');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Google sign-in is not enabled in Firebase Console.');
      }
      
      throw error;
    }
  }

  static async linkCurrentGuestWithGooglePopup(): Promise<FirebaseAuthUser | null> {
    const currentUser = auth.currentUser;

    if (!currentUser?.isAnonymous) {
      return this.signInWithGooglePopup();
    }

    try {
      const result = await linkWithPopup(currentUser, googleProvider);
      return this.formatUser(result.user);
    } catch (error: any) {
      console.error('Google account link failed:', error);

      if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked. Please enable popups and try again.');
      } else if (error.code === 'auth/unauthorized-domain') {
        throw new Error('Authentication not authorized for this domain. Please check Firebase configuration.');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Google sign-in is not enabled in Firebase Console.');
      }

      throw error;
    }
  }

  static getGoogleCredentialFromError(error: unknown): AuthCredential | null {
    return GoogleAuthProvider.credentialFromError(error as FirebaseError);
  }

  static async signInWithGoogleCredential(credential: AuthCredential): Promise<FirebaseAuthUser | null> {
    try {
      const result = await signInWithCredential(auth, credential);
      return this.formatUser(result.user);
    } catch (error) {
      console.error('Google credential sign-in failed:', error);
      throw error;
    }
  }

  // Sign in with Google using redirect (better for mobile, but not iOS Safari)
  static async signInWithGoogleRedirect(): Promise<void> {
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (error) {
      console.error('Google sign-in with redirect failed:', error);
      throw error;
    }
  }

  // Smart sign-in that chooses the best method for each platform
  static async signInWithGoogleSmart(): Promise<FirebaseAuthUser | null> {
    try {
      // For mobile devices (including iOS), always use popup to avoid Safari issues
      if (this.isMobile()) {
        return await this.signInWithGooglePopup();
      }
      
      // Desktop - use popup
      return await this.signInWithGooglePopup();
    } catch (error) {
      console.error('Smart sign-in failed:', error);
      throw error;
    }
  }

  static async signInAsGuest(): Promise<FirebaseAuthUser | null> {
    try {
      const result = await signInAnonymously(auth);
      return this.formatUser(result.user);
    } catch (error: any) {
      console.error('Anonymous sign-in failed:', error);

      if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Guest cooking is not available in this environment yet.');
      }

      throw error;
    }
  }

  static async signInWithCustomTokenForDev(customToken: string): Promise<FirebaseAuthUser | null> {
    if (!import.meta.env.DEV || import.meta.env.VITE_LAICA_DEV_AUTH_BROWSER !== "true") {
      throw new Error("Dev custom-token sign-in is not enabled");
    }

    await setPersistence(auth, browserLocalPersistence);
    const result = await firebaseSignInWithCustomToken(auth, customToken);
    return this.formatUser(result.user);
  }

  // Handle redirect result on page load with enhanced error handling
  static async handleRedirectResult(): Promise<FirebaseAuthUser | null> {
    try {
      const result = await getRedirectResult(auth);
      return result?.user ? this.formatUser(result.user) : null;
    } catch (error: any) {
      // Swallow all errors silently — getRedirectResult only produces meaningful
      // results when signInWithRedirect was explicitly initiated. In partitioned-
      // storage browsers (Safari ITP, in-app browsers) it throws spuriously on
      // every page load. Returning null is always safe here.
      if (import.meta.env.DEV) {
        console.debug('getRedirectResult failed (expected in partitioned-storage browsers):', error?.code || error?.message);
      }
      return null;
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
      isAnonymous: user.isAnonymous,
    };
  }

  // Get ID token for backend authentication
  // forceRefresh: if true, forces a token refresh even if the current one hasn't expired
  static async getIdToken(forceRefresh: boolean = false): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    
    try {
      return await user.getIdToken(forceRefresh);
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  }

  static async getAppCheckToken(forceRefresh: boolean = false): Promise<string | null> {
    const appCheck = getConfiguredAppCheck();
    if (!appCheck) return null;

    try {
      const result = await getFirebaseAppCheckToken(appCheck, forceRefresh);
      return result.token;
    } catch (error) {
      console.error('Error getting App Check token:', error);
      return null;
    }
  }
}

declare global {
  interface Window {
    __LAICA_DEV_AUTH__?: {
      signInWithCustomToken(customToken: string): Promise<FirebaseAuthUser | null>;
    };
  }
}

if (import.meta.env.DEV && import.meta.env.VITE_LAICA_DEV_AUTH_BROWSER === "true" && typeof window !== "undefined") {
  window.__LAICA_DEV_AUTH__ = {
    signInWithCustomToken: (customToken: string) => FirebaseAuthService.signInWithCustomTokenForDev(customToken),
  };
}
