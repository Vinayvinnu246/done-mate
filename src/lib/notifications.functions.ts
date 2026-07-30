import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("notifications")
      .select("*, job:jobs(id, title, postcode, city, scheduled_date, budget_min, budget_max, status, category:categories(name))")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    const items = data ?? [];
    return {
      items,
      unread: items.filter((n) => !n.read_at).length,
    };
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString(), status: "viewed" })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw error;
    return { ok: true };
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString(), status: "viewed" })
      .eq("user_id", userId)
      .is("read_at", null);
    if (error) throw error;
    return { ok: true };
  });

export const setNotificationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum([
          "unread",
          "viewed",
          "quote_sent",
          "not_interested",
          "job_booked",
          "job_closed",
          "expired",
        ]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("notifications")
      .update({
        status: data.status,
        read_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw error;
    return { ok: true };
  });

const prefsSchema = z.object({
  in_app: z.boolean().optional(),
  email: z.boolean().optional(),
  push: z.boolean().optional(),
  new_jobs: z.boolean().optional(),
  messages: z.boolean().optional(),
  bookings: z.boolean().optional(),
  payments: z.boolean().optional(),
  reviews: z.boolean().optional(),
});

export const updateNotificationPreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        preferences: prefsSchema,
        muted_category_ids: z.array(z.string().uuid()).max(60).optional(),
        daily_notification_limit: z.number().int().min(1).max(200).optional(),
        is_available: z.boolean().optional(),
        service_radius: z.number().int().min(1).max(200).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: current } = await supabase
      .from("profiles")
      .select("notification_preferences")
      .eq("user_id", userId)
      .maybeSingle();

    const merged = {
      ...((current?.notification_preferences ?? {}) as Record<string, unknown>),
      ...data.preferences,
    };

    const { error } = await supabase
      .from("profiles")
      .update({
        notification_preferences: merged,
        ...(data.muted_category_ids ? { muted_category_ids: data.muted_category_ids } : {}),
        ...(data.daily_notification_limit
          ? { daily_notification_limit: data.daily_notification_limit }
          : {}),
        ...(data.is_available != null ? { is_available: data.is_available } : {}),
        ...(data.service_radius ? { service_radius: data.service_radius } : {}),
      })
      .eq("user_id", userId);
    if (error) throw error;
    return { ok: true };
  });
