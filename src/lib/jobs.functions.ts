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
  parent_quote_id: z.string().uuid().optional(),
  proposed_by: z.enum(["customer", "provider"]).optional(),
});

const quoteUpdateSchema = z.object({
  quote_id: z.string().uuid(),
  status: z.enum(["accepted", "rejected", "withdrawn"]),
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

    try {
      const { notifyProvidersOfNewJob } = await import("./notifications.server");
      await notifyProvidersOfNewJob(job.id);
    } catch (e) {
      console.error("Failed to notify providers about new job", e);
    }

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

    // Get provider's categories to filter matched jobs
    const { data: providerCats } = await supabase
      .from("provider_categories")
      .select("category_id")
      .eq("provider_id", userId);
    const catIds = (providerCats ?? []).map((c) => c.category_id);

    let query = supabase
      .from("jobs")
      .select("*, category:categories(*), quotes(*)")
      .in("status", ["posted", "quoting"])
      .neq("customer_id", userId)
      .order("created_at", { ascending: false });

    if (catIds.length > 0) query = query.in("category_id", catIds);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((job) => ({
      ...job,
      quotes: job.quotes?.filter((q) => q.provider_id !== userId) ?? [],
      hasMyQuote: (job.quotes ?? []).some((q) => q.provider_id === userId),
    }));
  });

export const getMyProviderQuotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("quotes")
      .select("*, job:jobs(*, category:categories(*))")
      .eq("provider_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const getMyBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // Customer's accepted+ jobs
    const { data: customerJobs, error: e1 } = await supabase
      .from("jobs")
      .select("*, category:categories(*), quotes(*, provider:profiles(*))")
      .eq("customer_id", userId)
      .in("status", ["accepted", "in_progress", "completed", "cancelled", "disputed"])
      .order("scheduled_date", { ascending: true });
    if (e1) throw e1;

    // Provider's accepted quotes
    const { data: quotes, error: e2 } = await supabase
      .from("quotes")
      .select("*, job:jobs(*, category:categories(*), customer:profiles!jobs_customer_id_fkey(display_name, avatar_url))")
      .eq("provider_id", userId)
      .eq("status", "accepted")
      .order("updated_at", { ascending: false });
    if (e2) throw e2;

    return {
      customerJobs: customerJobs ?? [],
      providerJobs: (quotes ?? []).map((q) => ({ ...q.job, myQuote: q })),
    };
  });

export const updateJobStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        job_id: z.string().uuid(),
        status: z.enum(["in_progress", "completed", "cancelled"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: job, error: je } = await supabase
      .from("jobs")
      .select("id, customer_id, status")
      .eq("id", data.job_id)
      .maybeSingle();
    if (je) throw je;
    if (!job) throw new Error("Job not found");

    const { data: myQuote } = await supabase
      .from("quotes")
      .select("id, status")
      .eq("job_id", data.job_id)
      .eq("provider_id", userId)
      .eq("status", "accepted")
      .maybeSingle();

    const isCustomer = job.customer_id === userId;
    const isProvider = !!myQuote;
    if (!isCustomer && !isProvider) throw new Error("Not authorized");

    // Providers can move in_progress; customers can cancel or mark completed
    if (data.status === "in_progress" && !isProvider) throw new Error("Only the provider can start the job");
    if (data.status === "completed" && !isCustomer) throw new Error("Only the customer can mark the job as completed");

    const { data: updated, error } = await supabase
      .from("jobs")
      .update({ status: data.status })
      .eq("id", data.job_id)
      .select("*")
      .single();
    if (error) throw error;
    return updated;
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
      .select("customer_id, status, expires_at")
      .eq("id", data.job_id)
      .single();

    if (jobError) throw jobError;
    if (!["posted", "quoting"].includes(job.status)) throw new Error("This job is not accepting quotes");
    if (job.expires_at && new Date(job.expires_at) < new Date()) {
      throw new Error("This job has expired and is no longer accepting quotes");
    }

    // No duplicate quotes from the same provider (counter-offers excepted).
    if (!data.parent_quote_id && job.customer_id !== userId) {
      const { data: existing } = await supabase
        .from("quotes")
        .select("id")
        .eq("job_id", data.job_id)
        .eq("provider_id", userId)
        .in("status", ["pending", "countered", "accepted"])
        .maybeSingle();
      if (existing) throw new Error("You've already quoted on this job. Edit your existing quote instead.");
    }

    const proposedBy = data.proposed_by ?? (job.customer_id === userId ? "customer" : "provider");
    if (proposedBy === "provider" && job.customer_id === userId) {
      throw new Error("You cannot quote on your own job");
    }
    if (proposedBy === "customer" && job.customer_id !== userId) {
      throw new Error("Only the customer can send a counter-offer");
    }

    // For customer counter-offers, provider_id must be the original quote's provider
    let providerId = userId;
    if (proposedBy === "customer") {
      if (!data.parent_quote_id) throw new Error("Counter-offer must reference a parent quote");
      const { data: parent, error: pe } = await supabase
        .from("quotes")
        .select("provider_id")
        .eq("id", data.parent_quote_id)
        .single();
      if (pe) throw pe;
      providerId = parent.provider_id;

      // Mark parent as countered
      await supabase.from("quotes").update({ status: "countered" }).eq("id", data.parent_quote_id);
    } else if (data.parent_quote_id) {
      // Provider counter-response
      await supabase.from("quotes").update({ status: "countered" }).eq("id", data.parent_quote_id);
    }

    const { data: quote, error } = await supabase
      .from("quotes")
      .insert({
        provider_id: providerId,
        job_id: data.job_id,
        price: data.price,
        duration_minutes: data.duration_minutes,
        message: data.message,
        parent_quote_id: data.parent_quote_id,
        proposed_by: proposedBy,
      })
      .select("*")
      .single();

    if (error) throw error;

    if (proposedBy === "provider") {
      try {
        const { notifyCustomerOfQuote } = await import("./notifications.server");
        await notifyCustomerOfQuote(quote.id);
      } catch (e) {
        console.error("Failed to notify customer about quote", e);
      }
    }

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

      try {
        const { notifyOnQuoteAccepted } = await import("./notifications.server");
        await notifyOnQuoteAccepted(data.quote_id);
      } catch (e) {
        console.error("Failed to send booking notifications", e);
      }
    }

    return updatedQuote;
  });
