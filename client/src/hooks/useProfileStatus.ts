import { useQuery } from "@tanstack/react-query";

interface ProfileStatus {
  hasCompletedProfile: boolean;
}

export function useProfileStatus() {
  const { data, isLoading, error } = useQuery<ProfileStatus>({
    queryKey: ['/api/user/profile-status'],
    retry: false,
  });

  return {
    hasCompletedProfile: data?.hasCompletedProfile ?? false,
    isLoading,
    error,
  };
}