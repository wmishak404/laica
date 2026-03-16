import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { CookingSession } from "@shared/schema";

interface RecipeSnapshotData {
  recipeName: string;
  description: string;
  cookTime: number;
  difficulty: string;
  cuisine: string;
  pantryMatch: number;
  missingIngredients: string[];
  isFusion: boolean;
  steps: Array<{
    id?: number;
    instruction: string;
    duration?: string;
    tips?: string;
    visualCues?: string;
    commonMistakes?: string;
    safetyLevel?: string;
  }>;
}

interface StartSessionData {
  recipeName: string;
  recipeDescription?: string;
  recipeSnapshot?: RecipeSnapshotData;
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
    refetchInterval: 30000,
  });
}

export function useCookingSessions(limit = 200) {
  return useQuery<CookingSession[]>({
    queryKey: ["/api/cooking/sessions", limit],
  });
}

export function useStartCookingSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sessionData: StartSessionData) => {
      const response = await apiRequest('POST', '/api/cooking/session/start', sessionData);
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
      const response = await apiRequest('PUT', `/api/cooking/session/${sessionId}`, updateData);
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
      const response = await apiRequest('POST', `/api/cooking/session/${sessionId}/complete`, completionData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cooking/session/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cooking/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    },
  });
}

export function useDeleteCookingSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await apiRequest('DELETE', `/api/cooking/session/${sessionId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cooking/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cooking/session/active"] });
    },
  });
}

export function useDeleteAllCookingSessions() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/cooking/sessions/all');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cooking/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cooking/session/active"] });
    },
  });
}

export type { RecipeSnapshotData };
