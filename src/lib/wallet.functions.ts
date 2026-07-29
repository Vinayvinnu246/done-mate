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
  amount: z.number().positive().max(100000),
  bank_account_id: z.string().uuid(),
});

export const getWalletData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [banks, payouts] = await Promise.all([
      supabase.from("provider_bank_accounts").select("*").eq("provider_id", userId).order("created_at", { ascending: false }),
      supabase.from("payout_requests").select("*").eq("provider_id", userId).order("created_at", { ascending: false }).limit(20),
    ]);
    if (banks.error) throw banks.error;
    if (payouts.error) throw payouts.error;

    const paid = (payouts.data ?? []).filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
    const pendingOut = (payouts.data ?? []).filter((p) => p.status === "pending" || p.status === "processing").reduce((s, p) => s + Number(p.amount), 0);

    return {
      banks: banks.data ?? [],
      payouts: payouts.data ?? [],
      totals: { paid, pendingOut },
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
    const { data: bank, error: bankErr } = await supabase
      .from("provider_bank_accounts")
      .select("id")
      .eq("id", data.bank_account_id)
      .eq("provider_id", userId)
      .single();
    if (bankErr || !bank) throw new Error("Bank account not found");
    const { data: row, error } = await supabase
      .from("payout_requests")
      .insert({
        provider_id: userId,
        bank_account_id: data.bank_account_id,
        amount: data.amount,
        status: "pending",
      })
      .select()
      .single();
    if (error) throw error;
    return row;
  });