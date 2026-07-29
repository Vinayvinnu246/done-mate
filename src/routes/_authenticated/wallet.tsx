import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { toast } from "sonner";
import { Wallet as WalletIcon, Landmark, Clock, ArrowRight, Plus, Trash2, ShieldCheck, ExternalLink, AlertTriangle, TrendingUp, Receipt, Ban } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { getWalletData, addBankAccount, deleteBankAccount, requestPayout } from "@/lib/wallet.functions";
import {
  getStripeConnectStatus,
  createStripeOnboardingLink,
  refreshStripeConnectStatus,
  createStripeDashboardLink,
} from "@/lib/stripe-connect.functions";

export const Route = createFileRoute("/_authenticated/wallet")({
  component: WalletPage,
  validateSearch: (search: Record<string, unknown>) => ({
    stripe: typeof search.stripe === "string" ? search.stripe : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Wallet · DoneToday" },
      { name: "description", content: "Track earnings, add a bank account and withdraw payouts on DoneToday." },
    ],
  }),
});

const gbp = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

function WalletPage() {
  const { profile, isLoading } = useAuth();
  const qc = useQueryClient();
  const { stripe: stripeReturn } = useSearch({ from: "/_authenticated/wallet" });

  const walletQuery = useQuery({
    queryKey: ["wallet"],
    queryFn: () => getWalletData(),
    enabled: profile?.type === "provider",
  });

  const connectQuery = useQuery({
    queryKey: ["stripe-connect"],
    queryFn: () => getStripeConnectStatus(),
    enabled: profile?.type === "provider",
  });

  useEffect(() => {
    if (!stripeReturn || profile?.type !== "provider") return;
    refreshStripeConnectStatus()
      .then(() => qc.invalidateQueries({ queryKey: ["stripe-connect"] }))
      .catch(() => {});
  }, [stripeReturn, profile?.type, qc]);

  const startOnboarding = useMutation({
    mutationFn: () => createStripeOnboardingLink(),
    onSuccess: ({ url }) => { window.location.href = url; },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not start Stripe onboarding"),
  });

  const openDashboard = useMutation({
    mutationFn: () => createStripeDashboardLink(),
    onSuccess: ({ url }) => { window.open(url, "_blank"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not open Stripe dashboard"),
  });

  const [showBankForm, setShowBankForm] = useState(false);
  const [bank, setBank] = useState({ account_holder: "", bank_name: "", sort_code: "", account_number: "" });
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const addBank = useMutation({
    mutationFn: (input: typeof bank) => addBankAccount({ data: input }),
    onSuccess: () => {
      toast.success("Bank account added");
      setBank({ account_holder: "", bank_name: "", sort_code: "", account_number: "" });
      setShowBankForm(false);
      qc.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to add bank account"),
  });

  const removeBank = useMutation({
    mutationFn: (id: string) => deleteBankAccount({ data: { id } }),
    onSuccess: () => {
      toast.success("Bank account removed");
      qc.invalidateQueries({ queryKey: ["wallet"] });
    },
  });

  const withdraw = useMutation({
    mutationFn: (input: { amount: number; bank_account_id: string }) => requestPayout({ data: input }),
    onSuccess: () => {
      toast.success("Withdrawal requested");
      setWithdrawAmount("");
      qc.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Withdrawal failed"),
  });

  if (isLoading) return <LoadingScreen />;

  if (profile?.type !== "provider") {
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <Header />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h1 className="font-display text-2xl font-semibold text-[#2e4053]">Wallet</h1>
          <p className="text-[#6b7b8c] mt-2">The wallet is available for service providers only.</p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  const data = walletQuery.data;
  const banks = data?.banks ?? [];
  const payouts = data?.payouts ?? [];
  const transactions = data?.transactions ?? [];
  const holds = data?.holds ?? [];
  const balances = data?.balances ?? { available: 0, pending: 0, totalEarnings: 0, totalCommission: 0, totalWithdrawn: 0, reserved: 0 };
  const defaultBank = banks.find((b) => b.is_default) ?? banks[0];
  const available = balances.available;
  const minWithdrawal = data?.minWithdrawal ?? 50;
  const connect = connectQuery.data;
  const payoutsEnabled = !!connect?.payouts_enabled;
  const hasActiveHold = holds.length > 0;

  function handleWithdraw() {
    const amt = Number(withdrawAmount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (amt < minWithdrawal) return toast.error(`Minimum withdrawal is £${minWithdrawal}`);
    if (hasActiveHold) return toast.error("Payouts are on hold");
    if (!defaultBank) return toast.error("Add a bank account first");
    if (amt > available) return toast.error("Amount exceeds available balance");
    withdraw.mutate({ amount: amt, bank_account_id: defaultBank.id });
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Header />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <BackButton className="mb-2" />
        <div>
          <h1 className="font-display text-3xl font-semibold text-[#2e4053]">Wallet</h1>
          <p className="text-[#6b7b8c] mt-1">Add a bank account and withdraw earnings from completed jobs.</p>
        </div>

        {hasActiveHold && (
          <div className="rounded-xl bg-[#fdecea] border border-[#f5c6c0] p-4 flex items-start gap-3">
            <Ban className="h-5 w-5 text-[#c0392b] mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-[#c0392b]">Payouts on hold</p>
              <p className="text-[#7a2b21] mt-1">{holds[0].reason}</p>
            </div>
          </div>
        )}

        <Card className="border-[#E5E7EB]">
          <CardHeader>
            <CardTitle className="text-[#2e4053] flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#59914c]" /> Stripe payouts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!connect ? (
              <>
                <p className="text-sm text-[#6b7b8c]">
                  Optionally connect Stripe Express for automatic secure payouts. You can also withdraw to the bank
                  account you add below and DoneToday will process it manually.
                </p>
                <Button
                  className="rounded-full bg-[#635bff] hover:bg-[#5148e6]"
                  onClick={() => startOnboarding.mutate()}
                  disabled={startOnboarding.isPending}
                >
                  {startOnboarding.isPending ? "Preparing…" : "Set up Stripe payouts"}
                </Button>
              </>
            ) : payoutsEnabled ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm">
                  <p className="text-[#2e4053] font-medium flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#59914c]" /> Payouts enabled
                  </p>
                  <p className="text-xs text-[#6b7b8c] mt-1">
                    Your Stripe account is verified. Withdrawals go directly to your linked bank.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => openDashboard.mutate()} disabled={openDashboard.isPending}>
                  <ExternalLink className="h-4 w-4 mr-1" /> Stripe dashboard
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm rounded-lg bg-[#FFF8EC] border border-[#F0E1B8] p-3">
                  <AlertTriangle className="h-4 w-4 text-[#7a5c1a] mt-0.5" />
                  <div>
                    <p className="text-[#7a5c1a] font-medium">Onboarding incomplete</p>
                    <p className="text-xs text-[#7a5c1a]/80 mt-1">
                      Finish verification with Stripe to enable payouts.
                    </p>
                  </div>
                </div>
                <Button
                  className="rounded-full bg-[#635bff] hover:bg-[#5148e6]"
                  onClick={() => startOnboarding.mutate()}
                  disabled={startOnboarding.isPending}
                >
                  {startOnboarding.isPending ? "Preparing…" : "Continue Stripe onboarding"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-[#E5E7EB]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#6b7b8c] flex items-center gap-2">
                <WalletIcon className="h-4 w-4" /> Available balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-2xl text-[#2e4053]">{gbp(available)}</p>
              <p className="text-xs text-[#6b7b8c] mt-1">Ready to withdraw</p>
            </CardContent>
          </Card>
          <Card className="border-[#E5E7EB]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#6b7b8c] flex items-center gap-2">
                <Clock className="h-4 w-4" /> Pending balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-2xl text-[#2e4053]">{gbp(balances.pending)}</p>
              <p className="text-xs text-[#6b7b8c] mt-1">In 3-day hold</p>
            </CardContent>
          </Card>
          <Card className="border-[#E5E7EB]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#6b7b8c] flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Total earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-2xl text-[#2e4053]">{gbp(balances.totalEarnings)}</p>
              <p className="text-xs text-[#6b7b8c] mt-1">Gross of commission</p>
            </CardContent>
          </Card>
          <Card className="border-[#E5E7EB]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#6b7b8c] flex items-center gap-2">
                <ArrowRight className="h-4 w-4" /> Total withdrawn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-2xl text-[#2e4053]">{gbp(balances.totalWithdrawn)}</p>
              <p className="text-xs text-[#6b7b8c] mt-1">Paid to your bank</p>
            </CardContent>
          </Card>
          <Card className="border-[#E5E7EB]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#6b7b8c] flex items-center gap-2">
                <Receipt className="h-4 w-4" /> Commission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-2xl text-[#2e4053]">{gbp(balances.totalCommission)}</p>
              <p className="text-xs text-[#6b7b8c] mt-1">15% platform fee</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-[#E5E7EB]">
          <CardHeader>
            <CardTitle className="text-[#2e4053] flex items-center gap-2">
              <ArrowRight className="h-5 w-5" /> Withdraw to bank
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {defaultBank ? (
              <>
                <div className="text-sm text-[#6b7b8c]">
                  Sending to <span className="font-medium text-[#2e4053]">{defaultBank.bank_name}</span> •••• {defaultBank.account_last4}
                </div>
                <div className="text-xs text-[#6b7b8c]">
                  Minimum withdrawal £{minWithdrawal}. Estimated arrival: 2–3 business days.
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="number"
                    min={minWithdrawal}
                    step="0.01"
                    placeholder={`Amount (min £${minWithdrawal})`}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                  />
                  <Button className="rounded-full bg-[#59914c] hover:bg-[#4a7d3f]" onClick={handleWithdraw} disabled={withdraw.isPending}>
                    {withdraw.isPending ? "Requesting…" : "Withdraw now"}
                  </Button>
                </div>
                {balances.pending > 0 && (
                  <p className="text-xs text-[#6b7b8c]">{gbp(balances.pending)} is still in the 3-day hold period.</p>
                )}
              </>
            ) : (
              <p className="text-sm text-[#6b7b8c]">Add a bank account below to enable withdrawals.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#E5E7EB]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-[#2e4053] flex items-center gap-2">
              <Landmark className="h-5 w-5" /> Bank accounts
            </CardTitle>
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => setShowBankForm((s) => !s)}>
              <Plus className="h-4 w-4 mr-1" /> {showBankForm ? "Cancel" : "Add account"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {showBankForm && (
              <div className="rounded-xl border border-[#E5E7EB] p-4 space-y-3 bg-[#FAFAF8]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Account holder</Label>
                    <Input value={bank.account_holder} onChange={(e) => setBank({ ...bank, account_holder: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Bank name</Label>
                    <Input value={bank.bank_name} onChange={(e) => setBank({ ...bank, bank_name: e.target.value })} placeholder="e.g. Barclays" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Sort code</Label>
                    <Input value={bank.sort_code} onChange={(e) => setBank({ ...bank, sort_code: e.target.value })} placeholder="12-34-56" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Account number</Label>
                    <Input value={bank.account_number} onChange={(e) => setBank({ ...bank, account_number: e.target.value })} placeholder="12345678" />
                  </div>
                </div>
                <Button className="rounded-full" onClick={() => addBank.mutate(bank)} disabled={addBank.isPending}>
                  {addBank.isPending ? "Saving…" : "Save bank account"}
                </Button>
              </div>
            )}

            {banks.length === 0 && !showBankForm && (
              <p className="text-sm text-[#6b7b8c]">No bank accounts yet.</p>
            )}

            <div className="divide-y divide-[#E5E7EB]">
              {banks.map((b) => (
                <div key={b.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-[#2e4053]">{b.bank_name} <span className="tracking-widest">•••• {b.account_last4}</span></p>
                    <p className="text-xs text-[#6b7b8c]">{b.account_holder} · Sort {b.sort_code} {b.is_default && "· Default"}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeBank.mutate(b.id)}>
                    <Trash2 className="h-4 w-4 text-[#c0392b]" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E5E7EB]">
          <CardHeader>
            <CardTitle className="text-[#2e4053]">Payout history</CardTitle>
          </CardHeader>
          <CardContent>
            {payouts.length === 0 ? (
              <p className="text-sm text-[#6b7b8c]">No withdrawals yet.</p>
            ) : (
              <div className="divide-y divide-[#E5E7EB]">
                {payouts.map((p) => (
                  <div key={p.id} className="py-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[#2e4053] font-medium">{gbp(Number(p.amount))}</p>
                        <p className="text-xs text-[#6b7b8c]">
                          {new Date(p.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                          {p.estimated_arrival && ["requested","processing","pending"].includes(p.status) && (
                            <> · ETA {new Date(p.estimated_arrival).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</>
                          )}
                        </p>
                      </div>
                      <span className={`text-xs font-medium rounded-full px-3 py-1 capitalize ${
                        p.status === "paid" ? "text-[#59914c] bg-[#59914c]/10" :
                        p.status === "failed" || p.status === "reversed" ? "text-[#c0392b] bg-[#c0392b]/10" :
                        p.status === "on_hold" ? "text-[#c0392b] bg-[#fdecea]" :
                        "text-[#7a5c1a] bg-[#FFF8EC]"
                      }`}>{p.status.replace("_", " ")}</span>
                    </div>
                    {p.failure_reason && (p.status === "failed" || p.status === "reversed") && (
                      <p className="text-xs text-[#c0392b] mt-1">Reason: {p.failure_reason}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#E5E7EB]">
          <CardHeader>
            <CardTitle className="text-[#2e4053]">Transaction history</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-sm text-[#6b7b8c]">No transactions yet.</p>
            ) : (
              <div className="divide-y divide-[#E5E7EB]">
                {transactions.map((t) => {
                  const amt = Number(t.amount);
                  const positive = amt >= 0;
                  return (
                    <div key={t.id} className="flex items-center justify-between py-3 text-sm">
                      <div className="min-w-0">
                        <p className="text-[#2e4053] font-medium capitalize">{t.type.replace(/_/g, " ")}</p>
                        <p className="text-xs text-[#6b7b8c] truncate">
                          {t.description ?? "—"} · {new Date(t.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <span className={`font-medium ${positive ? "text-[#59914c]" : "text-[#c0392b]"}`}>
                        {positive ? "+" : ""}{gbp(amt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}