import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyProviderQuotes, createQuote, updateQuoteStatus } from "@/lib/jobs.functions";
import { ProviderShell } from "@/components/layout/ProviderShell";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";
import { PoundSterling, Clock, MessageSquare, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/quotes")({
  component: QuotesPage,
  head: () => ({
    meta: [
      { title: "My quotes · DoneMate" },
      { name: "description", content: "Track quotes and counter-offers on DoneMate." },
    ],
  }),
});

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-[#59914c] text-white",
  rejected: "bg-red-100 text-red-700",
  countered: "bg-blue-100 text-blue-700",
  withdrawn: "bg-slate-100 text-slate-600",
};

function QuotesPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["my-provider-quotes"],
    queryFn: () => getMyProviderQuotes(),
  });

  const withdrawMutation = useMutation({
    mutationFn: (quote_id: string) => updateQuoteStatus({ data: { quote_id, status: "withdrawn" } }),
    onSuccess: () => {
      toast.success("Quote withdrawn");
      qc.invalidateQueries({ queryKey: ["my-provider-quotes"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (isLoading) return <LoadingScreen />;

  const quotes = data ?? [];
  const active = quotes.filter((q) => ["pending", "countered"].includes(q.status));
  const done = quotes.filter((q) => !["pending", "countered"].includes(q.status));

  return (
    <ProviderShell>
      <div className="space-y-6">
        <header>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#2e4053]">My quotes</h1>
          <p className="text-[#6b7b8c] mt-1">Quotes you've submitted and their status.</p>
        </header>

        <Section title={`Active (${active.length})`}>
          {active.length === 0 ? (
            <Empty message="No active quotes. Browse jobs to send your first quote." />
          ) : (
            active.map((q) => (
              <QuoteCard
                key={q.id}
                quote={q}
                onCounter={() => qc.invalidateQueries({ queryKey: ["my-provider-quotes"] })}
                onWithdraw={() => withdrawMutation.mutate(q.id)}
                withdrawing={withdrawMutation.isPending}
              />
            ))
          )}
        </Section>

        <Section title={`History (${done.length})`}>
          {done.length === 0 ? (
            <Empty message="No past quotes yet." />
          ) : (
            done.map((q) => <QuoteCard key={q.id} quote={q} readOnly />)
          )}
        </Section>
      </div>
    </ProviderShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-semibold text-[#2e4053] mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#E5E7EB] bg-white p-8 text-center text-sm text-[#6b7b8c]">
      {message}
    </div>
  );
}

function QuoteCard({
  quote,
  onCounter,
  onWithdraw,
  withdrawing,
  readOnly,
}: {
  quote: any;
  onCounter?: () => void;
  onWithdraw?: () => void;
  withdrawing?: boolean;
  readOnly?: boolean;
}) {
  const [counterOpen, setCounterOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");

  const counterMutation = useMutation({
    mutationFn: () =>
      createQuote({
        data: {
          job_id: quote.job_id,
          price: Number(price),
          message: message || undefined,
          parent_quote_id: quote.id,
          proposed_by: "provider",
        },
      }),
    onSuccess: () => {
      toast.success("Counter-offer sent");
      setCounterOpen(false);
      setPrice("");
      setMessage("");
      onCounter?.();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const job = quote.job;
  return (
    <div className="rounded-2xl bg-white border border-[#E5E7EB] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to="/jobs/$jobId"
            params={{ jobId: quote.job_id }}
            className="font-semibold text-[#2e4053] hover:underline truncate block"
          >
            {job?.title ?? "Job"}
          </Link>
          <p className="text-xs text-[#6b7b8c] mt-1">{job?.category?.name}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize shrink-0 ${STATUS_STYLES[quote.status] ?? ""}`}>
          {quote.status}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#2e4053]">
        <span className="inline-flex items-center gap-1">
          <PoundSterling className="h-4 w-4" />
          {Number(quote.price).toFixed(2)}
        </span>
        {quote.duration_minutes && (
          <span className="inline-flex items-center gap-1 text-[#6b7b8c]">
            <Clock className="h-4 w-4" />
            {quote.duration_minutes} min
          </span>
        )}
        {quote.proposed_by === "customer" && (
          <span className="text-xs rounded-full bg-blue-50 text-blue-700 px-2 py-0.5">Customer counter</span>
        )}
      </div>

      {quote.message && (
        <div className="mt-3 rounded-lg bg-[#FAFAF8] p-3 text-sm text-[#4a5563] flex gap-2">
          <MessageSquare className="h-4 w-4 shrink-0 text-[#6b7b8c] mt-0.5" />
          <p>{quote.message}</p>
        </div>
      )}

      {!readOnly && (
        <div className="mt-4 flex flex-wrap gap-2">
          {quote.status === "countered" && !counterOpen && (
            <Button size="sm" className="rounded-full bg-[#59914c] hover:bg-[#4a7d3f]" onClick={() => setCounterOpen(true)}>
              Send new offer <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          )}
          {quote.status === "pending" && (
            <Button size="sm" variant="outline" className="rounded-full" onClick={onWithdraw} disabled={withdrawing}>
              Withdraw
            </Button>
          )}
          <Button asChild size="sm" variant="ghost" className="rounded-full">
            <Link to="/jobs/$jobId" params={{ jobId: quote.job_id }}>
              View job
            </Link>
          </Button>
        </div>
      )}

      {counterOpen && (
        <div className="mt-4 rounded-xl border border-[#E5E7EB] p-4 space-y-3">
          <div>
            <Label>New price (£)</Label>
            <Input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <Label>Message (optional)</Label>
            <Textarea rows={2} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setCounterOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="rounded-full bg-[#59914c] hover:bg-[#4a7d3f]"
              disabled={!price || counterMutation.isPending}
              onClick={() => counterMutation.mutate()}
            >
              {counterMutation.isPending ? "Sending…" : "Send offer"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}