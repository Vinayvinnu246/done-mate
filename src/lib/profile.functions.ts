import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const profileUpdateSchema = z.object({
  display_name: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(30).optional(),
  avatar_url: z.string().url().max(500).optional().or(z.literal("")),
});

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);

    return {
      userId,
      profile,
      roles: roles?.map((r) => r.role) ?? [],
    };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => profileUpdateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: data.display_name,
        phone: data.phone,
        avatar_url: data.avatar_url || null,
      })
      .eq("user_id", userId);

    if (error) throw error;
    return { ok: true };
  });

export const updateOnboardingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { status: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_status: data.status })
      .eq("user_id", userId);

    if (error) throw error;
    return { ok: true };
  });
