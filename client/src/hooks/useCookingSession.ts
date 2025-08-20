import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { CookingSession } from "@shared/schema";

interface StartSessionData {
  recipeName: string;
  recipeDescription?: string;
  ingredientsUsed: string[];
  totalSteps: number;
}

interface UpdateSessionData {
  completedSteps?: number;
  completed?: boolean;
  ingredientsRemaining?: string[];
  cookingDuration?: number;
  userRating?: number;
  userNotes?: string;
}

interface CompleteSessionData {
  ingredientsRemaining: string[];
  userRating?: number;
  userNotes?: string;
  cookingDuration: number;
  completedSteps: number;
}

export function useActiveCookingSession() {
  return useQuery<CookingSession | null>({
    queryKey: ["/api/cooking/session/active"],
    refetchInterval: 30000, // Check for updates every 30 seconds
  });
}

export function useCookingSessions(limit = 10) {
  return useQuery<CookingSession[]>({
    queryKey: ["/api/cooking/sessions", limit],
  });
}

export function useStartCookingSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sessionData: StartSessionData) => {
      const response = await fetch('/api/cooking/session/start', {
        method: 'POST',
        body: JSON.stringify(sessionData),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to start cooking session');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cooking/session/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cooking/sessions"] });
    },
  });
}

export function useUpdateCookingSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sessionId, updateData }: { sessionId: number; updateData: UpdateSessionData }) => {
      const response = await fetch(`/api/cooking/session/${sessionId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to update cooking session');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cooking/session/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cooking/sessions"] });
    },
  });
}

export function useCompleteCookingSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sessionId, completionData }: { sessionId: number; completionData: CompleteSessionData }) => {
      const response = await fetch(`/api/cooking/session/${sessionId}/complete`, {
        method: 'POST',
        body: JSON.stringify(completionData),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to complete cooking session');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cooking/session/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cooking/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    },
  });
}