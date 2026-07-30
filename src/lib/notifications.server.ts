/**
 * Server-only notification engine: provider matching + notification dispatch.
 * Never imported from client code (blocked by the *.server.ts filename rule).
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type NotificationType =
  | "new_job"
  | "new_quote"
  | "quote_accepted"
  | "job_closed"
  | "booking_confirmed"
  | "new_message";

const PREF_KEY_BY_TYPE: Record<NotificationType, string> = {
  new_job: "new_jobs",
  new_quote: "new_quotes",
  quote_accepted: "bookings",
  job_closed: "new_jobs",
  booking_confirmed: "bookings",
  new_message: "messages",
};

export function normalisePostcode(pc?: string | null) {
  return (pc ?? "").toUpperCase().replace(/\s+/g, "");
}

/** Outward code, e.g. "SW16 5NW" -> "SW16". */
export function outwardCode(pc?: string | null) {
  const clean = normalisePostcode(pc);
  if (!clean) return "";
  return clean.length > 3 ? clean.slice(0, clean.length - 3) : clean;
}

/** Postcode area letters, e.g. "SW16" -> "SW". */
export function postcodeArea(pc?: string | null) {
  return (outwardCode(pc).match(/^[A-Z]+/) ?? [""])[0];
}

export function coversPostcode(
  jobPostcode: string,
  providerPostcodes: string[],
) {
  const jobOut = outwardCode(jobPostcode);
  const jobArea = postcodeArea(jobPostcode);
  if (!jobOut) return false;
  return providerPostcodes.some((p) => {
    const out = outwardCode(p);
    if (!out) return false;
    // Exact district match, or the provider listed just the area ("SW").
    return jobOut === out || out === jobArea || jobOut.startsWith(out);
  });
}

export function milesBetween(
  a: { lat?: number | null; lng?: number | null },
  b: { lat?: number | null; lng?: number | null },
) {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null;
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)) * 10) / 10;
}

type JobRow = {
  id: string;
  title: string;
  description: string;
  category_id: string | null;
  postcode: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  budget_min: number | null;
  budget_max: number | null;
  scheduled_date: string | null;
  urgency: string;
};

export type MatchedProvider = {
  providerId: string;
  distanceMiles: number | null;
};

/**
 * Find providers eligible for a job: approved, complete, active, accepting work,
 * registered for the category, covering the postcode, category not muted.
 */
export async function findMatchingProviders(job: JobRow): Promise<MatchedProvider[]> {
  if (!job.category_id) return [];

  const { data: catRows } = await supabaseAdmin
    .from("provider_categories")
    .select("provider_id")
    .eq("category_id", job.category_id);

  const candidateIds = [...new Set((catRows ?? []).map((r) => r.provider_id))];
  if (candidateIds.length === 0) return [];

  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select(
      "user_id, type, verification_status, account_status, onboarding_status, is_available, postcode, service_radius, areas_covered, muted_category_ids, notification_preferences, daily_notification_limit",
    )
    .in("user_id", candidateIds)
    .eq("type", "provider")
    .eq("verification_status", "verified")
    .eq("account_status", "active")
    .eq("onboarding_status", "complete")
    .eq("is_available", true);

  const eligible = profiles ?? [];
  if (eligible.length === 0) return [];

  const { data: areas } = await supabaseAdmin
    .from("provider_service_areas")
    .select("provider_id, postcode, radius_miles, category_id")
    .in(
      "provider_id",
      eligible.map((p) => p.user_id),
    );

  const areasByProvider = new Map<string, { postcode: string; category_id: string | null }[]>();
  for (const a of areas ?? []) {
    const list = areasByProvider.get(a.provider_id) ?? [];
    list.push({ postcode: a.postcode, category_id: a.category_id });
    areasByProvider.set(a.provider_id, list);
  }

  const matches: MatchedProvider[] = [];

  for (const p of eligible) {
    const muted = (p.muted_category_ids as string[] | null) ?? [];
    if (muted.includes(job.category_id)) continue;

    const prefs = (p.notification_preferences ?? {}) as Record<string, unknown>;
    if (prefs.new_jobs === false || prefs.in_app === false) continue;

    const providerAreas = (areasByProvider.get(p.user_id) ?? []).filter(
      (a) => !a.category_id || a.category_id === job.category_id,
    );
    const postcodes = [
      ...providerAreas.map((a) => a.postcode),
      ...(((p.areas_covered as string[] | null) ?? []) as string[]),
      p.postcode ?? "",
    ].filter(Boolean);

    if (!coversPostcode(job.postcode ?? "", postcodes)) continue;

    // Daily anti-spam cap.
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", p.user_id)
      .eq("type", "new_job")
      .gte("created_at", since);
    if ((count ?? 0) >= (p.daily_notification_limit ?? 50)) continue;

    matches.push({ providerId: p.user_id, distanceMiles: null });
  }

  return matches;
}

type NotificationInput = {
  user_id: string;
  job_id?: string | null;
  quote_id?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
};

/** Insert notifications, ignoring duplicates for the same (user, job, type). */
export async function dispatchNotifications(rows: NotificationInput[]) {
  if (rows.length === 0) return 0;
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .upsert(
      rows.map((r) => ({
        ...r,
        metadata: (r.metadata ?? {}) as never,
        delivery_method: "in_app",
        delivery_status: "delivered",
      })),
      { onConflict: "user_id,job_id,type", ignoreDuplicates: true },
    )
    .select("id");
  if (error) {
    console.error("dispatchNotifications failed", error);
    return 0;
  }
  return data?.length ?? 0;
}

function money(min: number | null, max: number | null) {
  if (min == null && max == null) return "No budget set";
  if (min != null && max != null) return `£${min}–£${max}`;
  return `£${min ?? max}`;
}

/** Notify every matching provider that a new job was posted. */
export async function notifyProvidersOfNewJob(jobId: string) {
  const { data: job } = await supabaseAdmin
    .from("jobs")
    .select(
      "id, title, description, category_id, postcode, city, lat, lng, budget_min, budget_max, scheduled_date, urgency",
    )
    .eq("id", jobId)
    .maybeSingle();
  if (!job) return 0;

  const { data: category } = job.category_id
    ? await supabaseAdmin.from("categories").select("name").eq("id", job.category_id).maybeSingle()
    : { data: null };

  const matches = await findMatchingProviders(job as JobRow);
  if (matches.length === 0) return 0;

  const label = category?.name ?? "New";
  const area = outwardCode(job.postcode) || job.city || "your area";

  return dispatchNotifications(
    matches.map((m) => ({
      user_id: m.providerId,
      job_id: job.id,
      type: "new_job" as const,
      title: `New ${label.toLowerCase()} job near ${area}`,
      message: `${job.title} — ${(job.description ?? "").slice(0, 140)}`,
      metadata: {
        category: label,
        postcode_area: area,
        budget: money(job.budget_min, job.budget_max),
        scheduled_date: job.scheduled_date,
        urgency: job.urgency,
        distance_miles: m.distanceMiles,
      },
    })),
  );
}

/** Tell the customer a provider sent them a quote. */
export async function notifyCustomerOfQuote(quoteId: string) {
  const { data: quote } = await supabaseAdmin
    .from("quotes")
    .select("id, price, job_id, provider_id, job:jobs(id, title, customer_id)")
    .eq("id", quoteId)
    .maybeSingle();
  const job = quote?.job as { id: string; title: string; customer_id: string } | null;
  if (!quote || !job) return 0;

  const { data: provider } = await supabaseAdmin
    .from("profiles")
    .select("display_name")
    .eq("user_id", quote.provider_id)
    .maybeSingle();

  // Mark the provider's own job alert as "quote sent".
  await supabaseAdmin
    .from("notifications")
    .update({ status: "quote_sent" })
    .eq("user_id", quote.provider_id)
    .eq("job_id", job.id)
    .eq("type", "new_job");

  return dispatchNotifications([
    {
      user_id: job.customer_id,
      job_id: job.id,
      quote_id: quote.id,
      type: "new_quote",
      title: `New quote for “${job.title}”`,
      message: `${provider?.display_name ?? "A verified pro"} quoted £${quote.price}.`,
      metadata: { price: quote.price },
    },
  ]);
}

/** Booking confirmed: tell the winner, close the job for everyone else. */
export async function notifyOnQuoteAccepted(quoteId: string) {
  const { data: quote } = await supabaseAdmin
    .from("quotes")
    .select("id, price, job_id, provider_id, job:jobs(id, title, customer_id)")
    .eq("id", quoteId)
    .maybeSingle();
  const job = quote?.job as { id: string; title: string; customer_id: string } | null;
  if (!quote || !job) return 0;

  await dispatchNotifications([
    {
      user_id: quote.provider_id,
      job_id: job.id,
      quote_id: quote.id,
      type: "quote_accepted",
      title: "Your quote was accepted",
      message: `You're booked for “${job.title}”. Customer contact details are now available.`,
      metadata: { price: quote.price },
    },
  ]);

  await supabaseAdmin
    .from("notifications")
    .update({ status: "job_booked" })
    .eq("job_id", job.id)
    .eq("type", "new_job")
    .eq("user_id", quote.provider_id);

  // Everyone else who was alerted about this job.
  const { data: others } = await supabaseAdmin
    .from("notifications")
    .select("user_id")
    .eq("job_id", job.id)
    .eq("type", "new_job")
    .neq("user_id", quote.provider_id);

  const otherIds = [...new Set((others ?? []).map((o) => o.user_id))];
  if (otherIds.length > 0) {
    await supabaseAdmin
      .from("notifications")
      .update({ status: "job_closed" })
      .eq("job_id", job.id)
      .eq("type", "new_job")
      .in("user_id", otherIds);

    await dispatchNotifications(
      otherIds.map((id) => ({
        user_id: id,
        job_id: job.id,
        type: "job_closed" as const,
        title: "Job no longer available",
        message: `“${job.title}” has been booked with another provider.`,
      })),
    );
  }

  return 1;
}

export { PREF_KEY_BY_TYPE };
