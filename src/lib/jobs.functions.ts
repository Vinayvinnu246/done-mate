import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";

const jobInsertSchema = z.object({
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(20).max(2000),
  category_id: z.string().uuid(),
  urgency: z.enum(["standard", "today", "emergency"]),
  budget_min: z.number().min(0).optional(),
  budget_max: z.number().min(0).optional(),
  scheduled_date: z.string().optional(),
  address_line1: z.string().trim().min(3).max(200),
  address_line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(100),
  postcode: z.string().trim().min(3).max(20),
  lat: z.number().optional(),
  lng: z.number().optional(),
  images: z.array(z.string().min(1)).max(8).optional(),
  videos: z.array(z.string().min(1)).max(4).optional(),
});

const quoteInsertSchema = z.object({
  job_id: z.string().uuid(),
  price: z.number().min(0),
  duration_minutes: z.number().min(15).optional(),
  message: z.string().trim().max(1000).optional(),
});

const quoteUpdateSchema = z.object({
  quote_id: z.string().uuid(),
  status: z.enum(["accepted", "rejected"]),
});

export const getCategories = createServerFn({ method: "GET" }).handler(async () => {
  const supabasePublic = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  const { data, error } = await supabasePublic
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
});

export const createJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => jobInsertSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: job, error } = await supabase
      .from("jobs")
      .insert({
        customer_id: userId,
        ...data,
      })
      .select("*")
      .single();

    if (error) throw error;
    return job;
  });

export const getMyJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data, error } = await supabase
      .from("jobs")
      .select("*, category:categories(*), quotes(*)")
      .eq("customer_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  });

export const getAvailableJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data, error } = await supabase
      .from("jobs")
      .select("*, category:categories(*), quotes(*)")
      .in("status", ["posted", "quoting"])
      .neq("customer_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []).map((job) => ({
      ...job,
      quotes: job.quotes?.filter((q) => q.provider_id !== userId) ?? [],
    }));
  });

export const getJobById = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: string) => input)
  .handler(async ({ data: jobId, context }) => {
    const { supabase, userId } = context;

    const { data: job, error } = await supabase
      .from("jobs")
      .select("*, category:categories(*), quotes(*, provider:profiles(*))")
      .eq("id", jobId)
      .maybeSingle();

    if (error) throw error;
    if (!job) throw new Error("Job not found");

    const isCustomer = job.customer_id === userId;
    const isProvider = job.quotes?.some((q) => q.provider_id === userId);

    if (!isCustomer && !isProvider && job.status !== "posted" && job.status !== "quoting") {
      throw new Error("Not authorized to view this job");
    }

    return job;
  });

export const createQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => quoteInsertSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("customer_id, status")
      .eq("id", data.job_id)
      .single();

    if (jobError) throw jobError;
    if (job.customer_id === userId) throw new Error("You cannot quote on your own job");
    if (!["posted", "quoting"].includes(job.status)) throw new Error("This job is not accepting quotes");

    const { data: quote, error } = await supabase
      .from("quotes")
      .insert({
        provider_id: userId,
        ...data,
      })
      .select("*")
      .single();

    if (error) throw error;
    return quote;
  });

export const updateQuoteStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => quoteUpdateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select("*, job:jobs(customer_id)")
      .eq("id", data.quote_id)
      .single();

    if (quoteError) throw quoteError;
    if (quote.job.customer_id !== userId) throw new Error("Only the customer can accept or reject a quote");

    const { data: updatedQuote, error } = await supabase
      .from("quotes")
      .update({ status: data.status })
      .eq("id", data.quote_id)
      .select("*")
      .single();

    if (error) throw error;

    if (data.status === "accepted") {
      await supabase
        .from("jobs")
        .update({ status: "accepted" })
        .eq("id", quote.job_id);

      await supabase
        .from("quotes")
        .update({ status: "rejected" })
        .eq("job_id", quote.job_id)
        .neq("id", data.quote_id);
    }

    return updatedQuote;
  });
