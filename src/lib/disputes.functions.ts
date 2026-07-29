import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const createDisputeSchema = z.object({
  job_id: z.string().uuid(),
  reason: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).optional(),
});

export const createDispute = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => createDisputeSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: job, error: jerr } = await supabase
      .from("jobs")
      .select("id, customer_id, quotes(provider_id, status)")
      .eq("id", data.job_id)
      .single();
    if (jerr) throw jerr;
    const acceptedProvider = (job.quotes as any[])?.find((q) => q.status === "accepted")?.provider_id;
    if (!acceptedProvider) throw new Error("Job has no accepted provider");
    const isCustomer = job.customer_id === userId;
    const isProvider = acceptedProvider === userId;
    if (!isCustomer && !isProvider) throw new Error("Not a participant");
    const { data: row, error } = await supabase
      .from("disputes")
      .insert({
        job_id: data.job_id,
        opened_by: userId,
        customer_id: job.customer_id,
        provider_id: acceptedProvider,
        reason: data.reason,
        description: data.description,
      })
      .select("*")
      .single();
    if (error) throw error;
    await supabase.from("jobs").update({ status: "disputed" }).eq("id", data.job_id);
    return row;
  });

export const getMyDisputes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("disputes")
      .select("*, job:jobs(id,title)")
      .or(`customer_id.eq.${userId},provider_id.eq.${userId}`)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });