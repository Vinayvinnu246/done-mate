import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const bankSchema = z.object({
  account_holder: z.string().trim().min(2).max(120),
  bank_name: z.string().trim().min(2).max(120),
  sort_code: z.string().trim().regex(/^\d{2}-?\d{2}-?\d{2}$/, "Sort code must be 6 digits"),
  account_number: z.string().trim().regex(/^\d{6,10}$/, "Account number must be 6-10 digits"),
});

const payoutSchema = z.object({
  amount: z.number().positive().min(50, "Minimum withdrawal is £50").max(100000),
  bank_account_id: z.string().uuid(),
});

export const MIN_WITHDRAWAL = 50;

function computeBalances(ledger: Array<{ type: string; amount: number; available_at: string }>, payouts: Array<{ amount: number; status: string }>) {
  const now = Date.now();
  let earnedAvailable = 0;
  let earnedPending = 0;
  let totalEarnings = 0;
  let totalCommission = 0;
  for (const t of ledger) {
    const amt = Number(t.amount);
    const at = new Date(t.available_at).getTime();
    if (at <= now) earnedAvailable += amt;
    else if (amt > 0) earnedPending += amt;
    if (t.type === "job_earning" || t.type === "bonus") totalEarnings += amt;
    if (t.type === "commission") totalCommission += Math.abs(amt);
  }
  const reserved = payouts
    .filter((p) => ["requested", "processing", "on_hold", "pending"].includes(p.status))
    .reduce((s, p) => s + Number(p.amount), 0);
  const paidOut = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
  const available = Math.max(0, earnedAvailable - reserved - paidOut);
  return {
    available,
    pending: earnedPending,
    totalEarnings,
    totalCommission,
    totalWithdrawn: paidOut,
    reserved,
  };
}

export const getWalletData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [banks, payouts, ledger, holds] = await Promise.all([
      supabase.from("provider_bank_accounts").select("*").eq("provider_id", userId).order("created_at", { ascending: false }),
      supabase.from("payout_requests").select("*").eq("provider_id", userId).order("created_at", { ascending: false }).limit(20),
      supabase.from("wallet_transactions").select("*").eq("provider_id", userId).order("created_at", { ascending: false }),
      supabase.from("payout_holds").select("*").eq("provider_id", userId).eq("active", true),
    ]);
    if (banks.error) throw banks.error;
    if (payouts.error) throw payouts.error;
    if (ledger.error) throw ledger.error;
    if (holds.error) throw holds.error;

    const balances = computeBalances(ledger.data ?? [], payouts.data ?? []);

    return {
      banks: banks.data ?? [],
      payouts: payouts.data ?? [],
      transactions: ledger.data ?? [],
      holds: holds.data ?? [],
      balances,
      minWithdrawal: MIN_WITHDRAWAL,
    };
  });

export const addBankAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => bankSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const last4 = data.account_number.slice(-4);
    await supabase.from("provider_bank_accounts").update({ is_default: false }).eq("provider_id", userId);
    const { data: row, error } = await supabase
      .from("provider_bank_accounts")
      .insert({
        provider_id: userId,
        account_holder: data.account_holder,
        bank_name: data.bank_name,
        sort_code: data.sort_code.replace(/-/g, "").replace(/(\d{2})(\d{2})(\d{2})/, "$1-$2-$3"),
        account_last4: last4,
        is_default: true,
      })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const deleteBankAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("provider_bank_accounts").delete().eq("id", data.id).eq("provider_id", userId);
    if (error) throw error;
    return { ok: true };
  });

export const requestPayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => payoutSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Active payout hold?
    const { data: activeHolds, error: holdsErr } = await supabase
      .from("payout_holds")
      .select("id, reason")
      .eq("provider_id", userId)
      .eq("active", true);
    if (holdsErr) throw holdsErr;
    if (activeHolds && activeHolds.length > 0) {
      throw new Error(`Payouts are on hold: ${activeHolds[0].reason}`);
    }

    // Any open dispute on any job of this provider?
    const { data: openDisputes, error: dispErr } = await supabase
      .from("disputes")
      .select("id")
      .eq("provider_id", userId)
      .in("status", ["open", "reviewing"])
      .limit(1);
    if (dispErr) throw dispErr;
    if (openDisputes && openDisputes.length > 0) {
      throw new Error("You have an active dispute. Withdrawals are paused until it's resolved.");
    }

    // Duplicate in-flight request?
    const { data: inflight, error: infErr } = await supabase
      .from("payout_requests")
      .select("id")
      .eq("provider_id", userId)
      .in("status", ["requested", "processing", "pending", "on_hold"])
      .limit(1);
    if (infErr) throw infErr;
    if (inflight && inflight.length > 0) {
      throw new Error("You already have a withdrawal in progress.");
    }

    // Recompute available balance server-side and enforce
    const [ledger, payouts] = await Promise.all([
      supabase.from("wallet_transactions").select("type, amount, available_at").eq("provider_id", userId),
      supabase.from("payout_requests").select("amount, status").eq("provider_id", userId),
    ]);
    if (ledger.error) throw ledger.error;
    if (payouts.error) throw payouts.error;
    const balances = computeBalances(ledger.data ?? [], payouts.data ?? []);
    if (data.amount > balances.available) {
      throw new Error(`Amount exceeds available balance (${balances.available.toFixed(2)}).`);
    }

    const { data: bank, error: bankErr } = await supabase
      .from("provider_bank_accounts")
      .select("id")
      .eq("id", data.bank_account_id)
      .eq("provider_id", userId)
      .single();
    if (bankErr || !bank) throw new Error("Bank account not found");

    const estimated = new Date();
    estimated.setDate(estimated.getDate() + 3);

    const { data: row, error } = await supabase
      .from("payout_requests")
      .insert({
        provider_id: userId,
        bank_account_id: data.bank_account_id,
        amount: data.amount,
        status: "requested",
        estimated_arrival: estimated.toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return row;
  });