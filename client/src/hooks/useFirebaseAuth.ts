import { useCallback, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FirebaseAuthService, type FirebaseAuthUser } from '@/lib/firebase';
import { ApiRequestError, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

function createGuestUser(firebaseUser: FirebaseAuthUser) {
  return {
    id: firebaseUser.uid,
    email: null,
    firstName: null,
    lastName: null,
    profileImageUrl: null,
    authProvider: 'anonymous',
    firebaseUid: firebaseUser.uid,
    isAnonymous: true,
  };
}

export function useFirebaseAuth() {
  const [user, setUser] = useState<FirebaseAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const clearAuthCache = useCallback(() => {
    queryClient.setQueryData(["/api/auth/session"], null);
    queryClient.setQueryData(["/api/auth/user"], null);
  }, [queryClient]);

  const syncAnonymousWithBackend = useCallback(async (firebaseUser: FirebaseAuthUser) => {
    const sessionResponse = await apiRequest('GET', '/api/auth/session');
    const session = await sessionResponse.json();
    return session.user ?? createGuestUser(firebaseUser);
  }, []);

  const syncWithBackend = useCallback(async (firebaseUser: FirebaseAuthUser) => {
    try {
      console.log('Syncing with backend for user:', firebaseUser.email);

      const response = await apiRequest('POST', '/api/auth/google');
      const userData = await response.json();
      console.log('Backend sync successful:', userData);
      queryClient.setQueryData(["/api/auth/session"], userData);
      queryClient.setQueryData(["/api/auth/user"], userData);
    } catch (error) {
      console.error('Error syncing with backend:', error);
    }
  }, [queryClient]);

  useEffect(() => {
    let isMounted = true;
    let authStateVersion = 0;

    const unsubscribe = FirebaseAuthService.onAuthStateChanged((firebaseUser) => {
      authStateVersion += 1;
      const currentVersion = authStateVersion;

      if (!firebaseUser) {
        setUser(null);
        setIsLoading(false);
        clearAuthCache();
        return;
      }

      if (firebaseUser.isAnonymous) {
        setIsLoading(true);

        syncAnonymousWithBackend(firebaseUser)
          .then((guestUser) => {
            if (!isMounted || currentVersion !== authStateVersion) {
              return;
            }

            setUser(firebaseUser);
            setIsLoading(false);
            queryClient.setQueryData(["/api/auth/session"], guestUser);
            queryClient.setQueryData(["/api/auth/user"], null);
          })
          .catch(async (error) => {
            console.error('Anonymous session rejected by backend:', error);
            await FirebaseAuthService.signOut().catch(() => undefined);

            if (!isMounted || currentVersion !== authStateVersion) {
              return;
            }

            setUser(null);
            setIsLoading(false);
            clearAuthCache();
          });
        return;
      }

      setUser(firebaseUser);
      setIsLoading(false);
      // Linked users sync with the backend so durable account data exists.
      syncWithBackend(firebaseUser);
    });

    // Check for redirect result on page load
    FirebaseAuthService.handleRedirectResult()
      .then((result) => {
        if (result) {
          toast({
            title: "Welcome!",
            description: `Signed in as ${result.displayName || result.email}`,
          });
        }
      })
      .catch((error) => {
        // handleRedirectResult already swallows all errors internally.
        // This catch is a last-resort safety net — never show raw Firebase
        // messages to the user.
        console.error('Redirect result error:', error);
      });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [clearAuthCache, queryClient, syncAnonymousWithBackend, syncWithBackend, toast]);

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      
      // Use the new smart sign-in that automatically chooses the best method
      const result = await FirebaseAuthService.signInWithGoogleSmart();
      if (result) {
        toast({
          title: "Welcome!",
          description: `Signed in as ${result.displayName || result.email}`,
        });
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      
      let errorMessage = "I couldn't sign you in with Google. Try again.";

      // Internal Firebase messages that should never be shown to users
      const internalFirebaseMessages = [
        'missing initial state',
        'sessionStorage',
        'storage-partitioned',
        'SAML SSO',
      ];
      const isInternalError = internalFirebaseMessages.some(m =>
        error.message?.toLowerCase().includes(m.toLowerCase())
      );

      // Check for common Firebase auth errors
      if (error.code === 'auth/operation-not-allowed') {
        errorMessage = "Google sign-in is not available in this environment yet.";
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = "Google sign-in is not available from this address yet.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "The sign-in popup was blocked. Allow popups for this site, then try again.";
      } else if (error.message && !isInternalError) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Sign-in did not work",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signInAsGuest = async () => {
    try {
      setIsLoading(true);

      const result = await FirebaseAuthService.signInAsGuest();
      if (result) {
        const sessionResponse = await apiRequest('GET', '/api/auth/session');
        const session = await sessionResponse.json();
        const guestUser = session.user ?? createGuestUser(result);
        setUser(result);
        queryClient.setQueryData(["/api/auth/session"], guestUser);
        queryClient.setQueryData(["/api/auth/user"], null);
      }
    } catch (error: any) {
      console.error('Guest sign-in error:', error);

      await FirebaseAuthService.signOut().catch(() => undefined);
      setUser(null);
      clearAuthCache();

      const errorDescription = error instanceof ApiRequestError
        ? error.body?.message || "I couldn't start guest cooking. Try again."
        : error.message || "I couldn't start guest cooking. Try again.";

      toast({
        title: "Guest cooking did not start",
        description: errorDescription,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await FirebaseAuthService.signOut();
      queryClient.clear(); // Clear all cached data
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast({
        title: "Sign-out did not work",
        description: "I couldn't sign you out. Try again.",
        variant: "destructive",
      });
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signInWithGoogle,
    signInAsGuest,
    signOut,
  };
}
