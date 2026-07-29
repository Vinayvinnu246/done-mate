import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";

const createReviewSchema = z.object({
  job_id: z.string().uuid(),
  provider_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

export const createReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => createReviewSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("reviews")
      .insert({ ...data, customer_id: userId })
      .select("*")
      .single();
    if (error) throw error;
    return row;
  });

export const getMyReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [asProvider, asCustomer] = await Promise.all([
      supabase.from("reviews").select("*, job:jobs(id,title)").eq("provider_id", userId).order("created_at", { ascending: false }),
      supabase.from("reviews").select("*, job:jobs(id,title)").eq("customer_id", userId).order("created_at", { ascending: false }),
    ]);
    if (asProvider.error) throw asProvider.error;
    if (asCustomer.error) throw asCustomer.error;
    const received = asProvider.data ?? [];
    const avg = received.length ? received.reduce((s, r) => s + Number(r.rating), 0) / received.length : 0;
    return { received, given: asCustomer.data ?? [], avg, count: received.length };
  });

export const getProviderReviews = createServerFn({ method: "GET" })
  .validator((i: unknown) => z.object({ provider_id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const sb = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    const { data: rows, error } = await sb
      .from("reviews")
      .select("id,rating,comment,created_at,job:jobs(title)")
      .eq("provider_id", data.provider_id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return rows ?? [];
  });