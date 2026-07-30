import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PROVIDER_STATUSES = [
  "confirmed",
  "on_the_way",
  "arrived",
  "in_progress",
  "provider_completed",
  "unable_to_complete",
] as const;

export const CANCELLATION_REASONS = [
  "Emergency",
  "Schedule conflict",
  "Customer unavailable",
  "Incorrect job details",
  "Outside service scope",
  "Other",
] as const;

/** Every job assigned to the signed-in provider, with customer + category. */
export const listAssignedJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("jobs")
      .select(
        "*, category:categories(id, name), customer:profiles!jobs_customer_id_fkey(display_name, phone, avatar_url), quotes(id, provider_id, price, duration_minutes, status)",
      )
      .eq("assigned_provider_id", userId)
      .order("scheduled_start_datetime", { ascending: true, nullsFirst: false });
    if (error) throw new Error(error.message);

    const bookingConfirmed = (s: string) =>
      ![
        "quote_pending",
        "provider_selected",
        "cancelled",
      ].includes(s);

    return (data ?? []).map((job) => {
      const confirmed = bookingConfirmed(job.booking_status);
      const customer = job.customer as { display_name: string | null; phone: string | null } | null;
      return {
        ...job,
        // Full address + phone are only exposed once the booking is confirmed.
        address_line1: confirmed ? job.address_line1 : null,
        address_line2: confirmed ? job.address_line2 : null,
        customer: {
          display_name: customer?.display_name ?? "Customer",
          phone: confirmed ? (customer?.phone ?? null) : null,
        },
      };
    });
  });

export const getAssignedJobEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ job_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("job_status_events")
      .select("id, status, note, created_at, actor_id")
      .eq("job_id", data.job_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

/** Provider updates the live status of an assigned job. */
export const updateBookingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        job_id: z.string().uuid(),
        status: z.enum(PROVIDER_STATUSES),
        note: z.string().trim().max(1000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: job, error: je } = await supabase
      .from("jobs")
      .select("id, assigned_provider_id, booking_status")
      .eq("id", data.job_id)
      .maybeSingle();
    if (je) throw new Error(je.message);
    if (!job || job.assigned_provider_id !== userId) throw new Error("Not authorised for this job");

    const { isTerminal, logStatusEvent, notifyCustomerOfStatus } = await import(
      "./assignments.server"
    );
    if (isTerminal(job.booking_status)) throw new Error("This job is closed");

    const patch: Record<string, unknown> = { booking_status: data.status };
    if (data.status === "in_progress") patch.status = "in_progress";
    if (data.status === "provider_completed") patch.completion_notes = data.note ?? null;
    if (data.status === "unable_to_complete") {
      patch.status = "disputed";
      patch.cancellation_details = data.note ?? null;
    }

    const { error } = await supabase.from("jobs").update(patch).eq("id", data.job_id);
    if (error) throw new Error(error.message);

    await logStatusEvent(data.job_id, userId, data.status, data.note);
    await notifyCustomerOfStatus(data.job_id, data.status);
    return { ok: true };
  });

/** Provider cancels an assigned job with a reason. Customer + admins notified. */
export const cancelAssignedJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        job_id: z.string().uuid(),
        reason: z.enum(CANCELLATION_REASONS),
        details: z.string().trim().max(1000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: job } = await supabase
      .from("jobs")
      .select("id, assigned_provider_id, title, job_ref, customer_id")
      .eq("id", data.job_id)
      .maybeSingle();
    if (!job || job.assigned_provider_id !== userId) throw new Error("Not authorised for this job");

    const { error } = await supabase
      .from("jobs")
      .update({
        booking_status: "cancelled",
        status: "cancelled",
        cancellation_reason: data.reason,
        cancellation_details: data.details ?? null,
        cancelled_by: userId,
        reminder_24h_sent: true,
        reminder_5h_sent: true,
      })
      .eq("id", data.job_id);
    if (error) throw new Error(error.message);

    const { logStatusEvent, pushNotification } = await import("./assignments.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await logStatusEvent(data.job_id, userId, "cancelled", `${data.reason}${data.details ? ` — ${data.details}` : ""}`);

    await pushNotification({
      user_id: job.customer_id,
      job_id: job.id,
      type: "job_status",
      title: "Your provider cancelled",
      message: `${job.job_ref ?? job.title} was cancelled (${data.reason}). We'll help you find another pro.`,
      metadata: { reason: data.reason },
    });

    const { data: admins } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .in("role", ["admin", "super_admin"]);
    for (const a of admins ?? []) {
      await pushNotification({
        user_id: a.user_id,
        job_id: job.id,
        type: "job_status",
        title: "Provider cancelled a booking",
        message: `${job.job_ref ?? job.title}: ${data.reason}${data.details ? ` — ${data.details}` : ""}`,
      });
    }

    return { ok: true };
  });

/** Reschedule an assigned job: resets reminders and notifies both parties. */
export const rescheduleAssignedJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        job_id: z.string().uuid(),
        scheduled_start_datetime: z.string().min(1),
        estimated_duration_minutes: z.number().int().min(15).max(1440).optional(),
        note: z.string().trim().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: job } = await supabase
      .from("jobs")
      .select("id, assigned_provider_id, customer_id, title, job_ref, timezone, estimated_duration_minutes")
      .eq("id", data.job_id)
      .maybeSingle();
    if (!job || job.assigned_provider_id !== userId) throw new Error("Not authorised for this job");

    const startIso = new Date(data.scheduled_start_datetime).toISOString();
    const duration = data.estimated_duration_minutes ?? job.estimated_duration_minutes ?? 60;

    const { hasBookingConflict, logStatusEvent, pushNotification, formatInTimezone } =
      await import("./assignments.server");

    const conflict = await hasBookingConflict(userId, startIso, duration, job.id);
    if (conflict.conflict) {
      throw new Error("You already have another job scheduled during this time.");
    }

    const { error } = await supabase
      .from("jobs")
      .update({
        scheduled_start_datetime: startIso,
        scheduled_date: startIso,
        estimated_duration_minutes: duration,
        reminder_24h_sent: false,
        reminder_24h_sent_at: null,
        reminder_5h_sent: false,
        reminder_5h_sent_at: null,
      })
      .eq("id", data.job_id);
    if (error) throw new Error(error.message);

    const when = formatInTimezone(startIso, job.timezone ?? "Europe/London");
    await logStatusEvent(data.job_id, userId, "rescheduled", `${when}${data.note ? ` — ${data.note}` : ""}`);

    for (const uid of [job.customer_id, userId]) {
      await pushNotification({
        user_id: uid,
        job_id: job.id,
        type: "job_rescheduled",
        title: "Booking rescheduled",
        message: `${job.job_ref ?? job.title} is now scheduled for ${when}.`,
        metadata: { scheduled_start_datetime: startIso },
      });
    }

    return { ok: true };
  });

/** Before/after photos, provider notes and materials info. */
export const updateJobWorkDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        job_id: z.string().uuid(),
        before_photos: z.array(z.string().min(1)).max(12).optional(),
        after_photos: z.array(z.string().min(1)).max(12).optional(),
        provider_notes: z.string().trim().max(2000).optional(),
        materials_info: z.string().trim().max(2000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { job_id, ...patch } = data;
    const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
    if (Object.keys(clean).length === 0) return { ok: true };

    const { error } = await supabase
      .from("jobs")
      .update(clean)
      .eq("id", job_id)
      .eq("assigned_provider_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Customer confirms the provider's completion; unlocks review + payout. */
export const confirmJobCompletion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ job_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: job } = await supabase
      .from("jobs")
      .select("id, customer_id, assigned_provider_id, booking_status, title, job_ref")
      .eq("id", data.job_id)
      .maybeSingle();
    if (!job || job.customer_id !== userId) throw new Error("Only the customer can confirm completion");
    if (job.booking_status !== "provider_completed") throw new Error("The provider hasn't marked this job complete yet");

    const { error } = await supabase
      .from("jobs")
      .update({ booking_status: "completed", status: "completed", payment_status: "released" })
      .eq("id", data.job_id);
    if (error) throw new Error(error.message);

    const { logStatusEvent, pushNotification } = await import("./assignments.server");
    await logStatusEvent(data.job_id, userId, "customer_confirmed");
    if (job.assigned_provider_id) {
      await pushNotification({
        user_id: job.assigned_provider_id,
        job_id: job.id,
        type: "job_status",
        title: "Customer confirmed completion",
        message: `${job.job_ref ?? job.title} is complete. Your earnings are on the way.`,
      });
    }
    return { ok: true };
  });