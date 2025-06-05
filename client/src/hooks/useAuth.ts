import { useQuery } from "@tanstack/react-query";
import type { User, AuthUser } from "@shared/schema";

// Union type for authenticated users (local or external)
export type AuthenticatedUser = User | AuthUser;

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