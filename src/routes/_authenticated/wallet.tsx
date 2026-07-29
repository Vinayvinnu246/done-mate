import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Wallet as WalletIcon, Landmark, Clock, ArrowRight, Info } from "lucide-react";

export const Route = createFileRoute("/_authenticated/wallet")({
  component: WalletPage,
  head: () => ({
    meta: [
      { title: "Wallet · DoneToday" },
      { name: "description", content: "Track earnings, pending balance and payouts on DoneToday." },
    ],
  }),
});

// Placeholder figures — real values come from Stripe Connect once payouts are enabled.
const MOCK = {
  available: 320.0,
  pending: 150.0,
  nextPayout: "Friday",
  bankLast4: "4567",
  history: [
    { id: "p_003", date: "12 Jul", amount: 245.0, status: "Paid" },
    { id: "p_002", date: "05 Jul", amount: 180.0, status: "Paid" },
    { id: "p_001", date: "28 Jun", amount: 320.5, status: "Paid" },
  ],
};

function gbp(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

function WalletPage() {
  const { profile, isLoading } = useAuth();

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

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Header />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[#2e4053]">Wallet</h1>
          <p className="text-[#6b7b8c] mt-1">Track your earnings and payouts from completed jobs.</p>
        </div>

        <div className="rounded-xl border border-[#E5E7EB] bg-[#FFF8EC] p-4 flex items-start gap-3 text-sm text-[#7a5c1a]">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <p>Payouts activate once Stripe Connect is connected on your account. Figures shown are illustrative until then.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-[#E5E7EB]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#6b7b8c] flex items-center gap-2">
                <WalletIcon className="h-4 w-4" /> Available balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl text-[#2e4053]">{gbp(MOCK.available)}</p>
              <p className="text-xs text-[#6b7b8c] mt-1">Ready to pay out</p>
            </CardContent>
          </Card>

          <Card className="border-[#E5E7EB]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#6b7b8c] flex items-center gap-2">
                <Clock className="h-4 w-4" /> Pending balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl text-[#2e4053]">{gbp(MOCK.pending)}</p>
              <p className="text-xs text-[#6b7b8c] mt-1">Clearing from recent jobs</p>
            </CardContent>
          </Card>

          <Card className="border-[#E5E7EB]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#6b7b8c] flex items-center gap-2">
                <ArrowRight className="h-4 w-4" /> Next payout
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl text-[#2e4053]">{MOCK.nextPayout}</p>
              <p className="text-xs text-[#6b7b8c] mt-1">Automatic weekly transfer</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-[#E5E7EB]">
          <CardHeader>
            <CardTitle className="text-[#2e4053] flex items-center gap-2">
              <Landmark className="h-5 w-5" /> Bank account
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-[#6b7b8c]">Account ending in</p>
              <p className="font-medium text-[#2e4053] text-lg tracking-widest">•••• {MOCK.bankLast4}</p>
            </div>
            <Button variant="outline" className="rounded-full border-[#2e4053] text-[#2e4053]">
              Update bank details
            </Button>
          </CardContent>
        </Card>

        <Card className="border-[#E5E7EB]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-[#2e4053]">Payout history</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-[#E5E7EB]">
              {MOCK.history.map((row) => (
                <div key={row.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="text-[#2e4053] font-medium">{gbp(row.amount)}</p>
                    <p className="text-xs text-[#6b7b8c]">{row.date}</p>
                  </div>
                  <span className="text-xs font-medium text-[#59914c] bg-[#59914c]/10 rounded-full px-3 py-1">
                    {row.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}