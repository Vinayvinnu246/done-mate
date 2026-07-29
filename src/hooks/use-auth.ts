import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";
import { getMyProfile } from "@/lib/auth.functions";

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading: isLoadingUser,
    error: userError,
  } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) return null;
      return data.user;
    },
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: profileData,
    isLoading: isLoadingProfile,
  } = useQuery({
    queryKey: ["auth", "profile"],
    queryFn: async () => getMyProfile(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (userError) {
      // eslint-disable-next-line no-console
      console.error("Auth session check failed", userError);
    }
  }, [userError]);

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  };

  return {
    user,
    profile: profileData?.profile,
    roles: profileData?.roles ?? [],
    userId: profileData?.userId,
    isLoading: isLoadingUser || isLoadingProfile,
    isAuthenticated: !!user,
    signOut,
  };
}
