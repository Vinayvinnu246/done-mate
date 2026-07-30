import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  setNotificationStatus,
} from "@/lib/notifications.functions";
import { useAuth } from "./use-auth";

export function useNotifications() {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listNotifications(),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  // Realtime: refresh the list whenever a notification row changes for this user.
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["notifications"] });

  const markRead = useMutation({
    mutationFn: (id: string) => markNotificationRead({ data: { id } }),
    onSuccess: invalidate,
  });

  const markAllRead = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: invalidate,
  });

  const updateStatus = useMutation({
    mutationFn: (vars: { id: string; status: "not_interested" | "viewed" | "quote_sent" }) =>
      setNotificationStatus({ data: vars }),
    onSuccess: invalidate,
  });

  return {
    items: query.data?.items ?? [],
    unread: query.data?.unread ?? 0,
    isLoading: query.isLoading,
    markRead,
    markAllRead,
    updateStatus,
  };
}
