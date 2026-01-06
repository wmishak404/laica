import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User, AuthUser, UserSettings, CookingSession, UpdateUserProfile } from "@shared/schema";

// Union type for authenticated users (local or external)
export type AuthenticatedUser = User | AuthUser;

interface UserProfile {
  user: AuthUser;
  settings: UserSettings | null;
  recentSessions: CookingSession[];
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<AuthenticatedUser | null>({
    queryKey: ["/api/auth/user"],
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

        const res = await fetch('/api/auth/user', {
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

        return await res.json();
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
  const { isAuthenticated } = useAuth();
  
  return useQuery<UserProfile>({
    queryKey: ["/api/user/profile"],
    enabled: isAuthenticated, // Only fetch if authenticated
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