import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getMyProviderServices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [services, quals, areas, portfolio, requests] = await Promise.all([
      supabase.from("provider_services").select("*").eq("provider_id", userId),
      supabase.from("provider_qualifications").select("*").eq("provider_id", userId).order("created_at", { ascending: false }),
      supabase.from("provider_service_areas").select("*").eq("provider_id", userId),
      supabase.from("provider_portfolio").select("*").eq("provider_id", userId).order("created_at", { ascending: false }),
      supabase.from("pending_category_requests").select("*").eq("provider_id", userId).order("created_at", { ascending: false }),
    ]);
    return {
      services: services.data ?? [],
      qualifications: quals.data ?? [],
      areas: areas.data ?? [],
      portfolio: portfolio.data ?? [],
      requests: requests.data ?? [],
    };
  });

const serviceSchema = z.object({
  category_id: z.string().uuid(),
  years_experience: z.number().min(0).max(70).optional().nullable(),
  experience_description: z.string().max(500).optional().nullable(),
  callout_fee: z.number().min(0).max(10000).optional().nullable(),
  hourly_rate: z.number().min(0).max(10000).optional().nullable(),
  minimum_job_price: z.number().min(0).max(1000000).optional().nullable(),
  emergency_available: z.boolean().optional(),
  inspection_available: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

export const upsertProviderService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => serviceSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("provider_services")
      .upsert({ provider_id: userId, ...data }, { onConflict: "provider_id,category_id" });
    if (error) throw error;
    // Keep legacy provider_categories in sync for matching
    await supabase
      .from("provider_categories")
      .upsert({ provider_id: userId, category_id: data.category_id }, { onConflict: "provider_id,category_id" });
    return { ok: true };
  });

export const deleteProviderService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({ category_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("provider_services").delete().eq("provider_id", userId).eq("category_id", data.category_id);
    await supabase.from("provider_categories").delete().eq("provider_id", userId).eq("category_id", data.category_id);
    return { ok: true };
  });

export const toggleServicePause = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({ category_id: z.string().uuid(), is_active: z.boolean() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("provider_services")
      .update({ is_active: data.is_active })
      .eq("provider_id", userId)
      .eq("category_id", data.category_id);
    if (error) throw error;
    return { ok: true };
  });

const qualSchema = z.object({
  id: z.string().uuid().optional(),
  category_id: z.string().uuid().optional().nullable(),
  qualification_name: z.string().trim().min(2).max(120),
  registration_number: z.string().trim().max(80).optional().nullable(),
  issuing_body: z.string().trim().max(120).optional().nullable(),
  issue_date: z.string().optional().nullable(),
  expiry_date: z.string().optional().nullable(),
  document_url: z.string().min(1).optional().nullable(),
});

export const saveQualification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => qualSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const payload = { ...data, provider_id: userId, verification_status: "pending" as const };
    if (data.id) {
      const { error } = await supabase.from("provider_qualifications").update(payload).eq("id", data.id).eq("provider_id", userId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("provider_qualifications").insert(payload);
      if (error) throw error;
    }
    return { ok: true };
  });

export const deleteQualification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("provider_qualifications").delete().eq("id", data.id).eq("provider_id", userId);
    if (error) throw error;
    return { ok: true };
  });

const areaSchema = z.object({
  category_id: z.string().uuid().optional().nullable(),
  postcode: z.string().trim().min(2).max(16),
  radius_miles: z.number().min(1).max(100),
});

export const addServiceArea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => areaSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("provider_service_areas").insert({ provider_id: userId, ...data });
    if (error) throw error;
    return { ok: true };
  });

export const deleteServiceArea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("provider_service_areas").delete().eq("id", data.id).eq("provider_id", userId);
    if (error) throw error;
    return { ok: true };
  });

const portfolioSchema = z.object({
  category_id: z.string().uuid().optional().nullable(),
  title: z.string().trim().max(120).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  image_url: z.string().min(1),
});

export const addPortfolioItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => portfolioSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("provider_portfolio").insert({ provider_id: userId, ...data });
    if (error) throw error;
    return { ok: true };
  });

export const deletePortfolioItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("provider_portfolio").delete().eq("id", data.id).eq("provider_id", userId);
    if (error) throw error;
    return { ok: true };
  });

export const requestNewCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({
    proposed_name: z.string().trim().min(2).max(80),
    description: z.string().trim().max(500).optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("pending_category_requests").insert({ provider_id: userId, ...data });
    if (error) throw error;
    return { ok: true };
  });