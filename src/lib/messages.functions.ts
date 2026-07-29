import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const listSchema = z.object({
  job_id: z.string().uuid(),
  provider_id: z.string().uuid(),
});

const sendSchema = z.object({
  job_id: z.string().uuid(),
  provider_id: z.string().uuid(),
  body: z.string().trim().min(1).max(4000).optional(),
  image_url: z.string().url().optional(),
});

export const listMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => listSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("messages")
      .select("id, job_id, provider_id, sender_id, body, image_url, created_at")
      .eq("job_id", data.job_id)
      .eq("provider_id", data.provider_id)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => sendSchema.parse(data))
  .handler(async ({ data, context }) => {
    if (!data.body && !data.image_url) throw new Error("Message cannot be empty");
    const { data: row, error } = await context.supabase
      .from("messages")
      .insert({
        job_id: data.job_id,
        provider_id: data.provider_id,
        sender_id: context.userId,
        body: data.body ?? null,
        image_url: data.image_url ?? null,
      })
      .select("id, job_id, provider_id, sender_id, body, image_url, created_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });