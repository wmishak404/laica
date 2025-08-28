import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FirebaseAuthService, type FirebaseAuthUser } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export function useFirebaseAuth() {
  const [user, setUser] = useState<FirebaseAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = FirebaseAuthService.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setIsLoading(false);
      
      // Update React Query cache when auth state changes
      if (firebaseUser) {
        // User signed in - sync with backend
        syncWithBackend(firebaseUser);
      } else {
        // User signed out - clear cache
        queryClient.setQueryData(["/api/auth/user"], null);
      }
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
        console.error('Redirect result error:', error);
        
        // Don't show error toast for "missing initial state" - it's expected on iOS Safari
        if (!error.message?.includes('missing initial state')) {
          toast({
            title: "Sign-in Error", 
            description: "There was a problem signing you in. Please try again.",
            variant: "destructive",
          });
        }
      });

    return () => unsubscribe();
  }, [queryClient, toast]);

  const syncWithBackend = async (firebaseUser: FirebaseAuthUser) => {
    try {
      const idToken = await FirebaseAuthService.getIdToken();
      if (!idToken) {
        console.log('No ID token available');
        return;
      }

      console.log('Syncing with backend for user:', firebaseUser.email);

      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('Backend sync successful:', userData);
        queryClient.setQueryData(["/api/auth/user"], userData);
      } else {
        const errorData = await response.text();
        console.error('Backend sync failed:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error syncing with backend:', error);
    }
  };

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
      
      let errorMessage = "Failed to sign in with Google. Please try again.";
      
      // Check for common Firebase auth errors
      if (error.code === 'auth/operation-not-allowed') {
        errorMessage = "Google sign-in is not enabled in Firebase. Please enable Google authentication in Firebase Console.";
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = "Domain not authorized. Please add your current domain to Firebase's authorized domains list.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "Popup was blocked. Please allow popups for this site and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Sign-in Failed",
        description: errorMessage,
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
        title: "Sign-out Error",
        description: "There was a problem signing you out.",
        variant: "destructive",
      });
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signInWithGoogle,
    signOut,
  };
}