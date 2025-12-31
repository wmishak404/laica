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
  const { data: user, isLoading } = useQuery<AuthenticatedUser>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
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