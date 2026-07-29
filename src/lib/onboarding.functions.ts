import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const onboardingSchema = z.object({
  bio: z.string().trim().max(1000).optional(),
  years_experience: z.number().min(0).max(60).optional(),
  service_radius: z.number().min(1).max(100).optional(),
  business_name: z.string().trim().max(120).optional(),
  postcode: z.string().trim().max(16).optional(),
  working_days: z.array(z.enum(["mon","tue","wed","thu","fri","sat","sun"])).max(7).optional(),
  working_hours: z.object({ start: z.string(), end: z.string() }).optional(),
  category_ids: z.array(z.string().uuid()).max(10),
  documents: z.array(
    z.object({
      document_type: z.enum(["id", "selfie", "insurance", "dbs", "trade_licence", "address_proof"]),
      url: z.string().url(),
    }),
  ),
});

export const getMyProviderProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*, provider_categories(*, category:categories(*)), provider_verifications(*)")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return profile;
  });

export const submitProviderOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => onboardingSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("type")
      .eq("id", userId)
      .single();

    if (profileError) throw profileError;
    if (profile.type !== "provider") throw new Error("Only providers can complete onboarding");

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        bio: data.bio,
        years_experience: data.years_experience,
        service_radius: data.service_radius,
        business_name: data.business_name,
        postcode: data.postcode,
        working_days: data.working_days ?? [],
        working_hours: data.working_hours ?? { start: "09:00", end: "18:00" },
        verification_status: "pending",
      })
      .eq("id", userId);

    if (updateError) throw updateError;

    if (data.category_ids.length > 0) {
      const categoryRows = data.category_ids.map((category_id) => ({
        provider_id: userId,
        category_id,
      }));

      const { error: catError } = await supabase.from("provider_categories").insert(categoryRows);
      if (catError) throw catError;
    }

    if (data.documents.length > 0) {
      const documentRows = data.documents.map((doc) => ({
        provider_id: userId,
        ...doc,
      }));

      const { error: docError } = await supabase.from("provider_verifications").insert(documentRows);
      if (docError) throw docError;
    }

    return { ok: true };
  });
