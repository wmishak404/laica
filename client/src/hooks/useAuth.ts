import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User, AuthUser, UserSettings, CookingSession, UpdateUserProfile } from "@shared/schema";

export interface GuestUser {
  id: string;
  email: null;
  firstName: null;
  lastName: null;
  profileImageUrl: null;
  authProvider: "anonymous";
  firebaseUid: string;
  isAnonymous: true;
}

// Union type for authenticated users (local, linked external, or anonymous guest)
export type AuthenticatedUser = User | AuthUser | GuestUser;

export function isGuestUser(user: AuthenticatedUser | null | undefined): user is GuestUser {
  return Boolean(user && "isAnonymous" in user && user.isAnonymous);
}

interface UserProfile {
  user: AuthUser;
  settings: UserSettings | null;
  recentSessions: CookingSession[];
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<AuthenticatedUser | null>({
    queryKey: ["/api/auth/session"],
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes - token is still valid
    refetchOnMount: true,
    queryFn: async () => {
      // Get fresh Firebase token for each auth check
      try {
        const { FirebaseAuthService } = await import('@/lib/firebase');
        const idToken = await FirebaseAuthService.getIdToken(true); // Force refresh
        
        if (!idToken) {
          // No Firebase user - return null instead of throwing
          return null;
        }

        const res = await fetch('/api/auth/session', {
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });

        if (res.status === 401) {
          // Server says unauthorized - return null, don't throw
          // Firebase will handle re-authentication via onAuthStateChanged
          return null;
        }

        if (!res.ok) {
          throw new Error(`${res.status}: ${await res.text()}`);
        }

        const session = await res.json();
        return session.user ?? session;
      } catch (error) {
        console.error('Auth check failed:', error);
        return null;
      }
    },
  });

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
  };
}

export function useUserProfile() {
  const { isAuthenticated, user } = useAuth();
  
  return useQuery<UserProfile>({
    queryKey: ["/api/user/profile", user?.id ?? "signed-out"],
    enabled: isAuthenticated && !isGuestUser(user), // Guest profiles are browser-local
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (profileData: UpdateUserProfile) => {
      const response = await apiRequest('PUT', '/api/user/profile', profileData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });
}

export function useUpdateUserSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settingsData: Partial<UserSettings>) => {
      const response = await apiRequest('PUT', '/api/user/settings', settingsData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    },
  });
}

export function useResetPantry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/user/pantry/reset');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });
}
