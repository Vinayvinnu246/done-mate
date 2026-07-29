import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const onboardingSchema = z.object({
  display_name: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().max(30).optional(),
  avatar_url: z.string().url().optional().or(z.literal("")),
  date_of_birth: z.string().optional(),
  home_address: z.string().trim().max(300).optional(),
  business_name: z.string().trim().max(120).optional(),
  trading_name: z.string().trim().max(120).optional(),
  business_type: z.enum(["sole_trader", "limited"]).optional(),
  company_number: z.string().trim().max(30).optional(),
  vat_registered: z.boolean().optional(),
  vat_number: z.string().trim().max(30).optional(),
  bio: z.string().trim().max(1000).optional(),
  years_experience: z.number().min(0).max(60).optional(),
  category_ids: z.array(z.string().uuid()).max(15),
  subcategory_ids: z.array(z.string().uuid()).max(60).optional(),
  postcode: z.string().trim().max(16).optional(),
  service_radius: z.number().min(1).max(100).optional(),
  areas_covered: z.array(z.string().trim().max(40)).max(20).optional(),
  working_days: z.array(z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"])).max(7).optional(),
  working_hours: z.object({ start: z.string(), end: z.string() }).optional(),
  available_today: z.boolean().optional(),
  emergency_jobs: z.boolean().optional(),
  holiday_dates: z.array(z.string()).max(50).optional(),
  documents: z
    .array(
      z.object({
        document_type: z.enum([
          "id",
          "selfie",
          "insurance",
          "dbs",
          "trade_licence",
          "address_proof",
          "company_docs",
        ]),
        url: z.string().min(1),
        expiry_date: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
});

export const getMyProviderProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*, provider_categories(*, category:categories(*)), provider_verifications(*)")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;

    const { data: subs } = await supabase
      .from("provider_subcategories")
      .select("subcategory_id, subcategory:service_subcategories(id, name, slug, category_id)")
      .eq("provider_id", userId);

    return { ...(profile ?? {}), provider_subcategories: subs ?? [] };
  });

export const submitProviderOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => onboardingSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("type")
      .eq("user_id", userId)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile || profile.type !== "provider") throw new Error("Only providers can complete onboarding");

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: data.display_name,
        phone: data.phone,
        avatar_url: data.avatar_url || null,
        date_of_birth: data.date_of_birth || null,
        home_address: data.home_address,
        bio: data.bio,
        years_experience: data.years_experience,
        service_radius: data.service_radius,
        business_name: data.business_name,
        trading_name: data.trading_name,
        business_type: data.business_type,
        company_number: data.company_number,
        vat_registered: data.vat_registered ?? false,
        vat_number: data.vat_number,
        postcode: data.postcode,
        areas_covered: data.areas_covered ?? [],
        working_days: data.working_days ?? [],
        working_hours: data.working_hours ?? { start: "09:00", end: "18:00" },
        available_today: data.available_today ?? true,
        emergency_jobs: data.emergency_jobs ?? false,
        holiday_dates: data.holiday_dates ?? [],
        verification_status: data.documents.length > 0 ? "pending" : "unverified",
        onboarding_status: "complete",
      })
      .eq("user_id", userId);
    if (updateError) throw updateError;

    await supabase.from("provider_categories").delete().eq("provider_id", userId);
    if (data.category_ids.length > 0) {
      const { error: catError } = await supabase
        .from("provider_categories")
        .insert(data.category_ids.map((category_id) => ({ provider_id: userId, category_id })));
      if (catError) throw catError;
    }

    await supabase.from("provider_subcategories").delete().eq("provider_id", userId);
    if (data.subcategory_ids && data.subcategory_ids.length > 0) {
      const { error: subError } = await supabase
        .from("provider_subcategories")
        .insert(data.subcategory_ids.map((subcategory_id) => ({ provider_id: userId, subcategory_id })));
      if (subError) throw subError;
    }

    if (data.documents.length > 0) {
      const { error: docError } = await supabase.from("provider_verifications").insert(
        data.documents.map((doc) => ({
          provider_id: userId,
          document_type: doc.document_type,
          url: doc.url,
          expiry_date: doc.expiry_date || null,
          status: "pending",
        })),
      );
      if (docError) throw docError;
    }

    return { ok: true };
  });

export const uploadVerificationDoc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({
      document_type: z.enum([
        "id",
        "selfie",
        "insurance",
        "dbs",
        "trade_licence",
        "address_proof",
        "company_docs",
      ]),
      url: z.string().min(1),
      expiry_date: z.string().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase
      .from("provider_verifications")
      .delete()
      .eq("provider_id", userId)
      .eq("document_type", data.document_type);
    const { error } = await supabase.from("provider_verifications").insert({
      provider_id: userId,
      document_type: data.document_type,
      url: data.url,
      expiry_date: data.expiry_date || null,
      status: "pending",
    });
    if (error) throw error;
    return { ok: true };
  });

export const listSubcategories = createServerFn({ method: "GET" }).handler(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const client = createClient(process.env.SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const { data, error } = await client
    .from("service_subcategories")
    .select("id, name, slug, category_id, sort_order")
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
});