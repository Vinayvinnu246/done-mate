import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function requireAdmin(context: { supabase: any; userId: string }) {
  const { supabase, userId } = context;

  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "super_admin"])
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Unauthorized");
}

async function adminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const supabase = await adminClient();

    const [profiles, jobs, quotes, verifications] = await Promise.all([
      supabase.from("profiles").select("type", { count: "exact" }),
      supabase.from("jobs").select("status", { count: "exact" }),
      supabase.from("quotes").select("status", { count: "exact" }),
      supabase.from("provider_verifications").select("status", { count: "exact" }),
    ]);

    return {
      profiles: profiles.count ?? 0,
      jobs: jobs.count ?? 0,
      quotes: quotes.count ?? 0,
      verifications: verifications.count ?? 0,
    };
  });

export const getAdminVerifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const supabase = await adminClient();

    const { data, error } = await supabase
      .from("provider_verifications")
      .select("*, provider:profiles(display_name)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  });

export const updateVerificationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        verification_id: z.string().uuid(),
        status: z.enum(["approved", "rejected"]),
        notes: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const supabase = await adminClient();

    const { data: verification, error: findError } = await supabase
      .from("provider_verifications")
      .select("provider_id")
      .eq("id", data.verification_id)
      .single();

    if (findError) throw findError;

    const { error: updateError } = await supabase
      .from("provider_verifications")
      .update({ status: data.status, notes: data.notes, reviewed_by: context.userId })
      .eq("id", data.verification_id);

    if (updateError) throw updateError;

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        verification_status: data.status === "approved" ? "verified" : "rejected",
      })
      .eq("id", verification.provider_id);

    if (profileError) throw profileError;

    return { ok: true };
  });

export const getAdminJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const supabase = await adminClient();

    const { data, error } = await supabase
      .from("jobs")
      .select("*, category:categories(name)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    return data ?? [];
  });

export const updateJobStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        job_id: z.string().uuid(),
        status: z.enum(["posted", "quoting", "accepted", "in_progress", "completed", "cancelled", "disputed"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const supabase = await adminClient();

    const { error } = await supabase.from("jobs").update({ status: data.status }).eq("id", data.job_id);
    if (error) throw error;
    return { ok: true };
  });

export const getAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const supabase = await adminClient();

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, display_name, type, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (profilesError) throw profilesError;

    const { data: roles, error: rolesError } = await supabase.from("user_roles").select("user_id, role");
    if (rolesError) throw rolesError;

    const rolesByUser = new Map<string, string[]>();
    for (const r of roles ?? []) {
      const list = rolesByUser.get(r.user_id) ?? [];
      list.push(r.role);
      rolesByUser.set(r.user_id, list);
    }

    return (profiles ?? []).map((p) => ({
      ...p,
      roles: rolesByUser.get(p.id) ?? [],
    }));
  });

export const addUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        user_id: z.string().uuid(),
        role: z.enum(["admin", "super_admin", "support", "finance", "verification"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const supabase = await adminClient();

    const { error } = await supabase.from("user_roles").insert({
      user_id: data.user_id,
      role: data.role,
    });

    if (error) throw error;
    return { ok: true };
  });

// ============ Wallet / Payouts admin ============

const COMMISSION_RATE = 0.1;
const HOLD_DAYS = 3;

export const getAdminPayouts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const supabase = await adminClient();
    const { data, error } = await supabase
      .from("payout_requests")
      .select("*, bank:provider_bank_accounts(bank_name, account_last4, account_holder), provider:profiles!payout_requests_provider_id_fkey(display_name)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      // FK-based embed may not exist; fall back to plain select
      const { data: rows, error: e2 } = await supabase
        .from("payout_requests")
        .select("*, bank:provider_bank_accounts(bank_name, account_last4, account_holder)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (e2) throw e2;
      return rows ?? [];
    }
    return data ?? [];
  });

export const updatePayoutStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        payout_id: z.string().uuid(),
        status: z.enum(["requested", "processing", "paid", "failed", "reversed", "on_hold"]),
        failure_reason: z.string().max(300).optional(),
        estimated_arrival: z.string().datetime().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const supabase = await adminClient();

    const patch = {
      status: data.status,
      ...(data.failure_reason !== undefined ? { failure_reason: data.failure_reason } : {}),
      ...(data.estimated_arrival ? { estimated_arrival: data.estimated_arrival } : {}),
      ...(data.status === "paid" || data.status === "failed" || data.status === "reversed"
        ? { processed_at: new Date().toISOString() }
        : {}),
    };

    const { data: row, error } = await supabase
      .from("payout_requests")
      .update(patch as never)
      .eq("id", data.payout_id)
      .select()
      .single();
    if (error) throw error;

    if (data.status === "paid") {
      // Record ledger entry so total_withdrawn is reflected in the ledger too
      await supabase.from("wallet_transactions").insert({
        provider_id: row.provider_id,
        type: "withdrawal",
        amount: -Number(row.amount),
        description: "Payout to bank account",
        payout_request_id: row.id,
        available_at: new Date().toISOString(),
        created_by: context.userId,
      });
    } else if (data.status === "reversed") {
      await supabase.from("wallet_transactions").insert({
        provider_id: row.provider_id,
        type: "reversal",
        amount: Number(row.amount),
        description: "Payout reversed",
        payout_request_id: row.id,
        available_at: new Date().toISOString(),
        created_by: context.userId,
      });
    }

    return { ok: true };
  });

export const creditJobEarnings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        provider_id: z.string().uuid(),
        job_id: z.string().uuid().optional(),
        gross_amount: z.number().positive().max(100000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const supabase = await adminClient();

    const commission = Number((data.gross_amount * COMMISSION_RATE).toFixed(2));
    const net = Number((data.gross_amount - commission).toFixed(2));
    const availableAt = new Date();
    availableAt.setDate(availableAt.getDate() + HOLD_DAYS);

    const rows = [
      {
        provider_id: data.provider_id,
        type: "job_earning" as const,
        amount: net,
        description: `Job earning (customer paid £${data.gross_amount.toFixed(2)})`,
        job_id: data.job_id ?? null,
        available_at: availableAt.toISOString(),
        created_by: context.userId,
      },
      {
        provider_id: data.provider_id,
        type: "commission" as const,
        amount: -commission,
        description: "Platform commission (10%)",
        job_id: data.job_id ?? null,
        available_at: new Date().toISOString(),
        created_by: context.userId,
      },
    ];

    const { error } = await supabase.from("wallet_transactions").insert(rows);
    if (error) throw error;
    return { ok: true, net, commission };
  });

export const addWalletAdjustment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        provider_id: z.string().uuid(),
        type: z.enum(["adjustment", "bonus", "refund", "cancellation_fee"]),
        amount: z.number().refine((n) => n !== 0, "Amount required"),
        description: z.string().trim().min(3).max(300),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const supabase = await adminClient();
    const signed =
      data.type === "cancellation_fee" || data.type === "refund"
        ? -Math.abs(data.amount)
        : data.amount;
    const { error } = await supabase.from("wallet_transactions").insert({
      provider_id: data.provider_id,
      type: data.type,
      amount: signed,
      description: data.description,
      available_at: new Date().toISOString(),
      created_by: context.userId,
    });
    if (error) throw error;
    return { ok: true };
  });

export const setPayoutHold = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        provider_id: z.string().uuid(),
        reason: z.string().trim().min(3).max(300),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const supabase = await adminClient();
    const { error } = await supabase.from("payout_holds").insert({
      provider_id: data.provider_id,
      reason: data.reason,
      active: true,
      created_by: context.userId,
    });
    if (error) throw error;
    return { ok: true };
  });

export const releasePayoutHold = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ hold_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const supabase = await adminClient();
    const { error } = await supabase
      .from("payout_holds")
      .update({ active: false, released_at: new Date().toISOString(), released_by: context.userId })
      .eq("id", data.hold_id);
    if (error) throw error;
    return { ok: true };
  });
