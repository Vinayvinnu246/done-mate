/**
 * Server-only helpers for assigned jobs: assignment, status transitions,
 * double-booking checks and scheduled reminders.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const BOOKING_STATUSES = [
  "quote_pending",
  "provider_selected",
  "assigned",
  "confirmed",
  "upcoming",
  "on_the_way",
  "arrived",
  "in_progress",
  "provider_completed",
  "customer_confirmed",
  "completed",
  "cancelled",
  "disputed",
  "unable_to_complete",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

const TERMINAL: BookingStatus[] = [
  "completed",
  "customer_confirmed",
  "cancelled",
  "disputed",
  "unable_to_complete",
];

export function isTerminal(status: string) {
  return TERMINAL.includes(status as BookingStatus);
}

/** Insert a notification row directly (no dedupe on repeated status updates). */
export async function pushNotification(row: {
  user_id: string;
  job_id?: string | null;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  const { error } = await supabaseAdmin.from("notifications").insert({
    user_id: row.user_id,
    job_id: row.job_id ?? null,
    type: row.type,
    title: row.title,
    message: row.message,
    metadata: (row.metadata ?? {}) as never,
    delivery_method: "in_app",
    delivery_status: "delivered",
  });
  if (error) console.error("pushNotification failed", error);
}

export async function logStatusEvent(
  jobId: string,
  actorId: string | null,
  status: string,
  note?: string | null,
) {
  const { error } = await supabaseAdmin
    .from("job_status_events")
    .insert({ job_id: jobId, actor_id: actorId, status, note: note ?? null });
  if (error) console.error("logStatusEvent failed", error);
}

export function formatInTimezone(iso: string | null, timezone = "Europe/London") {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toISOString();
  }
}

/**
 * True when the provider already has another assigned job overlapping the slot.
 */
export async function hasBookingConflict(
  providerId: string,
  startIso: string,
  durationMinutes: number | null,
  ignoreJobId?: string,
) {
  const start = new Date(startIso).getTime();
  const end = start + (durationMinutes ?? 60) * 60_000;
  const windowStart = new Date(start - 12 * 60 * 60_000).toISOString();
  const windowEnd = new Date(end + 12 * 60 * 60_000).toISOString();

  const { data } = await supabaseAdmin
    .from("jobs")
    .select("id, scheduled_start_datetime, estimated_duration_minutes, booking_status, title")
    .eq("assigned_provider_id", providerId)
    .not("scheduled_start_datetime", "is", null)
    .gte("scheduled_start_datetime", windowStart)
    .lte("scheduled_start_datetime", windowEnd);

  for (const j of data ?? []) {
    if (ignoreJobId && j.id === ignoreJobId) continue;
    if (isTerminal(j.booking_status)) continue;
    const s = new Date(j.scheduled_start_datetime as string).getTime();
    const e = s + (j.estimated_duration_minutes ?? 60) * 60_000;
    if (s < end && start < e) return { conflict: true, job: j };
  }
  return { conflict: false as const, job: null };
}

/**
 * Assign a provider to a job (quote accepted or admin assignment) and fire the
 * immediate assignment notification, including the urgent < 5h variant.
 */
export async function assignProviderToJob(opts: {
  jobId: string;
  providerId: string;
  price?: number | null;
  durationMinutes?: number | null;
  actorId?: string | null;
}) {
  const { data: job } = await supabaseAdmin
    .from("jobs")
    .select(
      "id, job_ref, title, customer_id, scheduled_date, scheduled_start_datetime, timezone, postcode, category:categories(name)",
    )
    .eq("id", opts.jobId)
    .maybeSingle();
  if (!job) return;

  const start = job.scheduled_start_datetime ?? job.scheduled_date ?? null;

  await supabaseAdmin
    .from("jobs")
    .update({
      assigned_provider_id: opts.providerId,
      booking_status: "assigned",
      status: "accepted",
      agreed_price: opts.price ?? null,
      estimated_duration_minutes: opts.durationMinutes ?? null,
      scheduled_start_datetime: start,
      reminder_24h_sent: false,
      reminder_24h_sent_at: null,
      reminder_5h_sent: false,
      reminder_5h_sent_at: null,
    })
    .eq("id", opts.jobId);

  await logStatusEvent(opts.jobId, opts.actorId ?? null, "assigned");

  const categoryName =
    (job.category as { name?: string } | null)?.name?.toLowerCase() ?? "job";
  const when = formatInTimezone(start, job.timezone ?? "Europe/London");
  const hoursAway = start
    ? (new Date(start).getTime() - Date.now()) / 3_600_000
    : Infinity;

  const urgent = hoursAway <= 5;
  await pushNotification({
    user_id: opts.providerId,
    job_id: job.id,
    type: "job_assigned",
    title: urgent ? "New job assigned — starts soon" : "New job assigned",
    message: urgent
      ? `New job assigned: this ${categoryName} job starts in less than 5 hours${when ? ` (${when})` : ""}.`
      : `${job.job_ref ?? ""} ${job.title}${when ? ` — ${when}` : ""}`.trim(),
    metadata: { job_ref: job.job_ref, urgent },
  });

  // Booked inside the reminder windows: suppress stale reminders.
  if (hoursAway <= 24) {
    await supabaseAdmin
      .from("jobs")
      .update({ reminder_24h_sent: true, reminder_24h_sent_at: new Date().toISOString() })
      .eq("id", opts.jobId);
  }
  if (hoursAway <= 5) {
    await supabaseAdmin
      .from("jobs")
      .update({ reminder_5h_sent: true, reminder_5h_sent_at: new Date().toISOString() })
      .eq("id", opts.jobId);
  }
}

const CUSTOMER_STATUS_COPY: Record<string, { title: string; message: string }> = {
  confirmed: { title: "Booking confirmed", message: "Your provider has confirmed the booking." },
  on_the_way: { title: "Provider on the way", message: "Your provider is on the way." },
  arrived: { title: "Provider arrived", message: "Your provider has arrived." },
  in_progress: { title: "Work started", message: "Work has started." },
  provider_completed: {
    title: "Work completed",
    message: "The provider has marked the job as completed. Please confirm and leave a review.",
  },
  unable_to_complete: {
    title: "Provider could not complete the job",
    message: "The provider marked this job as unable to complete. Our team will be in touch.",
  },
  cancelled: { title: "Job cancelled", message: "Your provider cancelled this job." },
};

export async function notifyCustomerOfStatus(
  jobId: string,
  status: string,
  extra?: string | null,
) {
  const copy = CUSTOMER_STATUS_COPY[status];
  if (!copy) return;
  const { data: job } = await supabaseAdmin
    .from("jobs")
    .select("id, title, customer_id, job_ref")
    .eq("id", jobId)
    .maybeSingle();
  if (!job) return;
  await pushNotification({
    user_id: job.customer_id,
    job_id: job.id,
    type: "job_status",
    title: copy.title,
    message: `${copy.message}${extra ? ` ${extra}` : ""} (${job.job_ref ?? job.title})`,
    metadata: { booking_status: status },
  });
}

/** Cron worker: send 24h and 5h reminders exactly once per job. */
export async function runJobReminders() {
  const now = Date.now();
  const horizon = new Date(now + 25 * 3_600_000).toISOString();

  const { data: jobs, error } = await supabaseAdmin
    .from("jobs")
    .select(
      "id, job_ref, title, assigned_provider_id, scheduled_start_datetime, timezone, postcode, booking_status, reminder_24h_sent, reminder_5h_sent, customer_instructions, category:categories(name)",
    )
    .not("assigned_provider_id", "is", null)
    .not("scheduled_start_datetime", "is", null)
    .gte("scheduled_start_datetime", new Date(now).toISOString())
    .lte("scheduled_start_datetime", horizon);

  if (error) {
    console.error("runJobReminders query failed", error);
    return { sent24: 0, sent5: 0 };
  }

  let sent24 = 0;
  let sent5 = 0;

  for (const job of jobs ?? []) {
    if (isTerminal(job.booking_status)) continue;
    const start = new Date(job.scheduled_start_datetime as string).getTime();
    const hoursAway = (start - now) / 3_600_000;
    const trade =
      (job.category as { name?: string } | null)?.name?.toLowerCase() ?? "job";
    const when = formatInTimezone(
      job.scheduled_start_datetime,
      job.timezone ?? "Europe/London",
    );
    const area = (job.postcode ?? "").split(" ")[0];

    if (!job.reminder_24h_sent && hoursAway <= 24 && hoursAway > 5) {
      await pushNotification({
        user_id: job.assigned_provider_id as string,
        job_id: job.id,
        type: "job_reminder_24h",
        title: "Job tomorrow",
        message: `Reminder: you have a ${trade} job ${when}${area ? ` in ${area}` : ""}.`,
        metadata: { job_ref: job.job_ref },
      });
      await supabaseAdmin
        .from("jobs")
        .update({ reminder_24h_sent: true, reminder_24h_sent_at: new Date().toISOString() })
        .eq("id", job.id);
      sent24 += 1;
    }

    if (!job.reminder_5h_sent && hoursAway <= 5) {
      await pushNotification({
        user_id: job.assigned_provider_id as string,
        job_id: job.id,
        type: "job_reminder_5h",
        title: "Job starts in 5 hours",
        message: `Your ${trade} job starts in 5 hours (${when}). Check the address and customer instructions.`,
        metadata: { job_ref: job.job_ref },
      });
      await supabaseAdmin
        .from("jobs")
        .update({
          reminder_5h_sent: true,
          reminder_5h_sent_at: new Date().toISOString(),
          reminder_24h_sent: true,
        })
        .eq("id", job.id);
      sent5 += 1;
    }
  }

  return { sent24, sent5 };
}